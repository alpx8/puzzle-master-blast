from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime
import asyncio


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create Socket.IO server with CORS and fallback to polling
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    transports=['polling', 'websocket']  # Polling first for proxy compatibility
)

# Create FastAPI app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== Models ====================

class UserCreate(BaseModel):
    username: str
    user_id: Optional[str] = None

class UserUpdate(BaseModel):
    level: int
    xp: int
    high_score: int

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    level: int = 1
    xp: int = 0
    high_score: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LeaderboardEntry(BaseModel):
    id: str
    username: str
    level: int
    high_score: int
    xp: int
    rank: int

class RoomCreate(BaseModel):
    name: str
    host_id: str
    host_name: str
    password: Optional[str] = None
    is_private: bool = False

class RoomJoin(BaseModel):
    player_id: str
    player_name: str
    password: Optional[str] = None

class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    host_id: str
    host_name: str
    players: List[dict] = []
    max_players: int = 2
    status: str = "waiting"  # waiting, playing, finished
    password: Optional[str] = None
    is_private: bool = False
    winner_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    room_id: str
    player1_id: str
    player1_name: str
    player1_score: int
    player2_id: str
    player2_name: str
    player2_score: int
    winner_id: str
    winner_name: str
    status: str = "completed"  # completed, abandoned
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameScore(BaseModel):
    user_id: str
    username: str
    score: int
    level: int
    game_mode: str


# ==================== Socket.IO Event Handlers ====================

# Store active game states
game_states: Dict[str, dict] = {}

@sio.event
async def connect(sid, environ):
    logging.info(f"Client connected: {sid}")
    await sio.emit('connected', {'sid': sid}, to=sid)

@sio.event
async def disconnect(sid):
    logging.info(f"Client disconnected: {sid}")
    # Find and clean up any rooms the player was in
    rooms = await db.rooms.find({"players.sid": sid}).to_list(100)
    for room in rooms:
        await handle_player_disconnect(sid, room['id'])

async def handle_player_disconnect(sid, room_id):
    """Handle player disconnection from a room"""
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        return
    
    # Find and remove the player
    player_to_remove = None
    for player in room['players']:
        if player.get('sid') == sid:
            player_to_remove = player
            break
    
    if player_to_remove:
        await db.rooms.update_one(
            {"id": room_id},
            {"$pull": {"players": {"sid": sid}}}
        )
        
        # Notify others
        await sio.emit('player_left', {
            'player_id': player_to_remove.get('id'),
            'player_name': player_to_remove.get('name')
        }, room=room_id)
        
        # Check if room should be deleted
        updated_room = await db.rooms.find_one({"id": room_id})
        if updated_room and len(updated_room.get('players', [])) == 0:
            await db.rooms.delete_one({"id": room_id})

@sio.event
async def join_room(sid, data):
    """Player joins a game room"""
    room_id = data.get('room_id')
    player_id = data.get('player_id')
    player_name = data.get('player_name')
    
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        await sio.emit('error', {'message': 'Room not found'}, to=sid)
        return
    
    if room['status'] != 'waiting':
        await sio.emit('error', {'message': 'Game already started'}, to=sid)
        return
    
    # Join Socket.IO room
    sio.enter_room(sid, room_id)
    
    # Update player with socket id
    await db.rooms.update_one(
        {"id": room_id, "players.id": player_id},
        {"$set": {"players.$.sid": sid}}
    )
    
    # Get updated room
    room = await db.rooms.find_one({"id": room_id})
    
    # Notify everyone in room
    await sio.emit('room_update', {
        'room_id': room_id,
        'players': room['players'],
        'status': room['status']
    }, room=room_id)
    
    logging.info(f"Player {player_name} joined room {room_id}")

@sio.event
async def leave_room(sid, data):
    """Player leaves a game room"""
    room_id = data.get('room_id')
    player_id = data.get('player_id')
    
    sio.leave_room(sid, room_id)
    await handle_player_disconnect(sid, room_id)

