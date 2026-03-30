import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BlockSkin {
  id: string;
  name: string;
  colors: string[];
  glow?: boolean;
  neon?: boolean;
  premium?: boolean;
  adCost?: number; // Number of ads to watch to unlock
}

export interface Background {
  id: string;
  name: string;
  colors: [string, string];
  coinCost: number; // Cost in game coins
  free?: boolean;
}

interface SkinsState {
  skins: BlockSkin[];
  backgrounds: Background[];
  activeSkin: string;
  activeBackground: string;
  unlockedSkins: string[];
  unlockedBackgrounds: string[];
  setSkin: (skinId: string) => void;
  setBackground: (bgId: string) => void;
  loadSkins: () => Promise<void>;
  watchAdToUnlock: (skinId: string) => Promise<void>;
  purchaseBackground: (bgId: string, coins: number, deductCoins: (amount: number) => void) => Promise<boolean>;
}

// Extensive Block Themes Collection
const ALL_SKINS: BlockSkin[] = [
  // Free - Classic
  {
    id: 'default',
    name: 'Klasik',
    colors: ['#FF5252', '#00E5FF', '#69F0AE', '#FFD740', '#EA80FC', '#FFFF00', '#FF9100', '#7C4DFF'],
  },
  // Neon Series (Watch ads to unlock)
  {
    id: 'neon_blue',
    name: 'Neon Mavi',
    colors: ['#00F0FF', '#00BFFF', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB', '#ADD8E6', '#B0E0E6'],
    neon: true,
    glow: true,
    adCost: 1,
  },
  {
    id: 'neon_pink',
    name: 'Neon Pembe',
    colors: ['#FF00FF', '#FF1493', '#FF69B4', '#FF007F', '#FF0080', '#FF0099', '#FF00AA', '#FF00BB'],
    neon: true,
    glow: true,
    adCost: 1,
  },
  {
    id: 'neon_green',
    name: 'Neon Yeşil',
    colors: ['#39FF14', '#00FF00', '#32CD32', '#00FF7F', '#7FFF00', '#ADFF2F', '#7CFC00', '#00FA9A'],
    neon: true,
    glow: true,
    adCost: 1,
  },
  {
    id: 'neon_rainbow',
    name: 'Neon Gökkuşağı',
    colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF', '#FF00FF'],
    neon: true,
    glow: true,
    adCost: 2,
  },
  // Nature Series
  {
    id: 'ocean',
    name: 'Okyanus',
    colors: ['#006994', '#0077B6', '#0096C7', '#00B4D8', '#48CAE4', '#90E0EF', '#ADE8F4', '#CAF0F8'],
    adCost: 1,
  },
  {
    id: 'sunset',
    name: 'Gün Batımı',
    colors: ['#FF512F', '#F09819', '#FF6B35', '#FF8E53', '#FFA07A', '#FFB347', '#FFCC33', '#FFD700'],
    adCost: 1,
  },
  {
    id: 'forest',
    name: 'Orman',
    colors: ['#228B22', '#32CD32', '#3CB371', '#2E8B57', '#006400', '#00FF00', '#7CFC00', '#ADFF2F'],
    adCost: 1,
  },
  {
    id: 'autumn',
    name: 'Sonbahar',
    colors: ['#D2691E', '#CD853F', '#DEB887', '#F4A460', '#DAA520', '#B8860B', '#8B4513', '#A0522D'],
    adCost: 1,
  },
  // Candy Series
  {
    id: 'candy_pink',
    name: 'Şeker Pembesi',
    colors: ['#FF69B4', '#FF1493', '#DB7093', '#FFB6C1', '#FFC0CB', '#FF82AB', '#EE82EE', '#DA70D6'],
    adCost: 2,
  },
  {
    id: 'candy_blue',
    name: 'Şeker Mavisi',
    colors: ['#87CEEB', '#87CEFA', '#00BFFF', '#1E90FF', '#6495ED', '#4169E1', '#4682B4', '#5F9EA0'],
    adCost: 2,
  },
  // Fire & Ice Series
  {
    id: 'fire',
    name: 'Ateş',
    colors: ['#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFD700', '#FFFF00', '#DC143C'],
    glow: true,
    adCost: 2,
  },
  {
    id: 'ice',
    name: 'Buz',
    colors: ['#E0FFFF', '#AFEEEE', '#87CEEB', '#87CEFA', '#00BFFF', '#1E90FF', '#6495ED', '#B0E0E6'],
    glow: true,
    adCost: 2,
  },
  // Galaxy Series
  {
    id: 'galaxy_purple',
    name: 'Galaksi Mor',
    colors: ['#9B59B6', '#8E44AD', '#663399', '#4B0082', '#6A5ACD', '#7B68EE', '#9370DB', '#BA55D3'],
    glow: true,
    neon: true,
    adCost: 3,
  },
  {
    id: 'galaxy_blue',
    name: 'Galaksi Mavi',
    colors: ['#191970', '#000080', '#00008B', '#0000CD', '#0000FF', '#1E90FF', '#4169E1', '#6495ED'],
    glow: true,
    neon: true,
    adCost: 3,
  },
  // Premium Series
  {
    id: 'gold',
    name: 'Altın',
    colors: ['#FFD700', '#FFC107', '#FFB300', '#FF9800', '#F57F17', '#FDD835', '#FFEB3B', '#FFF176'],
    premium: true,
    glow: true,
    adCost: 4,
  },
  {
    id: 'diamond',
    name: 'Elmas',
    colors: ['#B9F2FF', '#89CFF0', '#7EC8E3', '#0077B6', '#023E8A', '#A2D2FF', '#CAF0F8', '#E0FFFF'],
    premium: true,
    glow: true,
    neon: true,
    adCost: 4,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    colors: ['#00FF7F', '#00FA9A', '#7FFFD4', '#40E0D0', '#00CED1', '#5F9EA0', '#20B2AA', '#3CB371'],
    premium: true,
    glow: true,
    neon: true,
    adCost: 5,
  },
  {
    id: 'midnight',
    name: 'Gece Yarısı',
    colors: ['#191970', '#000080', '#00008B', '#0000CD', '#1E90FF', '#4169E1', '#6495ED', '#87CEFA'],
    premium: true,
    adCost: 5,
  },
  {
    id: 'rainbow_bright',
    name: 'Parlak Gökkuşağı',
    colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF', '#FF00FF'],
    premium: true,
    glow: true,
    neon: true,
    adCost: 5,
  },
];

// Background Themes (purchasable with coins)
const ALL_BACKGROUNDS: Background[] = [
  { id: 'default', name: 'Klasik Gece', colors: ['#0a0a1a', '#1a1a35'], coinCost: 0, free: true },
  { id: 'ocean_deep', name: 'Derin Okyanus', colors: ['#0a192f', '#172a45'], coinCost: 500 },
  { id: 'sunset_glow', name: 'Gün Batımı', colors: ['#1a0a0a', '#2d1f1f'], coinCost: 500 },
  { id: 'forest_night', name: 'Gece Ormanı', colors: ['#0a1a0f', '#1a352a'], coinCost: 500 },
  { id: 'galaxy', name: 'Galaksi', colors: ['#0f0a1a', '#1f1a35'], coinCost: 750 },
  { id: 'neon_city', name: 'Neon Şehir', colors: ['#0a0a15', '#15152a'], coinCost: 750 },
  { id: 'volcanic', name: 'Volkanik', colors: ['#1a0a0a', '#351a1a'], coinCost: 1000 },
  { id: 'ice_cave', name: 'Buz Mağarası', colors: ['#0a1a1f', '#1a3540'], coinCost: 1000 },
  { id: 'aurora_sky', name: 'Aurora Gökyüzü', colors: ['#0a1a15', '#152a35'], coinCost: 1500 },
  { id: 'cosmic', name: 'Kozmik', colors: ['#0f0515', '#1a0a2a'], coinCost: 1500 },
  { id: 'cherry_blossom', name: 'Kiraz Çiçeği', colors: ['#1a0a15', '#2a1525'], coinCost: 2000 },
  { id: 'emerald', name: 'Zümrüt', colors: ['#0a1a0a', '#153015'], coinCost: 2000 },
];

export const useSkinsStore = create<SkinsState>((set, get) => ({
  skins: ALL_SKINS,
  backgrounds: ALL_BACKGROUNDS,
  activeSkin: 'default',
  activeBackground: 'default',
  unlockedSkins: ['default'],
  unlockedBackgrounds: ['default'],
  
  setSkin: (skinId: string) => {
    set({ activeSkin: skinId });
    AsyncStorage.setItem('activeSkin', skinId);
  },
  
  setBackground: (bgId: string) => {
    set({ activeBackground: bgId });
    AsyncStorage.setItem('activeBackground', bgId);
  },
  
  loadSkins: async () => {
    try {
      const [activeSkin, activeBackground, unlockedSkins, unlockedBackgrounds] = await Promise.all([
        AsyncStorage.getItem('activeSkin'),
        AsyncStorage.getItem('activeBackground'),
        AsyncStorage.getItem('unlockedSkins'),
        AsyncStorage.getItem('unlockedBackgrounds'),
      ]);
      
      set({
        activeSkin: activeSkin || 'default',
        activeBackground: activeBackground || 'default',
        unlockedSkins: unlockedSkins ? JSON.parse(unlockedSkins) : ['default'],
        unlockedBackgrounds: unlockedBackgrounds ? JSON.parse(unlockedBackgrounds) : ['default'],
      });
    } catch (error) {
      console.error('Error loading skins:', error);
    }
  },
  
  watchAdToUnlock: async (skinId: string) => {
    const { unlockedSkins } = get();
    if (!unlockedSkins.includes(skinId)) {
      const newUnlocked = [...unlockedSkins, skinId];
      set({ unlockedSkins: newUnlocked, activeSkin: skinId });
      await AsyncStorage.setItem('unlockedSkins', JSON.stringify(newUnlocked));
      await AsyncStorage.setItem('activeSkin', skinId);
    }
  },
  
  purchaseBackground: async (bgId: string, coins: number, deductCoins: (amount: number) => void) => {
    const { unlockedBackgrounds, backgrounds } = get();
    const bg = backgrounds.find(b => b.id === bgId);
    
    if (!bg || unlockedBackgrounds.includes(bgId)) return false;
    
    if (coins >= bg.coinCost) {
      deductCoins(bg.coinCost);
      const newUnlocked = [...unlockedBackgrounds, bgId];
      set({ unlockedBackgrounds: newUnlocked, activeBackground: bgId });
      await AsyncStorage.setItem('unlockedBackgrounds', JSON.stringify(newUnlocked));
      await AsyncStorage.setItem('activeBackground', bgId);
      return true;
    }
    
    return false;
  },
}));

export default useSkinsStore;
