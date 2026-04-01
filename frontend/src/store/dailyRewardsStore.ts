// Daily Rewards Store - Günlük giriş ödülleri (1-7 coin sistemi)
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyReward {
  day: number;
  xp: number;
  coins: number;
  claimed: boolean;
}

interface DailyRewardsState {
  currentStreak: number;
  lastClaimDate: string | null;
  rewards: DailyReward[];
  totalCoins: number;
  unlockedSkins: string[];
  shouldShowAd: boolean; // Ödül sonrası reklam gösterilecek mi
  
  // Actions
  checkAndShowReward: () => Promise<boolean>;
  claimReward: () => Promise<{ coins: number; xp: number }>;
  loadRewardsData: () => Promise<void>;
  saveRewardsData: () => Promise<void>;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  setShouldShowAd: (show: boolean) => void;
}

// Yeni ödül sistemi: 1, 2, 3, 4, 5, 6, 7 coin (haftalık sıfırlama)
const DAILY_REWARDS: Omit<DailyReward, 'claimed'>[] = [
  { day: 1, xp: 10, coins: 1 },
  { day: 2, xp: 15, coins: 2 },
  { day: 3, xp: 20, coins: 3 },
  { day: 4, xp: 25, coins: 4 },
  { day: 5, xp: 30, coins: 5 },
  { day: 6, xp: 40, coins: 6 },
  { day: 7, xp: 50, coins: 7 }, // Hafta sonu bonus
];

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

const isConsecutiveDay = (lastDate: string | null): boolean => {
  if (!lastDate) return true;
  
  const last = new Date(lastDate);
  const today = new Date();
  const diffTime = today.getTime() - last.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays === 1;
};

const isSameDay = (lastDate: string | null): boolean => {
  if (!lastDate) return false;
  return lastDate === getToday();
};

export const useDailyRewardsStore = create<DailyRewardsState>((set, get) => ({
  currentStreak: 0,
  lastClaimDate: null,
  rewards: DAILY_REWARDS.map(r => ({ ...r, claimed: false })),
  totalCoins: 0,
  unlockedSkins: ['default'],
  shouldShowAd: false,
  
  checkAndShowReward: async () => {
    const { loadRewardsData } = get();
    await loadRewardsData();
    
    // Bugün zaten claim edildi mi?
    if (isSameDay(get().lastClaimDate)) {
      return false;
    }
    
    return true; // Ödül gösterilebilir
  },
  
  claimReward: async () => {
    const { currentStreak, lastClaimDate, rewards, totalCoins } = get();
    
    // Streak hesapla
    let newStreak = currentStreak;
    if (isConsecutiveDay(lastClaimDate)) {
      newStreak = currentStreak + 1;
      // 7 günden sonra sıfırla (haftalık döngü)
      if (newStreak > 7) {
        newStreak = 1;
      }
    } else if (!isSameDay(lastClaimDate)) {
      // Streak kırıldı veya ilk giriş
      newStreak = 1;
    }
    
    // Bugünkü ödülü bul (0-indexed)
    const todayReward = DAILY_REWARDS[(newStreak - 1) % 7];
    
    // Ödülleri güncelle
    const newRewards = rewards.map((r, i) => ({
      ...r,
      claimed: i < newStreak,
    }));
    
    set({
      currentStreak: newStreak,
      lastClaimDate: getToday(),
      rewards: newRewards,
      totalCoins: totalCoins + todayReward.coins,
      shouldShowAd: true, // Ödül sonrası reklam göster
    });
    
    await get().saveRewardsData();
    
    return { coins: todayReward.coins, xp: todayReward.xp };
  },
  
  loadRewardsData: async () => {
    try {
      const data = await AsyncStorage.getItem('daily_rewards_v2');
      if (data) {
        const parsed = JSON.parse(data);
        
        // 7 günden fazla geçmişse streak sıfırla
        let streak = parsed.currentStreak || 0;
        if (streak > 7) streak = 0;
        
        set({
          currentStreak: streak,
          lastClaimDate: parsed.lastClaimDate || null,
          totalCoins: parsed.totalCoins || 0,
          unlockedSkins: parsed.unlockedSkins || ['default'],
          rewards: DAILY_REWARDS.map((r, i) => ({
            ...r,
            claimed: i < streak,
          })),
        });
      }
    } catch (error) {
      console.error('Failed to load rewards data:', error);
    }
  },
  
  saveRewardsData: async () => {
    try {
      const { currentStreak, lastClaimDate, totalCoins, unlockedSkins } = get();
      await AsyncStorage.setItem('daily_rewards_v2', JSON.stringify({
        currentStreak,
        lastClaimDate,
        totalCoins,
        unlockedSkins,
      }));
    } catch (error) {
      console.error('Failed to save rewards data:', error);
    }
  },
  
  addCoins: (amount: number) => {
    const { totalCoins } = get();
    set({ totalCoins: totalCoins + amount });
    get().saveRewardsData();
  },
  
  deductCoins: (amount: number) => {
    const { totalCoins } = get();
    if (totalCoins >= amount) {
      set({ totalCoins: totalCoins - amount });
      get().saveRewardsData();
      return true;
    }
    return false;
  },
  
  setShouldShowAd: (show: boolean) => {
    set({ shouldShowAd: show });
  },
}));

export default useDailyRewardsStore;
