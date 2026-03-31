# Gem Crush - Match-3 Puzzle Game PRD

## Original Problem Statement
Build a Match-3 puzzle game in the style of Candy Crush - the highest revenue-generating casual game style, optimized for maximum monetization.

## Architecture
- **Frontend**: React + Tailwind CSS (8x8 gem grid, CSS animations)
- **Backend**: FastAPI + MongoDB
- **Monetization**: Lives system, IAP shop, daily rewards, rewarded ads

## User Personas
1. **Casual Gamer**: Quick sessions, wants satisfying gameplay
2. **Completionist**: Driven by levels and high scores
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
- ✅ Full Match-3 game mechanics (swap, match, cascade, score)
- ✅ 8x8 gem board with 5 gem types
- ✅ Lives system (5 max, 30-min regen)
- ✅ Coins & power-ups shop
- ✅ Daily rewards (7-day streak calendar)
- ✅ Leaderboard API & UI
- ✅ Simulated ad watching for rewards
- ✅ Player persistence (MongoDB)
- ✅ Beautiful UI with glassmorphism & 3D gems

## Prioritized Backlog

### P0 (Critical for Revenue)
- [ ] Real ad integration (AdMob/Unity Ads)
- [ ] Real payment integration (Stripe/IAP)
- [ ] Level progression with unique challenges

### P1 (Engagement)
- [ ] Sound effects & music
- [ ] Haptic feedback (mobile)
- [ ] Achievement system
- [ ] Social sharing (share scores)

### P2 (Nice to Have)
- [ ] Special gem types (striped, wrapped, color bomb)
- [ ] Boosters at level start
- [ ] Lives gifting between friends
- [ ] Seasonal events/themes

## Next Tasks
1. Add sound effects for matches and combos
2. Implement real payment gateway
3. Add more level variety with obstacles
