"""
Backend API Tests for Puzzle Master Blast - Multiplayer System
Tests: User Profiles, Quick Match, Rooms, Game Results, Coins
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://puzzle-game-56.preview.emergentagent.com')

# Test user data
TEST_USER_ID = f"TEST_user_{uuid.uuid4().hex[:8]}"
TEST_USERNAME = f"TEST_Player_{uuid.uuid4().hex[:4]}"
TEST_USER_ID_2 = f"TEST_user2_{uuid.uuid4().hex[:8]}"
TEST_USERNAME_2 = f"TEST_Player2_{uuid.uuid4().hex[:4]}"


class TestHealthEndpoints:
    """Health check endpoints"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "Block Blast API" in data["message"]
        print("✓ API root endpoint working")
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print("✓ Health check endpoint working")


class TestUserProfiles:
    """User Profile CRUD tests with MongoDB persistence"""
    
    def test_create_profile(self):
        """POST /api/profiles - Create new user profile"""
        response = requests.post(f"{BASE_URL}/api/profiles", json={
            "username": TEST_USERNAME,
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify profile structure
        assert data["id"] == TEST_USER_ID
        assert data["username"] == TEST_USERNAME
        assert data["coins"] == 0
        assert data["level"] == 1
        assert data["xp"] == 0
        assert "owned_themes" in data
        assert "classic" in data["owned_themes"]
        assert "owned_backgrounds" in data
        assert "classic_night" in data["owned_backgrounds"]
        assert "power_ups" in data
        assert data["total_games"] == 0
        assert data["total_wins"] == 0
        print(f"✓ Created profile for {TEST_USERNAME}")
    
    def test_get_existing_profile(self):
        """POST /api/profiles - Get existing profile (idempotent)"""
        response = requests.post(f"{BASE_URL}/api/profiles", json={
            "username": TEST_USERNAME,
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TEST_USER_ID
        print("✓ Get existing profile works (idempotent)")
    
    def test_get_profile_by_id(self):
        """GET /api/profiles/{user_id} - Get profile by ID"""
        response = requests.get(f"{BASE_URL}/api/profiles/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == TEST_USER_ID
        assert data["username"] == TEST_USERNAME
        print("✓ Get profile by ID working")
    
    def test_get_nonexistent_profile(self):
        """GET /api/profiles/{user_id} - 404 for nonexistent profile"""
        response = requests.get(f"{BASE_URL}/api/profiles/nonexistent_user_12345")
        assert response.status_code == 404
        print("✓ 404 returned for nonexistent profile")
    
    def test_sync_profile(self):
        """PUT /api/profiles/{user_id}/sync - Full profile sync"""
        sync_data = {
            "user_id": TEST_USER_ID,
            "username": TEST_USERNAME,
            "coins": 500,
            "level": 5,
            "xp": 250,
            "high_score": 1500,
            "owned_themes": ["classic", "neon_blue"],
            "owned_backgrounds": ["classic_night", "ocean"],
            "active_theme": "neon_blue",
            "active_background": "ocean",
            "power_ups": {"bomb": 3, "shuffle": 2},
            "total_games": 10,
            "total_wins": 6,
            "win_streak": 2,
            "best_win_streak": 4
        }
        
        response = requests.put(f"{BASE_URL}/api/profiles/{TEST_USER_ID}/sync", json=sync_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify synced data
        assert data["coins"] == 500
        assert data["level"] == 5
        assert data["high_score"] == 1500
        assert "neon_blue" in data["owned_themes"]
        assert data["active_theme"] == "neon_blue"
        assert data["power_ups"]["bomb"] == 3
        print("✓ Profile sync working")
    
    def test_verify_sync_persistence(self):
        """GET /api/profiles/{user_id} - Verify sync persisted"""
        response = requests.get(f"{BASE_URL}/api/profiles/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify data persisted
        assert data["coins"] == 500
        assert data["level"] == 5
        assert data["high_score"] == 1500
        print("✓ Sync data persisted correctly")


class TestCoinsEndpoint:
    """Test coin addition endpoint"""
    
    def test_add_coins(self):
        """POST /api/profiles/{user_id}/coins - Add coins to user"""
        # First get current coins
        response = requests.get(f"{BASE_URL}/api/profiles/{TEST_USER_ID}")
        initial_coins = response.json()["coins"]
        
        # Add coins
        response = requests.post(f"{BASE_URL}/api/profiles/{TEST_USER_ID}/coins", json={
            "amount": 100,
            "reason": "test_reward"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["added"] == 100
        assert data["coins"] == initial_coins + 100
        print(f"✓ Added 100 coins, new balance: {data['coins']}")
    
    def test_add_coins_nonexistent_user(self):
        """POST /api/profiles/{user_id}/coins - 404 for nonexistent user"""
        response = requests.post(f"{BASE_URL}/api/profiles/nonexistent_user_12345/coins", json={
            "amount": 100,
            "reason": "test"
        })
        assert response.status_code == 404
        print("✓ 404 returned for adding coins to nonexistent user")


class TestPowerUps:
    """Test power-up update endpoint"""
    
    def test_update_powerup(self):
        """POST /api/profiles/{user_id}/powerups - Update power-up quantity"""
        response = requests.post(f"{BASE_URL}/api/profiles/{TEST_USER_ID}/powerups", json={
            "power_up_id": "bomb",
            "quantity": 5
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "power_ups" in data
        assert data["power_ups"]["bomb"] == 5
        print("✓ Power-up update working")


class TestGameResults:
    """Test game results endpoint"""
    
    def test_get_game_results_empty(self):
        """GET /api/game_results/{user_id} - Get empty game history"""
        response = requests.get(f"{BASE_URL}/api/game_results/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Game results endpoint working, found {len(data)} results")
    
    def test_get_game_results_nonexistent_user(self):
        """GET /api/game_results/{user_id} - Empty list for new user"""
        response = requests.get(f"{BASE_URL}/api/game_results/new_user_no_games")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 0
        print("✓ Empty game results for new user")


class TestQuickMatch:
    """Test Quick Match queue status endpoint"""
    
    def test_quick_match_status(self):
        """GET /api/quick_match/status - Check queue status"""
        response = requests.get(f"{BASE_URL}/api/quick_match/status")
        assert response.status_code == 200
        data = response.json()
        
        assert "queue_size" in data
        assert "waiting_players" in data
        assert isinstance(data["queue_size"], int)
        assert isinstance(data["waiting_players"], int)
        print(f"✓ Quick match status: {data['queue_size']} in queue")


class TestRooms:
    """Test room CRUD operations"""
    
    room_id = None
    
    def test_get_rooms_list(self):
        """GET /api/rooms - Get available rooms"""
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Rooms list endpoint working, found {len(data)} rooms")
    
    def test_create_room(self):
        """POST /api/rooms - Create new game room"""
        response = requests.post(f"{BASE_URL}/api/rooms", json={
            "name": f"TEST_Room_{uuid.uuid4().hex[:4]}",
            "host_id": TEST_USER_ID,
            "host_name": TEST_USERNAME,
            "password": None,
            "is_private": False
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "name" in data
        assert data["status"] == "waiting"
        TestRooms.room_id = data["id"]
        print(f"✓ Created room: {data['id']}")
    
    def test_verify_room_in_list(self):
        """GET /api/rooms - Verify created room appears in list"""
        response = requests.get(f"{BASE_URL}/api/rooms")
        assert response.status_code == 200
        data = response.json()
        
        room_ids = [r["id"] for r in data]
        assert TestRooms.room_id in room_ids
        print("✓ Created room appears in rooms list")
    
    def test_join_room(self):
        """POST /api/rooms/{room_id}/join - Join existing room"""
        # Create second user profile first
        requests.post(f"{BASE_URL}/api/profiles", json={
            "username": TEST_USERNAME_2,
            "user_id": TEST_USER_ID_2
        })
        
        response = requests.post(f"{BASE_URL}/api/rooms/{TestRooms.room_id}/join", json={
            "player_id": TEST_USER_ID_2,
            "player_name": TEST_USERNAME_2,
            "password": None
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["joined", "already_joined"]
        print(f"✓ Joined room: {data['status']}")
    
    def test_join_nonexistent_room(self):
        """POST /api/rooms/{room_id}/join - 404 for nonexistent room"""
        response = requests.post(f"{BASE_URL}/api/rooms/nonexistent_room_12345/join", json={
            "player_id": TEST_USER_ID_2,
            "player_name": TEST_USERNAME_2
        })
        assert response.status_code == 404
        print("✓ 404 returned for joining nonexistent room")
    
    def test_create_private_room(self):
        """POST /api/rooms - Create private room with password"""
        response = requests.post(f"{BASE_URL}/api/rooms", json={
            "name": f"TEST_Private_{uuid.uuid4().hex[:4]}",
            "host_id": TEST_USER_ID,
            "host_name": TEST_USERNAME,
            "password": "secret123",
            "is_private": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["isPrivate"] == True
        print(f"✓ Created private room: {data['id']}")
    
    def test_join_private_room_wrong_password(self):
        """POST /api/rooms/{room_id}/join - 403 for wrong password"""
        # Create a new private room
        create_response = requests.post(f"{BASE_URL}/api/rooms", json={
            "name": f"TEST_Private_PW_{uuid.uuid4().hex[:4]}",
            "host_id": TEST_USER_ID,
            "host_name": TEST_USERNAME,
            "password": "correct_password",
            "is_private": True
        })
        private_room_id = create_response.json()["id"]
        
        # Try to join with wrong password
        response = requests.post(f"{BASE_URL}/api/rooms/{private_room_id}/join", json={
            "player_id": TEST_USER_ID_2,
            "player_name": TEST_USERNAME_2,
            "password": "wrong_password"
        })
        assert response.status_code == 403
        print("✓ 403 returned for wrong password")
    
    def test_delete_room(self):
        """DELETE /api/rooms/{room_id} - Delete room"""
        if TestRooms.room_id:
            response = requests.delete(f"{BASE_URL}/api/rooms/{TestRooms.room_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "deleted"
            print(f"✓ Deleted room: {TestRooms.room_id}")


class TestLeaderboard:
    """Test leaderboard endpoint"""
    
    def test_get_leaderboard_by_level(self):
        """GET /api/leaderboard - Get leaderboard sorted by level"""
        response = requests.get(f"{BASE_URL}/api/leaderboard?sort_by=level&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Verify structure if data exists
        if len(data) > 0:
            entry = data[0]
            assert "id" in entry
            assert "username" in entry
            assert "level" in entry
            assert "high_score" in entry
            assert "rank" in entry
        print(f"✓ Leaderboard by level: {len(data)} entries")
    
    def test_get_leaderboard_by_score(self):
        """GET /api/leaderboard - Get leaderboard sorted by score"""
        response = requests.get(f"{BASE_URL}/api/leaderboard?sort_by=score&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Leaderboard by score: {len(data)} entries")


class TestScoreSubmission:
    """Test score submission endpoint"""
    
    def test_submit_score(self):
        """POST /api/scores - Submit game score"""
        response = requests.post(f"{BASE_URL}/api/scores", json={
            "user_id": TEST_USER_ID,
            "username": TEST_USERNAME,
            "score": 2500,
            "level": 3,
            "game_mode": "classic"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "score_id" in data
        print(f"✓ Score submitted: {data['score_id']}")
    
    def test_verify_high_score_updated(self):
        """GET /api/profiles/{user_id} - Verify high score updated"""
        response = requests.get(f"{BASE_URL}/api/profiles/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        # High score should be max of previous (1500 from sync) and new (2500)
        assert data["high_score"] >= 2500
        print(f"✓ High score updated to: {data['high_score']}")


class TestLegacyUserEndpoints:
    """Test legacy user endpoints for backward compatibility"""
    
    def test_create_legacy_user(self):
        """POST /api/users - Create legacy user"""
        legacy_user_id = f"TEST_legacy_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/users", json={
            "username": f"LegacyUser_{uuid.uuid4().hex[:4]}",
            "user_id": legacy_user_id
        })
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "username" in data
        print("✓ Legacy user creation working")
    
    def test_get_legacy_user(self):
        """GET /api/users/{user_id} - Get legacy user"""
        # First create a user
        legacy_user_id = f"TEST_legacy_get_{uuid.uuid4().hex[:8]}"
        requests.post(f"{BASE_URL}/api/users", json={
            "username": "LegacyGetUser",
            "user_id": legacy_user_id
        })
        
        response = requests.get(f"{BASE_URL}/api/users/{legacy_user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == legacy_user_id
        print("✓ Legacy user get working")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_rooms(self):
        """Clean up test rooms"""
        response = requests.get(f"{BASE_URL}/api/rooms")
        if response.status_code == 200:
            rooms = response.json()
            test_rooms = [r for r in rooms if r["name"].startswith("TEST_")]
            for room in test_rooms:
                requests.delete(f"{BASE_URL}/api/rooms/{room['id']}")
            print(f"✓ Cleaned up {len(test_rooms)} test rooms")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
