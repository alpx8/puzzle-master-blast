// AdMob Service - Handles ad initialization and management
import { Platform } from 'react-native';
import { AdMobConfig, getAdUnitId } from '../config/admobConfig';

// Type definitions for react-native-google-mobile-ads
// Note: This service provides mock implementations for web/development
// Real AdMob functionality requires native builds (EAS Build)

interface AdEventCallback {
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: any) => void;
  onAdOpened?: () => void;
  onAdClosed?: () => void;
  onAdClicked?: () => void;
}

class AdMobService {
  private isInitialized = false;
  private lastInterstitialTime = 0;
  private gameOverCount = 0;
  private interstitialAd: any = null;
  private isInterstitialLoading = false;
  private isInterstitialReady = false;

  // Initialize the AdMob SDK
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[AdMob] Already initialized');
      return;
    }

    try {
      // Check if we're running in a native environment
      if (Platform.OS === 'web') {
        console.log('[AdMob] Web platform detected - ads disabled');
        this.isInitialized = true;
        return;
      }

      // Dynamic import to avoid errors on web
      const mobileAds = await import('react-native-google-mobile-ads');
      const { default: MobileAds, MaxAdContentRating } = mobileAds;

      // Set request configuration
      await MobileAds().setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        testDeviceIdentifiers: AdMobConfig.testDeviceIds,
      });

      // Initialize the SDK
      await MobileAds().initialize();
      
      this.isInitialized = true;
      console.log('[AdMob] SDK initialized successfully');

      // Preload first interstitial
      this.loadInterstitial();
    } catch (error) {
      console.warn('[AdMob] Initialization failed (expected on web):', error);
      this.isInitialized = true; // Mark as initialized to prevent retries
    }
  }

  // Load an interstitial ad
  async loadInterstitial(): Promise<void> {
    if (Platform.OS === 'web' || this.isInterstitialLoading || this.isInterstitialReady) {
      return;
    }

    try {
      const { InterstitialAd, AdEventType } = await import('react-native-google-mobile-ads');
      
      this.isInterstitialLoading = true;
      const adUnitId = getAdUnitId('INTERSTITIAL');
      
      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        keywords: AdMobConfig.keywords,
      });

      // Set up event listeners
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[AdMob] Interstitial loaded');
        this.isInterstitialLoading = false;
        this.isInterstitialReady = true;
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('[AdMob] Interstitial load error:', error);
        this.isInterstitialLoading = false;
        this.isInterstitialReady = false;
        // Retry after delay
        setTimeout(() => this.loadInterstitial(), 30000);
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[AdMob] Interstitial closed');
        this.isInterstitialReady = false;
        // Reload for next time
        this.loadInterstitial();
      });

      this.interstitialAd.load();
    } catch (error) {
      console.warn('[AdMob] Failed to load interstitial:', error);
      this.isInterstitialLoading = false;
    }
  }

  // Show interstitial ad if conditions are met
  async showInterstitialIfReady(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('[AdMob] Web platform - skipping interstitial');
      return false;
    }

    const now = Date.now();
    const timeSinceLastAd = now - this.lastInterstitialTime;
    
    // Check minimum interval
    if (timeSinceLastAd < AdMobConfig.interstitial.minIntervalMs) {
      console.log('[AdMob] Too soon since last interstitial');
      return false;
    }

    // Check game over count
    this.gameOverCount++;
    if (this.gameOverCount < AdMobConfig.interstitial.showAfterGameOvers) {
      console.log(`[AdMob] Game over count: ${this.gameOverCount}/${AdMobConfig.interstitial.showAfterGameOvers}`);
      return false;
    }

    // Try to show ad
    if (this.isInterstitialReady && this.interstitialAd) {
      try {
        await this.interstitialAd.show();
        this.lastInterstitialTime = now;
        this.gameOverCount = 0;
        this.isInterstitialReady = false;
        console.log('[AdMob] Interstitial shown');
        return true;
      } catch (error) {
        console.warn('[AdMob] Failed to show interstitial:', error);
        return false;
      }
    }

    console.log('[AdMob] Interstitial not ready');
    return false;
  }

  // Reset game over counter (e.g., when starting a new session)
  resetGameOverCount(): void {
    this.gameOverCount = 0;
  }

  // Check if interstitial is ready
  isInterstitialAdReady(): boolean {
    return this.isInterstitialReady;
  }

  // Get initialization status
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
const admobService = new AdMobService();
export default admobService;
