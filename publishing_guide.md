# Puzzle Master Blast - Yayinlama ve Monetizasyon Rehberi

Bu rehber, Puzzle Master Blast uygulamanizi Google Play Store ve Apple App Store'a nasil yukleyeceginizi ve Google AdMob ile nasil para kazanacaginizi adim adim anlatmaktadir.

---

## Icindekiler

1. [Gerekli Hesaplar](#1-gerekli-hesaplar)
2. [EAS Build Kurulumu](#2-eas-build-kurulumu)
3. [Android - Google Play Store](#3-android---google-play-store)
4. [iOS - Apple App Store](#4-ios---apple-app-store)
5. [Google AdMob Ayarlari](#5-google-admob-ayarlari)
6. [Production Build Olusturma](#6-production-build-olusturma)
7. [Sorun Giderme](#7-sorun-giderme)

---

## 1. Gerekli Hesaplar

Uygulamanizi yayinlamak icin asagidaki hesaplara ihtiyaciniz var:

### Expo Hesabi (Ucretsiz)
- https://expo.dev adresine gidin
- "Sign Up" ile ucretsiz hesap olusturun
- Hesabinizi dogrulayin

### Google Play Console (25 USD - Tek Seferlik)
- https://play.google.com/console adresine gidin
- Google hesabinizla giris yapin
- 25 USD kayit ucretini odeyin
- Gelistirici profilinizi tamamlayin

### Apple Developer Program (99 USD/Yil)
- https://developer.apple.com/programs adresine gidin
- Apple ID ile giris yapin
- "Enroll" butonuna tiklayin
- 99 USD yillik ucreti odeyin
- Kimlik dogrulamasini tamamlayin (1-2 gun surebilir)

### Google AdMob Hesabi (Ucretsiz)
- https://admob.google.com adresine gidin
- Google hesabinizla giris yapin
- AdMob kosullarini kabul edin

---

## 2. EAS Build Kurulumu

EAS (Expo Application Services), uygulamanizi bulutta derleyerek .apk (Android) ve .ipa (iOS) dosyalari olusturur.

### Adim 1: EAS CLI Kurulumu
```bash
npm install -g eas-cli
```

### Adim 2: Expo Hesabina Giris
```bash
eas login
```

### Adim 3: Proje Yapilandirmasi
```bash
cd /app/frontend
eas build:configure
```

Bu komut, `eas.json` dosyasini olusturacaktir.

### Adim 4: eas.json Dosyasini Duzenleyin
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
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 3. Android - Google Play Store

### Adim 1: Production APK/AAB Olusturun
```bash
eas build --platform android --profile production
```
Bu islem 10-20 dakika surebilir. Tamamlandiginda .aab dosyasi indirilecektir.

### Adim 2: Google Play Console'da Uygulama Olusturun
1. https://play.google.com/console adresine gidin
2. "Uygulama olustur" butonuna tiklayin
3. Uygulama adini girin: "Puzzle Master Blast"
4. Varsayilan dil: Turkce
5. Uygulama turu: Oyun > Bulmaca
6. Ucretsiz veya ucretli: Ucretsiz

### Adim 3: Magaza Listesini Doldurun
- **Kisa aciklama** (80 karakter):
  ```
  Renkli bloklar, heyecan verici bulmacalar! Block Blast tarzinda bagimlilik yapici oyun.
  ```

- **Tam aciklama** (4000 karakter):
  ```
  Puzzle Master Blast, klasik blok bulmaca oyunlarinin en eglenceli hali!
  
  OYUN OZELLIKLERI:
  - 10x10 izgara uzerinde strateji
  - Renkli ve 3D efektli bloklar
  - Combo sistemi ile ekstra puanlar
  - Klasik ve zamanli oyun modlari
  - Cok oyunculu online mod
  - Gunluk gorevler ve oduller
  - Dunya capinda liderlik tablosu
  
  NASIL OYNANIR:
  1. Bloklari izgaraya yerlestirin
  2. Tam satirlari veya sutunlari temizleyin
  3. Combo yaparak bonus puanlar kazanin
  4. En yuksek skoru elde edin!
  
  Ailece oynamaya uygun, bagimlilik yapici bulmaca deneyimi!
  ```

### Adim 4: Gorselleri Yukleyin
Google Play Store icin gerekli gorseller:
- **Uygulama simgesi**: 512x512 PNG
- **Ozellik gorseli**: 1024x500 PNG
- **Ekran goruntuleri**: En az 2 adet (telefon icin)
  - Boyut: 1080x1920 veya 1920x1080

### Adim 5: Icerik Derecelendirmesi
1. "Icerik derecelendirmesi" bolumune gidin
2. Anketi doldurun (siddet yok, kumar yok, vb.)
3. PEGI veya IARC derecenizi alin

### Adim 6: Reklam Beyani
1. "Uygulama icerigi" > "Reklamlar" bolumune gidin
2. "Evet, uygulamam reklam iceriyor" secin

### Adim 7: AAB Dosyasini Yukleyin
1. "Yayinla" > "Production" bolumune gidin
2. "Yeni surum olustur" tiklayin
3. .aab dosyasini yukleyin
4. Surum notlarini ekleyin
5. "Incelemeye gonder" tiklayin

### Inceleme Suresi
Google Play incelemesi genellikle 1-7 gun surer.

---

## 4. iOS - Apple App Store

### Adim 1: Apple Developer Hesabinizi Dogrulayin
Apple Developer Program'a kayit sonrasi 24-48 saat icerisinde hesabiniz aktif olacaktir.

### Adim 2: App Store Connect'te Uygulama Olusturun
1. https://appstoreconnect.apple.com adresine gidin
2. "My Apps" > "+" > "New App" tiklayin
3. Bilgileri doldurun:
   - Platform: iOS
   - Name: Puzzle Master Blast
   - Primary Language: Turkish
   - Bundle ID: com.puzzlemasterblast.app
   - SKU: puzzlemasterblast001

### Adim 3: Production IPA Olusturun
```bash
eas build --platform ios --profile production
```
Not: iOS build icin Apple Developer hesabi gereklidir.

### Adim 4: App Store Listesini Doldurun
- **Subtitle** (30 karakter):
  ```
  Block Bulmaca Oyunu
  ```

- **Promotional Text** (170 karakter):
  ```
  Yeni guncelleme! Cok oyunculu mod artik aktif. Arkadaslarinla yarisarak en yuksek skoru elde et!
  ```

- **Description** (4000 karakter):
  Android icin yazilan tam aciklama ile ayni.

- **Keywords** (100 karakter):
  ```
  bulmaca,block,blast,puzzle,oyun,tetris,zeka,strateji,match,blok
  ```

### Adim 5: Ekran Goruntuleri
App Store icin gerekli ekran goruntuleri:
- **iPhone 6.7"**: 1290x2796 (iPhone 15 Pro Max)
- **iPhone 6.5"**: 1284x2778 (iPhone 14 Pro Max)
- **iPad Pro 12.9"**: 2048x2732

### Adim 6: Yas Derecelendirmesi
1. "App Information" > "Content Rights" bolumune gidin
2. Yas derecelendirme anketini doldurun
3. 4+ derecesi almaniz bekleniyor

### Adim 7: Uygulama Gizlilik Politikasi
Apple, gizlilik politikasi URL'si zorunlu kilar:
1. Basit bir gizlilik politikasi sayfasi olusturun
2. URL'yi App Store Connect'e ekleyin

Ornek gizlilik politikasi icerigi:
```
Puzzle Master Blast Gizlilik Politikasi

Bu uygulama, kullanici deneyimini iyilestirmek ve reklam gostermek icin 
Google AdMob kullanmaktadir. AdMob, kisisellestirilmis reklamlar icin 
cihaz bilgilerini ve reklam kimliklerini toplayabilir.

Toplanan veriler:
- Cihaz turu ve isletim sistemi
- Reklam kimligi (IDFA/GAID)
- Oyun istatistikleri (yerel olarak saklanir)

Verileriniz ucuncu taraflarla paylasilmaz (reklam aglari haric).

Iletisim: [email adresiniz]
```

### Adim 8: IPA Dosyasini Yukleyin
```bash
eas submit --platform ios --latest
```
Bu komut, en son build'i otomatik olarak App Store Connect'e yukler.

### Inceleme Suresi
Apple incelemesi genellikle 1-3 gun surer.

---

## 5. Google AdMob Ayarlari

### Adim 1: AdMob'da Uygulamalari Olusturun

#### Android Uygulamasi:
1. https://admob.google.com adresine gidin
2. "Apps" > "Add app" tiklayin
3. Platform: Android
4. "Is your app listed on a supported app store?" > Hayir (henuz yayinlanmadi)
5. App name: Puzzle Master Blast
6. Not: Uygulama yayinlandiktan sonra magaza baglantisini ekleyin

#### iOS Uygulamasi:
Ayni adimlari iOS icin tekrarlayin.

### Adim 2: Reklam Birimleri Olusturun

Her platform icin asagidaki reklam birimlerini olusturun:

#### Banner Reklami:
1. "Ad units" > "Add ad unit" > "Banner"
2. Ad unit name: "GameScreen_Banner"
3. "Create ad unit" tiklayin
4. Ad Unit ID'yi not edin

#### Interstitial Reklami:
1. "Ad units" > "Add ad unit" > "Interstitial"
2. Ad unit name: "GameOver_Interstitial"
3. "Create ad unit" tiklayin
4. Ad Unit ID'yi not edin

### Adim 3: App ID ve Ad Unit ID'leri Guncelleyin

`/app/frontend/app.json` dosyasinda:
```json
{
  "plugins": [
    [
      "react-native-google-mobile-ads",
      {
        "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY",
        "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ"
      }
    ]
  ],
  "android": {
    "config": {
      "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"
    }
  },
  "ios": {
    "config": {
      "googleMobileAdsAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ"
    }
  }
}
```

`/app/frontend/src/config/admobConfig.ts` dosyasinda:
```typescript
const PRODUCTION_IDS = {
  android: {
    APP_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
    BANNER: 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ID',
    INTERSTITIAL: 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID',
  },
  ios: {
    APP_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ',
    BANNER: 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ID',
    INTERSTITIAL: 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID',
  },
};
```

### Adim 4: Odeme Bilgilerini Ekleyin
1. AdMob'da "Payments" bolumune gidin
2. Banka hesabi veya odeme yontemi ekleyin
3. Vergi bilgilerini doldurun (Turkiye icin)

### Adim 5: Reklam Politikalarina Uyun
- Kendi reklamlariniza tiklamayin
- Kullanicilari reklam tiklamaya tesvik etmeyin
- Reklamlari oyun iceriginden ayirt edilebilir tutun

---

## 6. Production Build Olusturma

### Son Kontrol Listesi

Production build olusturmadan once:

- [ ] AdMob App ID'leri gercek ID'lerle degistirildi
- [ ] AdMob Ad Unit ID'leri gercek ID'lerle degistirildi
- [ ] `app.json` dosyasinda version ve versionCode guncellendi
- [ ] Gizlilik politikasi URL'si eklendi
- [ ] Test reklamlari kapatildi (isDev = false)

### Android Production Build
```bash
cd /app/frontend
eas build --platform android --profile production
```

### iOS Production Build
```bash
cd /app/frontend
eas build --platform ios --profile production
```

### Her Iki Platform
```bash
eas build --platform all --profile production
```

### Otomatik Submit
```bash
# Android
eas submit --platform android --latest

# iOS
eas submit --platform ios --latest
```

---

## 7. Sorun Giderme

### "AdMob App ID missing" Hatasi
- `app.json` dosyasinda `googleMobileAdsAppId` degerinin dogru ayarlandigindan emin olun
- Plugin yapilandirmasini kontrol edin

### "No fill" - Reklam Gosterilmiyor
- Yeni hesaplarda reklamlar 24-48 saat sonra gosterilmeye baslar
- Test cihazi olarak kayitli degilseniz test ID'lerini kullanin
- Internet baglantisini kontrol edin

### iOS Build Hatasi
- Apple Developer hesabinizin aktif oldugundan emin olun
- Provisioning profile'larin dogru ayarlandigindan emin olun
- `eas credentials` komutu ile sertifikalari kontrol edin

### Android Build Hatasi
- JDK 17 gereklidir (EAS Build otomatik saglar)
- `eas.json` dosyasinin dogru formatta oldugundan emin olun

### Interstitial Reklam Gosterilmiyor
- Minimum sure araligi (1 dakika) gectiginden emin olun
- Reklamin onceden yuklendiginden emin olun
- Console loglarini kontrol edin

---

## Faydali Linkler

- Expo Documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com
- Google AdMob: https://admob.google.com
- AdMob Policies: https://support.google.com/admob/answer/6128543

---

## Destek

Sorulariniz icin:
- Expo Discord: https://chat.expo.dev
- Stack Overflow: expo, react-native etiketleri

---

Basarilar! Uygulamanizi milyonlarca kullaniciya ulastirin!
