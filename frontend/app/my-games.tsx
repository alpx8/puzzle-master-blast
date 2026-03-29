import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useGameStore } from '@/src/store/gameStore';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                process.env.EXPO_PUBLIC_BACKEND_URL || 
                'https://puzzle-game-56.preview.emergentagent.com';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface GameResult {
  id: string;
  result: 'win' | 'loss';
  opponent_name: string;
  my_score: number;
  opponent_score: number;
  created_at: string;
}

export default function MyGamesScreen() {
  const router = useRouter();
  const { userId, username } = useGameStore();
  const [games, setGames] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ wins: 0, losses: 0, totalGames: 0 });

  const fetchGames = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await axios.get(`${API_URL}/api/game_results/${userId}`);
      const results = response.data as GameResult[];
      setGames(results);
      
      // Calculate stats
      const wins = results.filter(g => g.result === 'win').length;
      const losses = results.filter(g => g.result === 'loss').length;
      setStats({ wins, losses, totalGames: results.length });
    } catch (error) {
      console.error('Error fetching games:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGames();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    
    return date.toLocaleDateString('tr-TR');
  };

  const renderGameItem = ({ item }: { item: GameResult }) => {
    const isWin = item.result === 'win';
    
    return (
      <View style={[styles.gameCard, isWin ? styles.winCard : styles.lossCard]}>
        <View style={styles.resultBadge}>
          <Ionicons 
            name={isWin ? 'trophy' : 'close-circle'} 
            size={24} 
            color={isWin ? '#FFD700' : '#FF6B6B'} 
          />
        </View>
        
        <View style={styles.gameInfo}>
          <View style={styles.gameHeader}>
            <Text style={[styles.resultText, isWin ? styles.winText : styles.lossText]}>
              {isWin ? 'GALİBİYET' : 'MAĞLUBİYET'}
            </Text>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
          
          <View style={styles.scoresContainer}>
            <View style={styles.playerScore}>
              <Text style={styles.playerName}>Sen</Text>
              <Text style={[styles.scoreValue, isWin && styles.winnerScore]}>
                {item.my_score}
              </Text>
            </View>
            
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            
            <View style={styles.playerScore}>
              <Text style={styles.playerName}>{item.opponent_name}</Text>
              <Text style={[styles.scoreValue, !isWin && styles.winnerScore]}>
                {item.opponent_score}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const winRate = stats.totalGames > 0 
    ? Math.round((stats.wins / stats.totalGames) * 100) 
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Oyunlarım</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Section */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.statValue}>{stats.wins}</Text>
          <Text style={styles.statLabel}>Galibiyet</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={24} color="#FF6B6B" />
          <Text style={styles.statValue}>{stats.losses}</Text>
          <Text style={styles.statLabel}>Mağlubiyet</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="stats-chart" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>%{winRate}</Text>
          <Text style={styles.statLabel}>Kazanma</Text>
        </View>
      </View>

      {/* Games List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Oyunlar yükleniyor...</Text>
        </View>
      ) : games.length > 0 ? (
        <FlatList
          data={games}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4ECDC4"
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="game-controller-outline" size={64} color="#444" />
          <Text style={styles.emptyTitle}>Henüz Oyun Yok</Text>
          <Text style={styles.emptySubtitle}>
            Çok oyunculu modda oynayarak maç geçmişinizi oluşturun!
          </Text>
          <TouchableOpacity 
            style={styles.playButton}
            onPress={() => router.push('/multiplayer')}
          >
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={styles.playButtonText}>Çok Oyunculu Oyna</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    minWidth: (SCREEN_WIDTH - 64) / 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  gameCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  winCard: {
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  lossCard: {
    borderColor: 'rgba(255, 107, 107, 0.3)',
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  resultBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  gameInfo: {
    flex: 1,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  winText: {
    color: '#FFD700',
  },
  lossText: {
    color: '#FF6B6B',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  scoresContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerScore: {
    alignItems: 'center',
    flex: 1,
  },
  playerName: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  winnerScore: {
    color: '#FFD700',
  },
  vsContainer: {
    paddingHorizontal: 12,
  },
  vsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
