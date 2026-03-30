// User Sync Service - MongoDB ile senkronizasyon
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const configUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
  return envUrl || configUrl || 'https://puzzle-game-56.preview.emergentagent.com';
};

const API_URL = getApiUrl();

export interface UserProfile {
  id: string;
  username: string;
  coins: number;
  level: number;
  xp: number;
  xp_to_next_level: number;
  high_score: number;
  owned_themes: string[];
  owned_backgrounds: string[];
  active_theme: string;
  active_background: string;
  power_ups: Record<string, number>;
  total_games: number;
  total_wins: number;
  win_streak: number;
  best_win_streak: number;
}

export interface SyncData {
  user_id: string;
  username: string;
  coins: number;
  level: number;
  xp: number;
  high_score: number;
  owned_themes: string[];
  owned_backgrounds: string[];
  active_theme: string;
  active_background: string;
  power_ups: Record<string, number>;
  total_games: number;
  total_wins: number;
  win_streak: number;
  best_win_streak: number;
}

class UserSyncService {
  private syncInProgress = false;
  private lastSyncTime = 0;
  private SYNC_COOLDOWN = 5000; // 5 seconds between syncs

  /**
   * Get or create user profile from server
   */
  async getOrCreateProfile(userId: string, username: string): Promise<UserProfile | null> {
    try {
      const response = await axios.post(`${API_URL}/api/profiles`, {
        user_id: userId,
        username: username
      }, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get/create profile:', error);
      return null;
    }
  }

  /**
   * Get user profile from server
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const response = await axios.get(`${API_URL}/api/profiles/${userId}`, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get profile:', error);
      return null;
    }
  }

  /**
   * Sync full user data to server
   */
  async syncToServer(data: SyncData): Promise<UserProfile | null> {
    // Prevent concurrent syncs
    if (this.syncInProgress) {
      console.log('Sync already in progress, skipping...');
      return null;
    }

    // Cooldown check
    const now = Date.now();
    if (now - this.lastSyncTime < this.SYNC_COOLDOWN) {
      console.log('Sync cooldown active, skipping...');
      return null;
    }

    this.syncInProgress = true;
    this.lastSyncTime = now;

    try {
      const response = await axios.put(
        `${API_URL}/api/profiles/${data.user_id}/sync`,
        data,
        { timeout: 15000 }
      );
      
      console.log('Profile synced to server successfully');
      return response.data;
    } catch (error) {
      console.error('Failed to sync profile to server:', error);
      return null;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Add coins to user profile
   */
  async addCoins(userId: string, amount: number, reason: string = 'reward'): Promise<number | null> {
    try {
      const response = await axios.post(
        `${API_URL}/api/profiles/${userId}/coins`,
        { amount, reason },
        { timeout: 10000 }
      );
      
      return response.data.coins;
    } catch (error) {
      console.error('Failed to add coins:', error);
      return null;
    }
  }

  /**
   * Update power-up quantity
   */
  async updatePowerUp(userId: string, powerUpId: string, quantity: number): Promise<boolean> {
    try {
      await axios.post(
        `${API_URL}/api/profiles/${userId}/powerups`,
        { power_up_id: powerUpId, quantity },
        { timeout: 10000 }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update power-up:', error);
      return false;
    }
  }

  /**
   * Get game results for user
   */
  async getGameResults(userId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${API_URL}/api/game_results/${userId}`,
        { timeout: 10000 }
      );
      
      return response.data || [];
    } catch (error) {
      console.error('Failed to get game results:', error);
      return [];
    }
  }

  /**
   * Submit score to server
   */
  async submitScore(userId: string, username: string, score: number, level: number, gameMode: string): Promise<boolean> {
    try {
      await axios.post(
        `${API_URL}/api/scores`,
        {
          user_id: userId,
          username: username,
          score: score,
          level: level,
          game_mode: gameMode
        },
        { timeout: 10000 }
      );
      
      return true;
    } catch (error) {
      console.error('Failed to submit score:', error);
      return false;
    }
  }

  /**
   * Merge server profile with local data
   * Server wins for: total_games, total_wins, high_score, best_win_streak
   * Local wins for: coins (use higher), themes, power_ups
   */
  mergeProfiles(serverProfile: UserProfile, localData: Partial<SyncData>): UserProfile {
    return {
      ...serverProfile,
      coins: Math.max(serverProfile.coins, localData.coins || 0),
      level: Math.max(serverProfile.level, localData.level || 1),
      xp: localData.xp || serverProfile.xp,
      high_score: Math.max(serverProfile.high_score, localData.high_score || 0),
      owned_themes: [...new Set([...serverProfile.owned_themes, ...(localData.owned_themes || [])])],
      owned_backgrounds: [...new Set([...serverProfile.owned_backgrounds, ...(localData.owned_backgrounds || [])])],
      active_theme: localData.active_theme || serverProfile.active_theme,
      active_background: localData.active_background || serverProfile.active_background,
      power_ups: {
        ...serverProfile.power_ups,
        ...localData.power_ups
      },
      total_games: Math.max(serverProfile.total_games, localData.total_games || 0),
      total_wins: Math.max(serverProfile.total_wins, localData.total_wins || 0),
      win_streak: serverProfile.win_streak,
      best_win_streak: Math.max(serverProfile.best_win_streak, localData.best_win_streak || 0)
    };
  }
}

export const userSyncService = new UserSyncService();
export default userSyncService;
