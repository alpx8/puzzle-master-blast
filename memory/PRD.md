# Puzzle Master Blast - Ürün Gereksinimleri Belgesi (PRD)

## Son Güncelleme: 1 Nisan 2026

---

## Proje Özeti

**Uygulama Adı:** Puzzle Master Blast  
**Tür:** Block Blast benzeri mobil bulmaca oyunu  
**Platform:** Android (React Native / Expo)  
**Dil:** Türkçe

---

## Tamamlanan Özellikler

### v1.3.0 (1 Nisan 2026) - VIP & IAP Güncellemesi

**VIP Abonelik Sistemi (Güncellendi):**
- ✅ Google Play IAP entegrasyonu (`react-native-iap`)
- ✅ VIP Ol butonuna tıklandığında Google Play abonelik ekranı açılıyor
- ✅ Simülasyon kaldırıldı - sadece gerçek ödeme sonrası VIP aktif
- ✅ "Tebrikler! VIP Üye Oldunuz!" başarı animasyonu (ödeme onayı sonrası)
- ✅ "Satın Alımları Geri Yükle" butonu eklendi
- ✅ Fiyat: ₺149.99/ay

**7 Günlük Streak VIP Deneme:**
- ✅ 7 gün üst üste ödül toplayan kullanıcılara özel ekran
- ✅ Reklam izleyerek 1 günlük VIP deneme kazanma
- ✅ Konfeti efekti ve animasyon
- ✅ Deneme hakkı sadece 1 kez kullanılabilir

### v1.2.0 - Monetizasyon Güncellemesi

**Günlük Ödül Sistemi:**
- ✅ 1-7 coin ölçeklendirme (haftalık döngü)
- ✅ Ödül alındıktan hemen sonra reklam gösterimi
- ✅ VIP kullanıcılar reklam görmüyor

**Video İzle - Rastgele Ödül:**
- ✅ Joker sekmesinde "Video İzle" bölümü
- ✅ Kazanılabilecek ödüller: 5-25 Coin, Bomba, Karıştır, Geri Al, Ekstra Can
- ✅ Rewarded ad + ödül animasyonu

### v1.1.0 - UI Sadeleştirme & Multiplayer

**Mağaza Entegrasyonu:**
- ✅ 4 sekmeli mağaza: Coin, Tema, Joker, VIP
- ✅ Coin paketleri (Popüler/En İyi etiketleri)
- ✅ Temalar (Blok skinleri)
- ✅ Jokerler (Güçlendirmeler)

**Backend (MongoDB):**
- ✅ Kullanıcı profil sistemi
- ✅ Oyun sonuçları kaydetme
- ✅ Socket.IO room yönetimi

### v1.0.0 - Temel Özellikler

- ✅ 8x8 blok yerleştirme oyunu
- ✅ Klasik Mod (süresiz)
- ✅ Zamanlı Mod (3 dakika)
- ✅ Çok Oyunculu Mod
- ✅ Turnuva Modu (UI)
- ✅ Günlük ödüller ve görevler
- ✅ Liderlik tablosu
- ✅ AdMob entegrasyonu
- ✅ Çevrimdışı destek

---

## Teknik Mimari

### Frontend
- **Framework:** React Native + Expo SDK 53
- **Routing:** Expo Router
- **State:** Zustand
- **UI:** Custom components + Ionicons

### Backend
- **Framework:** FastAPI (Python)
- **Real-time:** Socket.IO
- **Database:** MongoDB

### Entegrasyonlar
- Google AdMob (`react-native-google-mobile-ads`)
- Google Play Billing (`react-native-iap`)
- Socket.IO (multiplayer)

---

## Monetizasyon

| Özellik | Durum | Fiyat |
|---------|-------|-------|
| VIP Abonelik | ✅ Aktif | ₺149.99/ay |
| Coin 500 | ✅ IAP | ₺19.99 |
| Coin 1200 | ✅ IAP | ₺39.99 |
| Coin 3000 | ✅ IAP | ₺79.99 |
| Coin 8000 | ✅ IAP | ₺149.99 |
| Interstitial Ads | ✅ | Günlük ödül sonrası |
| Rewarded Ads | ✅ | Video izle ödül |

---

## API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/profiles` | POST | Profil oluştur/getir |
| `/api/profiles/{id}/sync` | PUT | Profil senkronize et |
| `/api/rooms` | GET/POST | Oda listele/oluştur |
| `/api/rooms/{id}/join` | POST | Odaya katıl |
| `/api/leaderboard` | GET | Liderlik tablosu |

---

## Backlog / Gelecek Özellikler

| Öncelik | Özellik | Açıklama |
|---------|---------|----------|
| P1 | Kaygan Blok Animasyonu | Bloklar yerleşirken slide efekti |
| P1 | Multiplayer Gerçek Cihaz Testi | 2 cihazla Socket.IO testi |
| P2 | Backend Turnuva | Sunucu taraflı turnuva mantığı |
| P3 | Push Notifications | Günlük ödül hatırlatıcıları |

---

## Yayınlama Durumu

- **Version:** 1.3.0
- **Version Code:** 4
- **Package:** com.puzzlemaster.blastgame
- **Google Play:** Kapalı test aşamasında

---

## Önemli Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `/app/frontend/src/store/vipStore.ts` | VIP abonelik ve IAP mantığı |
| `/app/frontend/src/components/ShopModal.tsx` | Mağaza UI |
| `/app/frontend/src/components/DailyRewardsModal.tsx` | Günlük ödül + 7. gün VIP deneme |
| `/app/AAB_BUILD_REHBERI.md` | Build ve yayınlama rehberi |

---

## Bilinen Sınırlamalar

- Web preview'da VIP ikonu (Ionicons "star") görünüyor; Android'de daha iyi ikonlar kullanılabilir
- IAP sadece gerçek Android cihazda çalışır
- Multiplayer gerçek cihaz testi yapılmalı
