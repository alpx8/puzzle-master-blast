// Offline support utility for Puzzle Master Blast
import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OfflineState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

// Hook to monitor network connectivity
export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<OfflineState>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });

    // Get initial state
    NetInfo.fetch().then((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
      });
    });

    return () => unsubscribe();
  }, []);

  return networkStatus;
};

// Check if device is online
export const checkOnlineStatus = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  } catch {
    return false;
  }
};

// Offline leaderboard cache
const OFFLINE_LEADERBOARD_KEY = 'offline_leaderboard_cache';
const OFFLINE_TOURNAMENT_KEY = 'offline_tournament_cache';

export interface CachedLeaderboardEntry {
  id: string;
  username: string;
  score: number;
  level: number;
  xp: number;
}

// Save leaderboard to offline cache
export const cacheLeaderboard = async (data: CachedLeaderboardEntry[]) => {
  try {
    await AsyncStorage.setItem(OFFLINE_LEADERBOARD_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.log('Failed to cache leaderboard:', e);
  }
};

// Get cached leaderboard
export const getCachedLeaderboard = async (): Promise<CachedLeaderboardEntry[] | null> => {
  try {
    const cached = await AsyncStorage.getItem(OFFLINE_LEADERBOARD_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 24 hours
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Save tournament data to offline cache
export const cacheTournament = async (data: any) => {
  try {
    await AsyncStorage.setItem(OFFLINE_TOURNAMENT_KEY, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));
  } catch (e) {
    console.log('Failed to cache tournament:', e);
  }
};

// Get cached tournament
export const getCachedTournament = async () => {
  try {
    const cached = await AsyncStorage.getItem(OFFLINE_TOURNAMENT_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      // Cache valid for 1 hour
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return data;
      }
    }
    return null;
  } catch {
    return null;
  }
};

// Mock offline leaderboard data
export const getOfflineLeaderboard = (): CachedLeaderboardEntry[] => {
  return [
    { id: '1', username: 'Sen', score: 0, level: 1, xp: 0 },
  ];
};

// Check if a game mode requires online
export const requiresOnline = (mode: string): boolean => {
  switch (mode) {
    case 'classic':
      return false; // Classic mode works offline
    case 'timed':
      return false; // Timed mode works offline
    case 'multiplayer':
      return true; // Multiplayer requires online
    case 'tournament':
      return true; // Tournament requires online for leaderboard sync
    default:
      return false;
  }
};
