# Puzzle Master Blast - Ürün Gereksinimleri Belgesi (PRD)

## Son Güncelleme: 1 Nisan 2026

---

## Proje Özeti

**Uygulama Adı:** Puzzle Master Blast  
**Tür:** Block Blast benzeri mobil bulmaca oyunu  
**Platform:** Android (React Native / Expo)  
**Dil:** Türkçe

---

## VIP Abonelik Sistemi (Güncel)

### VIP Mantığı
- VIP kullanıcılar **hiç reklam görmez** (günlük ödül sonrası, oyun arası, banner)
- VIP olmayanlar reklamlara maruz kalır
- VIP abonelik sadece **Google Play üzerinden** satın alınabilir (web'de satın alma yapılamaz)
- Satın alma onayı Google Play'den geldikten sonra VIP aktif olur
- "Tebrikler! VIP Üye Oldunuz!" animasyonu ödeme onayı sonrası gösterilir
- Abonelik süresi dolunca VIP otomatik kaldırılır ve reklamlar geri gelir

### VIP Fiyatlandırma
- **Aylık Abonelik:** ₺149.99/ay
- **1 Günlük Deneme:** 7 gün üst üste giriş yapan kullanıcılar reklam izleyerek kazanabilir (tek seferlik)

### Reklam Türleri
| Reklam Türü | VIP Göster | VIP Olmayan |
|-------------|------------|-------------|
| Interstitial (oyun arası) | ❌ Hayır | ✅ Her 3 oyunda bir |
| Günlük ödül sonrası | ❌ Hayır | ✅ Evet |
| Rewarded (video izle ödül) | ✅ Evet* | ✅ Evet |

*VIP kullanıcılar isterse ödül için video izleyebilir

---

## Tamamlanan Özellikler

### v1.3.0 (1 Nisan 2026) - VIP & IAP Tam Entegrasyonu

**VIP Abonelik (Google Play IAP):**
- ✅ VIP Ol butonu Google Play abonelik ekranını açıyor
- ✅ Simülasyon kaldırıldı - sadece gerçek ödeme sonrası VIP aktif
- ✅ "Tebrikler! VIP Üye Oldunuz!" başarı animasyonu
- ✅ "Satın Alımları Geri Yükle" butonu
- ✅ VIP süresi dolunca otomatik kaldırma
- ✅ Kral tacı (👑) emoji VIP ikonu olarak kullanıldı

**Reklam Yönetimi:**
- ✅ VIP kontrolü tüm reklam noktalarına entegre edildi
- ✅ adManager.ts güncellenmiş - shouldShowAds(), checkVIPStatus()
- ✅ Oyun sonrası interstitial reklam (VIP değilse)
- ✅ Günlük ödül sonrası interstitial reklam (VIP değilse)

**7 Günlük Streak VIP Deneme:**
- ✅ 7 gün üst üste giriş yapanlara özel teklif
- ✅ Reklam izleyerek 1 günlük VIP kazanma
- ✅ Tek seferlik hak (hasUsedTrial flag)

### v1.2.0 - Monetizasyon

- ✅ Günlük ödül 1-7 coin ölçeklendirme
- ✅ Video izle rastgele ödül (5-25 coin, jokerler, ekstra can)
- ✅ 4 sekmeli mağaza (Coin, Tema, Joker, VIP)

### v1.0-1.1.0 - Temel Özellikler

- ✅ 8x8 blok yerleştirme oyunu
- ✅ 4 oyun modu (Klasik, Zamanlı, Multiplayer, Turnuva)
- ✅ Liderlik tablosu, görevler
- ✅ Backend (FastAPI, MongoDB, Socket.IO)
- ✅ Çevrimdışı destek

---

## Teknik Detaylar

### Dosyalar
| Dosya | Açıklama |
|-------|----------|
| `/app/frontend/src/store/vipStore.ts` | VIP abonelik state ve IAP mantığı |
| `/app/frontend/src/utils/adManager.ts` | Reklam yönetimi ve VIP kontrolü |
| `/app/frontend/src/components/ShopModal.tsx` | Mağaza UI (VIP sekmesi dahil) |
| `/app/frontend/src/components/DailyRewardsModal.tsx` | Günlük ödül + 7. gün VIP deneme |
| `/app/frontend/app/game.tsx` | Oyun ekranı (oyun sonu reklam) |

### IAP Ürün IDleri
| ID | Tür | Fiyat |
|----|-----|-------|
| vip_monthly | Abonelik | ₺149.99/ay |
| coins_500 | Tek seferlik | ₺19.99 |
| coins_1200 | Tek seferlik | ₺39.99 |
| coins_3000 | Tek seferlik | ₺79.99 |
| coins_8000 | Tek seferlik | ₺149.99 |

---

## Bilinen Sınırlamalar

1. **Web Preview:** Kral tacı emojisi ve bazı Ionicons web'de soru işareti olarak görünüyor. Android'de düzgün çalışır.
2. **IAP Test:** Gerçek satın alma sadece Google Play'den yüklenmiş APK/AAB'de test edilebilir.
3. **Multiplayer:** Gerçek cihazlarla test gerekiyor.

---

## Backlog

| Öncelik | Özellik |
|---------|---------|
| P1 | Kaygan blok yerleştirme animasyonu |
| P1 | Multiplayer gerçek cihaz testi |
| P2 | Backend turnuva mantığı |
| P3 | Push notifications |

---

## Yayınlama

- **Version:** 1.3.0
- **Version Code:** 5
- **Package:** com.puzzlemaster.blastgame
- **Rehber:** `/app/AAB_BUILD_REHBERI.md`
