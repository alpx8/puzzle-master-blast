# Puzzle Master Blast - Product Requirements Document

## Original Problem Statement
Kullanıcı, "Block Blast" benzeri "Puzzle Master Blast" adında bir mobil oyun geliştirmek istedi.

### Core Gameplay
- 10x10 grid üzerinde blok yerleştirme bulmaca oyunu
- Tam satır veya sütunları temizleyerek puan kazanma
- Oyuncu 3 bloktan hiçbirini yerleştiremediğinde oyun sona erer

### Visual & Effects Requirements
- Parlak, renkli, 3D efektli bloklar
- "Yukarıdan düşme" blok yerleştirme animasyonu
- Heyecan verici satır/sütun temizleme animasyonları
- Combo'lar için pixel-art tarzı metin ("COMBO", "GREAT", "WOW")
- Game Over ekranı (özel görsel ve ses)
- New High Score kutlaması (özel görsel ve ses)

### Audio & Haptics
- Blok yerleştirme, satır temizleme, game over ve high score ses efektleri
- Ses kapatma butonu
- Combo temizlemelerinde titreşim

### Multiplayer Mode
- Public ve şifreli oda listesi olan lobi
- Yeni oda oluşturma (public veya private)
- Gerçek zamanlı ve eşzamanlı oynanış
- Oyun geçmişi bölümü (Win/Loss sonuçları)

### Additional Features
- En yüksek skorlar için liderlik tablosu
- Günlük görevler sistemi (UI mevcut, backend eksik)
- Google AdMob reklam entegrasyonu

---

## Current Implementation Status

### Completed Features ✅
1. **Single Player Game** - Fully functional with all visual/audio effects
2. **Classic Mode** - Süresiz oyun modu
3. **Timed Mode** - 3 dakikalık zamanlı mod
4. **Multiplayer System** - Public/private rooms, lobby UI, real-time gameplay
5. **Leaderboard** - Functional score tracking and display
6. **Game Over / High Score Logic** - Custom UI, sounds, and icons
7. **Pixel-Art Combo Text** - Animated combo displays
8. **Block Visuals** - Bright, colorful, 3D effect blocks
9. **Sound Effects** - All game sounds working
10. **Mute Button** - Toggle sounds on/off
11. **Google AdMob Integration** - Banner and Interstitial ads configured

### Partially Implemented (UI Only) 🟡
1. **Daily Quests** - UI exists, backend logic missing

### Not Implemented ❌
1. **Daily Quests Backend** - Quest generation, tracking, rewards
2. **User Leveling/XP System** - XP tracking, level progression
3. **Score Multipliers for Combos** - Actual point multipliers
4. **Full User Authentication** - Persistent user profiles across devices

---

## Architecture

```
/app
├── backend/
│   ├── server.py        # FastAPI + Socket.IO server
│   └── requirements.txt
├── frontend/
│   ├── app.json         # Expo config with AdMob
│   ├── package.json
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx    # Home screen
│   │   ├── game.tsx     # Game screen with AdMob
│   │   ├── game-room.tsx
│   │   ├── leaderboard.tsx
│   │   └── multiplayer.tsx
│   └── src/
│       ├── components/
│       │   ├── BannerAd.tsx    # NEW: AdMob banner component
│       │   ├── Block.tsx
│       │   ├── GameBoard.tsx
│       │   └── ...
│       ├── config/
│       │   └── admobConfig.ts  # NEW: AdMob configuration
│       ├── services/
│       │   └── admobService.ts # NEW: AdMob service
│       └── store/
│           ├── gameStore.ts
│           └── questStore.ts
├── publishing_guide.md  # NEW: Store publishing guide
└── memory/
    └── PRD.md           # This file
```

---

## Tech Stack
- **Frontend**: React Native, Expo SDK 54, Expo Router, React Native Reanimated, Zustand
- **Backend**: Python, FastAPI, python-socketio, Uvicorn
- **Database**: MongoDB
- **Ads**: Google AdMob (react-native-google-mobile-ads)

---

## Key API Endpoints

### REST
- `GET /api/scores` - Leaderboard data
- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room
- `POST /api/rooms/{id}/join` - Join room
- `GET /api/game_results/{userId}` - Game history

### Socket.IO
- `join_room`, `leave_room`, `player_ready`
- `score_update`, `cannot_move`
- `game_started`, `game_over`, `game_ended`

---

## Database Schema
- `users`: { id, username, level, xp, high_score }
- `scores`: { id, user_id, username, score, timestamp }
- `rooms`: { id, name, players, password, status }
- `game_results`: { id, room_id, players, winner, scores }

---

## Monetization
- **Banner Ads**: Bottom of game screen (adaptive banner)
- **Interstitial Ads**: After every 2nd game over, minimum 1 minute interval

---

## Prioritized Backlog

### P0 - Critical
- [x] Google AdMob Integration
- [x] Publishing Guide Document
- [ ] End-to-end multiplayer testing

### P1 - High Priority
- [ ] Daily Quests Backend Implementation
- [ ] Score Multipliers for Combos

### P2 - Medium Priority
- [ ] User Leveling/XP System
- [ ] Rewarded Video Ads (bonus lives/items)

### P3 - Low Priority
- [ ] Full User Authentication (email/social login)
- [ ] Push Notifications
- [ ] In-app Purchases

---

## Notes
- App uses test ad IDs in development, production IDs needed for release
- Multiplayer uses Socket.IO for real-time communication
- Daily Quests UI is functional but backend is MOCKED

---

---

## Ready-to-Publish Files Created
1. `/app/frontend/eas.json` - EAS Build configuration
2. `/app/frontend/assets/privacy-policy.html` - Privacy policy page (Turkish)
3. `/app/PARA_KAZANMA_REHBERI.md` - Step-by-step monetization guide (Turkish)
4. `/app/publishing_guide.md` - Detailed publishing guide

## What User Needs To Do
1. Create accounts (Expo, Google Play $25, Apple Developer $99, AdMob)
2. Get AdMob App IDs and Ad Unit IDs
3. Share IDs with agent to update code
4. Build with EAS and submit to stores

Last Updated: February 2026
