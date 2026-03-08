// AdMob Configuration for Puzzle Master Blast
// Türkiye pazarı için optimize edilmiş

import { Platform } from 'react-native';

// Test Ad Unit IDs (Development)
const TEST_IDS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/6978759866',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
};

// Production Ad Unit IDs - Replace with your actual IDs from AdMob Console
const PRODUCTION_IDS = {
  android: {
    APP_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY', // Your Android App ID
    BANNER: 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ID',
    INTERSTITIAL: 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID',
  },
  ios: {
    APP_ID: 'ca-app-pub-XXXXXXXXXXXXXXXX~ZZZZZZZZZZ', // Your iOS App ID
    BANNER: 'ca-app-pub-XXXXXXXXXXXXXXXX/BANNER_ID',
    INTERSTITIAL: 'ca-app-pub-XXXXXXXXXXXXXXXX/INTERSTITIAL_ID',
  },
};

// Check if we're in development mode
const isDev = __DEV__;

export const getAdUnitId = (type: 'BANNER' | 'INTERSTITIAL' | 'REWARDED' | 'APP_OPEN'): string => {
  if (isDev) {
    return TEST_IDS[type];
  }
  
  const platformIds = Platform.OS === 'ios' ? PRODUCTION_IDS.ios : PRODUCTION_IDS.android;
  
  switch (type) {
    case 'BANNER':
      return platformIds.BANNER;
    case 'INTERSTITIAL':
      return platformIds.INTERSTITIAL;
    default:
      return TEST_IDS[type]; // Fallback to test IDs for unsupported types
  }
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
  AdMobConfig,
  isDev,
};
