// AdMob Reklam Yöneticisi
import { Platform } from 'react-native';

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

export const canShowInterstitial = (): boolean => {
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

export const shouldShowInterstitialAfterGame = (): boolean => {
  // Show interstitial every 3 games
  return gameCount % 3 === 0 && canShowInterstitial();
};

export const resetGameCount = (): void => {
  gameCount = 0;
};
