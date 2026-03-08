// AdMob Service - Web compatible mock
// Gerçek reklamlar sadece native build'de çalışır

import { Platform } from 'react-native';

// Mock service - Web'de ve development'ta kullanılır
const admobService = {
  initialize: async () => {
    console.log('[AdMob] Mock service initialized');
  },
  
  showInterstitialIfReady: async (): Promise<boolean> => {
    console.log('[AdMob] Mock interstitial - skipped on web');
    return false;
  },
  
  isInterstitialAdReady: (): boolean => {
    return false;
  },
  
  isReady: (): boolean => {
    return true;
  },
  
  resetGameOverCount: () => {
    console.log('[AdMob] Reset game over count');
  },
};

export default admobService;
