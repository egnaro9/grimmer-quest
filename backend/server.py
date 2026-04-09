from dotenv import load_dotenv
load_dotenv()  # load .env before any os.environ access

import certifi
from fastapi import FastAPI, APIRouter, HTTPException, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import random
try:
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False
    logging.warning("emergentintegrations not available — Stripe/IAP endpoints disabled (local dev mode)")

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
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

# ============ STRIPE PACKAGES ============
# Fixed packages - amounts defined server-side only for security
IAP_PACKAGES = {
    "coins_small": {"name": "500 Coins", "coins": 500, "amount": 0.99, "currency": "usd"},
    "coins_medium": {"name": "2500 Coins", "coins": 2500, "amount": 4.99, "currency": "usd"},
    "coins_large": {"name": "6000 Coins", "coins": 6000, "amount": 9.99, "currency": "usd"},
    "lives_pack": {"name": "10 Lives", "lives": 10, "amount": 1.99, "currency": "usd"},
    "starter_pack": {"name": "Starter Pack", "coins": 1000, "lives": 5, "power_ups": {"hammer": 5, "shuffle": 5, "color_bomb": 3}, "amount": 4.99, "currency": "usd"},
    "remove_ads": {"name": "Remove Ads Forever", "remove_ads": True, "amount": 2.99, "currency": "usd"},
}

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
    used_continues: bool = False
    continue_count: int = 0

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

class GameContinueRequest(BaseModel):
    player_id: str
    continue_type: str  # "ad" or "coins"
    continue_number: int  # 1, 2, or 3
    cost: Optional[int] = None  # Required if continue_type is "coins"

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
    
    # Track games with continues
    if result.used_continues:
        games_with_continues = player.get("games_with_continues", 0) + 1
        updates["games_with_continues"] = games_with_continues
    
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
        "level_completed": result.level >= player["current_level"],
        "used_continues": result.used_continues,
        "continue_count": result.continue_count
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

# Game Continue - Server-tracked continue events
CONTINUE_COSTS = [50, 100, 200]  # Escalating costs for continues 1, 2, 3

