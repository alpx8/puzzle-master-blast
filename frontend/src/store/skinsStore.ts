// Block Skins Store - Blok teması sistemi
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BlockSkin {
  id: string;
  name: string;
  colors: string[];
  gradient?: boolean;
  glow?: boolean;
  premium?: boolean;
  adCost?: number;
}

interface SkinsState {
  activeSkin: string;
  unlockedSkins: string[];
  skins: BlockSkin[];
  
  // Actions
  setSkin: (skinId: string) => void;
  unlockSkin: (skinId: string) => void;
  watchAdToUnlock: (skinId: string) => Promise<void>;
  loadSkins: () => Promise<void>;
  saveSkins: () => Promise<void>;
  getSkinColors: () => string[];
}

const ALL_SKINS: BlockSkin[] = [
  {
    id: 'default',
    name: 'Klasik',
    colors: ['#FF5252', '#00E5FF', '#69F0AE', '#FFD740', '#EA80FC', '#FFFF00', '#FF9100'],
  },
  {
    id: 'neon',
    name: 'Neon Gece',
    colors: ['#00F0FF', '#FF0099', '#39FF14', '#FAFF00', '#BD00FF', '#FF5F1F', '#FF003C'],
    glow: true,
    adCost: 3,
  },
  {
    id: 'gold',
    name: 'Altın',
    colors: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520', '#B8860B', '#CD853F', '#D2691E'],
    premium: true,
    adCost: 5,
  },
  {
    id: 'ocean',
    name: 'Okyanus',
    colors: ['#00CED1', '#20B2AA', '#48D1CC', '#40E0D0', '#00FFFF', '#7FFFD4', '#66CDAA'],
    adCost: 3,
  },
  {
    id: 'sunset',
    name: 'Gün Batımı',
    colors: ['#FF6B6B', '#FF8E53', '#FFA07A', '#FFB347', '#FF7F50', '#FF6347', '#FF4500'],
    adCost: 3,
  },
  {
    id: 'galaxy',
    name: 'Galaksi',
    colors: ['#9B59B6', '#8E44AD', '#663399', '#4B0082', '#6A5ACD', '#7B68EE', '#9370DB'],
    glow: true,
    premium: true,
    adCost: 7,
  },
  {
    id: 'candy',
    name: 'Şeker',
    colors: ['#FF69B4', '#FF1493', '#DB7093', '#FFB6C1', '#FFC0CB', '#FF82AB', '#EE82EE'],
    adCost: 3,
  },
  {
    id: 'forest',
    name: 'Orman',
    colors: ['#228B22', '#32CD32', '#00FF00', '#7CFC00', '#ADFF2F', '#9ACD32', '#6B8E23'],
    adCost: 3,
  },
  {
    id: 'fire',
    name: 'Ateş',
    colors: ['#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFD700', '#FFFF00'],
    glow: true,
    adCost: 5,
  },
  {
    id: 'ice',
    name: 'Buz',
    colors: ['#E0FFFF', '#AFEEEE', '#87CEEB', '#87CEFA', '#00BFFF', '#1E90FF', '#6495ED'],
    glow: true,
    adCost: 5,
  },
];

export const useSkinsStore = create<SkinsState>((set, get) => ({
  activeSkin: 'default',
  unlockedSkins: ['default'],
  skins: ALL_SKINS,
  
  setSkin: (skinId) => {
    const { unlockedSkins } = get();
    if (unlockedSkins.includes(skinId)) {
      set({ activeSkin: skinId });
      get().saveSkins();
    }
  },
  
  unlockSkin: (skinId) => {
    const { unlockedSkins } = get();
    if (!unlockedSkins.includes(skinId)) {
      set({ unlockedSkins: [...unlockedSkins, skinId] });
      get().saveSkins();
    }
  },
  
  watchAdToUnlock: async (skinId) => {
    // Reklam izleme simülasyonu
    return new Promise((resolve) => {
      setTimeout(() => {
        get().unlockSkin(skinId);
        resolve();
      }, 1500);
    });
  },
  
  loadSkins: async () => {
    try {
      const data = await AsyncStorage.getItem('block_skins');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          activeSkin: parsed.activeSkin || 'default',
          unlockedSkins: parsed.unlockedSkins || ['default'],
        });
      }
    } catch (error) {
      console.error('Failed to load skins:', error);
    }
  },
  
  saveSkins: async () => {
    try {
      const { activeSkin, unlockedSkins } = get();
      await AsyncStorage.setItem('block_skins', JSON.stringify({
        activeSkin,
        unlockedSkins,
      }));
    } catch (error) {
      console.error('Failed to save skins:', error);
    }
  },
  
  getSkinColors: () => {
    const { activeSkin, skins } = get();
    const skin = skins.find(s => s.id === activeSkin);
    return skin?.colors || ALL_SKINS[0].colors;
  },
}));

export default useSkinsStore;
