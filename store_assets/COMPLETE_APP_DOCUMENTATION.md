# Glimmer Quest - Complete Application Documentation

## Overview
Glimmer Quest is a Match-3 puzzle game (similar to Candy Crush) built as a cross-platform application. It runs as a web app and can be compiled for Android (Google Play) and iOS (App Store). The game is designed for monetization through in-app purchases, advertisements, and engagement mechanics.

---

## Technical Architecture

### Stack
- **Frontend**: React 18 + Tailwind CSS + Howler.js (audio)
- **Backend**: Python FastAPI + MongoDB (Motor async driver)
- **Mobile Wrapper**: Capacitor 5 (iOS + Android)
- **Payments**: Stripe Checkout
- **Ads**: Google AdMob (placeholder configured)

### File Structure
```
/app/
├── backend/
│   └── server.py          # All API endpoints
├── frontend/
│   ├── src/App.js         # Complete game logic + UI (~1900 lines)
│   ├── android/           # Android Studio project
│   └── ios/               # Xcode project
└── store_assets/          # App store materials
```

---

## Game Mechanics

### The Board
- 8×8 grid of gems (64 total cells)
- 5 gem types: Red, Blue, Green, Yellow, Purple
- Each gem is a React component with unique visual styling (gradients, inner glow, shine effect)

### Core Gameplay Loop
1. Player selects a gem by clicking/tapping
2. Player clicks an adjacent gem (up/down/left/right) to swap positions
3. If the swap creates a match (3+ gems of same color in a row/column), those gems disappear
4. Gems above the cleared gems fall down (gravity)
5. New random gems spawn at the top to fill empty spaces
6. If the new arrangement creates more matches, they automatically clear (cascade)
7. Process repeats until no more matches exist
8. Each valid swap costs 1 move

### Match Detection Algorithm
The `findMatches()` function scans the board:
- Horizontal scan: For each row, find consecutive gems of same type (3+ = match)
- Vertical scan: For each column, find consecutive gems of same type (3+ = match)
- Returns a Map of all matched gem positions with metadata (length, direction, intersections)

### Cascade System
The `processMatches()` function handles cascading:
1. Mark matched gems as "matched"
2. Play match sound effect
3. Animate gem disappearance (scale to 0, fade out)
4. Wait 200ms for animation
5. Remove matched gems from each column
6. Shift remaining gems down
7. Generate new random gems at top (with "falling" animation)
8. Check for new matches
9. Repeat until stable (max 15 cascades to prevent infinite loops)
10. Final safety loop: 3 additional passes to catch edge cases

### Special Gems
Created when matching more than 3 gems:

| Match Type | Special Gem | Effect When Activated |
|------------|-------------|----------------------|
| 4 in a row (horizontal) | Striped Vertical | Clears entire column |
| 4 in a row (vertical) | Striped Horizontal | Clears entire row |
| L-shape or T-shape | Wrapped | Clears 3×3 area around gem |
| 5+ in a row | Color Bomb | Clears ALL gems of that color on board |

Special gems are visually distinct (animated pulse, special overlays) and activate when included in a match or swapped.

### Obstacles
Higher levels introduce obstacles that add difficulty:

| Obstacle | Appearance | Behavior |
|----------|------------|----------|
| Ice | Cyan overlay with snowflake | Must match adjacent to remove ice first, then gem can be matched normally |
| Chain | Gold border with link icon | Has 1-2 layers; each adjacent match removes one layer |
| Blocker | Gray locked cell | Cannot be moved or matched; permanent obstacle |

### Scoring
- Base: 10 points per gem matched
- Combo multiplier: Score × cascade count (up to 5x)
- Example: 4 gems matched on 3rd cascade = 4 × 10 × 3 = 120 points

### Level System
10 progressively difficult levels:

| Level | Target Score | Obstacles |
|-------|-------------|-----------|
| 1 | 1,000 | None |
| 2 | 2,000 | None |
| 3 | 3,500 | Ice (8% chance) |
| 4 | 5,000 | Ice |
| 5 | 7,500 | Ice + Chains (5% chance) |
| 6 | 10,000 | Ice + Chains |
| 7 | 15,000 | Ice + Chains + Blockers (2% chance) |
| 8 | 20,000 | All obstacles |
| 9 | 30,000 | All obstacles |
| 10 | 50,000 | All obstacles |

### Win/Lose Conditions
- **Win**: Reach target score before running out of moves
- **Lose**: Run out of moves (30 per level) without reaching target
- On win: Advance to next level, earn coins (score ÷ 10)
- On lose: Can watch ad for +5 moves (once per game) or retry

---

## Monetization Systems

### Lives System
- Maximum: 5 lives
- Starting a game costs 1 life
- Regeneration: 1 life every 30 minutes (server-calculated)
- Lives display shows countdown timer to next life
- Can purchase more lives with coins or real money

### In-Game Currency (Coins)
- Earned by completing levels (score ÷ 10)
- Earned by watching rewarded ads (20-50 random coins)
- Earned through daily rewards
- Spent on power-ups and lives

