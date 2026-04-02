import requests
import sys
import json
from datetime import datetime
import time

class GemCrushAPITester:
    def __init__(self, base_url="https://glimmer-quest-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.test_player_id = None
        self.test_player_name = f"TestPlayer_{datetime.now().strftime('%H%M%S')}"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            self.failed_tests.append({"test": name, "details": details})
            print(f"❌ {name} - FAILED: {details}")

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            
            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    self.log_test(name, True)
                    return True, response_data
                except:
                    print(f"   Response: {response.text[:200]}...")
                    self.log_test(name, True)
                    return True, {}
            else:
                error_details = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_data = response.json()
                    error_details += f" - {error_data}"
                except:
                    error_details += f" - {response.text[:100]}"
                
                self.log_test(name, False, error_details)
                return False, {}

        except Exception as e:
            error_details = f"Request failed: {str(e)}"
            self.log_test(name, False, error_details)
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_create_player(self):
        """Test player creation"""
        success, response = self.run_test(
            "Create Player",
            "POST",
            "player/create",
            200,
            data={"player_name": self.test_player_name}
        )
        if success and 'id' in response:
            self.test_player_id = response['id']
            print(f"   Created player ID: {self.test_player_id}")
            return True
        return False

    def test_get_player(self):
        """Test player retrieval"""
        if not self.test_player_id:
            self.log_test("Get Player", False, "No player ID available")
            return False
        
        return self.run_test(
            "Get Player",
            "GET",
            f"player/{self.test_player_id}",
            200
        )[0]

    def test_start_game(self):
        """Test game start"""
        if not self.test_player_id:
            self.log_test("Start Game", False, "No player ID available")
            return False
        
        return self.run_test(
            "Start Game",
            "POST",
            "game/start",
            200,
            params={"player_id": self.test_player_id}
        )[0]

    def test_end_game(self):
        """Test game end"""
        if not self.test_player_id:
            self.log_test("End Game", False, "No player ID available")
            return False
        
        return self.run_test(
            "End Game",
            "POST",
            "game/end",
            200,
            data={
                "player_id": self.test_player_id,
                "score": 1500,
                "level": 1,
                "moves_used": 25
            }
        )[0]

    def test_shop_prices(self):
        """Test shop prices endpoint"""
        return self.run_test("Shop Prices", "GET", "shop/prices", 200)[0]

    def test_purchase_item(self):
        """Test item purchase"""
        if not self.test_player_id:
            self.log_test("Purchase Item", False, "No player ID available")
            return False
        
        # Try to purchase hammer (should have enough coins from game end)
        return self.run_test(
            "Purchase Item",
            "POST",
            "shop/purchase",
            200,
            data={
                "player_id": self.test_player_id,
                "item_type": "hammer",
                "quantity": 1
            }
        )[0]

    def test_use_powerup(self):
        """Test power-up usage"""
        if not self.test_player_id:
            self.log_test("Use Power-up", False, "No player ID available")
            return False
        
        return self.run_test(
            "Use Power-up",
            "POST",
            "powerup/use",
            200,
            data={
                "player_id": self.test_player_id,
                "power_up_type": "hammer"
            }
        )[0]

    def test_daily_reward_status(self):
        """Test daily reward status"""
        if not self.test_player_id:
            self.log_test("Daily Reward Status", False, "No player ID available")
            return False
        
        return self.run_test(
            "Daily Reward Status",
            "GET",
            f"daily-reward/status/{self.test_player_id}",
            200
        )[0]

    def test_claim_daily_reward(self):
        """Test daily reward claim"""
        if not self.test_player_id:
            self.log_test("Claim Daily Reward", False, "No player ID available")
            return False
        
        return self.run_test(
            "Claim Daily Reward",
            "POST",
            "daily-reward/claim",
            200,
            data={"player_id": self.test_player_id}
        )[0]

    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        return self.run_test("Leaderboard", "GET", "leaderboard", 200)[0]

    def test_watch_ad_coins(self):
        """Test watch ad for coins (MOCKED)"""
        if not self.test_player_id:
            self.log_test("Watch Ad (Coins)", False, "No player ID available")
            return False
        
        return self.run_test(
            "Watch Ad (Coins)",
            "POST",
            "ads/watch",
            200,
            params={"player_id": self.test_player_id, "reward_type": "coins"}
        )[0]

    def test_watch_ad_life(self):
        """Test watch ad for life (MOCKED)"""
        if not self.test_player_id:
            self.log_test("Watch Ad (Life)", False, "No player ID available")
            return False
        
        return self.run_test(
            "Watch Ad (Life)",
            "POST",
            "ads/watch",
            200,
            params={"player_id": self.test_player_id, "reward_type": "life"}
        )[0]

    def test_iap_packages(self):
        """Test IAP packages endpoint"""
        return self.run_test("IAP Packages", "GET", "iap/packages", 200)[0]

    def test_error_cases(self):
        """Test error handling"""
        print("\n🔍 Testing Error Cases...")
        
        # Test invalid player ID
        success, _ = self.run_test(
            "Invalid Player ID",
            "GET",
            "player/invalid-id",
            404
        )
        
        # Test start game with no lives (need to use up all lives first)
        # This is complex to test without multiple game starts, so we'll skip for now
        
        # Test purchase with insufficient coins
        if self.test_player_id:
            success, _ = self.run_test(
                "Insufficient Coins Purchase",
                "POST",
                "shop/purchase",
                400,
                data={
                    "player_id": self.test_player_id,
                    "item_type": "color_bomb",
                    "quantity": 100  # Should be too expensive
                }
            )

    def run_all_tests(self):
        """Run all API tests in sequence"""
        print("🚀 Starting Gem Crush API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 50)
        
        # Core functionality tests
        if not self.test_api_root():
            print("❌ API root failed, stopping tests")
            return False
        
        if not self.test_create_player():
            print("❌ Player creation failed, stopping tests")
            return False
        
        if not self.test_get_player():
            print("❌ Player retrieval failed")
        
        if not self.test_start_game():
            print("❌ Game start failed")
        
        if not self.test_end_game():
            print("❌ Game end failed")
        
        # Shop tests
        if not self.test_shop_prices():
            print("❌ Shop prices failed")
        
        if not self.test_purchase_item():
            print("❌ Item purchase failed")
        
        if not self.test_use_powerup():
            print("❌ Power-up usage failed")
        
        # Daily rewards
        if not self.test_daily_reward_status():
            print("❌ Daily reward status failed")
        
        if not self.test_claim_daily_reward():
            print("❌ Daily reward claim failed")
        
        # Leaderboard
        if not self.test_leaderboard():
            print("❌ Leaderboard failed")
        
        # Ad watching (mocked)
        if not self.test_watch_ad_coins():
            print("❌ Watch ad for coins failed")
        
        if not self.test_watch_ad_life():
            print("❌ Watch ad for life failed")
        
        # IAP packages (Stripe)
        if not self.test_iap_packages():
            print("❌ IAP packages failed")
        
        # Error cases
        self.test_error_cases()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80  # Consider 80%+ as passing

def main():
    tester = GemCrushAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())