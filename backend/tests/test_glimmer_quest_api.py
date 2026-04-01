"""
Glimmer Quest API Tests
Tests for Match-3 puzzle game backend endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasic:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"API root response: {data}")


class TestPlayerManagement:
    """Player creation and retrieval tests"""
    
    def test_create_new_player(self):
        """Test creating a new player"""
        unique_name = f"TestPlayer_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify player data structure
        assert "id" in data
        assert data["player_name"] == unique_name
        assert data["coins"] == 500  # Starting coins
        assert data["lives"] == 5  # Starting lives
        assert data["current_level"] == 1
        assert "power_ups" in data
        print(f"Created player: {unique_name} with ID: {data['id']}")
        return data
    
    def test_get_existing_player(self):
        """Test retrieving an existing player"""
        # First create a player
        unique_name = f"GetTest_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        assert create_response.status_code == 200
        player_id = create_response.json()["id"]
        
        # Then retrieve the player
        get_response = requests.get(f"{BASE_URL}/api/player/{player_id}")
        assert get_response.status_code == 200
        data = get_response.json()
        
        assert data["id"] == player_id
        assert data["player_name"] == unique_name
        print(f"Retrieved player: {data['player_name']}")
    
    def test_get_nonexistent_player(self):
        """Test retrieving a non-existent player returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/player/{fake_id}")
        assert response.status_code == 404
        print("Correctly returned 404 for non-existent player")


