from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime
import asyncio
import json


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
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

class RoomJoin(BaseModel):
    player_id: str
    player_name: str

class Room(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    host_id: str
    host_name: str
    players: List[dict] = []
    max_players: int = 2
    status: str = "waiting"  # waiting, playing, finished
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GameScore(BaseModel):
    user_id: str
    username: str
    score: int
    level: int
    game_mode: str


# ==================== WebSocket Manager ====================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}  # room_id -> {user_id: websocket}
        self.game_states: Dict[str, dict] = {}  # room_id -> game state

    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][user_id] = websocket

    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_connections:
            if user_id in self.active_connections[room_id]:
                del self.active_connections[room_id][user_id]
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast_to_room(self, room_id: str, message: dict):
        if room_id in self.active_connections:
            for user_id, connection in self.active_connections[room_id].items():
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logging.error(f"Error sending message to {user_id}: {e}")

    async def send_to_user(self, room_id: str, user_id: str, message: dict):
        if room_id in self.active_connections and user_id in self.active_connections[room_id]:
            try:
                await self.active_connections[room_id][user_id].send_json(message)
            except Exception as e:
                logging.error(f"Error sending message to {user_id}: {e}")


manager = ConnectionManager()


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
        # Update username if changed
        if existing_user.get("username") != user_data.username:
            await db.users.update_one(
                {"id": existing_user["id"]},
                {"$set": {"username": user_data.username, "updated_at": datetime.utcnow()}}
            )
            existing_user["username"] = user_data.username
        return User(**existing_user)
    
    # Create new user
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
    # Update user's high score if this score is higher
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
        # Create new user with score
        new_user = User(
            id=score_data.user_id,
            username=score_data.username,
            level=score_data.level,
            high_score=score_data.score
        )
        await db.users.insert_one(new_user.dict())
    
    # Save score to history
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
            "players": len(room.get("players", [])) + 1,  # +1 for host
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
            "can_move": True
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
    
    # Check if player already in room
    for player in room["players"]:
        if player["id"] == player_data.player_id:
            return {"status": "already_joined"}
    
    # Add player to room
    new_player = {
        "id": player_data.player_id,
        "name": player_data.player_name,
        "score": 0,
        "is_host": False,
        "can_move": True
    }
    
    await db.rooms.update_one(
        {"id": room_id},
        {"$push": {"players": new_player}}
    )
    
    # Broadcast to room that new player joined
    await manager.broadcast_to_room(room_id, {
        "type": "player_joined",
        "player": new_player
    })
    
    return {"status": "joined"}


@api_router.delete("/rooms/{room_id}")
async def delete_room(room_id: str):
    """Delete a room"""
    await db.rooms.delete_one({"id": room_id})
    
    # Broadcast room closed
    await manager.broadcast_to_room(room_id, {
        "type": "room_closed"
    })
    
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
    
    # Broadcast game start
    await manager.broadcast_to_room(room_id, {
        "type": "game_started",
        "players": room["players"]
    })
    
    return {"status": "started"}


# ==================== WebSocket Endpoint ====================

@app.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, user_id: str):
    """WebSocket endpoint for real-time game communication"""
    await manager.connect(websocket, room_id, user_id)
    
    try:
        # Get room info
        room = await db.rooms.find_one({"id": room_id})
        if room:
            await websocket.send_json({
                "type": "room_info",
                "room": {
                    "id": room["id"],
                    "name": room["name"],
                    "players": room["players"],
                    "status": room["status"]
                }
            })
        
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "move":
                # Player made a move
                await manager.broadcast_to_room(room_id, {
                    "type": "player_move",
                    "player_id": user_id,
                    "move": data.get("move")
                })
            
            elif message_type == "score_update":
                # Update player score
                score = data.get("score", 0)
                await db.rooms.update_one(
                    {"id": room_id, "players.id": user_id},
                    {"$set": {"players.$.score": score}}
                )
                
                await manager.broadcast_to_room(room_id, {
                    "type": "score_update",
                    "player_id": user_id,
                    "score": score
                })
            
            elif message_type == "cannot_move":
                # Player cannot make any more moves
                await db.rooms.update_one(
                    {"id": room_id, "players.id": user_id},
                    {"$set": {"players.$.can_move": False}}
                )
                
                await manager.broadcast_to_room(room_id, {
                    "type": "player_stuck",
                    "player_id": user_id
                })
                
                # Check if game should end
                room = await db.rooms.find_one({"id": room_id})
                if room:
                    active_players = [p for p in room["players"] if p.get("can_move", True)]
                    if len(active_players) <= 1:
                        # Game over
                        winner = max(room["players"], key=lambda p: p.get("score", 0))
                        
                        await db.rooms.update_one(
                            {"id": room_id},
                            {"$set": {"status": "finished"}}
                        )
                        
                        await manager.broadcast_to_room(room_id, {
                            "type": "game_over",
                            "winner": winner,
                            "players": room["players"]
                        })
            
            elif message_type == "chat":
                # Chat message
                await manager.broadcast_to_room(room_id, {
                    "type": "chat",
                    "player_id": user_id,
                    "message": data.get("message", "")
                })
            
            elif message_type == "ready":
                # Player is ready
                await db.rooms.update_one(
                    {"id": room_id, "players.id": user_id},
                    {"$set": {"players.$.ready": True}}
                )
                
                await manager.broadcast_to_room(room_id, {
                    "type": "player_ready",
                    "player_id": user_id
                })
                
                # Check if all players are ready
                room = await db.rooms.find_one({"id": room_id})
                if room and len(room["players"]) >= 2:
                    all_ready = all(p.get("ready", False) for p in room["players"])
                    if all_ready:
                        await db.rooms.update_one(
                            {"id": room_id},
                            {"$set": {"status": "playing"}}
                        )
                        await manager.broadcast_to_room(room_id, {
                            "type": "game_started"
                        })
    
    except WebSocketDisconnect:
        manager.disconnect(room_id, user_id)
        
        # Notify others that player left
        await manager.broadcast_to_room(room_id, {
            "type": "player_left",
            "player_id": user_id
        })
        
        # Remove player from room
        await db.rooms.update_one(
            {"id": room_id},
            {"$pull": {"players": {"id": user_id}}}
        )
        
        # Check if room should be deleted
        room = await db.rooms.find_one({"id": room_id})
        if room and len(room["players"]) == 0:
            await db.rooms.delete_one({"id": room_id})
    
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(room_id, user_id)


# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "Block Blast API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
