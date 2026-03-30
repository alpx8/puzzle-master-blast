from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import asyncio
import random


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
    transports=['polling', 'websocket']
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

class UserProfileSync(BaseModel):
    """Full user profile sync from client"""
    user_id: str
    username: str
    coins: int = 0
    level: int = 1
    xp: int = 0
    high_score: int = 0
    owned_themes: List[str] = ["classic"]
    owned_backgrounds: List[str] = ["classic_night"]
    active_theme: str = "classic"
    active_background: str = "classic_night"
    power_ups: Dict[str, int] = {}
    total_games: int = 0
    total_wins: int = 0
    win_streak: int = 0
    best_win_streak: int = 0

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    coins: int = 0
    level: int = 1
    xp: int = 0
    xp_to_next_level: int = 100
    high_score: int = 0
    owned_themes: List[str] = ["classic"]
    owned_backgrounds: List[str] = ["classic_night"]
    active_theme: str = "classic"
    active_background: str = "classic_night"
    power_ups: Dict[str, int] = {"bomb": 1, "shuffle": 1}
    total_games: int = 0
    total_wins: int = 0
    win_streak: int = 0
    best_win_streak: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    level: int = 1
    xp: int = 0
    high_score: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeaderboardEntry(BaseModel):
    id: str
    username: str
    level: int
    high_score: int
    xp: int
    rank: int
    total_wins: Optional[int] = 0

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GameScore(BaseModel):
    user_id: str
    username: str
    score: int
    level: int
    game_mode: str

class QuickMatchRequest(BaseModel):
    player_id: str
    player_name: str

class AddCoinsRequest(BaseModel):
    amount: int
    reason: str = "reward"

class PowerUpUpdate(BaseModel):
    power_up_id: str
    quantity: int


# ==================== Quick Match System ====================

# Queue for players waiting for quick match
quick_match_queue: Dict[str, dict] = {}
# Player SID to player_id mapping
sid_to_player: Dict[str, str] = {}


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
    
    # Remove from quick match queue if present
    player_id = sid_to_player.get(sid)
    if player_id and player_id in quick_match_queue:
        del quick_match_queue[player_id]
        logging.info(f"Removed player {player_id} from quick match queue")
    
    if sid in sid_to_player:
        del sid_to_player[sid]
    
    # Find and clean up any rooms the player was in
    rooms = await db.rooms.find({"players.sid": sid}).to_list(100)
    for room in rooms:
        await handle_player_disconnect(sid, room['id'])

async def handle_player_disconnect(sid, room_id):
    """Handle player disconnection from a room"""
    room = await db.rooms.find_one({"id": room_id})
    if not room:
        return
    
    # Find the disconnected player
    disconnected_player = None
    for player in room['players']:
        if player.get('sid') == sid:
            disconnected_player = player
            break
    
    if not disconnected_player:
        return
    
    # If game is in progress, opponent wins
    if room['status'] == 'playing':
        opponent = next((p for p in room['players'] if p['id'] != disconnected_player['id']), None)
        if opponent:
            # Opponent wins by forfeit
            await db.rooms.update_one(
                {"id": room_id},
                {"$set": {"status": "finished", "winner_id": opponent['id']}}
            )
            
            # Award coins to winner
            await award_match_result(opponent['id'], True, opponent.get('score', 0))
            await award_match_result(disconnected_player['id'], False, 0)
            
            await sio.emit('game_ended', {
                'winner_id': opponent['id'],
                'winner_name': opponent.get('name', 'Kazanan'),
                'players': room['players'],
                'scores': {p['id']: p.get('score', 0) for p in room['players']},
                'reason': 'opponent_disconnected'
            }, room=room_id)
    
    # Remove player from room
    await db.rooms.update_one(
        {"id": room_id},
        {"$pull": {"players": {"sid": sid}}}
    )
    
    # Notify others
    await sio.emit('player_left', {
        'player_id': disconnected_player.get('id'),
        'player_name': disconnected_player.get('name')
    }, room=room_id)
    
    # Check if room should be deleted
    updated_room = await db.rooms.find_one({"id": room_id})
    if updated_room and len(updated_room.get('players', [])) == 0:
        await db.rooms.delete_one({"id": room_id})
        # Clean up game state
        if room_id in game_states:
            del game_states[room_id]

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
    
    # Map sid to player_id
    sid_to_player[sid] = player_id
    
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
                'started_at': datetime.now(timezone.utc),
                'scores': {p['id']: 0 for p in room['players']},
                'can_move': {p['id']: True for p in room['players']},
                'game_over': {p['id']: False for p in room['players']}
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
    
    # Broadcast to all players in room (including sender for confirmation)
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

