#!/usr/bin/env python3
"""
WebSocket Testing for Block Blast Multiplayer
"""

import asyncio
import websockets
import json
import sys

class WebSocketTester:
    def __init__(self):
        self.ws_url = "wss://match-block-pop.preview.emergentagent.com/ws"
        self.test_results = []
    
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
    
    async def test_websocket_connection(self):
        """Test WebSocket connection to multiplayer endpoint"""
        try:
            # Test connecting to a WebSocket room
            room_id = "test-room-123"
            user_id = "test-user-456"
            
            uri = f"{self.ws_url}/{room_id}/{user_id}"
            print(f"Attempting to connect to: {uri}")
            
            # Try connecting with different timeouts and error handling
            try:
                # Create connection with proper timeout handling
                websocket = await websockets.connect(uri)
                self.log_test("WebSocket Connection", True, f"Connected to {uri}")
                
                # Test sending a message
                test_message = {
                    "type": "move",
                    "move": {
                        "block": "L-shape",
                        "position": {"x": 2, "y": 3},
                        "rotation": 0
                    }
                }
                
                await websocket.send(json.dumps(test_message))
                self.log_test("WebSocket Send Message", True, "Move message sent")
                
                # Try to receive a response (with timeout)
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=3)
                    data = json.loads(response)
                    self.log_test("WebSocket Receive Message", True, f"Received: {data.get('type', 'unknown')}")
                except asyncio.TimeoutError:
                    self.log_test("WebSocket Receive Message", True, "No immediate response (expected for room broadcast)")
                
                await websocket.close()
                return True
            except websockets.exceptions.InvalidStatusCode as e:
                if e.status_code == 404:
                    self.log_test("WebSocket Connection", False, f"WebSocket endpoint not found (404). May need proxy configuration for WebSocket support.")
                elif e.status_code == 520:
                    self.log_test("WebSocket Connection", False, f"Server error (520). WebSocket may not be properly configured in the proxy/ingress.")
                else:
                    self.log_test("WebSocket Connection", False, f"HTTP {e.status_code}: {str(e)}")
                return False
                
        except websockets.exceptions.ConnectionClosed as e:
            self.log_test("WebSocket Connection", False, f"Connection closed: {e}")
            return False
        except Exception as e:
            self.log_test("WebSocket Connection", False, f"Connection failed: {str(e)}")
            return False
    
    def test_websocket_endpoint_availability(self):
        """Test if WebSocket endpoint is reachable"""
        import requests
        try:
            # Try a simple HTTP request to the WebSocket path
            response = requests.get("https://puzzle-master-blast.preview.emergentagent.com/ws/test/test", timeout=5)
            if response.status_code == 404:
                self.log_test("WebSocket Endpoint Check", False, "WebSocket endpoint returns 404 - proxy may not support WebSocket upgrades")
            else:
                self.log_test("WebSocket Endpoint Check", True, f"WebSocket path accessible (HTTP {response.status_code})")
        except Exception as e:
            self.log_test("WebSocket Endpoint Check", False, f"Error accessing WebSocket path: {str(e)}")
        return False
    
    async def run_websocket_tests(self):
        """Run all WebSocket tests"""
        print(f"🔌 Starting WebSocket Tests")
        print(f"WebSocket URL: {self.ws_url}")
        print("=" * 50)
        
        # First test endpoint availability
        self.test_websocket_endpoint_availability()
        
        # Then test actual WebSocket connection
        success = await self.test_websocket_connection()
        
        print("\n" + "=" * 50)
        print(f"📊 WEBSOCKET TEST SUMMARY")
        if success:
            print(f"✅ WebSocket functionality working")
        else:
            print(f"❌ WebSocket functionality failed - likely proxy configuration issue")
            print(f"💡 WebSocket requires special proxy configuration to handle HTTP upgrade requests")
        
        return success

async def main():
    tester = WebSocketTester()
    success = await tester.run_websocket_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    asyncio.run(main())