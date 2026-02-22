# =====================================================
#  PUZZLE MASTER BLAST - PARA KAZANMA REHBERİ
#  Adım Adım Yayınlama ve Reklam Entegrasyonu
# =====================================================

Bu rehber, uygulamanı mağazalara yükleyip para kazanmaya başlaman için 
gereken TÜM adımları içeriyor. Sırayla takip et.

═══════════════════════════════════════════════════════════════════
 BÖLÜM 1: HESAP OLUŞTURMA (İLK YAPILACAK)
═══════════════════════════════════════════════════════════════════

## 1.1 Expo Hesabı (ÜCRETSİZ - 5 dakika)
┌─────────────────────────────────────────────────────────────────┐
│  1. https://expo.dev adresine git                               │
│  2. "Sign Up" tıkla                                             │
│  3. Email ile kayıt ol                                          │
│  4. Email'ini doğrula                                           │
│  ✓ Tamamlandı!                                                  │
└─────────────────────────────────────────────────────────────────┘

## 1.2 Google Play Console (25 USD - TEK SEFERLİK)
┌─────────────────────────────────────────────────────────────────┐
│  1. https://play.google.com/console adresine git                │
│  2. Google hesabınla giriş yap                                  │
│  3. "Başlayın" butonuna tıkla                                   │
│  4. 25 USD ödeme yap (kredi kartı/PayPal)                       │
│  5. Geliştirici bilgilerini doldur                              │
│  6. Kimlik doğrulama yap (1-2 gün sürebilir)                   │
│  ✓ Tamamlandı!                                                  │
└─────────────────────────────────────────────────────────────────┘

## 1.3 Apple Developer Program (99 USD/YIL)
┌─────────────────────────────────────────────────────────────────┐
│  1. https://developer.apple.com/programs adresine git           │
│  2. Apple ID ile giriş yap (yoksa oluştur)                      │
│  3. "Enroll" butonuna tıkla                                     │
│  4. Bireysel veya Şirket seç (Bireysel daha kolay)              │
│  5. 99 USD yıllık ücreti öde                                    │
│  6. Kimlik doğrulama tamamla (24-48 saat)                       │
│  ✓ Tamamlandı!                                                  │
└─────────────────────────────────────────────────────────────────┘

## 1.4 Google AdMob Hesabı (ÜCRETSİZ)
┌─────────────────────────────────────────────────────────────────┐
│  1. https://admob.google.com adresine git                       │
│  2. Google hesabınla giriş yap                                  │
│  3. Koşulları kabul et                                          │
│  4. Ödeme bilgilerini daha sonra ekleyeceksin                   │
│  ✓ Tamamlandı!                                                  │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
 BÖLÜM 2: ADMOB REKLAM AYARLARI (PARA KAZANMA)
═══════════════════════════════════════════════════════════════════

## 2.1 Android Uygulaması Oluştur
┌─────────────────────────────────────────────────────────────────┐
│  AdMob'da:                                                       │
│  1. Sol menüden "Apps" > "Add app" tıkla                        │
│  2. Platform: "Android" seç                                      │
│  3. "No" seç (henüz yayınlanmadı)                               │
│  4. App name: "Puzzle Master Blast" yaz                         │
│  5. "Add app" tıkla                                              │
│                                                                  │
│  ⚠️ ÖNEMLI: "App ID" yi not al!                                 │
│  Örnek: ca-app-pub-1234567890123456~1234567890                  │
└─────────────────────────────────────────────────────────────────┘

## 2.2 iOS Uygulaması Oluştur
┌─────────────────────────────────────────────────────────────────┐
│  AdMob'da aynı adımları iOS için tekrarla:                      │
│  1. "Apps" > "Add app" > "iOS"                                  │
│  2. App name: "Puzzle Master Blast"                             │
│                                                                  │
│  ⚠️ ÖNEMLI: iOS "App ID" yi de not al!                          │
└─────────────────────────────────────────────────────────────────┘

## 2.3 Banner Reklam Birimi Oluştur (HER İKİ PLATFORM İÇİN)
┌─────────────────────────────────────────────────────────────────┐
│  Android uygulaması için:                                        │
│  1. Android uygulamasını seç                                     │
│  2. "Ad units" > "Add ad unit"                                  │
│  3. "Banner" seç                                                 │
│  4. Ad unit name: "GameScreen_Banner"                           │
│  5. "Create ad unit" tıkla                                       │
│                                                                  │
│  ⚠️ "Ad unit ID" yi not al!                                     │
│  Örnek: ca-app-pub-1234567890123456/1234567890                  │
│                                                                  │
│  iOS için de aynı işlemi tekrarla!                              │
└─────────────────────────────────────────────────────────────────┘

