// Rewarded Ad Service - En yüksek gelirli reklam türü
import { Platform } from 'react-native';
import { getAdUnitId } from '../config/admobConfig';

class RewardedAdService {
  private rewardedAd: any = null;
  private isLoading = false;
  private isReady = false;
  private onRewardEarned: ((reward: { type: string; amount: number }) => void) | null = null;

  async initialize(): Promise<void> {
    if (Platform.OS === 'web') return;
    
    try {
      await this.loadAd();
    } catch (error) {
      console.warn('[RewardedAd] Init failed:', error);
    }
  }

  async loadAd(): Promise<void> {
    if (Platform.OS === 'web' || this.isLoading || this.isReady) return;

    try {
      const { RewardedAd, RewardedAdEventType, AdEventType } = await import('react-native-google-mobile-ads');
      
      this.isLoading = true;
      const adUnitId = getAdUnitId('REWARDED');
      
      this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
        keywords: ['puzzle', 'game', 'casual'],
      });

      this.rewardedAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('[RewardedAd] Loaded');
        this.isLoading = false;
        this.isReady = true;
      });

      this.rewardedAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.warn('[RewardedAd] Error:', error);
        this.isLoading = false;
        this.isReady = false;
        setTimeout(() => this.loadAd(), 30000);
      });

      this.rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
        console.log('[RewardedAd] Reward earned:', reward);
        if (this.onRewardEarned) {
          this.onRewardEarned(reward);
        }
      });

      this.rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('[RewardedAd] Closed');
        this.isReady = false;
        this.loadAd();
      });

      this.rewardedAd.load();
    } catch (error) {
      console.warn('[RewardedAd] Load failed:', error);
      this.isLoading = false;
    }
  }

  async showAd(onReward: (reward: { type: string; amount: number }) => void): Promise<boolean> {
    if (Platform.OS === 'web') {
      // Web'de simüle et
      onReward({ type: 'extra_life', amount: 1 });
      return true;
    }

    if (!this.isReady || !this.rewardedAd) {
      console.log('[RewardedAd] Not ready');
      return false;
    }

    this.onRewardEarned = onReward;
    
    try {
      await this.rewardedAd.show();
      this.isReady = false;
      return true;
    } catch (error) {
      console.warn('[RewardedAd] Show failed:', error);
      return false;
    }
  }

  isAdReady(): boolean {
    return Platform.OS === 'web' ? true : this.isReady;
  }
}

export const rewardedAdService = new RewardedAdService();
export default rewardedAdService;
