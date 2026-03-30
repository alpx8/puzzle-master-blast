import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Switch,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/src/store/gameStore';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Get API URL from environment
const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const configUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
  return envUrl || configUrl || 'https://puzzle-game-56.preview.emergentagent.com';
};

const API_URL = getApiUrl();

interface Room {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  isPrivate: boolean;
  hasPassword: boolean;
}

interface GameResult {
  id: string;
  result: 'win' | 'loss';
  opponent_name: string;
  my_score: number;
  opponent_score: number;
  coins_earned?: number;
  xp_earned?: number;
  created_at: string;
}

type TabType = 'public' | 'private' | 'history';

export default function MultiplayerScreen() {
  const router = useRouter();
  const { username, userId } = useGameStore();
  const { totalCoins } = useDailyRewardsStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('public');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  
  // Quick Match states
  const [showQuickMatch, setShowQuickMatch] = useState(false);
  const [quickMatchStatus, setQuickMatchStatus] = useState<'idle' | 'searching' | 'found'>('idle');
  const [quickMatchSocket, setQuickMatchSocket] = useState<Socket | null>(null);
  const [searchTime, setSearchTime] = useState(0);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/rooms`);
      if (response.data && response.data.length > 0) {
        setRooms(response.data);
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchGameHistory = async () => {
    if (!userId) {
      setGameHistory([]);
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/api/game_results/${userId}`);
      setGameHistory(response.data || []);
    } catch (error) {
      console.error('Error fetching game history:', error);
      setGameHistory([]);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchGameHistory();
    
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  // Pulse animation for quick match
  useEffect(() => {
    if (quickMatchStatus === 'searching') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [quickMatchStatus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRooms();
    fetchGameHistory();
  }, []);

  const createRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Hata', 'Lütfen oda adı girin');
      return;
    }

    const playerName = username || 'Oyuncu' + Math.floor(Math.random() * 1000);
    const playerId = userId || 'user-' + Date.now();

    setCreating(true);
    try {
      const response = await axios.post(`${API_URL}/api/rooms`, {
        name: roomName,
        host_id: playerId,
        host_name: playerName,
        password: isPrivate ? roomPassword : null,
        is_private: isPrivate,
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      setShowCreateModal(false);
      setRoomName('');
      setRoomPassword('');
      setIsPrivate(false);
      
      if (response.data && response.data.id) {
        router.push(`/game-room?roomId=${response.data.id}&isHost=true`);
      } else {
        Alert.alert('Hata', 'Oda oluşturuldu ancak yönlendirilemedi');
      }
    } catch (error: any) {
      console.error('Error creating room:', error);
      let errorMessage = 'Oda oluşturulamadı. ';
      if (error.code === 'ECONNABORTED') {
        errorMessage += 'Bağlantı zaman aşımına uğradı.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Sunucu hatası oluştu.';
      } else if (!error.response) {
        errorMessage += 'İnternet bağlantınızı kontrol edin.';
      } else {
        errorMessage += error.response?.data?.detail || 'Lütfen tekrar deneyin.';
      }
      Alert.alert('Bağlantı Hatası', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = (room: Room) => {
    if (room.status === 'playing') {
      Alert.alert('Uyarı', 'Bu oda şu anda oyunda');
      return;
    }

    if (room.players >= room.maxPlayers) {
      Alert.alert('Uyarı', 'Bu oda dolu');
      return;
    }

    if (room.hasPassword) {
      setSelectedRoom(room);
      setShowPasswordModal(true);
    } else {
      showAdBeforeJoin(room.id, null);
    }
  };

  const showAdBeforeJoin = (roomId: string, password: string | null) => {
    setPendingRoomId(roomId);
    setShowPasswordModal(false);
    setShowAdModal(true);
    setAdProgress(0);
    
    const interval = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
    
    setTimeout(() => {
      clearInterval(interval);
      setShowAdModal(false);
      joinRoom(roomId, password);
    }, 3000);
  };

  const joinRoom = async (roomId: string, password: string | null) => {
    const playerName = username || 'Oyuncu' + Math.floor(Math.random() * 1000);
    const playerId = userId || 'user-' + Date.now();

    setJoining(roomId);
    try {
      await axios.post(`${API_URL}/api/rooms/${roomId}/join`, {
        player_id: playerId,
        player_name: playerName,
        password: password,
      });
      
      setShowPasswordModal(false);
      setJoinPassword('');
      setSelectedRoom(null);
      
      router.push(`/game-room?roomId=${roomId}&isHost=false`);
    } catch (error: any) {
      console.error('Error joining room:', error);
      if (error.response?.status === 403) {
        Alert.alert('Hata', 'Yanlış şifre');
      } else {
        Alert.alert('Hata', 'Odaya katılınamadı');
      }
    } finally {
      setJoining(null);
    }
  };

  // ==================== Quick Match Functions ====================

  const startQuickMatch = () => {
    const playerName = username || 'Oyuncu' + Math.floor(Math.random() * 1000);
    const playerId = userId || 'user-' + Date.now();

    setShowQuickMatch(true);
    setQuickMatchStatus('searching');
    setSearchTime(0);

    // Start search timer
    searchTimerRef.current = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    // Connect to Socket.IO
    const socket = io(API_URL, {
      transports: ['polling', 'websocket'],
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('Quick match socket connected');
      socket.emit('join_quick_match', {
        player_id: playerId,
        player_name: playerName,
      });
    });

    socket.on('quick_match_waiting', (data) => {
      console.log('Waiting in queue:', data);
    });

    socket.on('quick_match_found', (data) => {
      console.log('Match found!', data);
      setQuickMatchStatus('found');
      
      // Clear timer
      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current);
      }

      // Navigate to game room after short delay
      setTimeout(() => {
        setShowQuickMatch(false);
        setQuickMatchStatus('idle');
        socket.disconnect();
        router.push(`/game-room?roomId=${data.room_id}&isHost=false&quickMatch=true`);
      }, 1500);
    });

    socket.on('error', (data) => {
      console.error('Quick match error:', data);
      Alert.alert('Hata', data.message || 'Eşleşme hatası');
      cancelQuickMatch();
    });

    socket.on('disconnect', () => {
      console.log('Quick match socket disconnected');
    });

    setQuickMatchSocket(socket);
  };

  const cancelQuickMatch = () => {
    const playerId = userId || 'user-' + Date.now();

    if (quickMatchSocket) {
      quickMatchSocket.emit('leave_quick_match', { player_id: playerId });
      quickMatchSocket.disconnect();
      setQuickMatchSocket(null);
    }

    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current);
      searchTimerRef.current = null;
    }

    setShowQuickMatch(false);
    setQuickMatchStatus('idle');
    setSearchTime(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (quickMatchSocket) {
        quickMatchSocket.disconnect();
      }
      if (searchTimerRef.current) {
        clearInterval(searchTimerRef.current);
      }
    };
  }, [quickMatchSocket]);

  const formatSearchTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const publicRooms = rooms.filter(r => !r.isPrivate && r.status === 'waiting');
  const privateRooms = rooms.filter(r => r.isPrivate && r.status === 'waiting');

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Calculate stats from history
  const totalWins = gameHistory.filter(g => g.result === 'win').length;
  const totalGames = gameHistory.length;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  const renderRoomItem = ({ item }: { item: Room }) => (
    <View style={styles.roomCard}>
      <View style={styles.roomInfo}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomName}>{item.name}</Text>
          {item.hasPassword && (
            <Ionicons name="lock-closed" size={16} color="#FFD700" />
          )}
        </View>
        <Text style={styles.roomHost}>Kurucu: {item.host}</Text>
      </View>
      <View style={styles.roomRight}>
        <View style={styles.playerCount}>
          <Ionicons name="people" size={16} color="#888" />
          <Text style={styles.playerCountText}>{item.players}/{item.maxPlayers}</Text>
        </View>
        <TouchableOpacity
          style={[styles.joinButton, joining === item.id && styles.joiningButton]}
          onPress={() => handleJoinRoom(item)}
          disabled={joining === item.id}
        >
          {joining === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>Katıl</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHistoryItem = ({ item }: { item: GameResult }) => (
    <View style={[styles.historyCard, item.result === 'win' ? styles.winCard : styles.lossCard]}>
      <View style={styles.historyLeft}>
        <Ionicons 
          name={item.result === 'win' ? 'trophy' : 'sad-outline'} 
          size={32} 
          color={item.result === 'win' ? '#FFD700' : '#FF6B6B'} 
        />
      </View>
      <View style={styles.historyInfo}>
        <Text style={[styles.historyResult, item.result === 'win' ? styles.winText : styles.lossText]}>
          {item.result === 'win' ? 'GALİBİYET' : 'MAĞLUBİYET'}
        </Text>
        <Text style={styles.historyOpponent}>vs {item.opponent_name}</Text>
        <Text style={styles.historyScore}>
          {item.my_score} - {item.opponent_score}
        </Text>
      </View>
      {(item.coins_earned || item.xp_earned) && (
        <View style={styles.historyRewards}>
          {item.coins_earned && (
            <View style={styles.rewardBadge}>
              <Ionicons name="logo-bitcoin" size={12} color="#FFD700" />
              <Text style={styles.rewardText}>+{item.coins_earned}</Text>
            </View>
          )}
          {item.xp_earned && (
            <View style={styles.rewardBadge}>
              <Ionicons name="star" size={12} color="#4ECDC4" />
              <Text style={styles.rewardText}>+{item.xp_earned}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'history' ? 'time-outline' : 'game-controller-outline'} 
        size={48} 
        color="#444" 
      />
      <Text style={styles.emptyText}>
        {activeTab === 'history' 
          ? 'Henüz oyun geçmişi yok' 
          : 'Bekleyen oda yok'}
      </Text>
      {activeTab !== 'history' && (
        <Text style={styles.emptySubtext}>Yeni bir oda oluşturun veya Hızlı Eşleşme deneyin!</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Çok Oyunculu</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* User Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Ionicons name="person" size={16} color="#4ECDC4" />
          <Text style={styles.statLabel}>{username || 'İsimsiz'}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.statValue}>{totalWins}</Text>
          <Text style={styles.statLabel}>Galibiyet</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="stats-chart" size={16} color="#FF6B6B" />
          <Text style={styles.statValue}>%{winRate}</Text>
          <Text style={styles.statLabel}>Oran</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="logo-bitcoin" size={16} color="#F7931A" />
          <Text style={styles.statValue}>{totalCoins}</Text>
        </View>
      </View>

      {/* Quick Match Button */}
      <TouchableOpacity 
        style={styles.quickMatchButton}
        onPress={startQuickMatch}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.quickMatchGradient}
        >
          <Ionicons name="flash" size={28} color="#fff" />
          <View style={styles.quickMatchText}>
            <Text style={styles.quickMatchTitle}>Hızlı Eşleşme</Text>
            <Text style={styles.quickMatchSubtitle}>Anında rakip bul!</Text>
          </View>
          <Ionicons name="arrow-forward" size={24} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Create Room Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Yeni Oda Oluştur</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'public' && styles.activeTab]}
          onPress={() => setActiveTab('public')}
        >
          <Ionicons name="globe-outline" size={18} color={activeTab === 'public' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>
            Açık ({publicRooms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'private' && styles.activeTab]}
          onPress={() => setActiveTab('private')}
        >
          <Ionicons name="lock-closed-outline" size={18} color={activeTab === 'private' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'private' && styles.activeTabText]}>
            Şifreli ({privateRooms.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Ionicons name="time-outline" size={18} color={activeTab === 'history' ? '#fff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            Geçmiş
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'public' ? publicRooms : activeTab === 'private' ? privateRooms : gameHistory}
          renderItem={activeTab === 'history' ? renderHistoryItem : renderRoomItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ECDC4" />
          }
        />
      )}

      {/* Create Room Modal */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Yeni Oda Oluştur</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Oda Adı"
              placeholderTextColor="#666"
              value={roomName}
              onChangeText={setRoomName}
              maxLength={30}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Şifreli Oda</Text>
              <Switch
                value={isPrivate}
                onValueChange={setIsPrivate}
                trackColor={{ false: '#333', true: '#4ECDC4' }}
                thumbColor={isPrivate ? '#fff' : '#888'}
              />
            </View>

            {isPrivate && (
              <TextInput
                style={styles.input}
                placeholder="Şifre (opsiyonel)"
                placeholderTextColor="#666"
                value={roomPassword}
                onChangeText={setRoomPassword}
                secureTextEntry
                maxLength={20}
              />
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  setRoomName('');
                  setRoomPassword('');
                  setIsPrivate(false);
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, creating && styles.disabledButton]}
                onPress={createRoom}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Oluştur</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="lock-closed" size={40} color="#FFD700" style={styles.lockIcon} />
            <Text style={styles.modalTitle}>Şifre Gerekli</Text>
            <Text style={styles.modalSubtitle}>{selectedRoom?.name}</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Şifreyi girin"
              placeholderTextColor="#666"
              value={joinPassword}
              onChangeText={setJoinPassword}
              secureTextEntry
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowPasswordModal(false);
                  setJoinPassword('');
                  setSelectedRoom(null);
                }}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => selectedRoom && showAdBeforeJoin(selectedRoom.id, joinPassword)}
              >
                <Text style={styles.confirmButtonText}>Katıl</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Ad Modal */}
      <Modal visible={showAdModal} transparent animationType="fade">
        <View style={styles.adModalOverlay}>
          <View style={styles.adModalContent}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.adGradient}
            >
              <Ionicons name="game-controller" size={60} color="#fff" />
              <Text style={styles.adTitle}>Oyuna Hazırlanıyor</Text>
              <Text style={styles.adSubtitle}>Reklam izleniyor...</Text>
              
              <View style={styles.adProgressContainer}>
                <View style={[styles.adProgressBar, { width: `${adProgress}%` }]} />
              </View>
              
              <Text style={styles.adProgressText}>{Math.round(adProgress)}%</Text>
              
              <View style={styles.adTips}>
                <Ionicons name="bulb" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={styles.adTipText}>İpucu: Komboları yakalamak puanınızı katlar!</Text>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Quick Match Modal */}
      <Modal visible={showQuickMatch} transparent animationType="fade">
        <View style={styles.quickMatchOverlay}>
          <View style={styles.quickMatchModal}>
            {quickMatchStatus === 'searching' ? (
              <>
                <Animated.View style={[
                  styles.searchingIcon,
                  { 
                    transform: [
                      { scale: pulseAnim },
                      { rotate: spin }
                    ]
                  }
                ]}>
                  <Ionicons name="search" size={60} color="#FF6B6B" />
                </Animated.View>
                
                <Text style={styles.searchingTitle}>Rakip Aranıyor...</Text>
                <Text style={styles.searchingTime}>{formatSearchTime(searchTime)}</Text>
                
                <View style={styles.searchingDots}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={[styles.dot, searchTime % 2 === 0 && styles.dotActive]} />
                  <View style={[styles.dot, searchTime % 3 === 0 && styles.dotActive]} />
                </View>

                <Text style={styles.searchingHint}>Eşleşme için bekleyin veya iptal edin</Text>
                
                <TouchableOpacity 
                  style={styles.cancelSearchButton}
                  onPress={cancelQuickMatch}
                >
                  <Text style={styles.cancelSearchText}>İptal</Text>
                </TouchableOpacity>
              </>
            ) : quickMatchStatus === 'found' ? (
              <>
                <Ionicons name="checkmark-circle" size={80} color="#4ECDC4" />
                <Text style={styles.matchFoundTitle}>Eşleşme Bulundu!</Text>
                <Text style={styles.matchFoundSubtitle}>Oyun başlıyor...</Text>
                <ActivityIndicator size="large" color="#4ECDC4" style={{ marginTop: 20 }} />
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickMatchButton: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  quickMatchGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  quickMatchText: {
    flex: 1,
    marginLeft: 12,
  },
  quickMatchTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickMatchSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#4ECDC4',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  activeTabText: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  roomInfo: {
    flex: 1,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  roomHost: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  roomRight: {
    alignItems: 'flex-end',
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerCountText: {
    color: '#888',
    marginLeft: 4,
    fontSize: 12,
  },
  joinButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joiningButton: {
    backgroundColor: '#888',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  winCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  lossCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  historyLeft: {
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyResult: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  winText: {
    color: '#FFD700',
  },
  lossText: {
    color: '#FF6B6B',
  },
  historyOpponent: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  historyScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  historyRewards: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rewardText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  lockIcon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#888',
  },
  // Ad Modal Styles
  adModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  adModalContent: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
  },
  adGradient: {
    padding: 32,
    alignItems: 'center',
  },
  adTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  adSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    marginBottom: 24,
  },
  adProgressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  adProgressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  adProgressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  adTips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    gap: 8,
  },
  adTipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    flex: 1,
  },
  // Quick Match Modal Styles
  quickMatchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  quickMatchModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  searchingIcon: {
    marginBottom: 20,
  },
  searchingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  searchingTime: {
    fontSize: 36,
    fontWeight: '300',
    color: '#FF6B6B',
    marginBottom: 20,
  },
  searchingDots: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    backgroundColor: '#FF6B6B',
  },
  searchingHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  cancelSearchButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  cancelSearchText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  matchFoundTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginTop: 16,
  },
  matchFoundSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
});
