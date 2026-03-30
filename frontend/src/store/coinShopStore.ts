// Coin Shop Store - Gerçek Google Play IAP Entegrasyonu
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// Google Play Console'da oluşturulacak ürün ID'leri
// ÖNEMLİ: Bu ID'leri Google Play Console'da da oluşturmalısın!
export const GOOGLE_PLAY_PRODUCT_IDS = [
  'coins_500',
  'coins_1200', 
  'coins_3000',
  'coins_8000',
];

// Ürün tanımları (Google Play'den fiyatlar dinamik gelecek)
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
  transactionId?: string;
  purchaseToken?: string;
}

interface CoinShopState {
  isConnected: boolean;
  products: typeof COIN_PRODUCTS;
  purchaseHistory: Purchase[];
  isPurchasing: boolean;
  error: string | null;
  iapProducts: any[]; // Google Play'den gelen ürünler
  
  // Actions
  initializeIAP: () => Promise<void>;
  purchaseCoins: (productKey: CoinProductKey, addCoins: (amount: number) => void) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  loadPurchaseHistory: () => Promise<void>;
  savePurchaseHistory: () => Promise<void>;
  finalizePurchase: (purchase: any) => Promise<void>;
}

// Processed transactions to prevent duplicates
const processedTransactions = new Set<string>();

