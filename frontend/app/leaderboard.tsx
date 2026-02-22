import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface LeaderboardEntry {
  id: string;
  username: string;
  level: number;
  highScore: number;
  xp: number;
  rank: number;
}

type TabType = 'level' | 'score';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('level');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaderboard = async (sortBy: TabType) => {
    try {
      const response = await axios.get(`${API_URL}/api/leaderboard?sort_by=${sortBy}`);
      // Map backend field names to frontend
      const mapped = response.data.map((item: any, index: number) => ({
        id: item.id,
        username: item.username,
        level: item.level,
        highScore: item.high_score || item.highScore || 0,
        xp: item.xp,
        rank: item.rank || index + 1,
      }));
      setLeaderboard(mapped);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Show mock data if API fails
      setLeaderboard([
        { id: '1', username: 'BlockBuster', level: 8, highScore: 12500, xp: 800, rank: 1 },
        { id: '2', username: 'GameMaster2024', level: 6, highScore: 10200, xp: 450, rank: 2 },
        { id: '3', username: 'PuzzlePro', level: 3, highScore: 8900, xp: 200, rank: 3 },
        { id: '4', username: 'TestOyuncu', level: 1, highScore: 0, xp: 0, rank: 4 },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard(activeTab);
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return { icon: 'trophy', color: '#FFD700' };
      case 2:
        return { icon: 'medal', color: '#C0C0C0' };
      case 3:
        return { icon: 'medal', color: '#CD7F32' };
      default:
        return null;
    }
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const badge = getRankBadge(item.rank);

    return (
      <View style={styles.leaderboardItem}>
        <View style={styles.rankContainer}>
          {badge ? (
            <Ionicons name={badge.icon as any} size={28} color={badge.color} />
          ) : (
            <Text style={styles.rankNumber}>{item.rank}</Text>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarText}>
              {item.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.userXP}>{item.xp.toLocaleString()} XP</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {activeTab === 'level' ? (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{item.level}</Text>
            </View>
          ) : (
            <Text style={styles.scoreText}>{item.highScore.toLocaleString()}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liderlik Tablosu</Text>
        <View style={styles.backButton} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'level' && styles.activeTab]}
          onPress={() => setActiveTab('level')}
        >
          <Ionicons 
            name="star" 
            size={20} 
            color={activeTab === 'level' ? '#fff' : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'level' && styles.activeTabText]}>
            Seviye Sıralaması
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'score' && styles.activeTab]}
          onPress={() => setActiveTab('score')}
        >
          <Ionicons 
            name="trophy" 
            size={20} 
            color={activeTab === 'score' ? '#fff' : '#888'} 
          />
          <Text style={[styles.tabText, activeTab === 'score' && styles.activeTabText]}>
            Skor Sıralaması
          </Text>
        </TouchableOpacity>
      </View>

      {/* Leaderboard List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4ECDC4"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people" size={60} color="#444" />
              <Text style={styles.emptyText}>Henüz oyuncu yok</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#888',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userXP: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
});