## 2.4 Interstitial Reklam Birimi Oluştur
┌─────────────────────────────────────────────────────────────────┐
│  Her iki platform için:                                          │
│  1. "Ad units" > "Add ad unit"                                  │
│  2. "Interstitial" seç                                          │
│  3. Ad unit name: "GameOver_Interstitial"                       │
│  4. "Create ad unit" tıkla                                       │
│                                                                  │
│  ⚠️ Bu ID'yi de not al!                                         │
└─────────────────────────────────────────────────────────────────┘

## 2.5 NOT EDİLECEK TÜM ID'LER
┌─────────────────────────────────────────────────────────────────┐
│  📝 ANDROID:                                                     │
│  App ID: ca-app-pub-________________~__________                 │
│  Banner ID: ca-app-pub-________________/__________              │
│  Interstitial ID: ca-app-pub-________________/__________        │
│                                                                  │
│  📝 iOS:                                                         │
│  App ID: ca-app-pub-________________~__________                 │
│  Banner ID: ca-app-pub-________________/__________              │
│  Interstitial ID: ca-app-pub-________________/__________        │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
 BÖLÜM 3: KODU GÜNCELLE (BENİ TEKRAR ÇAĞIR)
═══════════════════════════════════════════════════════════════════

AdMob ID'lerini aldıktan sonra bana geri gel ve şunu söyle:

