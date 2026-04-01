// AdMob Reklam Yöneticisi - VIP Entegrasyonu
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Production Ad Unit IDs
export const AD_UNITS = {
  APP_ID: 'ca-app-pub-1839067347385099~5884338608',
  BANNER: 'ca-app-pub-1839067347385099/9432013010',
  INTERSTITIAL: 'ca-app-pub-1839067347385099/9240441320',
  REWARDED: 'ca-app-pub-1839067347385099/2216556334',
  APP_OPEN: 'ca-app-pub-1839067347385099/5109624621',
  NATIVE_ADVANCED: 'ca-app-pub-1839067347385099/7792792007',
  REWARDED_INTERSTITIAL: 'ca-app-pub-1839067347385099/9248868543',
};

// Test Ad Unit IDs (for development)
export const TEST_AD_UNITS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  APP_OPEN: 'ca-app-pub-3940256099942544/3419835294',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/5354046379',
};

// Use production IDs
const isProduction = true;

// VIP durumunu kontrol et
export const checkVIPStatus = async (): Promise<boolean> => {
  try {
    const data = await AsyncStorage.getItem('vip_subscription');
    if (!data) return false;
    
    const parsed = JSON.parse(data);
    
    // VIP aktif mi?
    if (!parsed.isVIP) return false;
    
    // Abonelik süresi dolmuş mu?
    if (parsed.subscriptionEndDate) {
      const endDate = new Date(parsed.subscriptionEndDate);
      const now = new Date();
      
      if (now > endDate) {
        // Süre dolmuş - VIP'i kaldır
        await AsyncStorage.setItem('vip_subscription', JSON.stringify({
          ...parsed,
          isVIP: false,
        }));
        console.log('[AdManager] VIP süresi doldu, reklamlar aktif');
        return false;
      }
    }
    
    console.log('[AdManager] VIP aktif, reklamlar kapalı');
    return true;
  } catch (error) {
    console.error('[AdManager] VIP kontrol hatası:', error);
    return false;
  }
};

// Reklam gösterilmeli mi? (VIP değilse true)
export const shouldShowAds = async (): Promise<boolean> => {
  const isVIP = await checkVIPStatus();
  return !isVIP; // VIP değilse reklam göster
};

export const getAdUnitId = (type: keyof typeof AD_UNITS): string => {
  if (Platform.OS === 'web') {
    return ''; // Ads not supported on web
  }
  
  if (isProduction) {
    return AD_UNITS[type];
  }
  
  // Return test IDs for development
  switch (type) {
    case 'BANNER':
      return TEST_AD_UNITS.BANNER;
    case 'INTERSTITIAL':
      return TEST_AD_UNITS.INTERSTITIAL;
    case 'REWARDED':
      return TEST_AD_UNITS.REWARDED;
    case 'APP_OPEN':
      return TEST_AD_UNITS.APP_OPEN;
    case 'REWARDED_INTERSTITIAL':
      return TEST_AD_UNITS.REWARDED_INTERSTITIAL;
    default:
      return AD_UNITS[type];
  }
};

// Ad placement tracking
let lastInterstitialTime = 0;
const INTERSTITIAL_COOLDOWN = 60000; // 1 minute between interstitials

export const canShowInterstitial = async (): Promise<boolean> => {
  // Önce VIP kontrolü
  const isVIP = await checkVIPStatus();
  if (isVIP) {
    console.log('[AdManager] VIP kullanıcı - reklam gösterilmiyor');
    return false;
  }
  
  const now = Date.now();
  if (now - lastInterstitialTime >= INTERSTITIAL_COOLDOWN) {
    lastInterstitialTime = now;
    return true;
  }
  return false;
};

// Game count tracking for ad frequency
let gameCount = 0;

export const incrementGameCount = (): number => {
  gameCount++;
  return gameCount;
};

export const shouldShowInterstitialAfterGame = async (): Promise<boolean> => {
  // Önce VIP kontrolü
  const isVIP = await checkVIPStatus();
  if (isVIP) {
    console.log('[AdManager] VIP kullanıcı - oyun sonu reklam yok');
    return false;
  }
  
  // Show interstitial every 3 games
  return gameCount % 3 === 0 && await canShowInterstitial();
};

export const resetGameCount = (): void => {
  gameCount = 0;
};

// Banner reklam gösterilmeli mi?
export const shouldShowBanner = async (): Promise<boolean> => {
  return await shouldShowAds();
};

// Rewarded reklam (Video izle) - VIP'ler de izleyebilir çünkü ödül kazanıyorlar
export const canShowRewarded = (): boolean => {
  // Rewarded reklamlar VIP'ler için de açık (ödül alıyorlar)
  return Platform.OS !== 'web';
};
