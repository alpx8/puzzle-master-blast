// Coin Shop Store - Pure simulation for web/preview
// Real IAP will be handled by ShopModal on native builds
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Ürün tanımları
export const COIN_PRODUCTS = {
  COINS_500: {
    productId: 'coins_500',
    coins: 500,
    bonus: 0,
    price: '₺19.99',
    priceValue: 19.99,
    popular: false,
    bestValue: false,
  },
  COINS_1200: {
    productId: 'coins_1200',
    coins: 1000,
    bonus: 200,
    price: '₺39.99',
    priceValue: 39.99,
    popular: true,
    bestValue: false,
  },
  COINS_3000: {
    productId: 'coins_3000',
    coins: 2000,
    bonus: 1000,
    price: '₺79.99',
    priceValue: 79.99,
    popular: false,
    bestValue: false,
  },
  COINS_8000: {
    productId: 'coins_8000',
    coins: 4000,
    bonus: 4000,
    price: '₺149.99',
    priceValue: 149.99,
    popular: false,
    bestValue: true,
  },
};

export type CoinProductKey = keyof typeof COIN_PRODUCTS;

interface Purchase {
  id: string;
  productId: string;
  coins: number;
  price: string;
  date: string;
  platform: string;
}

interface CoinShopState {
  isConnected: boolean;
  products: typeof COIN_PRODUCTS;
  purchaseHistory: Purchase[];
  isPurchasing: boolean;
  error: string | null;
  
  initializeIAP: () => Promise<void>;
  purchaseCoins: (productKey: CoinProductKey, addCoins: (amount: number) => void) => Promise<boolean>;
  loadPurchaseHistory: () => Promise<void>;
  savePurchaseHistory: () => Promise<void>;
}

export const useCoinShopStore = create<CoinShopState>((set, get) => ({
  isConnected: true,
  products: COIN_PRODUCTS,
  purchaseHistory: [],
  isPurchasing: false,
  error: null,
  
  initializeIAP: async () => {
    set({ isConnected: true });
    await get().loadPurchaseHistory();
  },
  
  purchaseCoins: async (productKey, addCoins) => {
    const product = get().products[productKey];
    if (!product) return false;
    
    set({ isPurchasing: true, error: null });
    
    // Simülasyon modu (web ve preview için)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const totalCoins = product.coins + product.bonus;
    addCoins(totalCoins);
    
    const purchase: Purchase = {
      id: `sim_${Date.now()}`,
      productId: product.productId,
      coins: totalCoins,
      price: product.price,
      date: new Date().toISOString(),
      platform: Platform.OS,
    };
    
    const history = [...get().purchaseHistory, purchase];
    set({ purchaseHistory: history, isPurchasing: false });
    await get().savePurchaseHistory();
    
    return true;
  },
  
  loadPurchaseHistory: async () => {
    try {
      const data = await AsyncStorage.getItem('purchase_history');
      if (data) {
        set({ purchaseHistory: JSON.parse(data) });
      }
    } catch (error) {
      console.error('Failed to load purchase history:', error);
    }
  },
  
  savePurchaseHistory: async () => {
    try {
      const { purchaseHistory } = get();
      await AsyncStorage.setItem('purchase_history', JSON.stringify(purchaseHistory));
    } catch (error) {
      console.error('Failed to save purchase history:', error);
    }
  },
}));

export default useCoinShopStore;
