# Glimmer Quest - Product Requirements Document

## Original Problem Statement
User asked "What kind of apps make the most money?" and decided to build a Match-3 puzzle game (Candy Crush style) aimed at maximizing revenue through IAP, ads, and daily rewards.

## Product Overview
**Glimmer Quest** is a fully functional, cross-platform Match-3 puzzle game with:
- 50 data-driven levels across 5 themed worlds
- Monetization via Lives, Coins, Power-ups, Stripe payments, and Google AdMob
- Mobile-ready structure (Capacitor Android and iOS projects)

## Tech Stack
- **Frontend:** React, Tailwind CSS, Lucide Icons
- **Backend:** FastAPI, MongoDB
- **Mobile:** Capacitor (iOS + Android)
- **Payments:** Stripe (via emergentintegrations)
- **Ads:** Google AdMob (mocked, awaiting publisher ID)

---

## Completed Phases

### Phase 1: Continue After Loss System ✅
**Completed:** April 2025
- Server-side validation for continue purchases
- Escalating costs: 50 → 100 → 200 coins
- Max 3 continues per run
- Ad-based continue option (mocked)
- `pending_loss` state allows continues before final loss

### Phase 2: Visual Feedback Upgrade ✅
**Completed:** April 2025
- CSS animations for match bursts
- Screen shake on big matches (4+ gems)
- Combo text overlays (2x, 3x, AMAZING!)
- Cascade pulse effects
- Special gem activation effects (line clears, explosions)

### Phase 3: Level Expansion to 50 Levels ✅
**Completed:** April 2025
- Data-driven level config in `/app/frontend/src/config/levels.js`
- 5 themed worlds (10 levels each)
- Progressive obstacle introduction (ice → chains → blockers)
- Difficulty badges (tutorial, easy, medium, hard, expert, master)

### Phase 4: Level Map UI + Replay Fix ✅
**Completed:** April 2025
- World map with 5 themed worlds
- Level nodes showing locked/unlocked/completed states
- Replay earlier levels without affecting progression
- Fixed: `selectedMapLevel` now correctly tracks played level
- Fixed: `finalizeWin`/`finalizeLoss` send actual played level to backend
- Context-aware post-game buttons (Next Level vs Back to Map)

### Phase 5: Difficulty Tuning Pass ✅
**Completed:** April 2025
- Rebalanced all 50 levels for fair difficulty curve
- Obstacle caps: 25% ice, 18% chain, 8% blocker (51% max total)
- Level 50: 25,000 target / 20 moves (achievable with skill)
- Early levels feel easy, late levels feel challenging but fair
- Delayed obstacle introduction (ice at L6, chains at L10, blockers at L15)

---

## Architecture

```
/app/
├── backend/
│   ├── server.py             # FastAPI (game, shop, continue, Stripe)
│   └── .env                  # MONGO_URL, DB_NAME, STRIPE_API_KEY
├── frontend/
│   ├── src/
│   │   ├── App.js            # Core game logic, state machine, modals
│   │   ├── index.css         # Animations (Phase 2)
│   │   ├── config/levels.js  # 50 level configs (Phase 3 + 5)
│   │   └── components/
│   │       └── LevelMap.jsx  # World map UI (Phase 4)
│   ├── android/              # Capacitor Android
│   └── ios/                  # Capacitor iOS
├── store_assets/             # App store documentation
└── memory/
    └── PRD.md                # This file
```

## Key API Endpoints
- `POST /api/game/start` - Start game, deduct life
- `POST /api/game/end` - End game, update score/level
- `POST /api/game/continue` - Record continue (ad or coins)
- `POST /api/shop/purchase` - Buy items with coins
- `POST /api/iap/checkout` - Stripe checkout session
- `GET /api/daily-reward/status/{id}` - Daily reward status

## Database Schema (players collection)
```javascript
{
  id: string,
  player_name: string,
  coins: number,
  lives: number,
  max_lives: number,
  current_level: number,
  high_score: number,
  power_ups: { hammer, shuffle, color_bomb },
  daily_reward_streak: number,
  total_continues: number,
  games_with_continues: number
}
```

---

## Future/Backlog Tasks

### P1 (High Priority)
- [ ] Add User's AdMob Publisher ID (inject into index.html)
- [ ] Implement Stripe Webhooks for production

### P2 (Medium Priority)
- [ ] Polish app icons (replace placeholder SVGs)
- [ ] Add tutorial for new players
- [ ] Refactor App.js (2300+ lines) into smaller modules

### P3 (Low Priority)
- [ ] Add sound effects (sound manager exists, needs audio files)
- [ ] Leaderboard improvements (weekly/monthly)
- [ ] Social features (friend challenges)

---

## Mocked Integrations
- **AdMob:** `useAdPlacement.js` auto-succeeds after 1.5s delay
- **iOS/Android builds:** Capacitor configured but not compiled in container

## Test Credentials
Players are created dynamically. No persistent auth credentials.
