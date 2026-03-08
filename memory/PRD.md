# Puzzle Master Blast - Product Requirements Document

## Tamamlanan Özellikler ✅

### Core Game
- 8x8 grid bulmaca oyunu (Klasik ve Zamanlı mod)
- Parlak, 3D efektli bloklar (şeffaflık kaldırıldı)
- Combo sistemi ve pixel-art text
- Ses efektleri ve titreşim
- Game Over ve New High Score ekranları

### Monetizasyon Sistemi
- **Banner Ads** - Oyun ekranının altında
- **Interstitial Ads** - Game over'da
- **Rewarded Video Ads** - "Devam Et" sistemi (3 hak)
- **Continue Modal** - Animasyonlu, 5sn geri sayım

### Günlük Ödül Sistemi ✅
- 7 günlük streak takibi
- XP ve Coin ödülleri
- Özel skin ödülleri (5. ve 7. günlerde)
- Animasyonlu modal

### Blok Temaları (Skins) 🟡
- 10 farklı tema (Klasik, Neon, Altın, Okyanus, vb.)
- Reklam izleyerek kilit açma
- Premium ve Glow efektli temalar
- **NOT:** Web preview'da render sorunu var, native'de çalışacak

### Power-ups Sistemi 🟡
- Bomba (3x3 temizle)
- Karıştır (yeni bloklar)
- Ekstra Süre (zamanlı mod)
- Satır Temizle
- Store hazır, UI entegrasyonu bekliyor

### Multiplayer
- Public/Private odalar
- Real-time Socket.IO
- Oyun geçmişi

### Diğer
- Liderlik tablosu
- Günlük görevler (UI)
- Yayınlama rehberleri (Türkçe)

---

## Kullanıcıya Yapılacaklar

1. **Hesap Oluştur:**
   - Expo, Google Play ($25), Apple Developer ($99/yıl), AdMob

2. **AdMob ID'lerini Al ve Paylaş**

3. **Build & Yükle:**
   - `eas build --platform all`

---

## Dosya Yapısı

```
/app
├── frontend/
│   ├── app/
│   │   ├── index.tsx      # Ana ekran + Daily Rewards
│   │   ├── game.tsx       # Oyun + Continue modal
│   │   └── ...
│   └── src/
│       ├── components/
│       │   ├── DailyRewardsModal.tsx
│       │   ├── SkinsModal.tsx
│       │   └── ...
│       ├── store/
│       │   ├── gameStore.ts
│       │   ├── dailyRewardsStore.ts
│       │   ├── skinsStore.ts
│       │   ├── powerUpsStore.ts
│       │   └── questStore.ts
│       └── services/
│           ├── admobService.ts
│           └── rewardedAdService.ts
├── PARA_KAZANMA_REHBERI.md
└── publishing_guide.md
```

---

## Kalan İşler

### P1 - Yüksek
- [ ] Power-ups UI entegrasyonu (game.tsx)
- [ ] Skins modal web fix (veya native test)
- [ ] Multiplayer uçtan uca test

### P2 - Orta
- [ ] Sosyal paylaşım butonu
- [ ] Daily Quests backend

### P3 - Düşük
- [ ] Turnuva modu
- [ ] Push notifications

---

Last Updated: Şubat 2026
