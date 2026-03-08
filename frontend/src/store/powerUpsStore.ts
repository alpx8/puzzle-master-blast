// Power-ups Store - Güç artırıcılar
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PowerUpType = 'bomb' | 'shuffle' | 'extraTime' | 'clearRow';

interface PowerUp {
  id: PowerUpType;
  name: string;
  description: string;
  icon: string;
  color: string;
  count: number;
  adCost: number; // Kaç reklam izlenerek kazanılır
}

interface PowerUpsState {
  powerUps: PowerUp[];
  activePowerUp: PowerUpType | null;
  
  // Actions
  usePowerUp: (type: PowerUpType) => boolean;
  addPowerUp: (type: PowerUpType, amount?: number) => void;
  setActivePowerUp: (type: PowerUpType | null) => void;
  loadPowerUps: () => Promise<void>;
  savePowerUps: () => Promise<void>;
  watchAdForPowerUp: (type: PowerUpType) => Promise<void>;
}

const DEFAULT_POWERUPS: PowerUp[] = [
  {
    id: 'bomb',
    name: 'Bomba',
    description: '3x3 alanı temizle',
    icon: 'flame',
    color: '#FF5F1F',
    count: 1,
    adCost: 1,
  },
  {
    id: 'shuffle',
    name: 'Karıştır',
    description: 'Yeni bloklar al',
    icon: 'shuffle',
    color: '#BD00FF',
    count: 1,
    adCost: 1,
  },
  {
    id: 'extraTime',
    name: 'Ekstra Süre',
    description: '+30 saniye (zamanlı mod)',
    icon: 'time',
    color: '#00F0FF',
    count: 0,
    adCost: 2,
  },
  {
    id: 'clearRow',
    name: 'Satır Temizle',
    description: 'Bir satırı tamamen temizle',
    icon: 'remove-circle',
    color: '#39FF14',
    count: 0,
    adCost: 2,
  },
];

export const usePowerUpsStore = create<PowerUpsState>((set, get) => ({
  powerUps: DEFAULT_POWERUPS,
  activePowerUp: null,
  
  usePowerUp: (type) => {
    const { powerUps } = get();
    const powerUp = powerUps.find(p => p.id === type);
    
    if (!powerUp || powerUp.count <= 0) {
      return false;
    }
    
    set({
      powerUps: powerUps.map(p => 
        p.id === type ? { ...p, count: p.count - 1 } : p
      ),
      activePowerUp: null,
    });
    
    get().savePowerUps();
    return true;
  },
  
  addPowerUp: (type, amount = 1) => {
    const { powerUps } = get();
    set({
      powerUps: powerUps.map(p => 
        p.id === type ? { ...p, count: p.count + amount } : p
      ),
    });
    get().savePowerUps();
  },
  
  setActivePowerUp: (type) => {
    set({ activePowerUp: type });
  },
  
  watchAdForPowerUp: async (type) => {
    // Reklam izleme simülasyonu
    return new Promise((resolve) => {
      setTimeout(() => {
        get().addPowerUp(type);
        resolve();
      }, 1500);
    });
  },
  
  loadPowerUps: async () => {
    try {
      const data = await AsyncStorage.getItem('power_ups');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          powerUps: DEFAULT_POWERUPS.map(p => ({
            ...p,
            count: parsed[p.id] ?? p.count,
          })),
        });
      }
    } catch (error) {
      console.error('Failed to load power-ups:', error);
    }
  },
  
  savePowerUps: async () => {
    try {
      const { powerUps } = get();
      const data: Record<string, number> = {};
      powerUps.forEach(p => { data[p.id] = p.count; });
      await AsyncStorage.setItem('power_ups', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save power-ups:', error);
    }
  },
}));

export default usePowerUpsStore;
