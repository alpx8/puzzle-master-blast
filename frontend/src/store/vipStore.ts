// VIP Subscription Store - Abonelik yönetimi
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface VIPState {
  isVIP: boolean;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  autoRenew: boolean;
  price: string;
  productId: string;
  
  // Actions
  loadVIPStatus: () => Promise<void>;
  saveVIPStatus: () => Promise<void>;
  purchaseVIP: () => Promise<boolean>;
  cancelVIP: () => Promise<void>;
  checkSubscriptionExpiry: () => Promise<boolean>;
  setVIPStatus: (isVIP: boolean, endDate?: string) => void;
}

const VIP_PRODUCT_ID = 'vip_monthly';
const VIP_PRICE = '₺149.99/ay';
const SUBSCRIPTION_DAYS = 30;

export const useVIPStore = create<VIPState>((set, get) => ({
  isVIP: false,
  subscriptionStartDate: null,
  subscriptionEndDate: null,
  autoRenew: true,
  price: VIP_PRICE,
  productId: VIP_PRODUCT_ID,
  
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
        });
        
        // Abonelik süresi dolmuş mu kontrol et
        await get().checkSubscriptionExpiry();
      }
    } catch (error) {
      console.error('Failed to load VIP status:', error);
    }
  },
  
  saveVIPStatus: async () => {
    try {
      const { isVIP, subscriptionStartDate, subscriptionEndDate, autoRenew } = get();
      await AsyncStorage.setItem('vip_subscription', JSON.stringify({
        isVIP,
        subscriptionStartDate,
        subscriptionEndDate,
        autoRenew,
      }));
    } catch (error) {
      console.error('Failed to save VIP status:', error);
    }
  },
  
  purchaseVIP: async () => {
    // Web'de simülasyon
    if (Platform.OS === 'web') {
      console.log('[VIP] Web simulation - purchasing VIP subscription');
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS);
      
      set({
        isVIP: true,
        subscriptionStartDate: startDate.toISOString(),
        subscriptionEndDate: endDate.toISOString(),
        autoRenew: true,
      });
      
      await get().saveVIPStatus();
      return true;
    }
    
    // Native'de gerçek IAP (Google Play Subscriptions)
    try {
      // react-native-iap subscription satın alma
      // Bu kısım gerçek cihazda çalışacak
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + SUBSCRIPTION_DAYS);
      
      set({
        isVIP: true,
        subscriptionStartDate: startDate.toISOString(),
        subscriptionEndDate: endDate.toISOString(),
        autoRenew: true,
      });
      
      await get().saveVIPStatus();
      return true;
    } catch (error) {
      console.error('[VIP] Purchase error:', error);
      return false;
    }
  },
  
  cancelVIP: async () => {
    set({ autoRenew: false });
    await get().saveVIPStatus();
  },
  
  checkSubscriptionExpiry: async () => {
    const { subscriptionEndDate, autoRenew, isVIP } = get();
    
    if (!isVIP || !subscriptionEndDate) return false;
    
    const endDate = new Date(subscriptionEndDate);
    const now = new Date();
    
    if (now > endDate) {
      // Abonelik süresi dolmuş
      if (autoRenew) {
        // Otomatik yenileme simülasyonu (gerçekte Google Play yapar)
        console.log('[VIP] Auto-renewing subscription');
        
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + SUBSCRIPTION_DAYS);
        
        set({
          subscriptionEndDate: newEndDate.toISOString(),
        });
        
        await get().saveVIPStatus();
        return true;
      } else {
        // Abonelik iptal edilmiş, VIP'i kaldır
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
      });
    } else {
      set({
        isVIP: false,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        autoRenew: false,
      });
    }
    get().saveVIPStatus();
  },
}));

export default useVIPStore;
