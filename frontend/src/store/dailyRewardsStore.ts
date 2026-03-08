// Daily Rewards Store - Günlük giriş ödülleri
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyReward {
  day: number;
  xp: number;
  coins: number;
  skin?: string;
  claimed: boolean;
}

interface DailyRewardsState {
  currentStreak: number;
  lastClaimDate: string | null;
  rewards: DailyReward[];
  totalCoins: number;
  unlockedSkins: string[];
  
  // Actions
  checkAndShowReward: () => Promise<boolean>;
  claimReward: () => Promise<void>;
  loadRewardsData: () => Promise<void>;
  saveRewardsData: () => Promise<void>;
}

const DAILY_REWARDS: Omit<DailyReward, 'claimed'>[] = [
  { day: 1, xp: 50, coins: 100 },
  { day: 2, xp: 75, coins: 150 },
  { day: 3, xp: 100, coins: 200 },
  { day: 4, xp: 150, coins: 300 },
  { day: 5, xp: 200, coins: 400, skin: 'neon' },
  { day: 6, xp: 300, coins: 500 },
  { day: 7, xp: 500, coins: 1000, skin: 'gold' },
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
  
  checkAndShowReward: async () => {
    const { lastClaimDate, loadRewardsData } = get();
    await loadRewardsData();
    
    // Bugün zaten claim edildi mi?
    if (isSameDay(get().lastClaimDate)) {
      return false;
    }
    
    return true; // Ödül gösterilebilir
  },
  
  claimReward: async () => {
    const { currentStreak, lastClaimDate, rewards, totalCoins, unlockedSkins } = get();
    
    // Streak hesapla
    let newStreak = currentStreak;
    if (isConsecutiveDay(lastClaimDate)) {
      newStreak = Math.min(currentStreak + 1, 7);
    } else if (!isSameDay(lastClaimDate)) {
      // Streak kırıldı
      newStreak = 1;
    }
    
    // Bugünkü ödülü bul
    const todayReward = DAILY_REWARDS[(newStreak - 1) % 7];
    
    // Ödülleri güncelle
    const newRewards = rewards.map((r, i) => ({
      ...r,
      claimed: i < newStreak,
    }));
    
    // Skin varsa ekle
    const newSkins = [...unlockedSkins];
    if (todayReward.skin && !newSkins.includes(todayReward.skin)) {
      newSkins.push(todayReward.skin);
    }
    
    set({
      currentStreak: newStreak,
      lastClaimDate: getToday(),
      rewards: newRewards,
      totalCoins: totalCoins + todayReward.coins,
      unlockedSkins: newSkins,
    });
    
    await get().saveRewardsData();
  },
  
  loadRewardsData: async () => {
    try {
      const data = await AsyncStorage.getItem('daily_rewards');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          currentStreak: parsed.currentStreak || 0,
          lastClaimDate: parsed.lastClaimDate || null,
          totalCoins: parsed.totalCoins || 0,
          unlockedSkins: parsed.unlockedSkins || ['default'],
          rewards: DAILY_REWARDS.map((r, i) => ({
            ...r,
            claimed: i < (parsed.currentStreak || 0),
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
      await AsyncStorage.setItem('daily_rewards', JSON.stringify({
        currentStreak,
        lastClaimDate,
        totalCoins,
        unlockedSkins,
      }));
    } catch (error) {
      console.error('Failed to save rewards data:', error);
    }
  },
}));

export default useDailyRewardsStore;
