import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Quest {
  id: string;
  type: 'score' | 'clear_lines' | 'combo' | 'games_played' | 'level_up' | 'watch_ad' | 'multiplayer';
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number; // Coin reward
  completed: boolean;
  claimed: boolean;
}

interface QuestState {
  dailyQuests: Quest[];
  lastResetDate: string | null;
  loadQuests: (userId: string) => Promise<void>;
  updateQuestProgress: (type: Quest['type'], amount: number) => void;
  claimReward: (questId: string) => Promise<number>;
  checkAndResetDaily: () => Promise<void>;
}

// Generate daily quests
const generateDailyQuests = (): Quest[] => {
  return [
    {
      id: 'quest_score_500',
      type: 'score',
      title: '500 Puan Topla',
      description: 'Tek oyunda 500 puan yap',
      target: 500,
      progress: 0,
      xpReward: 50,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_score_1000',
      type: 'score',
      title: '1000 Puan Topla',
      description: 'Tek oyunda 1000 puan yap',
      target: 1000,
      progress: 0,
      xpReward: 100,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_score_2500',
      type: 'score',
      title: '2500 Puan Topla',
      description: 'Tek oyunda 2500 puan yap',
      target: 2500,
      progress: 0,
      xpReward: 200,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_lines_5',
      type: 'clear_lines',
      title: '5 Satır Temizle',
      description: 'Toplam 5 satır veya sütun temizle',
      target: 5,
      progress: 0,
      xpReward: 30,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_lines_15',
      type: 'clear_lines',
      title: '15 Satır Temizle',
      description: 'Toplam 15 satır veya sütun temizle',
      target: 15,
      progress: 0,
      xpReward: 75,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_lines_30',
      type: 'clear_lines',
      title: '30 Satır Temizle',
      description: 'Toplam 30 satır veya sütun temizle',
      target: 30,
      progress: 0,
      xpReward: 150,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_combo_2',
      type: 'combo',
      title: '2x Combo Yap',
      description: 'Tek hamlede 2 satır temizle',
      target: 1,
      progress: 0,
      xpReward: 40,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_combo_3',
      type: 'combo',
      title: '3x Combo Yap',
      description: 'Tek hamlede 3 satır temizle',
      target: 1,
      progress: 0,
      xpReward: 80,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_games_3',
      type: 'games_played',
      title: '3 Oyun Oyna',
      description: '3 oyun tamamla',
      target: 3,
      progress: 0,
      xpReward: 60,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_games_5',
      type: 'games_played',
      title: '5 Oyun Oyna',
      description: '5 oyun tamamla',
      target: 5,
      progress: 0,
      xpReward: 100,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_watch_ad',
      type: 'watch_ad',
      title: 'Reklam İzle',
      description: '3 reklam izle',
      target: 3,
      progress: 0,
      xpReward: 50,
      completed: false,
      claimed: false,
    },
    {
      id: 'quest_multiplayer',
      type: 'multiplayer',
      title: 'Online Oyna',
      description: '1 çok oyunculu maç oyna',
      target: 1,
      progress: 0,
      xpReward: 75,
      completed: false,
      claimed: false,
    },
  ];
};

export const useQuestStore = create<QuestState>((set, get) => ({
  dailyQuests: [],
  lastResetDate: null,
  
  loadQuests: async (userId: string) => {
    try {
      const savedQuests = await AsyncStorage.getItem(`quests_${userId}`);
      const lastReset = await AsyncStorage.getItem(`quests_reset_${userId}`);
      
      const today = new Date().toDateString();
      
      // Check if we need to reset quests (new day)
      if (lastReset !== today || !savedQuests) {
        const newQuests = generateDailyQuests();
        await AsyncStorage.setItem(`quests_${userId}`, JSON.stringify(newQuests));
        await AsyncStorage.setItem(`quests_reset_${userId}`, today);
        set({ dailyQuests: newQuests, lastResetDate: today });
      } else {
        set({ dailyQuests: JSON.parse(savedQuests), lastResetDate: lastReset });
      }
    } catch (error) {
      console.error('Error loading quests:', error);
      set({ dailyQuests: generateDailyQuests() });
    }
  },
  
  updateQuestProgress: (type: Quest['type'], amount: number) => {
    const { dailyQuests } = get();
    
    const updatedQuests = dailyQuests.map(quest => {
      if (quest.type === type && !quest.completed) {
        const newProgress = quest.progress + amount;
        const completed = newProgress >= quest.target;
        return {
          ...quest,
          progress: Math.min(newProgress, quest.target),
          completed,
        };
      }
      return quest;
    });
    
    set({ dailyQuests: updatedQuests });
    
    // Save to AsyncStorage
    AsyncStorage.getItem('userId').then(userId => {
      if (userId) {
        AsyncStorage.setItem(`quests_${userId}`, JSON.stringify(updatedQuests));
      }
    });
  },
  
  claimReward: async (questId: string) => {
    const { dailyQuests } = get();
    const quest = dailyQuests.find(q => q.id === questId);
    
    if (!quest || !quest.completed || quest.claimed) {
      return 0;
    }
    
    const updatedQuests = dailyQuests.map(q =>
      q.id === questId ? { ...q, claimed: true } : q
    );
    
    set({ dailyQuests: updatedQuests });
    
    // Save to AsyncStorage
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      await AsyncStorage.setItem(`quests_${userId}`, JSON.stringify(updatedQuests));
    }
    
    return quest.xpReward;
  },
  
  checkAndResetDaily: async () => {
    const { lastResetDate } = get();
    const today = new Date().toDateString();
    
    if (lastResetDate !== today) {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        const newQuests = generateDailyQuests();
        await AsyncStorage.setItem(`quests_${userId}`, JSON.stringify(newQuests));
        await AsyncStorage.setItem(`quests_reset_${userId}`, today);
        set({ dailyQuests: newQuests, lastResetDate: today });
      }
    }
  },
}));

export default useQuestStore;
