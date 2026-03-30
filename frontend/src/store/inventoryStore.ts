// Inventory Store - Kalıcı Envanter Sistemi
// Satın alınan temalar, arka planlar ve jokerler burada saklanır
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InventoryItem {
  id: string;
  type: 'theme' | 'background' | 'powerup';
  name: string;
  acquiredAt: string;
  acquiredBy: 'purchase' | 'ad' | 'reward' | 'default';
}

interface InventoryState {
  // Owned items
  ownedThemes: string[];
  ownedBackgrounds: string[];
  
  // Active selections
  activeTheme: string;
  activeBackground: string;
  
  // Statistics
  totalSpent: number;
  itemsAcquired: InventoryItem[];
  
  // Actions
  addTheme: (themeId: string, acquiredBy: InventoryItem['acquiredBy']) => void;
  addBackground: (backgroundId: string, acquiredBy: InventoryItem['acquiredBy']) => void;
  setActiveTheme: (themeId: string) => void;
  setActiveBackground: (backgroundId: string) => void;
  hasTheme: (themeId: string) => boolean;
  hasBackground: (backgroundId: string) => boolean;
  loadInventory: () => Promise<void>;
  saveInventory: () => Promise<void>;
  addSpending: (amount: number) => void;
}

// Default unlocked items
const DEFAULT_THEMES = ['classic'];
const DEFAULT_BACKGROUNDS = ['classic_night'];

export const useInventoryStore = create<InventoryState>((set, get) => ({
  ownedThemes: DEFAULT_THEMES,
  ownedBackgrounds: DEFAULT_BACKGROUNDS,
  activeTheme: 'classic',
  activeBackground: 'classic_night',
  totalSpent: 0,
  itemsAcquired: [],
  
  addTheme: (themeId, acquiredBy) => {
    const { ownedThemes, itemsAcquired } = get();
    if (ownedThemes.includes(themeId)) return;
    
    const newItem: InventoryItem = {
      id: themeId,
      type: 'theme',
      name: themeId,
      acquiredAt: new Date().toISOString(),
      acquiredBy,
    };
    
    set({
      ownedThemes: [...ownedThemes, themeId],
      itemsAcquired: [...itemsAcquired, newItem],
    });
    get().saveInventory();
  },
  
  addBackground: (backgroundId, acquiredBy) => {
    const { ownedBackgrounds, itemsAcquired } = get();
    if (ownedBackgrounds.includes(backgroundId)) return;
    
    const newItem: InventoryItem = {
      id: backgroundId,
      type: 'background',
      name: backgroundId,
      acquiredAt: new Date().toISOString(),
      acquiredBy,
    };
    
    set({
      ownedBackgrounds: [...ownedBackgrounds, backgroundId],
      itemsAcquired: [...itemsAcquired, newItem],
    });
    get().saveInventory();
  },
  
  setActiveTheme: (themeId) => {
    const { ownedThemes } = get();
    if (ownedThemes.includes(themeId)) {
      set({ activeTheme: themeId });
      get().saveInventory();
    }
  },
  
  setActiveBackground: (backgroundId) => {
    const { ownedBackgrounds } = get();
    if (ownedBackgrounds.includes(backgroundId)) {
      set({ activeBackground: backgroundId });
      get().saveInventory();
    }
  },
  
  hasTheme: (themeId) => {
    return get().ownedThemes.includes(themeId);
  },
  
  hasBackground: (backgroundId) => {
    return get().ownedBackgrounds.includes(backgroundId);
  },
  
  addSpending: (amount) => {
    const { totalSpent } = get();
    set({ totalSpent: totalSpent + amount });
    get().saveInventory();
  },
  
  loadInventory: async () => {
    try {
      const data = await AsyncStorage.getItem('player_inventory');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          ownedThemes: [...DEFAULT_THEMES, ...(parsed.ownedThemes || []).filter((t: string) => !DEFAULT_THEMES.includes(t))],
          ownedBackgrounds: [...DEFAULT_BACKGROUNDS, ...(parsed.ownedBackgrounds || []).filter((b: string) => !DEFAULT_BACKGROUNDS.includes(b))],
          activeTheme: parsed.activeTheme || 'classic',
          activeBackground: parsed.activeBackground || 'classic_night',
          totalSpent: parsed.totalSpent || 0,
          itemsAcquired: parsed.itemsAcquired || [],
        });
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  },
  
  saveInventory: async () => {
    try {
      const { ownedThemes, ownedBackgrounds, activeTheme, activeBackground, totalSpent, itemsAcquired } = get();
      await AsyncStorage.setItem('player_inventory', JSON.stringify({
        ownedThemes,
        ownedBackgrounds,
        activeTheme,
        activeBackground,
        totalSpent,
        itemsAcquired,
      }));
    } catch (error) {
      console.error('Failed to save inventory:', error);
    }
  },
}));

export default useInventoryStore;
