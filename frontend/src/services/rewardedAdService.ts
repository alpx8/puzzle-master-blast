// Rewarded Ad Service - Web compatible mock
// Gerçek reklamlar sadece native build'de çalışır
// Production build için app.json'a plugin eklenecek

import { Platform } from 'react-native';

// Mock service - Web'de ve development'ta kullanılır
// Production native build'de gerçek AdMob SDK ile değiştirilir
const rewardedAdService = {
  initialize: async () => {
    console.log('[RewardedAd] Mock service initialized');
  },
  
  showAd: async (onReward: (reward: { type: string; amount: number }) => void): Promise<boolean> => {
    // Reklam izleme simülasyonu - 1.5 saniye bekle
    return new Promise((resolve) => {
      console.log('[RewardedAd] Showing mock ad...');
      setTimeout(() => {
        console.log('[RewardedAd] Mock ad completed, giving reward');
        onReward({ type: 'extra_life', amount: 1 });
        resolve(true);
      }, 1500);
    });
  },
  
  isAdReady: (): boolean => {
    return true; // Mock her zaman hazır
  },
};

export default rewardedAdService;
