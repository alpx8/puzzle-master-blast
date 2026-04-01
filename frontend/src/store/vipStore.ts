// VIP Subscription Store - Google Play IAP Entegrasyonu
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

// IAP durumu
export type IAPStatus = 'idle' | 'loading' | 'purchasing' | 'success' | 'error';

export interface VIPState {
  isVIP: boolean;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  autoRenew: boolean;
  price: string;
  productId: string;
  hasUsedTrial: boolean;
  trialEndDate: string | null;
  iapStatus: IAPStatus;
  iapError: string | null;
  
  // Actions
  loadVIPStatus: () => Promise<void>;
  saveVIPStatus: () => Promise<void>;
  initializeIAP: () => Promise<void>;
  purchaseVIP: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  cancelVIP: () => Promise<void>;
  checkSubscriptionExpiry: () => Promise<boolean>;
  setVIPStatus: (isVIP: boolean, endDate?: string) => void;
  activateTrialVIP: () => Promise<boolean>;
  canActivateTrial: () => boolean;
  setIAPStatus: (status: IAPStatus, error?: string) => void;
}

const VIP_PRODUCT_ID = 'vip_monthly';
const VIP_PRICE = '₺149.99/ay';
const SUBSCRIPTION_DAYS = 30;

// IAP modülünü dinamik olarak yükle (web'de hata vermemesi için)
let RNIap: any = null;

const loadIAPModule = async () => {
  if (Platform.OS !== 'web' && !RNIap) {
    try {
      RNIap = await import('react-native-iap');
      console.log('[VIP] IAP module loaded');
    } catch (e) {
      console.log('[VIP] IAP module not available:', e);
    }
  }
  return RNIap;
};

