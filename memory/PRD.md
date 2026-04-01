# Glimmer Quest - Match-3 Puzzle Game PRD

## Original Problem Statement
Build a Match-3 puzzle game (Candy Crush style) optimized for maximum revenue, ready for Play Store launch.

## Architecture
- **Frontend**: React + Tailwind CSS + Howler.js + Capacitor (mobile)
- **Backend**: FastAPI + MongoDB + Stripe
- **Monetization**: Lives system, IAP via Stripe, AdMob ads (configured)

## What's Been Implemented (April 1, 2026)

### Core Game ✅
- Match-3 mechanics (swap, match, cascade - max 15 cascades)
- 8x8 gem board with 5 gem types (red, blue, green, yellow, purple)
- Special gems (striped_h, striped_v, wrapped, color_bomb)
- Level obstacles (ice, chains, blockers)
- Progressive difficulty levels (10 levels)
- Safety loop in processMatches to ensure no uncleared matches after cascades

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
- Sound effects (via Howler.js)

### Mobile Ready ✅
- Capacitor configured for Android/iOS
- Touch-optimized controls
- Responsive design

### Store Assets Created ✅
- `/app/store_assets/README.md` - App descriptions, keywords
- `/app/store_assets/PRIVACY_POLICY.md` - Privacy policy template

## Bug Fixes (April 1, 2026)

### FIXED: Gems Grouping Without Disappearing
- **Issue**: After cascades, 4+ gems would sometimes remain grouped without matching
- **Root Cause**: processMatches function wasn't fully processing all cascading matches
- **Fix Applied**: Added safety check loop (lines 1219-1267 in App.js) that:
  - Continues processing matches until board is truly stable
  - Runs up to 3 additional passes to catch edge cases
- **Verification**: Tested 25+ swaps - no uncleared matches found

### FIXED: Modal Overlay Blocking Clicks
- **Issue**: Modal overlays intercepting pointer events after modal closed
- **Status**: Verified working - modals open/close without blocking game board

## Test Reports
- `/app/test_reports/iteration_4.json` - Latest (100% pass rate)
- Backend: 20/20 API tests passed
- Frontend: All game mechanics verified working

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
- Test Reports: `/app/test_reports/`

## Code Architecture
```
/app/
├── backend/
│   ├── server.py             # FastAPI backend (Player state, Shop, Stripe endpoints)
│   ├── requirements.txt
│   ├── tests/                # pytest tests
│   └── .env
├── frontend/
│   ├── public/               # index.html (AdMob script), manifest.json, icons
│   ├── src/
│   │   ├── App.js            # React Match-3 Game Engine + UI (~1800 lines)
│   │   ├── hooks/            # useAdPlacement
│   │   ├── utils/            # soundManager
│   │   └── index.css         # Animations (matchPop, specialPulse)
│   ├── android/              # Capacitor Android project files
│   └── capacitor.config.json
├── store_assets/             # PRIVACY_POLICY.md, README.md
├── test_reports/
└── memory/
```

## Backlog (P2)
- Refactor App.js into smaller components/hooks
- Implement Stripe Webhooks for production
- Polish app icons
- Add more levels (currently 10)
- Add tutorial for new players
