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

### v1.2.1 (1 Nisan 2026) - VIP Deneme & Monetizasyon

**7 Günlük Streak VIP Deneme (YENİ):**
- ✅ 7 gün üst üste ödül toplayan kullanıcılara özel ekran
- ✅ Reklam izleyerek 1 günlük VIP deneme kazanma
- ✅ Crown animasyonu ve konfeti efekti
- ✅ Deneme hakkı sadece 1 kez kullanılabilir
- ✅ VIP deneme durumu AsyncStorage'da saklanıyor

### v1.2.0 (1 Nisan 2026) - Monetizasyon Güncellemesi

**Günlük Ödül Sistemi (Güncellendi):**
- ✅ 1-7 coin ölçeklendirme (haftalık döngü)
- ✅ Ödül alındıktan hemen sonra reklam gösterimi
- ✅ VIP kullanıcılara reklam gösterilmiyor

**VIP Abonelik Sistemi (YENİ):**
- ✅ Mağazada VIP sekmesi eklendi
- ✅ ₺149.99/ay aylık abonelik
- ✅ VIP avantajları: Reklamsız oyun, Hızlı yükleme, VIP rozeti
- ✅ Abonelik durumu ve bitiş tarihi gösterimi
- ✅ Web simülasyonu + Native IAP entegrasyonu hazır

**Video İzle & Rastgele Ödül (YENİ):**
- ✅ Joker sekmesine "Video İzle" bölümü eklendi
- ✅ Rastgele ödül sistemi: 5-25 Coin, Bomba, Karıştır, Geri Al, Ekstra Can
- ✅ Ödül animasyonu
- ✅ Web simülasyonu + Native rewarded ad hazır

**Ekstra Can Powerup (YENİ):**
- ✅ Yeni joker türü: Ekstra Can (150 coin)
- ✅ Oyun bitince devam etme imkanı

### v1.1.0 (Önceki Sürüm) - UI Sadeleştirme & Multiplayer

**Ana Ekran Sadeleştirildi:**
- ✅ Coin gösterimi tek yerde (sağ üst köşede şık tasarım)
- ✅ 4 oyun modu butonu: Klasik, Zamanlı, Çok Oyunculu, Turnuva
- ✅ Alt menü: Sıralama, Görevler, Ödül, Mağaza
- ✅ "Oyunlarım" kaldırıldı (Multiplayer Geçmiş sekmesinde)

**Mağaza Entegrasyonu:**
- ✅ Coin paketleri (Popüler/En İyi etiketleri)
- ✅ Temalar (Blok skinleri) entegre edildi
- ✅ Jokerler (Güçlendirmeler) entegre edildi
- ✅ 4 sekmeli mağaza: Coin, Tema, Joker, VIP

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
- Google AdMob (react-native-google-mobile-ads)
- react-native-iap (IAP)
- Socket.IO (multiplayer)

---

## Monetizasyon

| Özellik | Durum | Notlar |
|---------|-------|--------|
| Interstitial Ads | ✅ Aktif | Günlük ödül sonrası |
| Rewarded Ads | ✅ Aktif | Video izle rastgele ödül |
| VIP Abonelik | ✅ Aktif | ₺149.99/ay |
| IAP Coin Paketleri | ✅ Simülasyon | Google Play Console'da tanımlanacak |

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
| P1 | Multiplayer Gerçek Cihaz Testi | 2 cihazla Socket.IO testi |
| P2 | Google Play Console IAP Ürünleri | Gerçek ürünleri tanımla |
| P2 | Backend Turnuva | Sunucu taraflı turnuva mantığı |
| P3 | Push Notifications | Günlük ödül hatırlatıcıları |
| P3 | Sosyal Giriş | Google/Apple ile giriş |

---

## Yayınlama Durumu

- **Version:** 1.2.0
- **Version Code:** 3
- **Package:** com.puzzlemaster.blastgame
- **Google Play:** Kapalı test aşamasında
- **IAP Ürünleri:** 
  - coins_500, coins_1200, coins_3000, coins_8000
  - vip_monthly (₺149.99/ay)

---

## Test Durumu

| Özellik | Durum |
|---------|-------|
| Ana Ekran | ✅ |
| Mağaza (4 sekme) | ✅ |
| VIP Abonelik | ✅ (Simülasyon) |
| Video İzle Rastgele Ödül | ✅ (Simülasyon) |
| Günlük Ödül + Reklam | ✅ (Simülasyon) |
| Klasik Mod | ✅ |
| Zamanlı Mod | ✅ |
| Çok Oyunculu Ekranı | ✅ |
| Hızlı Eşleşme UI | ✅ |
| Oda Oluşturma | ✅ |
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
