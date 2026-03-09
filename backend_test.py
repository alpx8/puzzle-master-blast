#!/usr/bin/env python3
"""
Block Blast Backend API Testing Suite
Tests all API endpoints with realistic data
"""

import requests
import json
import sys
import uuid
from datetime import datetime

# Base URL from frontend environment
BASE_URL = "https://puzzle-master-blast-1.preview.emergentagent.com/api"

class BlockBlastAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.test_results = []
        self.created_users = []
        self.created_rooms = []
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check API", True, f"Status: {data}")
                    return True
                else:
                    self.log_test("Health Check API", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Health Check API", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Health Check API", False, f"Exception: {str(e)}")
            return False
    
    def test_user_creation(self):
        """Test POST /api/users - Create users"""
        users_to_create = [
            {"username": "GameMaster2024", "user_id": "gamemaster2024"},
            {"username": "BlockBuster", "user_id": "blockbuster"},
            {"username": "PuzzlePro", "user_id": "puzzlepro"}
        ]
        
        success_count = 0
        for user_data in users_to_create:
            try:
                response = requests.post(
                    f"{self.base_url}/users",
                    json=user_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("username") == user_data["username"]:
                        self.created_users.append(data["id"])
                        success_count += 1
                    else:
                        self.log_test(f"User Creation - {user_data['username']}", False, f"Invalid response: {data}")
                else:
                    self.log_test(f"User Creation - {user_data['username']}", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"User Creation - {user_data['username']}", False, f"Exception: {str(e)}")
        
        if success_count == len(users_to_create):
            self.log_test("User Creation API", True, f"Created {success_count} users successfully")
            return True
        else:
            self.log_test("User Creation API", False, f"Only {success_count}/{len(users_to_create)} users created")
            return False
    
    def test_user_stats_update(self):
        """Test PUT /api/users/{id} - Update user stats"""
        if not self.created_users:
            self.log_test("User Stats Update", False, "No users available for testing")
            return False
        
        updates = [
            {"level": 5, "xp": 450, "high_score": 2500},
            {"level": 8, "xp": 800, "high_score": 5000},
            {"level": 3, "xp": 200, "high_score": 1200}
        ]
        
        success_count = 0
        for i, user_id in enumerate(self.created_users):
            if i >= len(updates):
                break
                
            try:
                response = requests.put(
                    f"{self.base_url}/users/{user_id}",
                    json=updates[i],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if (data.get("level") == updates[i]["level"] and 
                        data.get("high_score") == updates[i]["high_score"]):
                        success_count += 1
                    else:
                        self.log_test(f"User Update - {user_id}", False, f"Stats not updated correctly: {data}")
                else:
                    self.log_test(f"User Update - {user_id}", False, f"Status: {response.status_code}, Response: {response.text}")
            except Exception as e:
                self.log_test(f"User Update - {user_id}", False, f"Exception: {str(e)}")
        
        if success_count > 0:
            self.log_test("User Stats Update API", True, f"Updated {success_count} user stats")
            return True
        else:
            self.log_test("User Stats Update API", False, "No user stats updated")
            return False
    
    def test_user_retrieval(self):
        """Test GET /api/users/{id}"""
        if not self.created_users:
            self.log_test("User Retrieval API", False, "No users available for testing")
            return False
        
        success_count = 0
        for user_id in self.created_users:
            try:
                response = requests.get(f"{self.base_url}/users/{user_id}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("id") == user_id:
                        success_count += 1
                    else:
                        self.log_test(f"User Retrieval - {user_id}", False, f"ID mismatch: {data}")
                else:
                    self.log_test(f"User Retrieval - {user_id}", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"User Retrieval - {user_id}", False, f"Exception: {str(e)}")
        
        if success_count > 0:
            self.log_test("User Retrieval API", True, f"Retrieved {success_count} users")
            return True
        else:
            self.log_test("User Retrieval API", False, "No users retrieved")
            return False
    
    def test_leaderboard(self):
        """Test GET /api/leaderboard"""
        try:
            # Test level-based leaderboard
            response = requests.get(f"{self.base_url}/leaderboard?sort_by=level", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    level_success = True
                    # Check if sorted by level (descending)
                    for i in range(len(data) - 1):
                        if data[i].get("level", 0) < data[i + 1].get("level", 0):
                            level_success = False
                            break
                    
                    if level_success:
                        self.log_test("Leaderboard API (Level)", True, f"Found {len(data)} users, sorted by level")
                    else:
                        self.log_test("Leaderboard API (Level)", False, "Not sorted by level correctly")
                else:
                    self.log_test("Leaderboard API (Level)", False, f"Invalid response format: {data}")
                    level_success = False
            else:
                self.log_test("Leaderboard API (Level)", False, f"Status: {response.status_code}")
                level_success = False
            
            # Test score-based leaderboard
            response = requests.get(f"{self.base_url}/leaderboard?sort_by=score", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    score_success = True
                    # Check if sorted by high_score (descending)
                    for i in range(len(data) - 1):
                        if data[i].get("high_score", 0) < data[i + 1].get("high_score", 0):
                            score_success = False
                            break
                    
                    if score_success:
                        self.log_test("Leaderboard API (Score)", True, f"Found {len(data)} users, sorted by score")
                    else:
                        self.log_test("Leaderboard API (Score)", False, "Not sorted by score correctly")
                else:
                    self.log_test("Leaderboard API (Score)", False, f"Invalid response format: {data}")
                    score_success = False
            else:
                self.log_test("Leaderboard API (Score)", False, f"Status: {response.status_code}")
                score_success = False
            
            return level_success and score_success
            
        except Exception as e:
            self.log_test("Leaderboard API", False, f"Exception: {str(e)}")
            return False
    
    def test_score_submission(self):
        """Test POST /api/scores"""
        if not self.created_users:
            self.log_test("Score Submission API", False, "No users available for testing")
            return False
        
        try:
            user_id = self.created_users[0]
            score_data = {
                "user_id": user_id,
                "username": "GameMaster2024",
                "score": 3500,
                "level": 6,
                "game_mode": "classic"
            }
            
            response = requests.post(
                f"{self.base_url}/scores",
                json=score_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    # Verify user's high score was updated
                    user_response = requests.get(f"{self.base_url}/users/{user_id}", timeout=10)
                    if user_response.status_code == 200:
                        user_data = user_response.json()
                        if user_data.get("high_score") == 3500:
                            self.log_test("Score Submission API", True, f"Score submitted and high score updated")
                            return True
                        else:
                            self.log_test("Score Submission API", False, f"High score not updated: {user_data.get('high_score')}")
                            return False
                    else:
                        self.log_test("Score Submission API", False, f"Could not verify user update")
                        return False
                else:
                    self.log_test("Score Submission API", False, f"Invalid response: {data}")
                    return False
            else:
                self.log_test("Score Submission API", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Score Submission API", False, f"Exception: {str(e)}")
            return False
    
    def test_room_management(self):
        """Test room management endpoints"""
        try:
            # Test GET /api/rooms (empty list initially)
            response = requests.get(f"{self.base_url}/rooms", timeout=10)
            if response.status_code == 200:
                rooms = response.json()
                self.log_test("Get Rooms API (Initial)", True, f"Found {len(rooms)} rooms")
            else:
                self.log_test("Get Rooms API (Initial)", False, f"Status: {response.status_code}")
                return False
            
            # Test POST /api/rooms (create room)
            if not self.created_users:
                self.log_test("Room Creation API", False, "No users available")
                return False
            
            room_data = {
                "name": "Elite Battle Arena",
                "host_id": self.created_users[0],
                "host_name": "GameMaster2024"
            }
            
            response = requests.post(
                f"{self.base_url}/rooms",
                json=room_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                room_response = response.json()
                room_id = room_response.get("id")
                if room_id:
                    self.created_rooms.append(room_id)
                    self.log_test("Room Creation API", True, f"Created room: {room_response}")
                else:
                    self.log_test("Room Creation API", False, f"No room ID in response: {room_response}")
                    return False
            else:
                self.log_test("Room Creation API", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
            # Test POST /api/rooms/{room_id}/join
            if len(self.created_users) >= 2:
                join_data = {
                    "player_id": self.created_users[1],
                    "player_name": "BlockBuster"
                }
                
                response = requests.post(
                    f"{self.base_url}/rooms/{room_id}/join",
                    json=join_data,
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    join_response = response.json()
                    if join_response.get("status") == "joined":
                        self.log_test("Join Room API", True, f"Player joined: {join_response}")
                    else:
                        self.log_test("Join Room API", False, f"Join failed: {join_response}")
                        return False
                else:
                    self.log_test("Join Room API", False, f"Status: {response.status_code}, Response: {response.text}")
                    return False
            else:
                self.log_test("Join Room API", False, "Not enough users to test joining")
            
            # Test GET /api/rooms (verify room has players)
            response = requests.get(f"{self.base_url}/rooms", timeout=10)
            if response.status_code == 200:
                rooms = response.json()
                found_room = None
                for room in rooms:
                    if room.get("id") == room_id:
                        found_room = room
                        break
                
                if found_room and found_room.get("players", 0) >= 1:
                    self.log_test("Get Rooms API (With Players)", True, f"Room has {found_room.get('players')} players")
                else:
                    self.log_test("Get Rooms API (With Players)", False, f"Room not found or no players: {rooms}")
                    return False
            else:
                self.log_test("Get Rooms API (With Players)", False, f"Status: {response.status_code}")
                return False
            
            # Test DELETE /api/rooms/{room_id}
            response = requests.delete(f"{self.base_url}/rooms/{room_id}", timeout=10)
            if response.status_code == 200:
                delete_response = response.json()
                if delete_response.get("status") == "deleted":
                    self.log_test("Delete Room API", True, f"Room deleted: {delete_response}")
                    return True
                else:
                    self.log_test("Delete Room API", False, f"Delete failed: {delete_response}")
                    return False
            else:
                self.log_test("Delete Room API", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
            
        except Exception as e:
            self.log_test("Room Management APIs", False, f"Exception: {str(e)}")
            return False
    
    def test_error_handling(self):
        """Test error handling for non-existent resources"""
        try:
            # Test non-existent user
            response = requests.get(f"{self.base_url}/users/nonexistent", timeout=10)
            if response.status_code == 404:
                self.log_test("Error Handling - Non-existent User", True, "Returns 404 as expected")
            else:
                self.log_test("Error Handling - Non-existent User", False, f"Expected 404, got {response.status_code}")
            
            # Test non-existent room
            response = requests.post(
                f"{self.base_url}/rooms/nonexistent/join",
                json={"player_id": "test", "player_name": "test"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 404:
                self.log_test("Error Handling - Non-existent Room", True, "Returns 404 as expected")
                return True
            else:
                self.log_test("Error Handling - Non-existent Room", False, f"Expected 404, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Error Handling Tests", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all API tests"""
        print(f"🚀 Starting Block Blast API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        tests = [
            ("Health Check", self.test_health_check),
            ("User Creation", self.test_user_creation),
            ("User Stats Update", self.test_user_stats_update),
            ("User Retrieval", self.test_user_retrieval),
            ("Leaderboard", self.test_leaderboard),
            ("Score Submission", self.test_score_submission),
            ("Room Management", self.test_room_management),
            ("Error Handling", self.test_error_handling)
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            print(f"\n🧪 Testing {test_name}...")
            if test_func():
                passed += 1
            else:
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"🎯 Success Rate: {(passed/(passed+failed)*100):.1f}%")
        
        return failed == 0

if __name__ == "__main__":
    tester = BlockBlastAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)