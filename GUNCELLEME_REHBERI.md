# 🚀 Google Play Güncelleme ve IAP Rehberi

## ✅ TAMAMLANAN İŞLEMLER

1. ✅ `react-native-iap` kütüphanesi kuruldu
2. ✅ `app.json` güncellendi:
   - `version`: 1.0.0 → **1.1.0**
   - `versionCode`: 1 → **2**
   - `react-native-iap` plugin eklendi
   - `kotlinVersion`: 2.1.20 ayarlandı
3. ✅ `coinShopStore.ts` gerçek IAP ile güncellendi

---

## BÖLÜM 1: Yeni Sürümü Yayınlama (AAB Güncelleme)

### Adım 1: Versiyon Numarasını Artır

Önce `app.json` dosyasında versiyon numaralarını artırmalısın:

```json
{
  "expo": {
    "version": "1.1.0",           // Önceki: 1.0.0 → Yeni: 1.1.0
    "android": {
      "versionCode": 2            // Önceki: 1 → Yeni: 2 (HER ZAMAN ARTMALI!)
    }
  }
}
```

⚠️ **ÖNEMLİ:** `versionCode` her yüklemede mutlaka artmalı! Google Play aynı veya düşük versionCode kabul etmez.

---

### Adım 2: Yeni AAB Dosyasını Oluştur

```bash
cd frontend

# EAS'a giriş yap
npx eas login

# Production build oluştur
npx eas build --platform android --profile production
```

Build tamamlandığında Expo dashboard'dan veya terminal'den `.aab` dosyasını indir.

---

### Adım 3: Google Play Console'a Yükle

1. **Google Play Console**'a git: https://play.google.com/console

2. **Uygulamanı seç** → Sol menüden **"Sürüm"** → **"Kapalı test"**

3. **"Yeni sürüm oluştur"** butonuna tıkla

4. **App Bundle'ı yükle** (.aab dosyası)

5. **Sürüm notları yaz** (Türkçe):
   ```
   🆕 Yenilikler v1.1.0:
   
   ⚡ Hızlı Eşleşme - Tek tuşla anında rakip bul!
   🏆 Oyun sonu ödülleri - Kazananlara coin ve XP!
   📊 Oyun geçmişi - Tüm maçlarını takip et
   🔄 Geliştirilmiş multiplayer deneyimi
   🐛 Çeşitli hata düzeltmeleri
   ```

6. **"Sürümü incele"** → **"Kapalı teste yayınla"**

---

### Adım 4: Test Et ve Production'a Geç

1. Kapalı testte sorun yoksa:
   - **"Sürüm"** → **"Production"** → **"Yeni sürüm oluştur"**
   - Aynı AAB'yi yükle veya "Kitaplıktan ekle" seç
   - İncelemeye gönder (1-3 gün sürebilir)

---

## BÖLÜM 2: Uygulama İçi Satın Alım (IAP) Kurulumu

### ⚠️ HAYIR, Otomatik Değil! Ekstra Ayar Gerekli!

Google Play Console'da ürünleri **manuel olarak tanımlamalısın**.

---

### Adım 1: Google Play Console'da Ürünleri Oluştur

1. **Google Play Console** → Uygulamanı seç

2. Sol menüden **"Para kazanma"** → **"Ürünler"** → **"Uygulama içi ürünler"**

3. **"Ürün oluştur"** butonuna tıkla

4. Her coin paketi için aşağıdaki bilgileri gir:

| Ürün Kimliği | Ad | Açıklama | Fiyat |
|--------------|-----|----------|-------|
| `coins_500` | 500 Coin | 500 altın coin paketi | ₺19.99 |
| `coins_1200` | 1200 Coin (+20% Bonus) | 1200 altın coin paketi | ₺39.99 |
| `coins_3000` | 3000 Coin (+50% Bonus) | 3000 altın coin paketi | ₺79.99 |
| `coins_8000` | 8000 Coin (+100% Bonus) | 8000 altın coin paketi | ₺149.99 |

5. Her ürün için **"Etkinleştir"** butonuna tıkla

---

### Adım 2: Uygulama Kodunu Güncelle

Şu anda kodda IAP simüle ediliyor. Gerçek IAP için `expo-in-app-purchases` veya `react-native-iap` kullanılmalı.

Mevcut kodun durumu:
- ✅ UI hazır (CoinShopModal.tsx)
- ❌ Gerçek Google Play Billing entegrasyonu YOK (simülasyon var)

---

### Adım 3: Gerçek IAP Entegrasyonu (İsteğe Bağlı)

Eğer gerçek para ile satın alım istiyorsan, şu adımları izle:

```bash
# IAP kütüphanesini kur
cd frontend
npx expo install expo-in-app-purchases
```

Sonra kodu güncellemen gerekiyor. İstersen bu entegrasyonu yapabilirim.

---

## BÖLÜM 3: Kontrol Listesi

### Güncelleme Öncesi ✅

- [ ] `versionCode` artırıldı mı?
- [ ] `version` güncellendi mi?
- [ ] Yeni AAB build edildi mi?
- [ ] Test edildi mi?

### IAP Kurulumu ✅

- [ ] Google Play Console'da ürünler oluşturuldu mu?
- [ ] Ürün ID'leri kodla eşleşiyor mu?
- [ ] Ürünler "Etkin" durumda mı?
- [ ] (Opsiyonel) Gerçek IAP kodu entegre edildi mi?

---

## 🔴 ÖNEMLİ NOTLAR

1. **Kapalı Test vs Production IAP:**
   - Kapalı testte **test satın alımları** yapabilirsin (gerçek para çekilmez)
   - Production'da **gerçek para** çekilir

2. **Test Kullanıcıları Ekle:**
   - **"Ayarlar"** → **"Lisans testi"** → Email ekle
   - Bu kullanıcılar satın alım yaparken gerçek para ödenmez

3. **IAP Olmadan Yayınlama:**
   - Şu anki haliyle yayınlayabilirsin
   - Coin mağazası çalışır ama **simülasyon** olarak (gerçek para alınmaz)
   - Daha sonra IAP ekleyebilirsin

---

## Hızlı Başlangıç Komutu

```bash
# 1. Versiyon güncelle
cd /app/frontend

# 2. app.json'da versionCode'u artır (elle yap)

# 3. Build al
npx eas build --platform android --profile production

# 4. Google Play Console'a yükle
```

---

**Sorular?** Gerçek IAP entegrasyonu yapmamı ister misin? Yoksa önce simülasyonlu versiyonu mu yayınlayalım?