"AdMob ID'lerimi aldım, kodları güncelle:
- Android App ID: [senin ID'n]
- Android Banner ID: [senin ID'n]  
- Android Interstitial ID: [senin ID'n]
- iOS App ID: [senin ID'n]
- iOS Banner ID: [senin ID'n]
- iOS Interstitial ID: [senin ID'n]"

Ben hepsini otomatik güncelleyeceğim.


═══════════════════════════════════════════════════════════════════
 BÖLÜM 4: UYGULAMA BUILD ETME
═══════════════════════════════════════════════════════════════════

## 4.1 Bilgisayarına Gerekli Araçları Kur
┌─────────────────────────────────────────────────────────────────┐
│  Terminal/Komut Satırında çalıştır:                             │
│                                                                  │
│  # Node.js kur (https://nodejs.org - LTS sürümü)                │
│                                                                  │
│  # EAS CLI kur                                                   │
│  npm install -g eas-cli                                          │
│                                                                  │
│  # Expo hesabına giriş yap                                       │
│  eas login                                                       │
└─────────────────────────────────────────────────────────────────┘

## 4.2 Kodu İndir
┌─────────────────────────────────────────────────────────────────┐
│  Emergent'tan kodu indir:                                        │
│  1. "Download Code" butonuna tıkla                               │
│  2. ZIP dosyasını indir                                          │
│  3. Bir klasöre çıkart                                           │
│  4. Terminal'de o klasöre git:                                   │
│     cd /indirilen/klasor/frontend                                │
└─────────────────────────────────────────────────────────────────┘

## 4.3 Android APK/AAB Oluştur
┌─────────────────────────────────────────────────────────────────┐
│  Terminal'de çalıştır:                                           │
│                                                                  │
│  cd frontend                                                     │
│  npm install                                                     │
│  eas build --platform android --profile production               │
│                                                                  │
│  ⏱️ Bu işlem 15-30 dakika sürebilir                             │
│  ✅ Bitince .aab dosyası linki verilecek                        │
└─────────────────────────────────────────────────────────────────┘

## 4.4 iOS IPA Oluştur
┌─────────────────────────────────────────────────────────────────┐
│  Terminal'de çalıştır:                                           │
│                                                                  │
│  eas build --platform ios --profile production                   │
│                                                                  │
│  ⚠️ Apple Developer hesabı gerekli                              │
│  ⏱️ Bu işlem 20-40 dakika sürebilir                             │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
 BÖLÜM 5: GOOGLE PLAY STORE'A YÜKLEME
═══════════════════════════════════════════════════════════════════

## 5.1 Play Console'da Uygulama Oluştur
┌─────────────────────────────────────────────────────────────────┐
│  1. https://play.google.com/console git                         │
│  2. "Uygulama oluştur" tıkla                                    │
│  3. Bilgileri doldur:                                            │
│     - Uygulama adı: Puzzle Master Blast                         │
│     - Varsayılan dil: Türkçe                                    │
│     - Uygulama türü: Oyun                                       │
│     - Kategori: Bulmaca                                         │
│     - Ücretsiz/Ücretli: Ücretsiz                                │
│  4. Beyanları kabul et ve "Uygulama oluştur" tıkla              │
└─────────────────────────────────────────────────────────────────┘

## 5.2 Mağaza Girişini Doldur
┌─────────────────────────────────────────────────────────────────┐
│  Sol menüden "Ana mağaza girişi" seç:                           │
│                                                                  │
│  📝 Kısa açıklama (80 karakter):                                │
│  "Renkli bloklar, heyecan verici bulmacalar! Bağımlılık yapıcı  │
│   block blast oyunu."                                            │
│                                                                  │
│  📝 Tam açıklama:                                                │
│  "Puzzle Master Blast, klasik blok bulmaca oyunlarının en       │
│   eğlenceli hali!                                                │
│                                                                  │
│   ⭐ OYUN ÖZELLİKLERİ:                                          │
│   • 10x10 ızgara üzerinde strateji                              │
│   • Renkli ve 3D efektli bloklar                                │
│   • Combo sistemi ile ekstra puanlar                            │
│   • Klasik ve zamanlı oyun modları                              │
│   • Çok oyunculu online mod                                     │
│   • Günlük görevler ve ödüller                                  │
│   • Dünya çapında liderlik tablosu                              │
│                                                                  │
│   🎮 NASIL OYNANIR:                                             │
│   1. Blokları ızgaraya yerleştirin                              │
│   2. Tam satırları veya sütunları temizleyin                    │
│   3. Combo yaparak bonus puanlar kazanın                        │
│   4. En yüksek skoru elde edin!                                 │
│                                                                  │
│   Ailece oynamaya uygun, bağımlılık yapıcı bulmaca deneyimi!"   │
└─────────────────────────────────────────────────────────────────┘

## 5.3 Görselleri Yükle
┌─────────────────────────────────────────────────────────────────┐
│  Gerekli görseller:                                              │
│                                                                  │
│  📱 Uygulama simgesi: 512x512 PNG                               │
│     (Canva veya Figma ile oluşturabilirsin)                     │
│                                                                  │
│  🖼️ Özellik görseli: 1024x500 PNG                              │
│     (Promosyon banner'ı)                                         │
│                                                                  │
│  📸 Ekran görüntüleri: En az 2 adet                             │
│     - Telefon: 1080x1920 veya 1920x1080                         │
│     - Oyundan screenshot al                                      │
└─────────────────────────────────────────────────────────────────┘

## 5.4 İçerik Derecelendirmesi
┌─────────────────────────────────────────────────────────────────┐
│  1. "Uygulama içeriği" > "İçerik derecelendirmesi" git          │
│  2. Anketi başlat                                                │
│  3. Soruları cevapla:                                            │
│     - Şiddet: Hayır                                              │
│     - Cinsellik: Hayır                                           │
│     - Kumar: Hayır                                               │
│     - Uyuşturucu: Hayır                                          │
│     - Küfür: Hayır                                               │
│  4. "Kaydet" ve "Gönder" tıkla                                   │
│  ✅ PEGI 3 veya Everyone derecesi alacaksın                     │
└─────────────────────────────────────────────────────────────────┘

## 5.5 Reklam Beyanı
┌─────────────────────────────────────────────────────────────────┐
│  1. "Uygulama içeriği" > "Reklamlar" git                        │
│  2. "Evet, uygulamam reklam içeriyor" seç                       │
│  3. Kaydet                                                       │
└─────────────────────────────────────────────────────────────────┘

## 5.6 Gizlilik Politikası
┌─────────────────────────────────────────────────────────────────┐
│  Gizlilik politikası sayfasını internete yüklemen gerekiyor.    │
│                                                                  │
│  KOLAY YÖNTEM - GitHub Pages:                                    │
│  1. github.com'da yeni repo oluştur                              │
│  2. privacy-policy.html dosyasını yükle                          │
│  3. Settings > Pages > Enable et                                 │
│  4. URL'yi al: https://username.github.io/repo/privacy.html     │
│                                                                  │
│  Bu URL'yi Play Console'a ekle:                                  │
│  "Uygulama içeriği" > "Gizlilik politikası"                     │
└─────────────────────────────────────────────────────────────────┘

## 5.7 AAB Dosyasını Yükle
┌─────────────────────────────────────────────────────────────────┐
│  1. "Yayınla" > "Production" git                                │
│  2. "Yeni sürüm oluştur" tıkla                                  │
│  3. "Uygulama paketleri" > "Yükle" tıkla                        │
│  4. .aab dosyasını seç ve yükle                                 │
│  5. Sürüm notları ekle: "İlk sürüm"                             │
│  6. "Sürümü incele" > "Production'a yayınlamaya başla" tıkla    │
│                                                                  │
│  ⏱️ Google incelemesi: 1-7 gün                                  │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
 BÖLÜM 6: APPLE APP STORE'A YÜKLEME
═══════════════════════════════════════════════════════════════════

## 6.1 App Store Connect'te Uygulama Oluştur
┌─────────────────────────────────────────────────────────────────┐
│  1. https://appstoreconnect.apple.com git                       │
│  2. "My Apps" > "+" > "New App" tıkla                           │
│  3. Bilgileri doldur:                                            │
│     - Platform: iOS                                              │
│     - Name: Puzzle Master Blast                                  │
│     - Primary Language: Turkish                                  │
│     - Bundle ID: com.puzzlemasterblast.app                      │
│     - SKU: puzzlemasterblast001                                  │
│  4. "Create" tıkla                                               │
└─────────────────────────────────────────────────────────────────┘

## 6.2 App Bilgilerini Doldur
┌─────────────────────────────────────────────────────────────────┐
│  "App Information" sekmesi:                                      │
│  - Subtitle: "Block Bulmaca Oyunu"                              │
│  - Category: Games > Puzzle                                      │
│  - Content Rights: "Does not contain third-party content"       │
│  - Age Rating: Anketi doldur (4+)                               │
│  - Privacy Policy URL: (GitHub Pages URL'in)                    │
└─────────────────────────────────────────────────────────────────┘

## 6.3 Ekran Görüntüleri Yükle
┌─────────────────────────────────────────────────────────────────┐
│  "App Store" sekmesi > her dil için:                            │
│                                                                  │
│  Gerekli boyutlar:                                               │
│  📱 iPhone 6.7" Display: 1290x2796                              │
│  📱 iPhone 6.5" Display: 1284x2778                              │
│  📱 iPhone 5.5" Display: 1242x2208                              │
│  📱 iPad Pro 12.9": 2048x2732                                   │
│                                                                  │
│  Her boyut için en az 1 screenshot gerekli                      │
└─────────────────────────────────────────────────────────────────┘

## 6.4 IPA Yükle
┌─────────────────────────────────────────────────────────────────┐
│  Terminal'de:                                                    │
│  eas submit --platform ios --latest                              │
│                                                                  │
│  VEYA Transporter uygulaması ile:                               │
│  1. Mac'te App Store'dan "Transporter" indir                    │
│  2. .ipa dosyasını sürükle bırak                                │
│  3. "Deliver" tıkla                                              │
│                                                                  │
│  ⏱️ Apple incelemesi: 1-3 gün                                   │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
 BÖLÜM 7: ÖDEME ALMA (PARA KAZANMA)
═══════════════════════════════════════════════════════════════════

## 7.1 AdMob Ödeme Ayarları
┌─────────────────────────────────────────────────────────────────┐
│  1. admob.google.com > "Payments" git                           │
│  2. "Add payment method" tıkla                                   │
│  3. Banka hesabı bilgilerini gir:                               │
│     - IBAN                                                       │
│     - Banka adı                                                  │
│     - Hesap sahibi adı                                           │
│  4. Vergi bilgilerini doldur                                     │
│                                                                  │
│  💰 Minimum ödeme eşiği: $100 (veya ₺ karşılığı)                │
│  📅 Ödeme tarihi: Her ayın 21-26'sı arası                       │
└─────────────────────────────────────────────────────────────────┘

## 7.2 Tahmini Kazanç
┌─────────────────────────────────────────────────────────────────┐
│  Türkiye'de ortalama reklam gelirleri:                          │
│                                                                  │
│  📊 Banner Reklam: $0.10 - $0.50 / 1000 görüntüleme             │
│  📊 Interstitial: $1.00 - $5.00 / 1000 görüntüleme              │
│                                                                  │
│  Örnek hesaplama (günlük 1000 aktif kullanıcı):                 │
│  - Banner: 10,000 görüntü x $0.30 = $3/gün                      │
│  - Interstitial: 500 görüntü x $2.00 = $1/gün                   │
│  - TOPLAM: ~$4/gün = ~$120/ay                                   │
│                                                                  │
│  10,000 kullanıcıda: ~$1,200/ay                                 │
│  100,000 kullanıcıda: ~$12,000/ay                               │
└─────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
 HIZLI KONTROL LİSTESİ
═══════════════════════════════════════════════════════════════════

Yayınlamadan önce kontrol et:

[ ] Expo hesabı oluşturuldu
[ ] Google Play Console hesabı oluşturuldu ($25 ödendi)
[ ] Apple Developer hesabı oluşturuldu ($99 ödendi)
[ ] AdMob hesabı oluşturuldu
[ ] AdMob'da Android ve iOS uygulamaları eklendi
[ ] Banner ve Interstitial reklam birimleri oluşturuldu
[ ] Tüm ID'ler not edildi
[ ] Gizlilik politikası internete yüklendi
[ ] Uygulama görselleri hazırlandı (icon, screenshots)
[ ] EAS ile build oluşturuldu
[ ] Mağaza açıklamaları yazıldı
[ ] AAB/IPA dosyaları yüklendi
[ ] Ödeme bilgileri eklendi

═══════════════════════════════════════════════════════════════════

Sorularun olursa bana yaz! Yayınladıktan sonra da güncellemeler için
tekrar gelebilirsin. Başarılar! 🎮💰
