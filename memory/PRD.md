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

### v1.1.0 (1 Nisan 2026) - UI Sadeleştirme & Multiplayer Güncellemesi

**Ana Ekran Sadeleştirildi:**
- ✅ Coin gösterimi tek yerde (sağ üst köşede şık tasarım)
- ✅ 4 oyun modu butonu: Klasik, Zamanlı, Çok Oyunculu, Turnuva
- ✅ Alt menü: Sıralama, Görevler, Ödül, Mağaza
- ✅ "Oyunlarım" kaldırıldı (Multiplayer Geçmiş sekmesinde)

**Mağaza Entegrasyonu:**
- ✅ Coin paketleri (Popüler/En İyi etiketleri)
- ✅ Temalar (Blok skinleri) entegre edildi
- ✅ Jokerler (Güçlendirmeler) entegre edildi
- ✅ Reklam izle butonu (ücretsiz joker)

**Multiplayer Güncellemesi:**
- ✅ Stats bar (Galibiyet, Oran, Coin)
- ✅ Hızlı Eşleşme butonu (gradient tasarım)
- ✅ 3 sekme: Açık odalar, Şifreli odalar, Geçmiş
- ✅ Oyun geçmişi kartları

**Backend (MongoDB):**
- ✅ Kullanıcı profil sistemi
- ✅ Oyun sonuçları kaydetme
- ✅ Quick Match kuyruğu
- ✅ Socket.IO room yönetimi

### v1.0.0 (Önceki Sürümler)

- ✅ 8x8 blok yerleştirme oyunu
- ✅ Klasik Mod (süresiz)
- ✅ Zamanlı Mod (3 dakika)
- ✅ Çok Oyunculu Mod
- ✅ Turnuva Modu (UI)
- ✅ Günlük ödüller
- ✅ Günlük görevler
- ✅ Liderlik tablosu
- ✅ AdMob entegrasyonu
- ✅ Tema/Skin sistemi
- ✅ Joker/Power-up sistemi
- ✅ Çevrimdışı destek (Klasik/Zamanlı modlar)

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
- Google AdMob
- react-native-iap (IAP)
- Socket.IO (multiplayer)

---

## API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/profiles` | POST | Profil oluştur/getir |
| `/api/profiles/{id}/sync` | PUT | Profil senkronize et |
| `/api/profiles/{id}/coins` | POST | Coin ekle |
| `/api/rooms` | GET/POST | Oda listele/oluştur |
| `/api/rooms/{id}/join` | POST | Odaya katıl |
| `/api/game_results/{id}` | GET | Oyun geçmişi |
| `/api/leaderboard` | GET | Liderlik tablosu |
| `/api/quick_match/status` | GET | Eşleşme kuyruğu durumu |

---

## Socket.IO Events

| Event | Yön | Açıklama |
|-------|-----|----------|
| `join_room` | Client→Server | Odaya katıl |
| `player_ready` | Client→Server | Hazır ol |
| `score_update` | Client→Server | Skor güncelle |
| `player_game_over` | Client→Server | Oyun bitti |
| `join_quick_match` | Client→Server | Hızlı eşleşme kuyruğuna gir |
| `room_update` | Server→Client | Oda durumu güncellendi |
| `game_started` | Server→Client | Oyun başladı |
| `game_ended` | Server→Client | Oyun sona erdi |
| `quick_match_found` | Server→Client | Eşleşme bulundu |

---

## Backlog / Gelecek Özellikler

| Öncelik | Özellik | Açıklama |
|---------|---------|----------|
| P1 | Kaygan Blok Animasyonu | Bloklar yerleşirken slide efekti |
| P1 | Multiplayer Test | Gerçek cihazlarda 2 kişiyle test |
| P2 | Native IAP Doğrulama | Google Play Billing backend |
| P2 | Backend Turnuva | Sunucu taraflı turnuva mantığı |
| P3 | Push Notifications | Günlük ödül hatırlatıcıları |
| P3 | Sosyal Giriş | Google/Apple ile giriş |

---

## Yayınlama Durumu

- **Version:** 1.1.0
- **Version Code:** 2
- **Package:** com.puzzlemaster.blastgame
- **Google Play:** Kapalı test aşamasında
- **IAP Ürünleri:** Tanımlanacak (coins_500, coins_1200, coins_3000, coins_8000)

---

## Test Durumu

| Özellik | Durum |
|---------|-------|
| Ana Ekran | ✅ |
| Mağaza (Coin/Tema/Joker) | ✅ |
| Klasik Mod | ✅ |
| Zamanlı Mod | ✅ |
| Çok Oyunculu Ekranı | ✅ |
| Hızlı Eşleşme UI | ✅ |
| Oda Oluşturma | ✅ |
| Günlük Ödüller | ✅ |
| Görevler | ✅ |
| Liderlik Tablosu | ✅ |

---

## Bilinen Sorunlar

1. **Multiplayer gerçek cihaz testi gerekiyor** - Web preview'da Socket.IO bağlantısı test edilemedi
2. **IAP simülasyon modunda** - Gerçek satın alma sadece cihazda çalışır
3. **AdMob simülasyon modunda** - Expo Go'da reklam gösterilmiyor

---

## Notlar

- Uygulama Türkçe kullanıcı arayüzüne sahip
- Çevrimdışı mod destekleniyor (Klasik/Zamanlı)
- Google Play Console'da IAP ürünleri oluşturulmalı
- BILLING izni app.json'a eklenmiş durumda
