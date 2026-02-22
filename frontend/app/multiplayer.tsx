import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useGameStore } from '@/src/store/gameStore';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                process.env.EXPO_PUBLIC_BACKEND_URL || 
                'https://puzzle-master-blast.preview.emergentagent.com';

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
  created_at: string;
}

type TabType = 'public' | 'private' | 'history';

export default function MultiplayerScreen() {
  const router = useRouter();
  const { username, userId } = useGameStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('public');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

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
      });
      
      setShowCreateModal(false);
      setRoomName('');
      setRoomPassword('');
      setIsPrivate(false);
      
      router.push(`/game-room?roomId=${response.data.id}&isHost=true`);
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Hata', 'Oda oluşturulamadı');
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
      joinRoom(room.id, null);
    }
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

  const publicRooms = rooms.filter(r => !r.isPrivate && r.status === 'waiting');
  const privateRooms = rooms.filter(r => r.isPrivate && r.status === 'waiting');

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
        <Text style={styles.emptySubtext}>Yeni bir oda oluşturun!</Text>
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

      {/* User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.userName}>{username || 'İsimsiz Oyuncu'}</Text>
          <Text style={styles.userLevel}>Online</Text>
        </View>
      </View>

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
                onPress={() => selectedRoom && joinRoom(selectedRoom.id, joinPassword)}
              >
                <Text style={styles.confirmButtonText}>Katıl</Text>
              </TouchableOpacity>
            </View>
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
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userLevel: {
    fontSize: 12,
    color: '#4ECDC4',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  historyScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
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
});