@sio.event
async def player_game_over(sid, data):
    """Player's game is over (no more valid moves)"""
    room_id = data.get('room_id')
    player_id = data.get('player_id')
    final_score = data.get('score', 0)
    
    logging.info(f"Player {player_id} game over in room {room_id} with score {final_score}")
    
    # Update player state in database
    await db.rooms.update_one(
        {"id": room_id, "players.id": player_id},
        {"$set": {
            "players.$.game_over": True,
            "players.$.score": final_score,
            "players.$.can_move": False
        }}
    )
    
    # Update game state
    if room_id in game_states:
        game_states[room_id]['scores'][player_id] = final_score
        game_states[room_id]['can_move'][player_id] = False
        game_states[room_id]['game_over'][player_id] = True
    
    # Notify other players
    await sio.emit('player_game_over', {
        'player_id': player_id,
        'score': final_score
    }, room=room_id)
    
    # Check if all players are done
    room = await db.rooms.find_one({"id": room_id})
    if room and len(room['players']) >= 2:
        all_game_over = all(p.get('game_over', False) for p in room['players'])
        
        if all_game_over:
            await finalize_game(room_id, room)

@sio.event
async def chat_message(sid, data):
    """Chat message in room"""
    room_id = data.get('room_id')
    player_name = data.get('player_name')
    message = data.get('message', '')
    
    await sio.emit('chat', {
        'player_name': player_name,
        'message': message,
        'timestamp': datetime.now(timezone.utc).isoformat()
    }, room=room_id)

# ==================== Quick Match Socket Events ====================

@sio.event
async def join_quick_match(sid, data):
    """Player joins the quick match queue"""
    player_id = data.get('player_id')
    player_name = data.get('player_name')
    
    logging.info(f"Player {player_name} ({player_id}) joining quick match queue")
    
    # Map sid to player
    sid_to_player[sid] = player_id
    
    # Check if there's already a player waiting
    waiting_players = [p for p in quick_match_queue.values() if p['id'] != player_id]
    
    if waiting_players:
        # Match found! Create room with the first waiting player
        opponent = waiting_players[0]
        opponent_id = opponent['id']
        
        # Remove both from queue
        if opponent_id in quick_match_queue:
            del quick_match_queue[opponent_id]
        if player_id in quick_match_queue:
            del quick_match_queue[player_id]
        
        # Create a new room
        room = Room(
            name=f"Quick Match - {player_name} vs {opponent['name']}",
            host_id=opponent_id,
            host_name=opponent['name'],
            is_private=False,
            players=[
                {
                    "id": opponent_id,
                    "name": opponent['name'],
                    "score": 0,
                    "is_host": True,
                    "can_move": True,
                    "ready": True,
                    "game_over": False,
                    "sid": opponent['sid']
                },
                {
                    "id": player_id,
                    "name": player_name,
                    "score": 0,
                    "is_host": False,
                    "can_move": True,
                    "ready": True,
                    "game_over": False,
                    "sid": sid
                }
            ]
        )
        
        await db.rooms.insert_one(room.dict())
        
        # Join both to Socket.IO room
        sio.enter_room(sid, room.id)
        sio.enter_room(opponent['sid'], room.id)
        
        # Initialize game state
        game_states[room.id] = {
            'started_at': datetime.now(timezone.utc),
            'scores': {opponent_id: 0, player_id: 0},
            'can_move': {opponent_id: True, player_id: True},
            'game_over': {opponent_id: False, player_id: False}
        }
        
        # Update room status to playing
        await db.rooms.update_one(
            {"id": room.id},
            {"$set": {"status": "playing"}}
        )
        
        # Notify both players
        match_data = {
            'room_id': room.id,
            'players': room.players,
            'opponent': {
                'id': opponent_id,
                'name': opponent['name']
            }
        }
        
        await sio.emit('quick_match_found', {
            **match_data,
            'opponent': {'id': player_id, 'name': player_name}
        }, to=opponent['sid'])
        
        await sio.emit('quick_match_found', {
            **match_data,
            'opponent': {'id': opponent_id, 'name': opponent['name']}
        }, to=sid)
        
        logging.info(f"Quick match created: Room {room.id}")
    else:
        # Add to queue
        quick_match_queue[player_id] = {
            'id': player_id,
            'name': player_name,
            'sid': sid,
            'joined_at': datetime.now(timezone.utc)
        }
        
        await sio.emit('quick_match_waiting', {
            'position': len(quick_match_queue),
            'message': 'Rakip aranıyor...'
        }, to=sid)
        
        logging.info(f"Player {player_name} added to queue. Queue size: {len(quick_match_queue)}")

