# Glimmer Quest - Match-3 Puzzle Game PRD

## Original Problem Statement
Build a Match-3 puzzle game (Candy Crush style) optimized for maximum revenue, ready for Play Store launch.

## Architecture
- **Frontend**: React + Tailwind CSS + Howler.js + Capacitor (mobile)
- **Backend**: FastAPI + MongoDB + Stripe
- **Monetization**: Lives system, IAP via Stripe, AdMob ads (configured)

## What's Been Implemented (March 31, 2026)

### Core Game ✅
- Match-3 mechanics (swap, match, cascade - max 10)
- 8x8 gem board with 5 gem types
- Special gems (striped, wrapped, color bomb)
- Level obstacles (ice, chains, blockers)
- Progressive difficulty levels

### Monetization ✅
- Lives system (5 max, 30-min regen)
- **Stripe Integration**: Real money purchases
  - $0.99 - 500 Coins
  - $4.99 - 2500 Coins  
  - $9.99 - 6000 Coins
  - $1.99 - 10 Lives
  - $4.99 - Starter Pack
  - $2.99 - Remove Ads Forever
- In-game coin purchases for power-ups
- AdMob ready (needs publisher ID)
- Watch-ad rewards (simulated)

### Engagement ✅
- Daily rewards (7-day streak)
- Achievements system
- Leaderboard
- Sound effects

### Mobile Ready ✅
- Capacitor configured for Android/iOS
- Touch-optimized controls
- Responsive design

### Store Assets Created ✅
- `/app/store_assets/README.md` - App descriptions, keywords
- `/app/store_assets/PRIVACY_POLICY.md` - Privacy policy template

## Launch Checklist

### Before Play Store Submission
- [ ] Get AdMob Publisher ID → Update `/app/frontend/public/index.html`
- [ ] Fill in Privacy Policy contact email
- [ ] Create app icon (512x512 PNG)
- [ ] Take 5+ screenshots
- [ ] Create feature graphic (1024x500)
- [ ] Build Android APK: `cd frontend && npm run build && npx cap add android && npx cap open android`
- [ ] Sign APK with release keystore
- [ ] Create Google Play Developer account ($25)
- [ ] Host Privacy Policy (GitHub Pages works)

### Production Deployment
- [ ] Deploy backend to cloud (Railway recommended)
- [ ] Update frontend env with production backend URL
- [ ] Set up production MongoDB (MongoDB Atlas)
- [ ] Configure Stripe webhook URL for production

## Files Reference
- Backend: `/app/backend/server.py`
- Frontend: `/app/frontend/src/App.js`
- Capacitor: `/app/frontend/capacitor.config.json`
- Store Assets: `/app/store_assets/`
