// AdMob Configuration for Puzzle Master Blast
// Türkiye pazarı için optimize edilmiş

import { Platform } from 'react-native';

// Test Ad Unit IDs (Development - Web'de kullanılır)
const TEST_IDS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/6978759866',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
};

// Production Ad Unit IDs - GERÇEK ID'LER
const PRODUCTION_IDS = {
  android: {
    APP_ID: 'ca-app-pub-1839067347385099~5884338608',
    BANNER: 'ca-app-pub-1839067347385099/9432013010',
    INTERSTITIAL: 'ca-app-pub-1839067347385099/9240441320',
    REWARDED: 'ca-app-pub-1839067347385099/2216556334',
    REWARDED_INTERSTITIAL: 'ca-app-pub-1839067347385099/9248868543',
    NATIVE: 'ca-app-pub-1839067347385099/7792792007',
    APP_OPEN: 'ca-app-pub-1839067347385099/5109624621',
  },
  ios: {
    // iOS için aynı ID'leri kullanıyoruz - iOS hesabı açıldığında güncellenecek
    APP_ID: 'ca-app-pub-1839067347385099~5884338608',
    BANNER: 'ca-app-pub-1839067347385099/9432013010',
    INTERSTITIAL: 'ca-app-pub-1839067347385099/9240441320',
    REWARDED: 'ca-app-pub-1839067347385099/2216556334',
    REWARDED_INTERSTITIAL: 'ca-app-pub-1839067347385099/9248868543',
    NATIVE: 'ca-app-pub-1839067347385099/7792792007',
    APP_OPEN: 'ca-app-pub-1839067347385099/5109624621',
  },
};

// Check if we're in development mode
const isDev = __DEV__;

export const getAdUnitId = (type: 'BANNER' | 'INTERSTITIAL' | 'REWARDED' | 'REWARDED_INTERSTITIAL' | 'APP_OPEN'): string => {
  // Production'da gerçek ID'leri kullan
  if (!isDev) {
    const platformIds = Platform.OS === 'ios' ? PRODUCTION_IDS.ios : PRODUCTION_IDS.android;
    return platformIds[type] || TEST_IDS[type];
  }
  
  // Development'ta test ID'lerini kullan
  return TEST_IDS[type];
};

export const getAppId = (): string => {
  const platformIds = Platform.OS === 'ios' ? PRODUCTION_IDS.ios : PRODUCTION_IDS.android;
  return platformIds.APP_ID;
};

export const AdMobConfig = {
  // Banner ad settings
  banner: {
    refreshInterval: 30000, // 30 seconds
    position: 'bottom' as const,
  },
  
  // Interstitial ad settings
  interstitial: {
    // Show interstitial after every N game overs
    showAfterGameOvers: 2,
    // Minimum time between interstitials (ms)
    minIntervalMs: 60000, // 1 minute
  },
  
  // Ad keywords for better targeting (Turkish gaming market)
  keywords: ['puzzle', 'oyun', 'bulmaca', 'block', 'blast', 'tetris', 'casual'],
  
  // Content rating
  maxAdContentRating: 'G' as const, // General audiences
  
  // Test device IDs for development
  testDeviceIds: Platform.OS === 'ios' ? ['SIMULATOR'] : ['EMULATOR'],
};

export default {
  getAdUnitId,
  getAppId,
  AdMobConfig,
  isDev,
  PRODUCTION_IDS,
};
