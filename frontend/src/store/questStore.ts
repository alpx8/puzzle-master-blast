import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Quest {
  id: string;
  type: 'score' | 'clear_lines' | 'combo' | 'games_played' | 'level_up';
  title: string;
  description: string;
  target: number;
  progress: number;
  xpReward: number;
  completed: boolean;
  claimed: boolean;
}

interface QuestState {
  dailyQuests: Quest[];
  lastQuestDate: string;
  totalQuestsCompleted: number;
  
  // Actions
  loadQuests: (userId: string) => Promise<void>;
  updateQuestProgress: (type: Quest['type'], amount: number) => void;
  claimReward: (questId: string) => Promise<number>;
  checkAndRefreshQuests: (userId: string) => Promise<void>;
}

const QUEST_TEMPLATES = [
  // Score quests
  { type: 'score' as const, title: 'Puan Avcısı', description: '{target} puan topla', targets: [500, 1000, 2000, 5000], xpMultiplier: 0.1 },
  { type: 'score' as const, title: 'Skor Ustası', description: 'Tek oyunda {target} puan yap', targets: [300, 500, 1000, 2000], xpMultiplier: 0.15 },
  
  // Line clear quests
  { type: 'clear_lines' as const, title: 'Satır Temizleyici', description: '{target} satır/sütun temizle', targets: [5, 10, 20, 30], xpMultiplier: 5 },
  { type: 'clear_lines' as const, title: 'Patlama Ustası', description: '{target} satır patlat', targets: [10, 25, 50], xpMultiplier: 4 },
  
  // Combo quests
  { type: 'combo' as const, title: 'Kombo Kralı', description: '{target}x kombo yap', targets: [2, 3, 5, 7], xpMultiplier: 20 },
  { type: 'combo' as const, title: 'Zincirleme', description: '{target} kez üst üste kombo yap', targets: [3, 5, 10], xpMultiplier: 15 },
  
  // Games played
  { type: 'games_played' as const, title: 'Oyun Sever', description: '{target} oyun oyna', targets: [3, 5, 10], xpMultiplier: 25 },
];

const generateDailyQuests = (): Quest[] => {
  const quests: Quest[] = [];
  const usedTypes = new Set<string>();
  
  // Generate 3 random quests
  while (quests.length < 3) {
    const template = QUEST_TEMPLATES[Math.floor(Math.random() * QUEST_TEMPLATES.length)];
    const questKey = `${template.type}-${template.title}`;
    
    if (usedTypes.has(questKey)) continue;
    usedTypes.add(questKey);
    
    const target = template.targets[Math.floor(Math.random() * template.targets.length)];
    const xpReward = Math.floor(target * template.xpMultiplier);
    
    quests.push({
      id: `${Date.now()}-${quests.length}`,
      type: template.type,
      title: template.title,
      description: template.description.replace('{target}', target.toString()),
      target,
      progress: 0,
      xpReward: Math.max(xpReward, 10), // Minimum 10 XP
      completed: false,
      claimed: false,
    });
  }
  
  return quests;
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useQuestStore = create<QuestState>((set, get) => ({
  dailyQuests: [],
  lastQuestDate: '',
  totalQuestsCompleted: 0,
  
  loadQuests: async (userId: string) => {
    try {
      const stored = await AsyncStorage.getItem(`quests_${userId}`);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          dailyQuests: data.dailyQuests || [],
          lastQuestDate: data.lastQuestDate || '',
          totalQuestsCompleted: data.totalQuestsCompleted || 0,
        });
      }
      
      // Check if we need new quests
      await get().checkAndRefreshQuests(userId);
    } catch (error) {
      console.error('Error loading quests:', error);
    }
  },
  
  checkAndRefreshQuests: async (userId: string) => {
    const today = getTodayDate();
    const { lastQuestDate } = get();
    
    if (lastQuestDate !== today) {
      // Generate new daily quests
      const newQuests = generateDailyQuests();
      
      set({
        dailyQuests: newQuests,
        lastQuestDate: today,
      });
      
      // Save to storage
      await AsyncStorage.setItem(`quests_${userId}`, JSON.stringify({
        dailyQuests: newQuests,
        lastQuestDate: today,
        totalQuestsCompleted: get().totalQuestsCompleted,
      }));
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
  },
  
  claimReward: async (questId: string): Promise<number> => {
    const { dailyQuests, totalQuestsCompleted } = get();
    
    const quest = dailyQuests.find(q => q.id === questId);
    if (!quest || !quest.completed || quest.claimed) return 0;
    
    const updatedQuests = dailyQuests.map(q => 
      q.id === questId ? { ...q, claimed: true } : q
    );
    
    set({
      dailyQuests: updatedQuests,
      totalQuestsCompleted: totalQuestsCompleted + 1,
    });
    
    return quest.xpReward;
  },
}));