@sio.event
async def leave_quick_match(sid, data):
    """Player leaves the quick match queue"""
    player_id = data.get('player_id')
    
    if player_id in quick_match_queue:
        del quick_match_queue[player_id]
        logging.info(f"Player {player_id} left quick match queue")
    
    await sio.emit('quick_match_cancelled', {}, to=sid)


# ==================== Helper Functions ====================

async def finalize_game(room_id: str, room: dict):
    """Finalize a game and distribute rewards"""
    # Determine winner by score
    scores = {p['id']: p.get('score', 0) for p in room['players']}
    winner_id = max(scores, key=scores.get)
    winner = next((p for p in room['players'] if p['id'] == winner_id), None)
    
    # Update room status
    await db.rooms.update_one(
        {"id": room_id},
        {"$set": {"status": "finished", "winner_id": winner_id}}
    )
    
    # Award coins and update stats
    for player in room['players']:
        is_winner = player['id'] == winner_id
        await award_match_result(player['id'], is_winner, player.get('score', 0))
    
    # Save game results for both players
    for player in room['players']:
        is_winner = player['id'] == winner_id
        opponent = next((p for p in room['players'] if p['id'] != player['id']), None)
        
        if opponent:
            game_result = {
                "id": str(uuid.uuid4()),
                "user_id": player['id'],
                "result": "win" if is_winner else "loss",
                "opponent_name": opponent.get('name', 'Rakip'),
                "my_score": player.get('score', 0),
                "opponent_score": opponent.get('score', 0),
                "room_id": room_id,
                "coins_earned": 100 if is_winner else 25,
                "xp_earned": 50 if is_winner else 15,
                "created_at": datetime.now(timezone.utc)
            }
            await db.game_results.insert_one(game_result)
    
    # Emit game ended event with rewards info
    await sio.emit('game_ended', {
        'winner_id': winner_id,
        'winner_name': winner.get('name', 'Kazanan') if winner else 'Bilinmiyor',
        'players': room['players'],
        'scores': scores,
        'rewards': {
            winner_id: {'coins': 100, 'xp': 50},
            **{p['id']: {'coins': 25, 'xp': 15} for p in room['players'] if p['id'] != winner_id}
        }
    }, room=room_id)
    
    # Clean up game state
    if room_id in game_states:
        del game_states[room_id]