export const useVIPStore = create<VIPState>((set, get) => ({
  isVIP: false,
  subscriptionStartDate: null,
  subscriptionEndDate: null,
  autoRenew: true,
  price: VIP_PRICE,
  productId: VIP_PRODUCT_ID,
  hasUsedTrial: false,
  trialEndDate: null,
  iapStatus: 'idle',
  iapError: null,
  
  setIAPStatus: (status: IAPStatus, error?: string) => {
    set({ iapStatus: status, iapError: error || null });
  },
  
  loadVIPStatus: async () => {
    try {
      const data = await AsyncStorage.getItem('vip_subscription');
      if (data) {
        const parsed = JSON.parse(data);
        set({
          isVIP: parsed.isVIP || false,
          subscriptionStartDate: parsed.subscriptionStartDate || null,
          subscriptionEndDate: parsed.subscriptionEndDate || null,
          autoRenew: parsed.autoRenew !== false,
          hasUsedTrial: parsed.hasUsedTrial || false,
          trialEndDate: parsed.trialEndDate || null,
        });
        
        await get().checkSubscriptionExpiry();
      }
    } catch (error) {
      console.error('Failed to load VIP status:', error);
    }
  },
  
  saveVIPStatus: async () => {
    try {
      const { isVIP, subscriptionStartDate, subscriptionEndDate, autoRenew, hasUsedTrial, trialEndDate } = get();
      await AsyncStorage.setItem('vip_subscription', JSON.stringify({
        isVIP,
        subscriptionStartDate,
        subscriptionEndDate,
        autoRenew,
        hasUsedTrial,
        trialEndDate,
      }));
    } catch (error) {
      console.error('Failed to save VIP status:', error);
    }
  },
  
  // IAP başlatma
  initializeIAP: async () => {
    if (Platform.OS === 'web') {
      console.log('[VIP] IAP not available on web');
      return;
    }
    
    const iap = await loadIAPModule();
    if (!iap) return;
    
    try {
      set({ iapStatus: 'loading' });
      
      // IAP bağlantısını başlat
      await iap.initConnection();
      console.log('[VIP] IAP connection initialized');
      
      // Abonelik ürünlerini yükle
      const subscriptions = await iap.getSubscriptions({ skus: [VIP_PRODUCT_ID] });
      console.log('[VIP] Available subscriptions:', subscriptions);
      
      // Satın alma dinleyicisini kur
      iap.purchaseUpdatedListener(async (purchase: any) => {
        console.log('[VIP] Purchase updated:', purchase);
        
        if (purchase.transactionReceipt) {
          // Satın alma başarılı - VIP'i aktive et
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS);
          
          set({
            isVIP: true,
            subscriptionStartDate: startDate.toISOString(),
            subscriptionEndDate: endDate.toISOString(),
            autoRenew: true,
            iapStatus: 'success',
          });
          
          await get().saveVIPStatus();
          
          // Satın almayı onayla
          await iap.finishTransaction({ purchase, isConsumable: false });
        }
      });
      
      iap.purchaseErrorListener((error: any) => {
        console.error('[VIP] Purchase error:', error);
        set({ iapStatus: 'error', iapError: error.message });
      });
      
      set({ iapStatus: 'idle' });
    } catch (error: any) {
      console.error('[VIP] IAP init error:', error);
      set({ iapStatus: 'error', iapError: error.message });
    }
  },
  
  purchaseVIP: async () => {
    const { iapStatus } = get();
    
    // Zaten satın alma işleminde
    if (iapStatus === 'purchasing') {
      return false;
    }
    
    // Web'de satın alma yapılamaz - bilgilendirme göster
    if (Platform.OS === 'web') {
      console.log('[VIP] Web platform - cannot process real purchase');
      Alert.alert(
        'Bilgi',
        'VIP abonelik satın alma sadece Android uygulamasında çalışır.\n\nGoogle Play Store\'dan indirdiğiniz uygulamada bu özelliği kullanabilirsiniz.',
        [{ text: 'Tamam' }]
      );
      return false;
    }
    
    // Native'de gerçek IAP
    const iap = await loadIAPModule();
    if (!iap) {
      Alert.alert('Hata', 'Ödeme sistemi yüklenemedi. Lütfen tekrar deneyin.');
      return false;
    }
    
    try {
      set({ iapStatus: 'purchasing' });
      
      // Google Play abonelik satın alma ekranını aç
      await iap.requestSubscription({
        sku: VIP_PRODUCT_ID,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
      
      // Satın alma başlatıldı - listener'dan sonuç gelecek
      // purchaseUpdatedListener içinde VIP aktive edilecek
      return true;
    } catch (error: any) {
      console.error('[VIP] Purchase error:', error);
      
      let errorMessage = 'Satın alma işlemi başarısız oldu.';
      
      if (error.code === 'E_USER_CANCELLED') {
        errorMessage = 'Satın alma iptal edildi.';
      } else if (error.code === 'E_ITEM_UNAVAILABLE') {
        errorMessage = 'Bu ürün şu anda mevcut değil.';
      } else if (error.code === 'E_NETWORK_ERROR') {
        errorMessage = 'İnternet bağlantınızı kontrol edin.';
      }
      
      set({ iapStatus: 'error', iapError: errorMessage });
      Alert.alert('Hata', errorMessage);
      return false;
    }
  },
  
  // Satın alımları geri yükle
  restorePurchases: async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Bilgi', 'Geri yükleme sadece Android uygulamasında çalışır.');
      return false;
    }
    
    const iap = await loadIAPModule();
    if (!iap) return false;
    
    try {
      set({ iapStatus: 'loading' });
      
      const purchases = await iap.getAvailablePurchases();
      console.log('[VIP] Available purchases:', purchases);
      
      // VIP aboneliği bul
      const vipPurchase = purchases.find((p: any) => p.productId === VIP_PRODUCT_ID);
      
      if (vipPurchase) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS);
        
        set({
          isVIP: true,
          subscriptionStartDate: startDate.toISOString(),
          subscriptionEndDate: endDate.toISOString(),
          autoRenew: true,
          iapStatus: 'success',
        });
        
        await get().saveVIPStatus();
        Alert.alert('Başarılı', 'VIP üyeliğiniz geri yüklendi!');
        return true;
      } else {
        set({ iapStatus: 'idle' });
        Alert.alert('Bilgi', 'Geri yüklenecek VIP üyelik bulunamadı.');
        return false;
      }
    } catch (error: any) {
      console.error('[VIP] Restore error:', error);
      set({ iapStatus: 'error', iapError: error.message });
      Alert.alert('Hata', 'Geri yükleme başarısız oldu.');
      return false;
    }
  },
  
  cancelVIP: async () => {
    set({ autoRenew: false });
    await get().saveVIPStatus();
    
    // Google Play'de abonelik iptali için kullanıcıyı yönlendir
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Abonelik İptali',
        'Aboneliğinizi iptal etmek için Google Play Store > Abonelikler bölümüne gidin.',
        [{ text: 'Tamam' }]
      );
    }
  },
  
  checkSubscriptionExpiry: async () => {
    const { subscriptionEndDate, autoRenew, isVIP } = get();
    
    if (!isVIP || !subscriptionEndDate) return false;
    
    const endDate = new Date(subscriptionEndDate);
    const now = new Date();
    
    if (now > endDate) {
      if (autoRenew) {
        // Google Play otomatik yenileme yapacak
        // Burada sadece lokal kontrolü yapıyoruz
        console.log('[VIP] Subscription may need renewal - Google Play will handle');
        return true;
      } else {
        console.log('[VIP] Subscription expired, removing VIP status');
        
        set({
          isVIP: false,
          subscriptionStartDate: null,
          subscriptionEndDate: null,
        });
        
        await get().saveVIPStatus();
        return false;
      }
    }
    
    return true;
  },
  
  setVIPStatus: (isVIP: boolean, endDate?: string) => {
    if (isVIP && endDate) {
      set({
        isVIP: true,
        subscriptionStartDate: new Date().toISOString(),
        subscriptionEndDate: endDate,
        autoRenew: true,
        iapStatus: 'success',
      });
    } else {
      set({
        isVIP: false,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        autoRenew: false,
        iapStatus: 'idle',
      });
    }
    get().saveVIPStatus();
  },
  
  activateTrialVIP: async () => {
    const { hasUsedTrial, isVIP } = get();
    
    if (isVIP || hasUsedTrial) {
      console.log('[VIP] Trial not available - already VIP or trial used');
      return false;
    }
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1);
    
    set({
      isVIP: true,
      subscriptionStartDate: startDate.toISOString(),
      subscriptionEndDate: endDate.toISOString(),
      trialEndDate: endDate.toISOString(),
      hasUsedTrial: true,
      autoRenew: false,
      iapStatus: 'success',
    });
    
    await get().saveVIPStatus();
    console.log('[VIP] 1-day trial activated!');
    return true;
  },
  
  canActivateTrial: () => {
    const { hasUsedTrial, isVIP } = get();
    return !hasUsedTrial && !isVIP;
  },
}));

export default useVIPStore;