export const useCoinShopStore = create<CoinShopState>((set, get) => ({
  isConnected: false,
  products: COIN_PRODUCTS,
  purchaseHistory: [],
  isPurchasing: false,
  error: null,
  iapProducts: [],
  
  initializeIAP: async () => {
    try {
      // Web'de IAP kullanılamaz, mock olarak işaretle
      if (Platform.OS === 'web') {
        console.log('[IAP] Web platform - using simulation mode');
        set({ isConnected: true });
        await get().loadPurchaseHistory();
        return;
      }
      
      // react-native-iap import
      const {
        initConnection,
        getProducts,
        purchaseUpdatedListener,
        purchaseErrorListener,
        finishTransaction,
      } = require('react-native-iap');
      
      // IAP bağlantısını başlat
      const connection = await initConnection();
      console.log('[IAP] Connection result:', connection);
      
      if (!connection) {
        console.warn('[IAP] Connection failed');
        set({ isConnected: false, error: 'Mağaza bağlantısı kurulamadı' });
        return;
      }
      
      // Ürünleri yükle
      try {
        const products = await getProducts({ skus: GOOGLE_PLAY_PRODUCT_IDS });
        console.log('[IAP] Products loaded:', products.length);
        
        // Ürün fiyatlarını güncelle (Google Play'den gelen fiyatlar)
        if (products.length > 0) {
          const updatedProducts = { ...COIN_PRODUCTS };
          
          products.forEach((product: any) => {
            const key = Object.keys(COIN_PRODUCTS).find(
              k => COIN_PRODUCTS[k as CoinProductKey].productId === product.productId
            );
            
            if (key) {
              updatedProducts[key as CoinProductKey] = {
                ...updatedProducts[key as CoinProductKey],
                price: product.localizedPrice || updatedProducts[key as CoinProductKey].price,
              };
            }
          });
          
          set({ products: updatedProducts, iapProducts: products });
        }
      } catch (productError) {
        console.warn('[IAP] Failed to load products:', productError);
        // Ürünler yüklenemese bile bağlantı başarılı
      }
      
      set({ isConnected: true });
      await get().loadPurchaseHistory();
      
    } catch (error: any) {
      console.error('[IAP] Initialization error:', error);
      set({ 
        error: 'Mağaza bağlantısı kurulamadı', 
        isConnected: false 
      });
    }
  },
  
  purchaseCoins: async (productKey, addCoins) => {
    const product = get().products[productKey];
    if (!product) return false;
    
    set({ isPurchasing: true, error: null });
    
    try {
      // Web'de simülasyon yap
      if (Platform.OS === 'web') {
        console.log('[IAP] Web simulation - purchasing:', product.productId);
        
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
      
      // ===== GERÇEK GOOGLE PLAY SATIN ALMA =====
      const { requestPurchase, finishTransaction } = require('react-native-iap');
      
      console.log('[IAP] Starting purchase:', product.productId);
      
      // Satın alma isteği gönder
      await requestPurchase({ 
        sku: product.productId,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
      
      // requestPurchase bir Promise döndürmez, purchaseUpdatedListener ile yakalanır
      // Bu yüzden burada bir bekleme yapıyoruz
      
      // Satın alma sonucunu bekle (30 saniye timeout)
      return new Promise((resolve) => {
        const {
          purchaseUpdatedListener,
          purchaseErrorListener,
          finishTransaction,
        } = require('react-native-iap');
        
        let resolved = false;
        
        // Timeout
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            set({ isPurchasing: false, error: 'Satın alma zaman aşımına uğradı' });
            resolve(false);
          }
        }, 30000);
        
        // Purchase success listener
        const purchaseUpdateSubscription = purchaseUpdatedListener(
          async (purchase: any) => {
            console.log('[IAP] Purchase update received:', purchase);
            
            if (resolved) return;
            
            // Duplicate check
            const transactionId = purchase.transactionId || purchase.purchaseToken;
            if (processedTransactions.has(transactionId)) {
              console.log('[IAP] Duplicate transaction, skipping');
              return;
            }
            
            try {
              // Transaction'ı işaretle
              processedTransactions.add(transactionId);
              
              // Coinleri ekle
              const totalCoins = product.coins + product.bonus;
              addCoins(totalCoins);
              
              // Geçmişe kaydet
              const purchaseRecord: Purchase = {
                id: transactionId,
                productId: product.productId,
                coins: totalCoins,
                price: product.price,
                date: new Date().toISOString(),
                platform: Platform.OS,
                transactionId: purchase.transactionId,
                purchaseToken: purchase.purchaseToken,
              };
              
              const history = [...get().purchaseHistory, purchaseRecord];
              set({ purchaseHistory: history });
              await get().savePurchaseHistory();
              
              // Google Play'e işlemi tamamla
              await finishTransaction({ 
                purchase, 
                isConsumable: true 
              });
              
              console.log('[IAP] Purchase completed successfully');
              
              resolved = true;
              clearTimeout(timeout);
              purchaseUpdateSubscription.remove();
              
              set({ isPurchasing: false });
              resolve(true);
              
            } catch (finishError) {
              console.error('[IAP] Error finishing transaction:', finishError);
              resolved = true;
              clearTimeout(timeout);
              set({ isPurchasing: false, error: 'İşlem tamamlanamadı' });
              resolve(false);
            }
          }
        );
        
        // Purchase error listener
        const purchaseErrorSubscription = purchaseErrorListener(
          (error: any) => {
            console.error('[IAP] Purchase error:', error);
            
            if (resolved) return;
            
            resolved = true;
            clearTimeout(timeout);
            purchaseUpdateSubscription.remove();
            purchaseErrorSubscription.remove();
            
            let errorMessage = 'Satın alma başarısız oldu';
            if (error.code === 'E_USER_CANCELLED') {
              errorMessage = 'Satın alma iptal edildi';
            } else if (error.code === 'E_ITEM_UNAVAILABLE') {
              errorMessage = 'Ürün kullanılamıyor';
            } else if (error.code === 'E_NETWORK_ERROR') {
              errorMessage = 'Bağlantı hatası';
            }
            
            set({ isPurchasing: false, error: errorMessage });
            resolve(false);
          }
        );
      });
      
    } catch (error: any) {
      console.error('[IAP] Purchase error:', error);
      set({ 
        isPurchasing: false, 
        error: error.message || 'Satın alma başarısız oldu'
      });
      return false;
    }
  },
  
  finalizePurchase: async (purchase: any) => {
    try {
      if (Platform.OS === 'web') return;
      
      const { finishTransaction } = require('react-native-iap');
      await finishTransaction({ purchase, isConsumable: true });
      console.log('[IAP] Purchase finalized');
    } catch (error) {
      console.error('[IAP] Failed to finalize purchase:', error);
    }
  },
  
  restorePurchases: async () => {
    if (Platform.OS === 'web') return;
    
    try {
      const { getAvailablePurchases } = require('react-native-iap');
      const purchases = await getAvailablePurchases();
      console.log('[IAP] Restored purchases:', purchases?.length || 0);
      
      // Consumable ürünler için restore genellikle boş döner
      // çünkü zaten tüketilmişlerdir
    } catch (error) {
      console.error('[IAP] Restore purchases error:', error);
    }
  },
  
  loadPurchaseHistory: async () => {
    try {
      const data = await AsyncStorage.getItem('purchase_history');
      if (data) {
        set({ purchaseHistory: JSON.parse(data) });
      }
    } catch (error) {
      console.error('[IAP] Failed to load purchase history:', error);
    }
  },
  
  savePurchaseHistory: async () => {
    try {
      const { purchaseHistory } = get();
      await AsyncStorage.setItem('purchase_history', JSON.stringify(purchaseHistory));
    } catch (error) {
      console.error('[IAP] Failed to save purchase history:', error);
    }
  },
}));

export default useCoinShopStore;