@api_router.post("/game/continue", response_model=dict)
async def game_continue(request: GameContinueRequest):
    """Record a game continue event. For coin continues, also deducts coins."""
    player = await db.players.find_one({"id": request.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Validate continue number
    if request.continue_number < 1 or request.continue_number > 3:
        raise HTTPException(status_code=400, detail="Invalid continue number (must be 1-3)")
    
    updates = {}
    
    # For coin continues, validate and deduct cost
    if request.continue_type == "coins":
        expected_cost = CONTINUE_COSTS[request.continue_number - 1]
        
        # Validate cost matches expected
        if request.cost != expected_cost:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid continue cost. Expected {expected_cost}, got {request.cost}"
            )
        
        if player["coins"] < request.cost:
            raise HTTPException(status_code=400, detail="Not enough coins")
        
        updates["coins"] = player["coins"] - request.cost
    
    # Track continues in player stats (optional analytics field)
    total_continues = player.get("total_continues", 0) + 1
    updates["total_continues"] = total_continues
    
    if updates:
        await db.players.update_one({"id": request.player_id}, {"$set": updates})
    
    updated_player = await db.players.find_one({"id": request.player_id}, {"_id": 0})
    
    return {
        "success": True,
        "player": updated_player,
        "continue_number": request.continue_number,
        "continue_type": request.continue_type
    }

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

# ============ STRIPE PAYMENT ENDPOINTS ============

class CheckoutRequest(BaseModel):
    package_id: str
    player_id: str
    origin_url: str

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    player_id: str
    package_id: str
    amount: float
    currency: str
    status: str = "pending"
    payment_status: str = "initiated"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

@api_router.get("/iap/packages")
async def get_iap_packages():
    """Get available in-app purchase packages"""
    packages = []
    for pkg_id, pkg in IAP_PACKAGES.items():
        packages.append({
            "id": pkg_id,
            "name": pkg["name"],
            "amount": pkg["amount"],
            "currency": pkg["currency"],
            "description": get_package_description(pkg)
        })
    return packages

def get_package_description(pkg):
    parts = []
    if "coins" in pkg:
        parts.append(f"{pkg['coins']} Coins")
    if "lives" in pkg:
        parts.append(f"{pkg['lives']} Lives")
    if "power_ups" in pkg:
        parts.append("+ Power-ups")
    if "remove_ads" in pkg:
        parts.append("No more ads!")
    return " • ".join(parts) if parts else pkg["name"]

@api_router.post("/iap/checkout")
async def create_checkout_session(request: CheckoutRequest, http_request: Request):
    """Create a Stripe checkout session for a package"""
    if not STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payment system unavailable in local dev mode")
    # Validate package exists
    if request.package_id not in IAP_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid package")
    
    # Validate player exists
    player = await db.players.find_one({"id": request.player_id}, {"_id": 0})
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    package = IAP_PACKAGES[request.package_id]
    
    # Initialize Stripe
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Build URLs from provided origin
    success_url = f"{request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/payment-cancel"
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=package["amount"],
        currency=package["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "player_id": request.player_id,
            "package_id": request.package_id,
            "package_name": package["name"]
        }
    )
    
    try:
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record BEFORE redirect
        transaction = PaymentTransaction(
            session_id=session.session_id,
            player_id=request.player_id,
            package_id=request.package_id,
            amount=package["amount"],
            currency=package["currency"]
        )
        await db.payment_transactions.insert_one(transaction.model_dump())
        
        return {"url": session.url, "session_id": session.session_id}
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@api_router.get("/iap/status/{session_id}")
async def get_payment_status(session_id: str):
    """Check payment status and fulfill if completed"""
    if not STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payment system unavailable in local dev mode")
    # Find transaction
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # If already completed, return status
    if transaction.get("payment_status") == "paid":
        return {"status": "complete", "payment_status": "paid", "already_processed": True}
    
    # Check with Stripe
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    try:
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": status.status, "payment_status": status.payment_status}}
        )
        
        # If paid, fulfill the purchase (only once)
        if status.payment_status == "paid" and transaction.get("payment_status") != "paid":
            await fulfill_purchase(transaction["player_id"], transaction["package_id"])
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"completed_at": datetime.now(timezone.utc).isoformat()}}
            )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,  # Convert cents to dollars
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check payment status")

async def fulfill_purchase(player_id: str, package_id: str):
    """Add purchased items to player account"""
    package = IAP_PACKAGES.get(package_id)
    if not package:
        return
    
    player = await db.players.find_one({"id": player_id}, {"_id": 0})
    if not player:
        return
    
    updates = {}
    
    if "coins" in package:
        updates["coins"] = player.get("coins", 0) + package["coins"]
    
    if "lives" in package:
        updates["lives"] = min(player.get("lives", 0) + package["lives"], player.get("max_lives", 5) + 10)
    
    if "power_ups" in package:
        current_power_ups = player.get("power_ups", {})
        for pu, qty in package["power_ups"].items():
            current_power_ups[pu] = current_power_ups.get(pu, 0) + qty
        updates["power_ups"] = current_power_ups
    
    if "remove_ads" in package:
        updates["ads_removed"] = True
    
    if updates:
        await db.players.update_one({"id": player_id}, {"$set": updates})
        logger.info(f"Fulfilled purchase for player {player_id}: {package_id}")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    if not STRIPE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Payment system unavailable in local dev mode")
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            # Find and fulfill the transaction
            session_id = webhook_response.session_id
            transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
            
            if transaction and transaction.get("payment_status") != "paid":
                await fulfill_purchase(transaction["player_id"], transaction["package_id"])
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "status": "complete",
                        "payment_status": "paid",
                        "completed_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True, "error": str(e)}

# Include the router in the main app
app.include_router(api_router)

@app.get("/")
def root():
    return {"message": "Glimmer Quest backend is live"}

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
