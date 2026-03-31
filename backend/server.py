from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import random

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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class PlayerState(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: str
    coins: int = 500
    lives: int = 5
    max_lives: int = 5
    lives_last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    current_level: int = 1
    high_score: int = 0
    total_games_played: int = 0
    power_ups: dict = Field(default_factory=lambda: {"hammer": 3, "shuffle": 2, "color_bomb": 1})
    daily_reward_claimed: Optional[str] = None
    daily_reward_streak: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PlayerCreate(BaseModel):
    player_name: str

class GameResult(BaseModel):
    player_id: str
    score: int
    level: int
    moves_used: int

class LeaderboardEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    player_name: str
    high_score: int
    current_level: int

class PurchaseRequest(BaseModel):
    player_id: str
    item_type: str  # "lives", "hammer", "shuffle", "color_bomb", "coins"
    quantity: int = 1

class UsePowerUpRequest(BaseModel):
    player_id: str
    power_up_type: str  # "hammer", "shuffle", "color_bomb"

class DailyRewardClaim(BaseModel):
    player_id: str

# Shop prices
SHOP_PRICES = {
    "lives": 50,  # per life
    "hammer": 100,
    "shuffle": 75,
    "color_bomb": 150,
    "coins_small": 0,  # Free from ads
    "coins_medium": 0,  # Free from ads
}

DAILY_REWARDS = [
    {"day": 1, "coins": 100, "power_ups": {}},
    {"day": 2, "coins": 150, "power_ups": {"hammer": 1}},
    {"day": 3, "coins": 200, "power_ups": {}},
    {"day": 4, "coins": 250, "power_ups": {"shuffle": 1}},
    {"day": 5, "coins": 300, "power_ups": {"hammer": 1, "shuffle": 1}},
    {"day": 6, "coins": 400, "power_ups": {}},
    {"day": 7, "coins": 500, "power_ups": {"color_bomb": 1, "hammer": 2, "shuffle": 2}},
]

LIFE_REGEN_MINUTES = 30

# ============ HELPER FUNCTIONS ============

def calculate_lives(player: dict) -> dict:
    """Calculate current lives based on time passed"""
    if player["lives"] >= player["max_lives"]:
        return player
    
    last_updated = datetime.fromisoformat(player["lives_last_updated"])
    now = datetime.now(timezone.utc)
    minutes_passed = (now - last_updated).total_seconds() / 60
    lives_to_add = int(minutes_passed // LIFE_REGEN_MINUTES)
    
    if lives_to_add > 0:
        new_lives = min(player["lives"] + lives_to_add, player["max_lives"])
        player["lives"] = new_lives
        player["lives_last_updated"] = now.isoformat()
    
    return player

def get_next_life_time(player: dict) -> Optional[int]:
    """Returns seconds until next life, or None if at max"""
    if player["lives"] >= player["max_lives"]:
        return None
    
    last_updated = datetime.fromisoformat(player["lives_last_updated"])
    now = datetime.now(timezone.utc)
    seconds_passed = (now - last_updated).total_seconds()
    seconds_per_life = LIFE_REGEN_MINUTES * 60
    seconds_until_next = seconds_per_life - (seconds_passed % seconds_per_life)
    return int(seconds_until_next)

# ============ API ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Gem Crush API - Match-3 Game Backend"}

# Player Management
@api_router.post("/player/create", response_model=dict)
async def create_player(input: PlayerCreate):
    # Check if player name already exists
    existing = await db.players.find_one({"player_name": input.player_name}, {"_id": 0})
    if existing:
        # Return existing player with updated lives
        existing = calculate_lives(existing)
        await db.players.update_one(
            {"id": existing["id"]},
            {"$set": {"lives": existing["lives"], "lives_last_updated": existing["lives_last_updated"]}}
        )
        result = {**existing, "next_life_seconds": get_next_life_time(existing)}
        return result
    
    # Create new player
    player = PlayerState(player_name=input.player_name)
    doc = player.model_dump()
    await db.players.insert_one(doc)
    
    # Return without _id
    result = {k: v for k, v in doc.items() if k != "_id"}
    result["next_life_seconds"] = None
    return result

@api_router.get("/player/{player_id}", response_model=dict)
async def get_player(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Update lives based on time
    player = calculate_lives(player)
    await db.players.update_one(
        {"id": player_id},
        {"$set": {"lives": player["lives"], "lives_last_updated": player["lives_last_updated"]}}
    )
    
    return {**player, "next_life_seconds": get_next_life_time(player)}

# Game Actions
@api_router.post("/game/start", response_model=dict)
async def start_game(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Update lives first
    player = calculate_lives(player)
    
    if player["lives"] <= 0:
        await db.players.update_one(
            {"id": player_id},
            {"$set": {"lives": player["lives"], "lives_last_updated": player["lives_last_updated"]}}
        )
        raise HTTPException(status_code=400, detail="No lives remaining")
    
    # Deduct a life
    player["lives"] -= 1
    player["lives_last_updated"] = datetime.now(timezone.utc).isoformat()
    
    await db.players.update_one(
        {"id": player_id},
        {"$set": {"lives": player["lives"], "lives_last_updated": player["lives_last_updated"]}}
    )
    
    return {
        "success": True,
        "lives_remaining": player["lives"],
        "level": player["current_level"],
        "power_ups": player["power_ups"],
        "next_life_seconds": get_next_life_time(player)
    }

@api_router.post("/game/end", response_model=dict)
async def end_game(result: GameResult):
    player = await db.players.find_one({"id": result.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    updates = {
        "total_games_played": player["total_games_played"] + 1
    }
    
    # Update high score if beaten
    if result.score > player["high_score"]:
        updates["high_score"] = result.score
    
    # Advance level if completed
    if result.level >= player["current_level"]:
        updates["current_level"] = result.level + 1
    
    # Give coins based on score
    coins_earned = result.score // 10
    updates["coins"] = player["coins"] + coins_earned
    
    await db.players.update_one({"id": result.player_id}, {"$set": updates})
    
    return {
        "success": True,
        "coins_earned": coins_earned,
        "new_high_score": result.score > player["high_score"],
        "level_completed": result.level >= player["current_level"]
    }

# Shop
@api_router.post("/shop/purchase", response_model=dict)
async def purchase_item(request: PurchaseRequest):
    player = await db.players.find_one({"id": request.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if request.item_type not in SHOP_PRICES:
        raise HTTPException(status_code=400, detail="Invalid item type")
    
    total_cost = SHOP_PRICES[request.item_type] * request.quantity
    
    if player["coins"] < total_cost:
        raise HTTPException(status_code=400, detail="Not enough coins")
    
    updates = {"coins": player["coins"] - total_cost}
    
    if request.item_type == "lives":
        new_lives = min(player["lives"] + request.quantity, player["max_lives"] + 5)  # Allow up to max+5
        updates["lives"] = new_lives
    elif request.item_type in ["hammer", "shuffle", "color_bomb"]:
        power_ups = player["power_ups"].copy()
        power_ups[request.item_type] = power_ups.get(request.item_type, 0) + request.quantity
        updates["power_ups"] = power_ups
    
    await db.players.update_one({"id": request.player_id}, {"$set": updates})
    
    updated_player = await db.players.find_one({"id": request.player_id}, {"_id": 0})
    return {"success": True, "player": updated_player}

@api_router.get("/shop/prices")
async def get_shop_prices():
    return SHOP_PRICES

# Power-ups
@api_router.post("/powerup/use", response_model=dict)
async def use_power_up(request: UsePowerUpRequest):
    player = await db.players.find_one({"id": request.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    power_ups = player["power_ups"]
    if request.power_up_type not in power_ups or power_ups[request.power_up_type] <= 0:
        raise HTTPException(status_code=400, detail="No power-up available")
    
    power_ups[request.power_up_type] -= 1
    await db.players.update_one({"id": request.player_id}, {"$set": {"power_ups": power_ups}})
    
    return {"success": True, "remaining": power_ups[request.power_up_type]}

# Daily Rewards
@api_router.post("/daily-reward/claim", response_model=dict)
async def claim_daily_reward(request: DailyRewardClaim):
    player = await db.players.find_one({"id": request.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    now = datetime.now(timezone.utc)
    today = now.date().isoformat()
    
    # Check if already claimed today
    if player.get("daily_reward_claimed") == today:
        raise HTTPException(status_code=400, detail="Daily reward already claimed")
    
    # Calculate streak
    yesterday = (now - timedelta(days=1)).date().isoformat()
    if player.get("daily_reward_claimed") == yesterday:
        streak = min(player.get("daily_reward_streak", 0) + 1, 7)
    else:
        streak = 1
    
    # Get reward for current streak day
    reward = DAILY_REWARDS[streak - 1]
    
    # Apply rewards
    updates = {
        "daily_reward_claimed": today,
        "daily_reward_streak": streak,
        "coins": player["coins"] + reward["coins"]
    }
    
    if reward["power_ups"]:
        power_ups = player["power_ups"].copy()
        for pu, qty in reward["power_ups"].items():
            power_ups[pu] = power_ups.get(pu, 0) + qty
        updates["power_ups"] = power_ups
    
    await db.players.update_one({"id": request.player_id}, {"$set": updates})
    
    return {
        "success": True,
        "day": streak,
        "coins_reward": reward["coins"],
        "power_ups_reward": reward["power_ups"],
        "next_day": min(streak + 1, 7)
    }

@api_router.get("/daily-reward/status/{player_id}", response_model=dict)
async def get_daily_reward_status(player_id: str):
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    today = datetime.now(timezone.utc).date().isoformat()
    can_claim = player.get("daily_reward_claimed") != today
    current_streak = player.get("daily_reward_streak", 0)
    
    return {
        "can_claim": can_claim,
        "current_streak": current_streak,
        "next_reward_day": min(current_streak + 1, 7) if can_claim else min(current_streak + 1, 7),
        "rewards": DAILY_REWARDS
    }

# Leaderboard
@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 20):
    players = await db.players.find(
        {},
        {"_id": 0, "player_name": 1, "high_score": 1, "current_level": 1}
    ).sort("high_score", -1).limit(limit).to_list(limit)
    
    return players

# Watch ad for rewards
@api_router.post("/ads/watch", response_model=dict)
async def watch_ad_for_reward(player_id: str, reward_type: str = "coins"):
    """Simulate watching an ad for rewards"""
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if reward_type == "coins":
        coins_reward = random.randint(20, 50)
        await db.players.update_one(
            {"id": player_id},
            {"$set": {"coins": player["coins"] + coins_reward}}
        )
        return {"success": True, "reward_type": "coins", "amount": coins_reward}
    elif reward_type == "life":
        new_lives = min(player["lives"] + 1, player["max_lives"])
        await db.players.update_one(
            {"id": player_id},
            {"$set": {"lives": new_lives}}
        )
        return {"success": True, "reward_type": "life", "amount": 1}
    
    raise HTTPException(status_code=400, detail="Invalid reward type")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
