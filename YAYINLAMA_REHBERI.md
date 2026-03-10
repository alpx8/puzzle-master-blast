# Puzzle Master Blast - Google Play Store Yayınlama Rehberi

## MEVCUT DURUM
- AdMob App ID: `ca-app-pub-1839067347385099~5884338608` ✅
- AdMob reklam ID'leri yapılandırıldı ✅
- Google Play Console hesabı var (onay bekleniyor)

---

## ADIM 1: EXPO HESABI KURULUMU

### 1.1 Expo CLI Kurulumu (Bilgisayarınızda)
```bash
npm install -g eas-cli
```

### 1.2 Expo'ya Giriş
```bash
eas login
```
- Expo hesabınız yoksa: https://expo.dev/signup adresinden oluşturun

### 1.3 Projeyi Expo'ya Bağlama
```bash
cd /app/frontend
eas init
```
Bu komut size bir `projectId` verecek.

---

## ADIM 2: APP.JSON GÜNCELLEMESİ

Expo'dan aldığınız bilgileri `app.json` dosyasına ekleyin:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "BURAYA_EXPO_PROJECT_ID_GELECEK"
      }
    },
    "owner": "EXPO_KULLANICI_ADINIZ",
    "updates": {
      "url": "https://u.expo.dev/BURAYA_EXPO_PROJECT_ID_GELECEK"
    }
  }
}
```

---

## ADIM 3: GOOGLE PLAY CONSOLE HAZIRLIĞI

### 3.1 Service Account Oluşturma (Otomatik Yükleme İçin)

1. Google Cloud Console'a gidin: https://console.cloud.google.com
2. Yeni proje oluşturun veya mevcut projeyi seçin
3. "APIs & Services" > "Credentials" bölümüne gidin
4. "Create Credentials" > "Service Account" seçin
5. İsim verin: `puzzle-master-blast-deploy`
6. Role: "Editor" seçin
7. JSON key indirin ve `google-service-account.json` olarak kaydedin

### 3.2 Google Play Console'da Service Account Yetkilendirme

1. Google Play Console: https://play.google.com/console
2. "Users and Permissions" > "Invite New Users" 
3. Service account email'ini ekleyin (JSON dosyasındaki `client_email`)
4. Yetki: "Release Manager" verin

---

## ADIM 4: UYGULAMA BUILD ETME

### 4.1 Production Build (AAB - Google Play için)
```bash
cd /app/frontend
eas build --platform android --profile production
```

Bu işlem 10-20 dakika sürebilir. Sonunda `.aab` dosyası oluşacak.

### 4.2 Build Durumunu Kontrol
```bash
eas build:list
```

---

## ADIM 5: GOOGLE PLAY STORE'A YÜKLEME

### Seçenek A: Manuel Yükleme (Önerilen - İlk Yükleme)

1. Build tamamlandığında, Expo'dan `.aab` dosyasını indirin
2. Google Play Console'a gidin
3. "All apps" > "Create app" (ilk kez ise)
4. Uygulama bilgilerini doldurun:
   - App name: `Puzzle Master Blast`
   - Default language: Turkish
   - App or game: Game
   - Free or paid: Free
5. "Production" > "Create new release"
6. `.aab` dosyasını yükleyin
7. Release notes ekleyin

### Seçenek B: EAS Submit ile Otomatik Yükleme
```bash
eas submit --platform android --profile production
```
(Service account JSON dosyası gerekli)

---

## ADIM 6: GOOGLE PLAY STORE LİSTESİ

### 6.1 Store Listing (Mağaza Sayfası)

**Uygulama Adı:** Puzzle Master Blast

**Kısa Açıklama (80 karakter):**
```
Renkli blokları yerleştir, satırları temizle ve en yüksek skoru yap!
```

**Tam Açıklama:**
```
Puzzle Master Blast, bağımlılık yapan bir blok bulmaca oyunudur!

NASIL OYNANIR?
- Blokları 8x8 tahtaya yerleştir
- Tam satır veya sütunları temizle
- Combo yap ve puanını katla!

ÖZELLİKLER:
★ Klasik Mod - Süresiz rahat oyun
★ Zamanlı Mod - 3 dakikada en yüksek skor
★ Çok Oyunculu - Arkadaşlarınla yarış
★ Turnuva Modu - Haftalık ödüller kazan

POWER-UPS:
💣 Bomba - 3x3 alan temizle
🔀 Karıştır - Yeni bloklar al
⏱️ Ekstra Süre - +30 saniye

EĞLENCELİ ÖZELLİKLER:
✓ Günlük ödüller
✓ 10+ farklı tema
✓ Liderlik tablosu
✓ Çevrimdışı oynanabilir

Şimdi indir ve bulmaca ustası ol!
```

### 6.2 Görsel Materyaller

**Gerekli görseller:**
- App Icon: 512x512 px (PNG)
- Feature Graphic: 1024x500 px
- Screenshots: En az 2 adet (telefon boyutu)
- Phone Screenshots: 1080x1920 px (önerilen)

### 6.3 Kategoriler
- Primary: Games > Puzzle
- Tags: Puzzle, Casual, Offline, Block

---

## ADIM 7: ADMOB DOĞRULAMA

AdMob'un çalışması için:

1. AdMob Console: https://admob.google.com
2. "Apps" > Uygulamanızı seçin
3. "App settings" kontrol edin
4. Package name: `com.puzzlemasterblast.app` olmalı

**Mevcut Reklam Birimleri:**
| Tür | ID |
|-----|-----|
| Banner | ca-app-pub-1839067347385099/9432013010 |
| Interstitial | ca-app-pub-1839067347385099/9240441320 |
| Rewarded | ca-app-pub-1839067347385099/2216556334 |
| App Open | ca-app-pub-1839067347385099/5109624621 |

---

## ADIM 8: YAYINLAMA KONTROLÜ

Google Play Console'da yayınlamadan önce kontrol listesi:

- [ ] Store listing tamamlandı
- [ ] Content rating anketi dolduruldu
- [ ] Target audience seçildi
- [ ] Privacy policy URL eklendi
- [ ] App icon yüklendi
- [ ] Feature graphic yüklendi
- [ ] En az 2 screenshot yüklendi
- [ ] AAB dosyası yüklendi

---

## SIKÇA SORULAN SORULAR

**S: Build ne kadar sürer?**
C: İlk build 15-25 dakika, sonrakiler 10-15 dakika

**S: AdMob reklamları ne zaman görünür?**
C: Production build'de otomatik görünür. İlk reklamlar için 1-24 saat bekleyebilirsiniz.

**S: Google Play onayı ne kadar sürer?**
C: İlk uygulama için 3-7 gün, güncellemeler için 1-3 gün

---

## YARDIM

Herhangi bir adımda takılırsanız bana sorun!
