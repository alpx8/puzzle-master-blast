# 📱 Puzzle Master Blast - Mağaza Listeleme Rehberi

## 1️⃣ EXPO EAS BUILD İLE UYGULAMA OLUŞTURMA

### Kurulum

```bash
# EAS CLI'ı global olarak kur
npm install -g eas-cli

# Expo hesabına giriş yap
eas login

# Proje ID'si oluştur
eas init
```

### eas.json Dosyası Oluştur

`/app/frontend/eas.json` dosyası:
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      },
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-store-connect-app-id"
      }
    }
  }
}
```

### Build Komutları

```bash
# Android APK (test için)
eas build --platform android --profile preview

# Android AAB (Play Store için)
eas build --platform android --profile production

# iOS (App Store için)
eas build --platform ios --profile production
```

---

## 2️⃣ GOOGLE PLAY STORE'A YÜKLEME

### Adım 1: Google Play Console Hesabı

1. https://play.google.com/console adresine git
2. **25$ tek seferlik ücret** öde
3. Geliştirici hesabını oluştur

### Adım 2: Uygulama Oluştur

1. "Uygulama oluştur" butonuna tıkla
2. Uygulama adı: **Puzzle Master Blast**
3. Varsayılan dil: Türkçe
4. Uygulama türü: Oyun
5. Ücretsiz/Ücretli seç

### Adım 3: Store Listing

**Başlık (30 karakter):**
```
Puzzle Master Blast
```

**Kısa Açıklama (80 karakter):**
```
Blok yerleştirme bulmaca oyunu! Satırları temizle, combo yap, arkadaşlarınla yarış!
```

**Tam Açıklama (4000 karakter):**
```
🎮 PUZZLE MASTER BLAST - En eğlenceli blok bulmaca oyunu!

🧩 OYUN NASIL OYNANIR?
• Blokları sürükleyip tahtaya yerleştir
• Satır veya sütunları tamamen doldur
• Dolu satırlar otomatik temizlenir
• Combo yaparak puanını katla!

🏆 OYUN MODLARI
• Klasik Mod: Süresiz oyna, rekorunu kır!
• Zamanlı Mod: 3 dakikada en yüksek skoru yap!
• Çok Oyunculu: Arkadaşlarınla gerçek zamanlı yarış!

✨ ÖZELLİKLER
• Renkli ve göz alıcı grafikler
• Eğlenceli ses efektleri
• Günlük görevler ve XP sistemi
• Global liderlik tablosu
• Şifreli özel odalar

📱 Mobil cihazlar için optimize edildi!

Hemen indir ve bulmaca ustası ol! 🚀
```

### Adım 4: Görseller

**Uygulama İkonu:**
- Boyut: 512x512 px
- Format: PNG (32-bit, alfa kanalı ile)

**Feature Graphic:**
- Boyut: 1024x500 px
- Format: PNG veya JPEG

**Ekran Görüntüleri:**
- Telefon: En az 2 adet (min 320px, max 3840px)
- Tablet: En az 1 adet (7 inç ve 10 inç)
- Önerilen: 1080x1920 px (9:16 oran)

### Adım 5: AAB Yükleme

1. "Sürümler" > "Üretim" > "Yeni sürüm oluştur"
2. EAS build'den aldığın .aab dosyasını yükle
3. Sürüm notlarını yaz
4. "Sürümü incele" > "Yayınla"

### İnceleme Süreci
- Genellikle 1-3 gün
- İlk uygulama için 7 güne kadar uzayabilir

---

## 3️⃣ APPLE APP STORE'A YÜKLEME

### Adım 1: Apple Developer Hesabı

1. https://developer.apple.com adresine git
2. **99$/yıl** abonelik ücreti öde
3. Geliştirici hesabını oluştur

### Adım 2: App Store Connect

1. https://appstoreconnect.apple.com
2. "My Apps" > "+" > "New App"
3. Bilgileri doldur:
   - Platform: iOS
   - Name: Puzzle Master Blast
   - Primary Language: Turkish
   - Bundle ID: com.puzzlemasterblast.app
   - SKU: puzzlemasterblast001

### Adım 3: App Information

**Başlık:** Puzzle Master Blast
**Subtitle:** Blok Bulmaca Oyunu
**Kategori:** Games > Puzzle

**Açıklama:** (Google Play ile aynı kullanılabilir)

### Adım 4: Görseller

**App Icon:**
- 1024x1024 px (App Store için)

**Screenshots:**
- iPhone 6.7": 1290x2796 px
- iPhone 6.5": 1284x2778 px
- iPhone 5.5": 1242x2208 px
- iPad Pro 12.9": 2048x2732 px

### Adım 5: TestFlight (Test)

1. EAS build'den .ipa dosyasını al
2. App Store Connect'e yükle
3. Internal testers ekle
4. Test et

### Adım 6: Yayınlama

1. Build'i seç
2. "Submit for Review"
3. Export Compliance: "No" (şifreleme kullanmıyorsan)

### İnceleme Süreci
- Genellikle 24-48 saat
- Reddedilirse detaylı açıklama gelir

---

## 4️⃣ REKLAM ENTEGRASYOnu (GOOGLE ADMOB)

### Adım 1: AdMob Hesabı

1. https://admob.google.com
2. Google hesabınla giriş yap
3. Yeni uygulama ekle

### Adım 2: Ad Unit ID'leri Oluştur

**Banner Reklam:**
- Format: Banner (320x50)
- Yerleşim: Oyun ekranı altı

**Interstitial Reklam:**
- Format: Tam ekran
- Yerleşim: Oyun bitiminde

**Rewarded Reklam:**
- Format: Ödüllü video
- Yerleşim: Ekstra can/ipucu için

### Adım 3: Paket Kurulumu

```bash
npx expo install react-native-google-mobile-ads
```

### Adım 4: app.json Güncelle

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-XXXXXXXX~YYYYYYYY",
          "iosAppId": "ca-app-pub-XXXXXXXX~ZZZZZZZZ"
        }
      ]
    ]
  }
}
```

