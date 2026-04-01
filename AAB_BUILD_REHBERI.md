# 🚀 Android AAB Build Rehberi - Adım Adım

Bu rehber, Puzzle Master Blast uygulamasını Google Play Store'a yüklemek için AAB (Android App Bundle) dosyası oluşturmanıza yardımcı olacaktır.

---

## 📋 Ön Gereksinimler

1. **Node.js** (v18 veya üzeri)
2. **npm** veya **yarn**
3. **Expo hesabı** (expo.dev'de ücretsiz oluşturabilirsiniz)
4. **EAS CLI** yüklü olmalı

---

## 🔧 Adım 1: Projeyi İndirme

1. Emergent platformunda sağ üstteki **"Download Project"** butonuna tıklayın
2. ZIP dosyasını indirin
3. ZIP'i çıkarın: `C:\Projects\puzzle-master-blast` (OneDrive dışında bir klasöre!)

---

## 🔧 Adım 2: Terminal Açma ve Klasöre Gitme

Windows PowerShell veya Command Prompt açın:

```bash
cd C:\Projects\puzzle-master-blast\frontend
```

**ÖNEMLİ:** `frontend` klasörünün içinde olduğunuzdan emin olun! `package.json` bu klasörde olmalı.

Kontrol etmek için:
```bash
dir package.json
```
Bu komut `package.json` dosyasını göstermelidir.

---

## 🔧 Adım 3: Bağımlılıkları Yükleme

```bash
npm install
```

Veya yarn tercih ederseniz:
```bash
yarn install
```

---

## 🔧 Adım 4: EAS CLI Kurulumu

```bash
npm install -g eas-cli
```

---

## 🔧 Adım 5: Expo'ya Giriş

```bash
npx eas login
```

Expo hesap bilgilerinizi girin (veya yeni hesap oluşturun).

---

## 🔧 Adım 6: Proje Yapılandırması Kontrolü

`app.json` dosyasının doğru ayarlandığından emin olun:

```json
{
  "expo": {
    "name": "Puzzle Master Blast",
    "slug": "puzzle-master-blast",
    "version": "1.2.0",
    "android": {
      "package": "com.puzzlemaster.blastgame",
      "versionCode": 3,
      "permissions": [
        "INTERNET",
        "com.android.vending.BILLING"
      ]
    }
  }
}
```

`eas.json` dosyası:
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./play-store-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 🔧 Adım 7: EAS Projesini Başlatma (İlk kez)

```bash
npx eas init
```

veya

```bash
npx eas build:configure
```

Bu komut projenizi Expo sunucularına bağlar.

---

## 🔧 Adım 8: AAB Build Başlatma

```bash
npx eas build --platform android --profile production
```

**Build Süreci:**
1. Expo sunucularına kodunuz yüklenir
2. Bulutta build işlemi başlar (5-15 dakika sürebilir)
3. Build tamamlandığında indirme linki verilir

---

## 🔧 Adım 9: AAB Dosyasını İndirme

Build tamamlandığında terminalde bir link görünür:

```
✔ Build finished
🔗 https://expo.dev/accounts/YOUR_ACCOUNT/projects/puzzle-master-blast/builds/XXXX
```

1. Bu linke tıklayın
2. Expo dashboard'da **"Download"** butonuna tıklayın
3. `.aab` dosyası indirilecek

---

## 📱 Adım 10: Google Play Console'a Yükleme

1. [Google Play Console](https://play.google.com/console) açın
2. Uygulamanıza gidin
3. **"Sürüm"** > **"Üretim"** (veya dahili test)
4. **"Yeni sürüm oluştur"** tıklayın
5. AAB dosyasını sürükleyip bırakın
6. Sürüm notlarını yazın
7. **"İncele ve yayınla"** tıklayın

---

## ⚠️ Sık Karşılaşılan Hatalar ve Çözümleri

### Hata: "ENOENT: no such file or directory, open 'package.json'"
**Çözüm:** Yanlış klasördesiniz. `cd frontend` komutuyla frontend klasörüne gidin.

### Hata: "Git not found"
**Çözüm:** Git yükleyin veya şu komutu kullanın:
```bash
$env:EAS_NO_VCS=1; npx eas build --platform android
```

### Hata: "Error: connect ECONNREFUSED"
**Çözüm:** İnternet bağlantınızı kontrol edin ve tekrar deneyin.

### Hata: "Version code already exists"
**Çözüm:** `app.json`'daki `android.versionCode` değerini artırın (örn: 3 → 4).

---

## 📝 IAP Ürünlerini Google Play'de Tanımlama

Build sonrası Google Play Console'da:

1. **"Para kazanma"** > **"Ürünler"** > **"Uygulama içi ürünler"**
2. Şu ürünleri oluşturun:
   - `coins_500` - ₺19.99
   - `coins_1200` - ₺39.99
   - `coins_3000` - ₺79.99
   - `coins_8000` - ₺149.99

3. **"Abonelikler"** bölümünde:
   - `vip_monthly` - ₺149.99/ay

---

## ✅ Build Öncesi Kontrol Listesi

- [ ] Node.js v18+ kurulu
- [ ] `cd frontend` ile doğru klasörde
- [ ] `npm install` başarılı
- [ ] `npx eas login` ile giriş yapıldı
- [ ] `app.json` ve `eas.json` doğru yapılandırıldı
- [ ] İnternet bağlantısı aktif

---

## 📞 Yardım

Sorun yaşarsanız:
1. Hata mesajının tamamını kopyalayın
2. Hangi adımda olduğunuzu belirtin
3. Terminaldeki çıktıyı paylaşın

İyi şanslar! 🎮