async def award_match_result(user_id: str, is_winner: bool, score: int):
    """Award coins and XP based on match result"""
    coins = 100 if is_winner else 25
    xp = 50 if is_winner else 15
    
    # Get user profile
    profile = await db.user_profiles.find_one({"id": user_id})
    
    if profile:
        update_data = {
            "coins": profile.get('coins', 0) + coins,
            "xp": profile.get('xp', 0) + xp,
            "total_games": profile.get('total_games', 0) + 1,
            "updated_at": datetime.now(timezone.utc)
        }
        
        if is_winner:
            update_data['total_wins'] = profile.get('total_wins', 0) + 1
            update_data['win_streak'] = profile.get('win_streak', 0) + 1
            update_data['best_win_streak'] = max(
                profile.get('best_win_streak', 0),
                update_data['win_streak']
            )
        else:
            update_data['win_streak'] = 0
        
        # Check high score
        if score > profile.get('high_score', 0):
            update_data['high_score'] = score
        
        # Check level up
        new_xp = update_data['xp']
        current_level = profile.get('level', 1)
        xp_to_next = profile.get('xp_to_next_level', 100)
        
        while new_xp >= xp_to_next:
            new_xp -= xp_to_next
            current_level += 1
            xp_to_next = int(100 * (1.5 ** (current_level - 1)))
        
        update_data['xp'] = new_xp
        update_data['level'] = current_level
        update_data['xp_to_next_level'] = xp_to_next
        
        await db.user_profiles.update_one(
            {"id": user_id},
            {"$set": update_data}
        )


# ==================== User Profile Endpoints ====================

@api_router.post("/profiles", response_model=dict)
async def create_or_get_profile(data: UserCreate):
    """Create a new user profile or get existing one"""
    existing = None
    
    if data.user_id:
        existing = await db.user_profiles.find_one({"id": data.user_id})
    
    if not existing and data.username:
        existing = await db.user_profiles.find_one({"username": data.username})
    
    if existing:
        # Update username if changed
        if existing.get("username") != data.username:
            await db.user_profiles.update_one(
                {"id": existing["id"]},
                {"$set": {"username": data.username, "updated_at": datetime.now(timezone.utc)}}
            )
            existing["username"] = data.username
        
        # Remove _id for JSON serialization
        existing.pop('_id', None)
        return existing
    
    # Create new profile
    new_profile = UserProfile(
        id=data.user_id or str(uuid.uuid4()),
        username=data.username
    )
    
    profile_dict = new_profile.dict()
    await db.user_profiles.insert_one(profile_dict)
    profile_dict.pop('_id', None)
    
    return profile_dict

