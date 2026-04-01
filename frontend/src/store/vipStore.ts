// VIP Subscription Store - Google Play IAP Entegrasyonu
// VIP kullanıcılar reklam görmez, VIP olmayanlar reklam görür
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

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
  activateTrialVIP: () => Promise<boolean>;
  canActivateTrial: () => boolean;
  setIAPStatus: (status: IAPStatus, error?: string) => void;
}

const VIP_PRODUCT_ID = 'vip_monthly';
const VIP_PRICE = '₺149.99/ay';
const SUBSCRIPTION_DAYS = 30;

// IAP modülünü dinamik olarak yükle
let RNIap: any = null;

const loadIAPModule = async () => {
  if (Platform.OS !== 'web' && !RNIap) {
    try {
      RNIap = await import('react-native-iap');
      console.log('[VIP] IAP modülü yüklendi');
    } catch (e) {
      console.log('[VIP] IAP modülü yüklenemedi:', e);
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
        
        // Abonelik süresi dolmuş mu kontrol et
        await get().checkSubscriptionExpiry();
      }
    } catch (error) {
      console.error('[VIP] Durum yüklenemedi:', error);
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
      console.log('[VIP] Durum kaydedildi, isVIP:', isVIP);
    } catch (error) {
      console.error('[VIP] Durum kaydedilemedi:', error);
    }
  },
  
  // IAP başlatma
  initializeIAP: async () => {
    if (Platform.OS === 'web') {
      console.log('[VIP] Web platformunda IAP desteklenmiyor');
      return;
    }
    
    const iap = await loadIAPModule();
    if (!iap) return;
    
    try {
      set({ iapStatus: 'loading' });
      
      await iap.initConnection();
      console.log('[VIP] IAP bağlantısı kuruldu');
      
      // Abonelik ürünlerini yükle
      const subscriptions = await iap.getSubscriptions({ skus: [VIP_PRODUCT_ID] });
      console.log('[VIP] Abonelikler:', subscriptions);
      
      // Satın alma dinleyicisi
      iap.purchaseUpdatedListener(async (purchase: any) => {
        console.log('[VIP] Satın alma güncellendi:', purchase);
        
        if (purchase.transactionReceipt) {
          // Google Play onayladı - VIP'i aktive et
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
          console.log('[VIP] VIP aktive edildi! Bitiş:', endDate.toISOString());
          
          // Satın almayı onayla
          await iap.finishTransaction({ purchase, isConsumable: false });
        }
      });
      
      iap.purchaseErrorListener((error: any) => {
        console.error('[VIP] Satın alma hatası:', error);
        set({ iapStatus: 'error', iapError: error.message });
      });
      
      set({ iapStatus: 'idle' });
    } catch (error: any) {
      console.error('[VIP] IAP başlatma hatası:', error);
      set({ iapStatus: 'error', iapError: error.message });
    }
  },
  
  purchaseVIP: async () => {
    const { iapStatus } = get();
    
    if (iapStatus === 'purchasing') {
      return false;
    }
    
    // Web'de satın alma yapılamaz
    if (Platform.OS === 'web') {
      Alert.alert(
        'Bilgi',
        'VIP abonelik satın alma sadece Google Play Store\'dan indirilen Android uygulamasında çalışır.\n\nBu özelliği kullanmak için uygulamayı Google Play\'den indirin.',
        [{ text: 'Tamam' }]
      );
      return false;
    }
    
    const iap = await loadIAPModule();
    if (!iap) {
      Alert.alert('Hata', 'Ödeme sistemi yüklenemedi. Lütfen tekrar deneyin.');
      return false;
    }
    
    try {
      set({ iapStatus: 'purchasing' });
      
      // Google Play abonelik ekranını aç
      await iap.requestSubscription({
        sku: VIP_PRODUCT_ID,
        andDangerouslyFinishTransactionAutomaticallyIOS: false,
      });
      
      // purchaseUpdatedListener'dan sonuç gelecek
      return true;
    } catch (error: any) {
      console.error('[VIP] Satın alma hatası:', error);
      
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
      console.log('[VIP] Mevcut satın almalar:', purchases);
      
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
      console.error('[VIP] Geri yükleme hatası:', error);
      set({ iapStatus: 'error', iapError: error.message });
      Alert.alert('Hata', 'Geri yükleme başarısız oldu.');
      return false;
    }
  },
  
  cancelVIP: async () => {
    set({ autoRenew: false });
    await get().saveVIPStatus();
    
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Abonelik İptali',
        'Aboneliğinizi iptal etmek için Google Play Store > Abonelikler bölümüne gidin.',
        [{ text: 'Tamam' }]
      );
    }
  },
  
  // Abonelik süresi kontrolü
  checkSubscriptionExpiry: async () => {
    const { subscriptionEndDate, autoRenew, isVIP } = get();
    
    if (!isVIP || !subscriptionEndDate) return false;
    
    const endDate = new Date(subscriptionEndDate);
    const now = new Date();
    
    if (now > endDate) {
      // Süre dolmuş
      console.log('[VIP] Abonelik süresi doldu');
      
      set({
        isVIP: false,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        autoRenew: false,
      });
      
      await get().saveVIPStatus();
      return false;
    }
    
    console.log('[VIP] Abonelik aktif, bitiş:', subscriptionEndDate);
    return true;
  },
  
  // 7 günlük streak için 1 günlük VIP deneme
  activateTrialVIP: async () => {
    const { hasUsedTrial, isVIP } = get();
    
    if (isVIP || hasUsedTrial) {
      console.log('[VIP] Deneme kullanılamaz - zaten VIP veya deneme kullanılmış');
      return false;
    }
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 1); // 1 gün
    
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
    console.log('[VIP] 1 günlük deneme aktive edildi!');
    return true;
  },
  
  canActivateTrial: () => {
    const { hasUsedTrial, isVIP } = get();
    return !hasUsedTrial && !isVIP;
  },
}));

export default useVIPStore;
