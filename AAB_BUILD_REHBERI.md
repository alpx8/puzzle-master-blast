# 🚀 PUZZLE MASTER BLAST - AAB BUILD REHBERİ

## Adım Adım Google Play Store'a Yükleme

---

## 📥 ADIM 1: Projeyi İndir

1. Emergent platformunda sağ üstteki **"Download Project"** butonuna tıkla
2. ZIP dosyasını bilgisayarına indir
3. ZIP'i çıkar → `C:\Projects\puzzle-master-blast` (OneDrive klasörü OLMAMALI!)

---

## 💻 ADIM 2: Node.js Kur (Eğer Yoksa)

1. https://nodejs.org adresine git
2. **LTS** versiyonunu indir ve kur
3. Kurulumu kontrol et:
```powershell
node --version
npm --version
```

---

## 📂 ADIM 3: Doğru Klasöre Git

PowerShell veya Command Prompt aç:

```powershell
cd C:\Projects\puzzle-master-blast\frontend
```

**ÖNEMLİ:** `package.json` dosyasının bu klasörde olduğundan emin ol:
```powershell
dir package.json
```

---

## 📦 ADIM 4: Bağımlılıkları Yükle

```powershell
npm install
```

Bu işlem 2-5 dakika sürebilir. Tamamlanana kadar bekle.

---

## 🔧 ADIM 5: EAS CLI Kur

```powershell
npm install -g eas-cli
```

---

## 🔐 ADIM 6: Expo'ya Giriş Yap

```powershell
npx eas login
```

- Expo hesabın yoksa: https://expo.dev adresinden ücretsiz oluştur
- Email ve şifreni gir

---

## 🚀 ADIM 7: Build Başlat

```powershell
npx eas build --platform android --profile production
```

**İlk seferinde sorular soracak:**
- "Would you like to automatically create an EAS project?" → **Yes**
- "Generate a new Android Keystore?" → **Yes**

Build süreci 10-20 dakika sürer (Expo sunucularında yapılır).

---

## 📲 ADIM 8: AAB Dosyasını İndir

Build bittiğinde terminalde bir link görünecek:
```
✔ Build finished
🔗 https://expo.dev/accounts/YOUR_ACCOUNT/projects/puzzle-master-blast/builds/XXXX
```

1. Bu linke tıkla
2. Expo sayfasında **"Download"** butonuna tıkla
3. `.aab` dosyası indirilecek

---

## 📱 ADIM 9: Google Play Console'a Yükle

1. https://play.google.com/console adresine git
2. Uygulamanı seç (veya yeni oluştur)
3. Sol menüden: **"Sürüm"** → **"Üretim"** (veya "Dahili test")
4. **"Yeni sürüm oluştur"** butonuna tıkla
5. AAB dosyasını sürükle ve bırak
6. Sürüm notlarını yaz (örn: "VIP üyelik ve yeni özellikler eklendi")
7. **"İncele ve yayınla"** butonuna tıkla

---

## 💰 ADIM 10: IAP Ürünlerini Tanımla

Google Play Console'da:

### Uygulama İçi Ürünler (Coin Paketleri)
**Sol menü → Para kazanma → Ürünler → Uygulama içi ürünler**

| Ürün ID | İsim | Fiyat |
|---------|------|-------|
| coins_500 | 500 Coin | ₺19.99 |
| coins_1200 | 1000+200 Coin | ₺39.99 |
| coins_3000 | 2000+1000 Coin | ₺79.99 |
| coins_8000 | 4000+4000 Coin | ₺149.99 |

### Abonelikler (VIP)
**Sol menü → Para kazanma → Abonelikler**

| Abonelik ID | İsim | Fiyat |
|-------------|------|-------|
| vip_monthly | VIP Aylık | ₺149.99/ay |

---

## ⚠️ SIK KARŞILAŞILAN HATALAR

### "ENOENT: package.json bulunamadı"
**Çözüm:** Yanlış klasördesin. `cd frontend` komutuyla frontend klasörüne git.

### "Git bulunamadı"
**Çözüm:** Bu komutu kullan:
```powershell
$env:EAS_NO_VCS=1; npx eas build --platform android --profile production
```

### "Version code zaten var"
**Çözüm:** `app.json` dosyasındaki `android.versionCode` değerini artır.

### "Network error"
**Çözüm:** İnternet bağlantını kontrol et ve tekrar dene.

---

## ✅ KONTROL LİSTESİ

Build öncesi:
- [ ] Node.js v18+ kurulu
- [ ] `cd frontend` ile doğru klasördesin
- [ ] `npm install` başarılı
- [ ] Expo hesabına giriş yapıldı

Build sonrası:
- [ ] AAB dosyası indirildi
- [ ] Google Play Console'a yüklendi
- [ ] IAP ürünleri tanımlandı

---

## 📞 SORUN MU VAR?

1. Hata mesajının tamamını kopyala
2. Hangi adımda olduğunu belirt
3. Terminal çıktısını paylaş

---

İyi şanslar! 🎮🚀