@sio.event
async def player_ready(sid, data):
    """Player marks themselves as ready"""
    room_id = data.get('room_id')
    player_id = data.get('player_id')
    
    await db.rooms.update_one(
        {"id": room_id, "players.id": player_id},
        {"$set": {"players.$.ready": True}}
    )
    
    room = await db.rooms.find_one({"id": room_id})
    
    # Check if all players are ready
    if room and len(room['players']) >= 2:
        all_ready = all(p.get('ready', False) for p in room['players'])
        if all_ready:
            await db.rooms.update_one(
                {"id": room_id},
                {"$set": {"status": "playing"}}
            )
            
            # Initialize game state
            game_states[room_id] = {
                'started_at': datetime.utcnow(),
                'scores': {p['id']: 0 for p in room['players']},
                'can_move': {p['id']: True for p in room['players']}
            }
            
            await sio.emit('game_started', {
                'room_id': room_id,
                'players': room['players']
            }, room=room_id)
        else:
            await sio.emit('player_ready', {
                'player_id': player_id,
                'players': room['players']
            }, room=room_id)

@sio.event
async def score_update(sid, data):
    """Player updates their score during multiplayer game"""
    room_id = data.get('room_id')
    player_id = data.get('player_id')
    score = data.get('score', 0)
    
    if room_id in game_states:
        game_states[room_id]['scores'][player_id] = score
    
    await db.rooms.update_one(
        {"id": room_id, "players.id": player_id},
        {"$set": {"players.$.score": score}}
    )
    
    await sio.emit('score_updated', {
        'player_id': player_id,
        'score': score
    }, room=room_id)

@sio.event
async def cannot_move(sid, data):
    """Player cannot make any more moves"""
    room_id = data.get('room_id')
    player_id = data.get('player_id')
    
    if room_id in game_states:
        game_states[room_id]['can_move'][player_id] = False
    
    await db.rooms.update_one(
        {"id": room_id, "players.id": player_id},
        {"$set": {"players.$.can_move": False}}
    )
    
    await sio.emit('player_stuck', {
        'player_id': player_id
    }, room=room_id)
    
    # Check if game should end
    if room_id in game_states:
        active_players = [pid for pid, can_move in game_states[room_id]['can_move'].items() if can_move]
        
        if len(active_players) <= 1:
            # Game over - determine winner
            scores = game_states[room_id]['scores']
            winner_id = max(scores, key=scores.get)
            
            room = await db.rooms.find_one({"id": room_id})
            winner = next((p for p in room['players'] if p['id'] == winner_id), None)
            
            await db.rooms.update_one(
                {"id": room_id},
                {"$set": {"status": "finished"}}
            )
            
            await sio.emit('game_over', {
                'winner': winner,
                'scores': scores,
                'players': room['players']
            }, room=room_id)
            
            # Clean up game state
            del game_states[room_id]

@sio.event
async def chat_message(sid, data):
    """Chat message in room"""
    room_id = data.get('room_id')
    player_name = data.get('player_name')
    message = data.get('message', '')
    
    await sio.emit('chat', {
        'player_name': player_name,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }, room=room_id)


# ==================== User Endpoints ====================

@api_router.post("/users", response_model=User)
async def create_or_update_user(user_data: UserCreate):
    """Create a new user or get existing user"""
    existing_user = None
    
    if user_data.user_id:
        existing_user = await db.users.find_one({"id": user_data.user_id})
    
    if not existing_user:
        existing_user = await db.users.find_one({"username": user_data.username})
    
    if existing_user:
        if existing_user.get("username") != user_data.username:
            await db.users.update_one(
                {"id": existing_user["id"]},
                {"$set": {"username": user_data.username, "updated_at": datetime.utcnow()}}
            )
            existing_user["username"] = user_data.username
        return User(**existing_user)
    
    new_user = User(
        id=user_data.user_id or str(uuid.uuid4()),
        username=user_data.username
    )
    await db.users.insert_one(new_user.dict())
    return new_user


@api_router.put("/users/{user_id}", response_model=User)
async def update_user_stats(user_id: str, stats: UserUpdate):
    """Update user statistics after game"""
    result = await db.users.find_one_and_update(
        {"id": user_id},
        {
            "$set": {
                "level": stats.level,
                "xp": stats.xp,
                "high_score": max(stats.high_score, 0),
                "updated_at": datetime.utcnow()
            }
        },
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**result)


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)


# ==================== Leaderboard Endpoints ====================

@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(sort_by: str = "level", limit: int = 50):
    """Get leaderboard sorted by level or score"""
    sort_field = "level" if sort_by == "level" else "high_score"
    
    users = await db.users.find().sort(sort_field, -1).limit(limit).to_list(limit)
    
    leaderboard = []
    for rank, user in enumerate(users, 1):
        leaderboard.append(LeaderboardEntry(
            id=user["id"],
            username=user["username"],
            level=user.get("level", 1),
            high_score=user.get("high_score", 0),
            xp=user.get("xp", 0),
            rank=rank
        ))
    
    return leaderboard