class TestGameFlow:
    """Game start and end flow tests"""
    
    @pytest.fixture
    def test_player(self):
        """Create a test player for game tests"""
        unique_name = f"GameTest_{uuid.uuid4().hex[:8]}"
        response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        return response.json()
    
    def test_start_game(self, test_player):
        """Test starting a game"""
        response = requests.post(f"{BASE_URL}/api/game/start?player_id={test_player['id']}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "lives_remaining" in data
        assert data["lives_remaining"] == 4  # Started with 5, used 1
        assert "level" in data
        assert "power_ups" in data
        print(f"Game started, lives remaining: {data['lives_remaining']}")
    
    def test_end_game_with_score(self, test_player):
        """Test ending a game with a score"""
        # Start game first
        requests.post(f"{BASE_URL}/api/game/start?player_id={test_player['id']}")
        
        # End game with score
        response = requests.post(f"{BASE_URL}/api/game/end", json={
            "player_id": test_player["id"],
            "score": 500,
            "level": 1,
            "moves_used": 20
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "coins_earned" in data
        assert data["coins_earned"] == 50  # 500 / 10
        print(f"Game ended, coins earned: {data['coins_earned']}")
    
    def test_start_game_no_lives(self, test_player):
        """Test starting game with no lives fails"""
        # Use up all lives
        for _ in range(5):
            requests.post(f"{BASE_URL}/api/game/start?player_id={test_player['id']}")
        
        # Try to start another game
        response = requests.post(f"{BASE_URL}/api/game/start?player_id={test_player['id']}")
        assert response.status_code == 400
        print("Correctly blocked game start with no lives")


class TestShop:
    """Shop and purchase tests"""
    
    def test_get_shop_prices(self):
        """Test getting shop prices"""
        response = requests.get(f"{BASE_URL}/api/shop/prices")
        assert response.status_code == 200
        data = response.json()
        
        assert "lives" in data
        assert "hammer" in data
        assert "shuffle" in data
        assert "color_bomb" in data
        print(f"Shop prices: {data}")
    
    def test_purchase_lives(self):
        """Test purchasing lives"""
        # Create player with enough coins
        unique_name = f"ShopTest_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        # Purchase lives
        response = requests.post(f"{BASE_URL}/api/shop/purchase", json={
            "player_id": player["id"],
            "item_type": "lives",
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "player" in data
        print(f"Purchased lives, new coin balance: {data['player']['coins']}")
    
    def test_purchase_insufficient_coins(self):
        """Test purchase with insufficient coins fails"""
        # Create player
        unique_name = f"PoorTest_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        # Try to buy expensive items until coins run out
        # First deplete coins by buying many items
        for _ in range(20):
            requests.post(f"{BASE_URL}/api/shop/purchase", json={
                "player_id": player["id"],
                "item_type": "color_bomb",
                "quantity": 1
            })
        
        # Now try to buy more
        response = requests.post(f"{BASE_URL}/api/shop/purchase", json={
            "player_id": player["id"],
            "item_type": "color_bomb",
            "quantity": 10
        })
        assert response.status_code == 400
        print("Correctly blocked purchase with insufficient coins")


class TestPowerUps:
    """Power-up usage tests"""
    
    def test_use_power_up(self):
        """Test using a power-up"""
        # Create player
        unique_name = f"PowerTest_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        # Use hammer power-up (starts with 3)
        response = requests.post(f"{BASE_URL}/api/powerup/use", json={
            "player_id": player["id"],
            "power_up_type": "hammer"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["remaining"] == 2  # Started with 3, used 1
        print(f"Used hammer, remaining: {data['remaining']}")
    
    def test_use_power_up_none_available(self):
        """Test using power-up when none available fails"""
        # Create player
        unique_name = f"NoPower_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        # Use all color bombs (starts with 1)
        requests.post(f"{BASE_URL}/api/powerup/use", json={
            "player_id": player["id"],
            "power_up_type": "color_bomb"
        })
        
        # Try to use another
        response = requests.post(f"{BASE_URL}/api/powerup/use", json={
            "player_id": player["id"],
            "power_up_type": "color_bomb"
        })
        assert response.status_code == 400
        print("Correctly blocked power-up use when none available")


class TestDailyRewards:
    """Daily reward system tests"""
    
    def test_get_daily_reward_status(self):
        """Test getting daily reward status"""
        # Create player
        unique_name = f"DailyTest_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        response = requests.get(f"{BASE_URL}/api/daily-reward/status/{player['id']}")
        assert response.status_code == 200
        data = response.json()
        
        assert "can_claim" in data
        assert "current_streak" in data
        assert "rewards" in data
        assert len(data["rewards"]) == 7  # 7 days of rewards
        print(f"Daily reward status: can_claim={data['can_claim']}, streak={data['current_streak']}")
    
    def test_claim_daily_reward(self):
        """Test claiming daily reward"""
        # Create player
        unique_name = f"ClaimTest_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        response = requests.post(f"{BASE_URL}/api/daily-reward/claim", json={
            "player_id": player["id"]
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["day"] == 1  # First day
        assert data["coins_reward"] == 100  # Day 1 reward
        print(f"Claimed day {data['day']} reward: {data['coins_reward']} coins")
    
    def test_claim_daily_reward_twice(self):
        """Test claiming daily reward twice in same day fails"""
        # Create player
        unique_name = f"TwiceTest_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        # Claim first time
        requests.post(f"{BASE_URL}/api/daily-reward/claim", json={
            "player_id": player["id"]
        })
        
        # Try to claim again
        response = requests.post(f"{BASE_URL}/api/daily-reward/claim", json={
            "player_id": player["id"]
        })
        assert response.status_code == 400
        print("Correctly blocked second daily reward claim")


class TestLeaderboard:
    """Leaderboard tests"""
    
    def test_get_leaderboard(self):
        """Test getting leaderboard"""
        response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            assert "player_name" in data[0]
            assert "high_score" in data[0]
            assert "current_level" in data[0]
        print(f"Leaderboard has {len(data)} entries")
    
    def test_leaderboard_limit(self):
        """Test leaderboard with limit parameter"""
        response = requests.get(f"{BASE_URL}/api/leaderboard?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) <= 5
        print(f"Leaderboard with limit=5 returned {len(data)} entries")


class TestAds:
    """Ad reward tests"""
    
    def test_watch_ad_for_coins(self):
        """Test watching ad for coins"""
        # Create player
        unique_name = f"AdTest_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        response = requests.post(f"{BASE_URL}/api/ads/watch?player_id={player['id']}&reward_type=coins")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["reward_type"] == "coins"
        assert 20 <= data["amount"] <= 50  # Random between 20-50
        print(f"Ad reward: {data['amount']} coins")
    
    def test_watch_ad_for_life(self):
        """Test watching ad for life"""
        # Create player
        unique_name = f"LifeAd_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/player/create", json={
            "player_name": unique_name
        })
        player = create_response.json()
        
        # Use some lives first
        requests.post(f"{BASE_URL}/api/game/start?player_id={player['id']}")
        
        response = requests.post(f"{BASE_URL}/api/ads/watch?player_id={player['id']}&reward_type=life")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["reward_type"] == "life"
        assert data["amount"] == 1
        print("Ad reward: 1 life")


class TestIAP:
    """In-app purchase tests"""
    
    def test_get_iap_packages(self):
        """Test getting IAP packages"""
        response = requests.get(f"{BASE_URL}/api/iap/packages")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check package structure
        for pkg in data:
            assert "id" in pkg
            assert "name" in pkg
            assert "amount" in pkg
            assert "currency" in pkg
        
        print(f"Found {len(data)} IAP packages")
        for pkg in data:
            print(f"  - {pkg['name']}: ${pkg['amount']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
