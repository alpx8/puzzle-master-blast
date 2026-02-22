import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '@/src/store/gameStore';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Room {
  id: string;
  name: string;
  host: string;
  players: number;
  maxPlayers: number;
  status: 'waiting' | 'playing';
}

export default function MultiplayerScreen() {
  const router = useRouter();
  const { username, userId, level } = useGameStore();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Mock data for testing
      setRooms([
        { id: '1', name: 'Eğlenceli Oda', host: 'Ali', players: 1, maxPlayers: 2, status: 'waiting' },
        { id: '2', name: 'Pro Oyuncular', host: 'Veli', players: 2, maxPlayers: 2, status: 'playing' },
        { id: '3', name: 'Yeni Başlayanlar', host: 'Ayşe', players: 1, maxPlayers: 2, status: 'waiting' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      Alert.alert('Hata', 'Lütfen oda adı girin');
      return;
    }

    if (!username) {
      Alert.alert('Hata', 'Lütfen önce kullanıcı adınızı belirleyin');
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post(`${API_URL}/api/rooms`, {
        name: roomName,
        host_id: userId,
        host_name: username,
      });
      
      setShowCreateModal(false);
      setRoomName('');
      
      // Navigate to game room
      router.push(`/game-room?roomId=${response.data.id}&isHost=true`);
    } catch (error) {
      console.error('Error creating room:', error);
      Alert.alert('Hata', 'Oda oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async (room: Room) => {
    if (room.status === 'playing') {
      Alert.alert('Uyarı', 'Bu oda şu anda oyunda. Lütfen başka bir oda seçin.');
      return;
    }

    if (room.players >= room.maxPlayers) {
      Alert.alert('Uyarı', 'Bu oda dolu. Lütfen başka bir oda seçin.');
      return;
    }

    if (!username) {
      Alert.alert('Hata', 'Lütfen önce kullanıcı adınızı belirleyin');
      return;
    }

    setJoining(room.id);
    try {
      await axios.post(`${API_URL}/api/rooms/${room.id}/join`, {
        player_id: userId,
        player_name: username,
      });
      
      // Navigate to game room
      router.push(`/game-room?roomId=${room.id}&isHost=false`);
    } catch (error) {
      console.error('Error joining room:', error);
      Alert.alert('Hata', 'Odaya katılınamadı. Lütfen tekrar deneyin.');
    } finally {
      setJoining(null);
    }
  };

  const renderRoom = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={[
        styles.roomItem,
        item.status === 'playing' && styles.roomPlaying,
      ]}
      onPress={() => joinRoom(item)}
      disabled={item.status === 'playing' || joining === item.id}
    >
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.roomHost}>Kurucu: {item.host}</Text>
      </View>
      
      <View style={styles.roomStats}>
        <View style={styles.playerCount}>
          <Ionicons name="people" size={18} color="#888" />
          <Text style={styles.playerCountText}>
            {item.players}/{item.maxPlayers}
          </Text>
        </View>
        
        {item.status === 'waiting' ? (
          joining === item.id ? (
            <ActivityIndicator size="small" color="#4ECDC4" />
          ) : (
            <View style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Katıl</Text>
            </View>
          )
        ) : (
          <View style={styles.playingBadge}>
            <Text style={styles.playingBadgeText}>Oyunda</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Çok Oyunculu</Text>
        <TouchableOpacity onPress={fetchRooms} style={styles.backButton}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* User Info */}
      <View style={styles.userCard}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>
            {username ? username.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{username || 'İsimsiz Oyuncu'}</Text>
          <Text style={styles.userLevel}>Seviye {level}</Text>
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

      {/* Create Room Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Oda Oluştur</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Oda adı girin..."
              placeholderTextColor="#666"
              value={roomName}
              onChangeText={setRoomName}
              maxLength={30}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => {
                  setShowCreateModal(false);
                  setRoomName('');
                }}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreate}
                onPress={createRoom}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalCreateText}>Oluştur</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Rooms Section */}
      <View style={styles.roomsSection}>
        <Text style={styles.sectionTitle}>Mevcut Odalar</Text>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={styles.loadingText}>Odalar yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={rooms}
            renderItem={renderRoom}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.roomsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="game-controller" size={60} color="#444" />
                <Text style={styles.emptyText}>Henüz oda yok</Text>
                <Text style={styles.emptySubtext}>İlk odayı sen oluştur!</Text>
              </View>
            }
          />
        )}
      </View>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userLevel: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#667eea',
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  roomsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  roomsList: {
    paddingBottom: 20,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  roomPlaying: {
    opacity: 0.6,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  roomHost: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  roomStats: {
    alignItems: 'flex-end',
    gap: 8,
  },
  playerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerCountText: {
    fontSize: 14,
    color: '#888',
  },
  joinButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  playingBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  playingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
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
    paddingTop: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    marginTop: 16,
  },
  emptySubtext: {
    color: '#555',
    fontSize: 14,
    marginTop: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#2d2d44',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#888',
  },
  modalCreate: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#4ECDC4',
    alignItems: 'center',
  },
  modalCreateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