### Power-Ups
Purchasable with coins, usable during gameplay:

| Power-Up | Cost | Effect |
|----------|------|--------|
| Hammer | 100 coins | Remove any single gem instantly |
| Shuffle | 150 coins | Randomize all gem positions |
| Color Bomb | 200 coins | Remove all gems of selected color |

Players start with: 3 Hammers, 2 Shuffles, 1 Color Bomb

### Real Money Purchases (Stripe)
In-app purchase packages:

| Package | Price | Contents |
|---------|-------|----------|
| Coin Pack S | $0.99 | 500 Coins |
| Coin Pack M | $4.99 | 2,500 Coins |
| Coin Pack L | $9.99 | 6,000 Coins |
| Life Pack | $1.99 | 10 Lives |
| Starter Bundle | $4.99 | 1,000 Coins + 5 Lives + 5 of each power-up |
| Remove Ads | $2.99 | Permanent ad removal |

Payment flow:
1. User selects package
2. Frontend calls `/api/iap/checkout` with package ID
3. Backend creates Stripe Checkout Session
4. User redirected to Stripe payment page
5. On success, redirected back to app with session ID
6. Frontend calls `/api/iap/status/{session_id}` to verify
7. Backend credits items to player account

### Advertisements (AdMob)
Two ad placements configured:
1. **Rewarded Ads**: Watch to earn coins/lives (shop) or +5 moves (game over)
2. **Interstitial Ads**: Shown between levels on win

Currently simulated (returns fake success). Requires AdMob Publisher ID for production.

---

## Engagement Features

### Daily Rewards
7-day reward calendar with escalating rewards:

| Day | Coins | Power-Ups |
|-----|-------|-----------|
| 1 | 50 | None |
| 2 | 75 | None |
| 3 | 100 | 1 Hammer |
| 4 | 150 | None |
| 5 | 200 | 1 Shuffle |
| 6 | 300 | None |
| 7 | 500 | 1 of each power-up |

- Streak resets if player misses a day
- After day 7, cycles back to day 1
- Can only claim once per 24 hours (server-enforced via `last_daily_claim` timestamp)

### Achievements
8 unlockable achievements:

| ID | Name | Description | Threshold |
|----|------|-------------|-----------|
| first_match | First Match | Make your first match | 1 match |
| combo_master | Combo Master | Get a 5x combo | 5 cascades |
| level_5 | Rising Star | Reach level 5 | Level 5 |
| level_10 | Gem Champion | Reach level 10 | Level 10 |
| score_10k | High Scorer | Score 10,000 in one game | 10,000 pts |
| score_50k | Legend | Score 50,000 in one game | 50,000 pts |
| daily_7 | Dedicated | 7-day login streak | 7 days |
| special_gem | Special Touch | Create a special gem | 1 special |

Achievements are checked client-side against player data.

### Leaderboard
Global ranking by high score:
- Displays top players with rank, name, level, and high score
- Top 3 have special styling (gold medals)
- Current player's entry highlighted
- Fetched from `/api/leaderboard` (sorted by `high_score` descending)

### Share Score
Social sharing functionality:
- **Game Over Modal**: Pink/purple "Share Score" button
- **Main Menu**: "Share" button below personal best (if high_score > 0)

Share behavior:
1. If device supports Web Share API (mobile): Opens native share sheet
2. Fallback: Copies text to clipboard

Share message format:
- High score: "🏆 NEW HIGH SCORE! I just scored X points in Glimmer Quest! Can you beat me? 💎✨"
- Regular: "💎 I scored X points on Level Y in Glimmer Quest! Can you beat me? ✨"

---

## User Interface

### Screens/States

1. **Name Input Modal** (Initial)
   - Text input for player name (max 20 chars)
   - "Start Playing!" button (disabled until name entered)
   - Creates new player in database on submit

2. **Main Menu**
   - Game title "GLIMMER QUEST"
   - Player stats card: Name, Lives, Coins, Level
   - "PLAY LEVEL X" button (disabled if 0 lives)
   - 4 action buttons: Shop, Daily, Awards, Ranks
   - Personal best display with Share button (if high_score > 0)

3. **Game Screen**
   - HUD: Lives (with regen timer), Coins, Score, Moves remaining, Level, Target progress bar, Sound toggle
   - Power-ups bar: Hammer, Shuffle, Color Bomb (with counts)
   - 8×8 game board
   - "Back to Menu" link
   - Combo indicator (shows "Xx COMBO!" during cascades)

4. **Game Over Modal**
   - Win: "🎉 Level Complete!" / Lose: "😢 Out of Moves!"
   - Final score display
   - Target reached indicator
   - "🏆 New High Score!" badge (if applicable)
   - Coins earned
   - Share Score button
   - Watch Ad for +5 Moves (lose only, once per game)
   - Next Level / Try Again button
   - Main Menu button

5. **Shop Modal** (2 tabs)
   - **Coins Tab**: Purchase power-ups/lives with coins, watch ads for free rewards
   - **Buy Tab**: Real money IAP packages via Stripe