### Adım 5: Kod Örneği

```typescript
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Banner Reklam
<BannerAd
  unitId={TestIds.BANNER} // Production'da gerçek ID kullan
  size={BannerAdSize.BANNER}
/>

// Interstitial Reklam
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';

const interstitial = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL);

interstitial.addAdEventListener(AdEventType.LOADED, () => {
  interstitial.show();
});

interstitial.load();

// Rewarded Reklam
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';

const rewarded = RewardedAd.createForAdRequest(TestIds.REWARDED);

rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
  console.log('User earned reward:', reward);
  // Kullanıcıya ödül ver (ekstra can, ipucu vb.)
});

rewarded.load();
```

### Önerilen Reklam Stratejisi

1. **Banner**: Oyun ekranı altında (her zaman görünür)
2. **Interstitial**: Her 3 oyunda bir (game over sonrası)
3. **Rewarded**: 
   - Ekstra blok almak için
   - Oyuna devam etmek için
   - 2x puan için

### Tahmini Gelir
- Türkiye için ortalama eCPM: $0.50 - $2.00
- 1000 gösterim = ~$0.50 - $2.00
- Günlük 10,000 aktif kullanıcı = ~$50-200/ay

---

## 5️⃣ GEREKLİ GÖRSELLER

### Android

| Görsel | Boyut | Format |
|--------|-------|--------|
| App Icon | 512x512 | PNG |
| Feature Graphic | 1024x500 | PNG/JPEG |
| Phone Screenshots | 1080x1920 | PNG/JPEG |
| Tablet Screenshots | 1920x1200 | PNG/JPEG |

### iOS

| Görsel | Boyut | Format |
|--------|-------|--------|
| App Icon | 1024x1024 | PNG |
| iPhone 6.7" | 1290x2796 | PNG/JPEG |
| iPhone 6.5" | 1284x2778 | PNG/JPEG |
| iPad Pro | 2048x2732 | PNG/JPEG |

---

## ✅ KONTROL LİSTESİ

### Yayın Öncesi
- [ ] Uygulama ikonları hazır
- [ ] Ekran görüntüleri hazır
- [ ] Store açıklamaları yazıldı
- [ ] Gizlilik politikası URL'si hazır
- [ ] Test edildi (tüm özellikler çalışıyor)

### Google Play
- [ ] Play Console hesabı açıldı (25$)
- [ ] AAB dosyası oluşturuldu
- [ ] Store listing tamamlandı
- [ ] Content rating anketi dolduruldu
- [ ] Yayınlandı

### App Store
- [ ] Developer hesabı açıldı (99$/yıl)
- [ ] IPA dosyası oluşturuldu
- [ ] App Store Connect bilgileri dolduruldu
- [ ] TestFlight testi yapıldı
- [ ] Yayınlandı

### Reklam
- [ ] AdMob hesabı açıldı
- [ ] Ad Unit ID'leri alındı
- [ ] Reklam entegrasyonu yapıldı
- [ ] Test reklamları çalışıyor

---

## 🔗 FAYDALI LİNKLER

- Expo EAS Docs: https://docs.expo.dev/build/introduction/
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com
- AdMob: https://admob.google.com
- Privacy Policy Generator: https://app-privacy-policy-generator.firebaseapp.com/

---

**Not:** Bu rehber genel bilgiler içermektedir. Mağaza politikaları değişebilir, güncel bilgiler için resmi dokümantasyonları kontrol edin.