@api_router.get("/profiles/{user_id}")
async def get_profile(user_id: str):
    """Get user profile by ID"""
    profile = await db.user_profiles.find_one({"id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.pop('_id', None)
    return profile

@api_router.put("/profiles/{user_id}/sync")
async def sync_profile(user_id: str, data: UserProfileSync):
    """Sync full user profile from client"""
    existing = await db.user_profiles.find_one({"id": user_id})
    
    profile_data = {
        "id": user_id,
        "username": data.username,
        "coins": data.coins,
        "level": data.level,
        "xp": data.xp,
        "high_score": data.high_score,
        "owned_themes": data.owned_themes,
        "owned_backgrounds": data.owned_backgrounds,
        "active_theme": data.active_theme,
        "active_background": data.active_background,
        "power_ups": data.power_ups,
        "total_games": data.total_games,
        "total_wins": data.total_wins,
        "win_streak": data.win_streak,
        "best_win_streak": data.best_win_streak,
        "updated_at": datetime.now(timezone.utc)
    }
    
    if existing:
        # Merge: keep server-side wins/games if higher
        profile_data['total_games'] = max(data.total_games, existing.get('total_games', 0))
        profile_data['total_wins'] = max(data.total_wins, existing.get('total_wins', 0))
        profile_data['high_score'] = max(data.high_score, existing.get('high_score', 0))
        profile_data['best_win_streak'] = max(data.best_win_streak, existing.get('best_win_streak', 0))
        
        await db.user_profiles.update_one(
            {"id": user_id},
            {"$set": profile_data}
        )
    else:
        profile_data['created_at'] = datetime.now(timezone.utc)
        await db.user_profiles.insert_one(profile_data)
    
    # Return updated profile
    result = await db.user_profiles.find_one({"id": user_id})
    result.pop('_id', None)
    return result

@api_router.post("/profiles/{user_id}/coins")
async def add_coins(user_id: str, data: AddCoinsRequest):
    """Add coins to user profile"""
    result = await db.user_profiles.find_one_and_update(
        {"id": user_id},
        {
            "$inc": {"coins": data.amount},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        },
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    result.pop('_id', None)
    return {"coins": result['coins'], "added": data.amount}

@api_router.post("/profiles/{user_id}/powerups")
async def update_powerup(user_id: str, data: PowerUpUpdate):
    """Update power-up quantity"""
    result = await db.user_profiles.find_one_and_update(
        {"id": user_id},
        {
            "$set": {
                f"power_ups.{data.power_up_id}": data.quantity,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    result.pop('_id', None)
    return {"power_ups": result.get('power_ups', {})}


# ==================== User Endpoints (Legacy) ====================

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
                {"$set": {"username": user_data.username, "updated_at": datetime.now(timezone.utc)}}
            )
            existing_user["username"] = user_data.username
        existing_user.pop('_id', None)
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
                "updated_at": datetime.now(timezone.utc)
            }
        },
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    result.pop('_id', None)
    return User(**result)


@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.pop('_id', None)
    return User(**user)


# ==================== Leaderboard Endpoints ====================

@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(sort_by: str = "level", limit: int = 50):
    """Get leaderboard sorted by level or score"""
    sort_field = "level" if sort_by == "level" else "high_score"
    
    # Try user_profiles first, fallback to users
    profiles = await db.user_profiles.find().sort(sort_field, -1).limit(limit).to_list(limit)
    
    if not profiles:
        profiles = await db.users.find().sort(sort_field, -1).limit(limit).to_list(limit)
    
    leaderboard = []
    for rank, user in enumerate(profiles, 1):
        leaderboard.append(LeaderboardEntry(
            id=user["id"],
            username=user["username"],
            level=user.get("level", 1),
            high_score=user.get("high_score", 0),
            xp=user.get("xp", 0),
            rank=rank,
            total_wins=user.get("total_wins", 0)
        ))
    
    return leaderboard


@api_router.post("/scores")
async def submit_score(score_data: GameScore):
    """Submit a game score"""
    # Update user profile
    profile = await db.user_profiles.find_one({"id": score_data.user_id})
    
    if profile:
        update_data = {
            "updated_at": datetime.now(timezone.utc)
        }
        if score_data.score > profile.get("high_score", 0):
            update_data["high_score"] = score_data.score
        if score_data.level > profile.get("level", 1):
            update_data["level"] = score_data.level
        
        await db.user_profiles.update_one(
            {"id": score_data.user_id},
            {"$set": update_data}
        )
    else:
        # Create new profile
        new_profile = UserProfile(
            id=score_data.user_id,
            username=score_data.username,
            level=score_data.level,
            high_score=score_data.score
        )
        await db.user_profiles.insert_one(new_profile.dict())
    
    # Also save to scores collection for history
    score_record = {
        "id": str(uuid.uuid4()),
        "user_id": score_data.user_id,
        "username": score_data.username,
        "score": score_data.score,
        "level": score_data.level,
        "game_mode": score_data.game_mode,
        "created_at": datetime.now(timezone.utc)
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
            "status": room["status"],
            "isPrivate": room.get("is_private", False),
            "hasPassword": bool(room.get("password"))
        })
    
    return result


@api_router.post("/rooms", response_model=dict)
async def create_room(room_data: RoomCreate):
    """Create a new game room"""
    room = Room(
        name=room_data.name,
        host_id=room_data.host_id,
        host_name=room_data.host_name,
        password=room_data.password,
        is_private=room_data.is_private,
        players=[{
            "id": room_data.host_id,
            "name": room_data.host_name,
            "score": 0,
            "is_host": True,
            "can_move": True,
            "ready": False,
            "game_over": False
        }]
    )
    
    await db.rooms.insert_one(room.dict())
    
    return {
        "id": room.id,
        "name": room.name,
        "status": room.status,
        "isPrivate": room.is_private
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
    
    # Check password for private rooms
    if room.get("password"):
        if not player_data.password or player_data.password != room["password"]:
            raise HTTPException(status_code=403, detail="Invalid password")
    
    for player in room["players"]:
        if player["id"] == player_data.player_id:
            return {"status": "already_joined"}
    
    new_player = {
        "id": player_data.player_id,
        "name": player_data.player_name,
        "score": 0,
        "is_host": False,
        "can_move": True,
        "ready": False,
        "game_over": False
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
    
    # Clean up game state
    if room_id in game_states:
        del game_states[room_id]
    
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
        'started_at': datetime.now(timezone.utc),
        'scores': {p['id']: 0 for p in room['players']},
        'can_move': {p['id']: True for p in room['players']},
        'game_over': {p['id']: False for p in room['players']}
    }
    
    await sio.emit('game_started', {
        'room_id': room_id,
        'players': room['players']
    }, room=room_id)
    
    return {"status": "started"}


@api_router.post("/rooms/{room_id}/player_gameover")
async def player_game_over(room_id: str, player_id: str, score: int):
    """Handle when a player can't place any more blocks"""
    room = await db.rooms.find_one({"id": room_id})
    
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    # Update player's game_over status and score
    await db.rooms.update_one(
        {"id": room_id, "players.id": player_id},
        {"$set": {"players.$.game_over": True, "players.$.score": score}}
    )
    
    # Update game state
    if room_id in game_states:
        game_states[room_id]['scores'][player_id] = score
        game_states[room_id]['game_over'][player_id] = True
    
    # Check if all players are game over
    updated_room = await db.rooms.find_one({"id": room_id})
    all_game_over = all(p.get("game_over", False) for p in updated_room["players"])
    
    if all_game_over:
        await finalize_game(room_id, updated_room)
        return {"status": "game_ended"}
    
    # Emit player game over event
    await sio.emit('player_game_over', {
        'room_id': room_id,
        'player_id': player_id,
        'score': score
    }, room=room_id)
    
    return {"status": "waiting_other_player"}


@api_router.get("/game_results/{user_id}")
async def get_user_game_results(user_id: str):
    """Get game results for a specific user"""
    results = await db.game_results.find({
        "user_id": user_id
    }).sort("created_at", -1).to_list(50)
    
    formatted_results = []
    for result in results:
        formatted_results.append({
            "id": result["id"],
            "result": result.get("result", "unknown"),
            "opponent_name": result.get("opponent_name", "Rakip"),
            "my_score": result.get("my_score", 0),
            "opponent_score": result.get("opponent_score", 0),
            "coins_earned": result.get("coins_earned", 0),
            "xp_earned": result.get("xp_earned", 0),
            "created_at": result["created_at"].isoformat() if hasattr(result["created_at"], 'isoformat') else result["created_at"]
        })
    
    return formatted_results


# ==================== Quick Match API ====================

@api_router.get("/quick_match/status")
async def get_quick_match_status():
    """Get current quick match queue status"""
    return {
        "queue_size": len(quick_match_queue),
        "waiting_players": len(quick_match_queue)
    }


# ==================== Health Check ====================

@api_router.get("/")
async def root():
    return {"message": "Block Blast API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


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