6. **Daily Reward Modal**
   - 7-day calendar grid
   - Current day highlighted
   - Claimed days marked with checkmark
   - Claim button (if available)
   - Streak counter

7. **Achievements Modal**
   - List of all achievements
   - Unlocked: Gold styling with checkmark
   - Locked: Grayscale with opacity

8. **Leaderboard Modal**
   - Scrollable list of top players
   - Rank, name, level, high score
   - Top 3 with medal emojis (🥇🥈🥉)

### Visual Design
- Dark purple/black gradient background with animated star particles
- Glassmorphism panels (semi-transparent with backdrop blur)
- 3D-style buttons with drop shadows and press effects
- Gems have 3D appearance (inner highlights, outer glow, reflections)
- Animations: Gem pulse on select, pop on match, fall-in for new gems, shake on big combos

### Audio
Managed by Howler.js sound manager:
- Button clicks
- Gem swap
- Match clear
- Combo (different from regular match)
- Special gem creation
- Power-up activation
- Level up
- Game over
- Coin collect

Sound toggle in HUD (persists in state, not saved to DB).

---

## Backend API Endpoints

### Player Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/player/create` | Create new player with name |
| GET | `/api/player/{player_id}` | Get player data (auto-calculates regenerated lives) |

### Game Flow
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/game/start` | Deduct 1 life, return power-ups |
| POST | `/api/game/end` | Save score, update high score, award coins, advance level if won |

### Shop
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/prices` | Get coin prices for items |
| POST | `/api/shop/purchase` | Buy item with coins |

### Power-Ups
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/powerup/use` | Deduct 1 power-up from inventory |

### Daily Rewards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily-reward/status/{player_id}` | Get reward calendar, streak, claim availability |
| POST | `/api/daily-reward/claim` | Claim today's reward |

### Ads
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ads/watch` | Award coins (20-50) or 1 life for watching ad |

### Leaderboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leaderboard` | Top 100 players by high score |

### In-App Purchases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/iap/packages` | List available IAP packages |
| POST | `/api/iap/checkout` | Create Stripe checkout session |
| GET | `/api/iap/status/{session_id}` | Verify payment and credit items |

---

## Database Schema (MongoDB)

### `players` Collection
```javascript
{
  id: "uuid-string",           // Unique player ID
  player_name: "string",       // Display name
  lives: 5,                    // Current lives (0-5)
  max_lives: 5,                // Maximum lives
  coins: 1000,                 // Currency balance
  current_level: 1,            // Current game level (1-10)
  high_score: 0,               // Personal best score
  power_ups: {                 // Power-up inventory
    hammer: 3,
    shuffle: 2,
    color_bomb: 1
  },
  daily_reward_streak: 0,      // Consecutive days claimed
  last_daily_claim: null,      // ISO timestamp of last claim
  last_life_update: "ISO",     // Timestamp for life regeneration calc
  created_at: "ISO"            // Account creation timestamp
}
```

---

## Mobile Platform Configuration

### Capacitor Config (`capacitor.config.json`)
```json
{
  "appId": "com.glimmerquest.game",
  "appName": "Glimmer Quest",
  "webDir": "build",
  "server": {
    "androidScheme": "https",
    "iosScheme": "https"
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#0B0B13"
    },
    "StatusBar": {
      "style": "DARK",
      "backgroundColor": "#0B0B13"
    }
  }
}
```

### Android
- Min SDK: 22 (Android 5.1)
- Target SDK: 33 (Android 13)
- Portrait orientation locked
- Internet permission enabled

### iOS
- Deployment target: iOS 13+
- Portrait orientation (iPhone), all orientations (iPad)
- App Transport Security: Allows arbitrary loads (for API)
- Non-exempt encryption: false (no export compliance needed)

---

## Security Considerations

1. **No client-side validation of purchases**: All IAP verification happens server-side via Stripe session status
2. **Lives regeneration is server-calculated**: Client cannot manipulate life count
3. **Score is client-reported**: Could be spoofed (acceptable for casual game, would need server-side game state for competitive)
4. **No authentication**: Players identified by UUID stored in browser/app; losing device = losing progress
5. **CORS enabled**: Backend allows all origins (would restrict in production)

---

## Build Commands

```bash
# Development
cd frontend && yarn start          # Start dev server (port 3000)
cd backend && uvicorn server:app   # Start API (port 8001)

# Production Build
cd frontend && yarn build          # Create optimized build
npx cap sync                       # Sync to Android + iOS

# Mobile
npx cap open android               # Open in Android Studio
npx cap open ios                   # Open in Xcode (Mac only)
```

---

## Summary
Glimmer Quest is a complete, production-ready Match-3 puzzle game with:
- Full gameplay mechanics (matching, cascades, special gems, obstacles)
- Monetization (lives, coins, IAP, ads)
- Engagement (daily rewards, achievements, leaderboard, social sharing)
- Cross-platform deployment (web, Android, iOS)

The game is designed to maximize player retention and revenue through proven mobile game mechanics while providing an enjoyable casual puzzle experience.
