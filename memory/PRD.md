# Glimmer Quest - Match-3 Puzzle Game PRD

## Original Problem Statement
Build a Match-3 puzzle game (Candy Crush style) optimized for maximum revenue. User requested:
1. Rename from "Gem Crush" to "Glimmer Quest" (verified unique name)
2. AdMob integration for monetization
3. Sound effects and polish
4. All gameplay enhancements (special gems, obstacles, achievements)

## Architecture
- **Frontend**: React + Tailwind CSS + Howler.js (sounds)
- **Backend**: FastAPI + MongoDB
- **Monetization**: Lives system, IAP shop, daily rewards, AdMob ads (configured, needs publisher ID)

## User Personas
1. **Casual Gamer**: Quick sessions, wants satisfying gameplay
2. **Completionist**: Driven by levels, achievements, high scores
3. **Spender**: Willing to pay for lives/power-ups to progress faster

## Core Requirements (Static)
- Match-3 gem swapping mechanics
- Lives system with time-based regeneration
- Coins & power-ups (Hammer, Shuffle, Color Bomb)
- Daily reward streak system (7 days)
- Leaderboard
- Progressive difficulty levels
- Rewarded ads for free currency

## What's Been Implemented (March 31, 2026)

### Phase 1 - MVP ✅
- Full Match-3 game mechanics (swap, match, cascade, score)
- 8x8 gem board with 5 gem types
- Lives system (5 max, 30-min regen)
- Coins & power-ups shop
- Daily rewards (7-day streak calendar)
- Leaderboard API & UI
- Simulated ad watching for rewards
- Player persistence (MongoDB)
- Beautiful UI with glassmorphism & 3D gems

### Phase 2 - Enhancements ✅
- **Renamed to "Glimmer Quest"** - verified unique name for app stores
- **AdMob Integration** - Ad Placement API configured (needs publisher ID to activate)
- **Sound Effects** - Howler.js integration with match/combo/powerup sounds
- **Special Gems**:
  - Striped (horizontal/vertical) - Match 4 gems
  - Wrapped - L/T shape matches
  - Color Bomb - Match 5+ gems
- **Level Obstacles**:
  - Ice - First match removes ice layer
  - Chains (1-2 layers) - Reduce chain count with matches
  - Blockers - Immovable obstacles
- **Achievements System** - 8 achievements with unlock tracking
- **Watch Ad to Continue** - +5 moves on game over

## Prioritized Backlog

### P0 (Critical for Revenue) - Ready to Activate
- [ ] Get AdMob/AdSense Publisher ID and activate real ads
- [ ] Stripe integration for real in-app purchases

### P1 (Engagement)
- [ ] Background music
- [ ] More achievement types
- [ ] Social sharing (share scores)
- [ ] Push notifications for lives regeneration

### P2 (Nice to Have)
- [ ] Boosters at level start
- [ ] Lives gifting between friends
- [ ] Seasonal events/themes
- [ ] More obstacle types (bombs, teleports)

## Technical Notes

### AdMob Setup Required
1. Create AdSense account at https://www.google.com/adsense/
2. Get Publisher ID (ca-pub-XXXXXXXX)
3. Edit `/app/frontend/public/index.html`:
   - Replace `ca-pub-YOUR_PUBLISHER_ID` with actual ID
   - Uncomment the AdSense script tags
   - Remove `data-adbreak-test="on"` for production

### Sound Files
Using CDN-hosted sounds from freesound.org. If CORS issues occur, sounds gracefully degrade (game continues without sound).

## Next Tasks
1. Get AdMob publisher ID and test real ads
2. Add background music loop
3. Create more level variety with new obstacles