@api_router.post("/scores")
async def submit_score(score_data: GameScore):
    """Submit a game score"""
    user = await db.users.find_one({"id": score_data.user_id})
    
    if user:
        if score_data.score > user.get("high_score", 0):
            await db.users.update_one(
                {"id": score_data.user_id},
                {
                    "$set": {
                        "high_score": score_data.score,
                        "level": score_data.level,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
    else:
        new_user = User(
            id=score_data.user_id,
            username=score_data.username,
            level=score_data.level,
            high_score=score_data.score
        )
        await db.users.insert_one(new_user.dict())
    
    score_record = {
        "id": str(uuid.uuid4()),
        "user_id": score_data.user_id,
        "username": score_data.username,
        "score": score_data.score,
        "level": score_data.level,
        "game_mode": score_data.game_mode,
        "created_at": datetime.utcnow()
    }
    await db.scores.insert_one(score_record)
    
    return {"status": "success", "score_id": score_record["id"]}


# ==================== Room Endpoints ====================

@api_router.get("/rooms", response_model=List[dict])
async def get_rooms():
    """Get all available rooms"""
    rooms = await db.rooms.find({"status": {"$in": ["waiting", "playing"]}}).to_list(100)
    
    result = []
    for room in rooms:
        result.append({
            "id": room["id"],
            "name": room["name"],
            "host": room["host_name"],
            "players": len(room.get("players", [])),
            "maxPlayers": room.get("max_players", 2),
            "status": room["status"]
        })
    
    return result


@api_router.post("/rooms", response_model=dict)
async def create_room(room_data: RoomCreate):
    """Create a new game room"""
    room = Room(
        name=room_data.name,
        host_id=room_data.host_id,
        host_name=room_data.host_name,
        players=[{
            "id": room_data.host_id,
            "name": room_data.host_name,
            "score": 0,
            "is_host": True,
            "can_move": True,
            "ready": False
        }]
    )
    
    await db.rooms.insert_one(room.dict())
    
    return {
        "id": room.id,
        "name": room.name,
        "status": room.status
    }


@api_router.post("/rooms/{room_id}/join")
async def join_room(room_id: str, player_data: RoomJoin):
    """Join an existing room"""
    room = await db.rooms.find_one({"id": room_id})
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if room["status"] != "waiting":
        raise HTTPException(status_code=400, detail="Room is not accepting players")
    
    if len(room["players"]) >= room["max_players"]:
        raise HTTPException(status_code=400, detail="Room is full")
    
    for player in room["players"]:
        if player["id"] == player_data.player_id:
            return {"status": "already_joined"}
    
    new_player = {
        "id": player_data.player_id,
        "name": player_data.player_name,
        "score": 0,
        "is_host": False,
        "can_move": True,
        "ready": False
    }
    
    await db.rooms.update_one(
        {"id": room_id},
        {"$push": {"players": new_player}}
    )
    
    return {"status": "joined", "room_id": room_id}


@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    """Delete a room"""
    await db.rooms.delete_one({"id": room_id})
    
    # Notify Socket.IO room
    await sio.emit('room_closed', {}, room=room_id)
    
    return {"status": "deleted"}


@api_router.post("/rooms/{room_id}/start")
async def start_game(room_id: str):
    """Start the game in a room"""
    room = await db.rooms.find_one({"id": room_id})
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if len(room["players"]) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 players to start")
    
    await db.rooms.update_one(
        {"id": room_id},
        {"$set": {"status": "playing"}}
    )
    
    # Initialize game state
    game_states[room_id] = {
        'started_at': datetime.utcnow(),
        'scores': {p['id']: 0 for p in room['players']},
        'can_move': {p['id']: True for p in room['players']}
    }
    
    await sio.emit('game_started', {
        'room_id': room_id,
        'players': room['players']
    }, room=room_id)
    
    return {"status": "started"}


# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "Block Blast API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Include the router in the main app
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO app - This creates the /socket.io/ endpoint
socket_app = socketio.ASGIApp(sio, app)

# Store original app for shutdown handler
_fastapi_app = app

# Override app with socket_app for uvicorn compatibility
# This allows the supervisor config to use server:app while still supporting Socket.IO
app = socket_app

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@_fastapi_app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# For running with uvicorn
# The socket_app wraps the FastAPI app and handles Socket.IO
