import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '@/src/store/gameStore';
import { useQuestStore } from '@/src/store/questStore';
import { initSounds } from '@/src/utils/sounds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { username, setUsername, loadUserData, saveUserData, level, highScore, userId } = useGameStore();
  const { loadQuests, dailyQuests } = useQuestStore();
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState('');
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadUserData();
    initSounds();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load quests when userId is available
  useEffect(() => {
    if (userId) {
      loadQuests(userId);
    }
  }, [userId]);

  const handleSaveName = async () => {
    if (tempName.trim()) {
      setUsername(tempName.trim());
      await saveUserData();
      setShowNameInput(false);
    }
  };

  const GameModeButton = ({ 
    title, 
    subtitle, 
    icon, 
    colors, 
    onPress 
  }: { 
    title: string; 
    subtitle: string; 
    icon: keyof typeof Ionicons.glyphMap; 
    colors: string[]; 
    onPress: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.modeButton} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.modeGradient, { backgroundColor: colors[0] }]}>
        <Ionicons name={icon} size={32} color="#fff" />
        <View style={styles.modeTextContainer}>
          <Text style={styles.modeTitle}>{title}</Text>
          <Text style={styles.modeSubtitle}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.content,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
            ]}
          >
            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <View style={styles.logoGrid}>
                  {[...Array(9)].map((_, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.logoBlock,
                        { backgroundColor: [
                          '#FF6B6B', '#4ECDC4', '#45B7D1',
                          '#96CEB4', '#FFEAA7', '#DDA0DD',
                          '#F7DC6F', '#BB8FCE', '#85C1E9'
                        ][i] }
                      ]} 
                    />
                  ))}
                </View>
              </View>
              <Text style={styles.title}>BLOCK BLAST</Text>
              <Text style={styles.subtitle}>Blokları yerleştir, satırları patlat!</Text>
            </View>

            {/* User Stats */}
            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.userSection}
                onPress={() => {
                  setTempName(username);
                  setShowNameInput(true);
                }}
              >
                <View style={styles.avatarContainer}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {username || 'İsim Gir'}
                  </Text>
                  <Text style={styles.userStats}>Seviye {level} • En Yüksek: {highScore}</Text>
                </View>
                <Ionicons name="pencil" size={18} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Name Input Modal */}
            {showNameInput && (
              <View style={styles.nameInputContainer}>
                <Text style={styles.inputLabel}>Kullanıcı Adın</Text>
                <TextInput
                  style={styles.nameInput}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="İsmini gir..."
                  placeholderTextColor="#666"
                  maxLength={20}
                  autoFocus
                />
                <View style={styles.inputButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowNameInput(false)}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveName}
                  >
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Game Mode Buttons */}
            <View style={styles.modesSection}>
              <Text style={styles.sectionTitle}>Oyun Modu Seç</Text>
              
              <GameModeButton
                title="Klasik Mod"
                subtitle="Süresiz oyna, en yüksek skoru yap!"
                icon="infinite"
                colors={['#4ECDC4', '#44A08D']}
                onPress={() => router.push('/game?mode=classic')}
              />
              
              <GameModeButton
                title="Zamanlı Mod"
                subtitle="3 dakikada en çok puan topla!"
                icon="timer"
                colors={['#FF6B6B', '#FF8E53']}
                onPress={() => router.push('/game?mode=timed')}
              />
              
              <GameModeButton
                title="Online Çok Oyunculu"
                subtitle="Rakibini yen, şampiyon ol!"
                icon="people"
                colors={['#667eea', '#764ba2']}
                onPress={() => router.push('/multiplayer')}
              />
            </View>

            {/* Leaderboard Button */}
            <TouchableOpacity 
              style={styles.leaderboardButton}
              onPress={() => router.push('/leaderboard')}
            >
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.leaderboardText}>Liderlik Tablosu</Text>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoGrid: {
    width: 90,
    height: 90,
    flexDirection: 'row',
    flexWrap: 'wrap',
    transform: [{ rotate: '45deg' }],
  },
  logoBlock: {
    width: 26,
    height: 26,
    margin: 2,
    borderRadius: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 4,
    textShadowColor: 'rgba(78, 205, 196, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  statsContainer: {
    marginBottom: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  userStats: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  nameInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    color: '#fff',
    marginBottom: 12,
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  modeButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modeSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  leaderboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  leaderboardText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
});
