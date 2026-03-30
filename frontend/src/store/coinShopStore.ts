// Coin Shop Store - Gerçek para ile coin satın alma
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Google Play Product IDs
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
  
  // Actions
  initializeIAP: () => Promise<void>;
  purchaseCoins: (productKey: CoinProductKey, addCoins: (amount: number) => void) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  loadPurchaseHistory: () => Promise<void>;
  savePurchaseHistory: () => Promise<void>;
}

export const useCoinShopStore = create<CoinShopState>((set, get) => ({
  isConnected: false,
  products: COIN_PRODUCTS,
  purchaseHistory: [],
  isPurchasing: false,
  error: null,
  
  initializeIAP: async () => {
    try {
      // Web'de IAP kullanılamaz, mock olarak işaretle
      if (Platform.OS === 'web') {
        set({ isConnected: true });
        await get().loadPurchaseHistory();
        return;
      }
      
      // Native için expo-in-app-purchases kullan
      const InAppPurchases = require('expo-in-app-purchases');
      await InAppPurchases.connectAsync();
      
      // Ürünleri yükle
      const productIds = Object.values(COIN_PRODUCTS).map(p => p.productId);
      await InAppPurchases.getProductsAsync(productIds);
      
      // Purchase listener
      InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }: any) => {
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          results?.forEach(async (purchase: any) => {
            if (!purchase.acknowledged) {
              await InAppPurchases.finishTransactionAsync(purchase, true);
            }
          });
        }
      });
      
      set({ isConnected: true });
      await get().loadPurchaseHistory();
    } catch (error) {
      console.error('IAP initialization error:', error);
      set({ error: 'Mağaza bağlantısı kurulamadı', isConnected: false });
    }
  },
  
  purchaseCoins: async (productKey, addCoins) => {
    const product = COIN_PRODUCTS[productKey];
    if (!product) return false;
    
    set({ isPurchasing: true, error: null });
    
    try {
      // Web'de simülasyon yap
      if (Platform.OS === 'web') {
        // Simüle edilmiş satın alma (2 saniye bekle)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const totalCoins = product.coins + product.bonus;
        addCoins(totalCoins);
        
        // Satın alma geçmişine ekle
        const purchase: Purchase = {
          id: `web_${Date.now()}`,
          productId: product.productId,
          coins: totalCoins,
          price: product.price,
          date: new Date().toISOString(),
          platform: 'web_simulation',
        };
        
        const history = [...get().purchaseHistory, purchase];
        set({ purchaseHistory: history, isPurchasing: false });
        await get().savePurchaseHistory();
        
        return true;
      }
      
      // Native satın alma
      const InAppPurchases = require('expo-in-app-purchases');
      const { responseCode, results } = await InAppPurchases.purchaseItemAsync(product.productId);
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results?.length > 0) {
        const totalCoins = product.coins + product.bonus;
        addCoins(totalCoins);
        
        const purchase: Purchase = {
          id: results[0].transactionId || `native_${Date.now()}`,
          productId: product.productId,
          coins: totalCoins,
          price: product.price,
          date: new Date().toISOString(),
          platform: Platform.OS,
        };
        
        const history = [...get().purchaseHistory, purchase];
        set({ purchaseHistory: history, isPurchasing: false });
        await get().savePurchaseHistory();
        
        // İşlemi tamamla
        await InAppPurchases.finishTransactionAsync(results[0], true);
        
        return true;
      }
      
      set({ isPurchasing: false, error: 'Satın alma iptal edildi' });
      return false;
    } catch (error: any) {
      console.error('Purchase error:', error);
      set({ 
        isPurchasing: false, 
        error: error.message || 'Satın alma başarısız oldu'
      });
      return false;
    }
  },
  
  restorePurchases: async () => {
    if (Platform.OS === 'web') return;
    
    try {
      const InAppPurchases = require('expo-in-app-purchases');
      const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync();
      
      if (responseCode === InAppPurchases.IAPResponseCode.OK) {
        console.log('Purchases restored:', results?.length || 0);
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
    }
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
