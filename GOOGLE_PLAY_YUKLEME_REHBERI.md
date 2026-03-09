# Puzzle Master Blast - Google Play Store Yükleme Rehberi

## 📱 Uygulama Özellikleri

**Oyun Modları:**
- ✅ Klasik Mod (Çevrimdışı çalışır)
- ✅ Zamanlı Mod (Çevrimdışı çalışır)
- ✅ Çok Oyunculu Mod (Online)
- ✅ Haftalık Turnuva (Online)

**Özellikler:**
- 🎨 10+ Blok Teması
- ⚡ 4 Power-up
- 🎁 Günlük Ödüller
- 📊 Liderlik Tablosu
- 📱 Reklam Entegrasyonu (AdMob)

---

## 🚀 Adım Adım Yükleme

### Adım 1: Gerekli Hesaplar

1. **Expo Hesabı** (Ücretsiz)
   - https://expo.dev adresinden kayıt ol
   
2. **Google Play Console** ($25 tek seferlik)
   - https://play.google.com/console
   - Developer hesabı oluştur

3. **AdMob Hesabı** (Ücretsiz - Zaten hazır)
   - https://admob.google.com
   - Production ID'lerin entegre edildi ✅

---

### Adım 2: EAS Build Kurulumu

Terminal'de şu komutları çalıştır:

```bash
# 1. EAS CLI yükle
npm install -g eas-cli

# 2. Expo'ya giriş yap
eas login

# 3. Proje klasörüne git
cd frontend

# 4. EAS projesi oluştur
eas build:configure
```

**ÖNEMLİ:** `eas build:configure` çalıştırınca:
- Expo hesabındaki kullanıcı adını `app.json` > `owner` alanına yaz
- Oluşan Project ID'yi `app.json` > `extra` > `eas` > `projectId` alanına yaz

---

### Adım 3: APK/AAB Build

**Test için APK:**
```bash
eas build --platform android --profile preview
```

**Google Play için AAB:**
```bash
eas build --platform android --profile production
```

Build tamamlandıktan sonra Expo Dashboard'dan indirebilirsin.

---

### Adım 4: Google Play Console

1. **Yeni Uygulama Oluştur**
   - Google Play Console'a gir
   - "Uygulama oluştur" tıkla
   - Uygulama adı: "Puzzle Master Blast"
   - Varsayılan dil: Türkçe
   - Oyun seç

2. **Store Listing**
   - **Kısa Açıklama (80 karakter):**
     ```
     Bağımlılık yapan blok bulmaca oyunu! Klasik mod çevrimdışı oynanır.
     ```
   
   - **Tam Açıklama:**
     ```
     PUZZLE MASTER BLAST - Bağımlılık Yapan Blok Bulmaca Oyunu!
     
     🎮 OYUN MODLARI
     • Klasik Mod - Süresiz oyna, yüksek skor kır! (Çevrimdışı çalışır)
     • Zamanlı Mod - 3 dakikada en yüksek puanı topla!
     • Çok Oyunculu - Arkadaşlarınla yarış!
     • Haftalık Turnuva - Büyük ödüller kazan!
     
     ⚡ ÖZELLİKLER
     • 10+ farklı blok teması
     • Güçlü power-up'lar: Bomba, Karıştır, Satır Temizle
     • Günlük ödül sistemi
     • Liderlik tablosu
     • Pürüzsüz animasyonlar
     
     🏆 NEDEN BU OYUN?
     • İnternet olmadan da oynayabilirsin
     • Tüm veriler cihazında saklanır
     • Reklam izleyerek bonus kazan
     • Tamamen Türkçe arayüz
     
     Şimdi indir, bulmaca ustası ol!
     ```

3. **Ekran Görüntüleri**
   - En az 2 telefon ekran görüntüsü
   - Oyun ekranı, ana menü, turnuva ekranı önerilir

4. **Uygulama İkonu**
   - 512x512 PNG ikon gerekli
   - `/app/frontend/assets/images/icon.png` kullanılabilir

5. **Feature Graphic**
   - 1024x500 banner resmi
   - Opsiyonel ama önerilir

---

### Adım 5: Release

1. "Production" sekmesine git
2. "Yeni sürüm oluştur" tıkla
3. AAB dosyasını yükle
4. Sürüm notları ekle:
   ```
   Puzzle Master Blast v1.0.0
   
   • 4 farklı oyun modu
   • Çevrimdışı oynanabilir klasik mod
   • 10+ blok teması
   • Günlük ödüller ve power-up'lar
   ```
5. "İncelemeye gönder" tıkla

---

## 💰 AdMob Entegrasyonu

AdMob ID'lerin zaten entegre edildi:

| Tip | Android ID |
|-----|------------|
| App ID | ca-app-pub-1839067347385099~5884338608 |
| Banner | ca-app-pub-1839067347385099/8155148652 |
| Interstitial | ca-app-pub-1839067347385099/3846893818 |
| Rewarded | ca-app-pub-1839067347385099/6823376012 |

---

## 🔧 Sorun Giderme

**Build hatası alıyorum:**
```bash
# Cache temizle
rm -rf node_modules
yarn install
eas build --platform android --profile production --clear-cache
```

**AdMob çalışmıyor:**
- Web preview'da reklamlar MOCK'tur
- Gerçek reklamlar sadece native build'de çalışır
- app.json'daki AdMob App ID'nin doğru olduğundan emin ol

**Oyun çevrimdışı açılmıyor:**
- İlk açılışta internet gerekli (store yüklemesi)
- Sonraki açılışlarda Klasik/Zamanlı mod çevrimdışı çalışır

---

## ✅ Kontrol Listesi

- [ ] Expo hesabı oluşturuldu
- [ ] Google Play Console hesabı açıldı ($25)
- [ ] `eas build:configure` çalıştırıldı
- [ ] app.json'da owner ve projectId güncellendi
- [ ] Production build alındı
- [ ] Store listing dolduruldu
- [ ] Ekran görüntüleri yüklendi
- [ ] İncelemeye gönderildi

---

## 📞 Yardım

Sorun yaşarsan:
- Expo Docs: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- Google Play Console Yardım: https://support.google.com/googleplay/android-developer

**Tahmini İnceleme Süresi:** 1-3 iş günü
