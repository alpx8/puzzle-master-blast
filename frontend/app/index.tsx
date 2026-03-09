import React, { useEffect, useState, useRef } from 'react';
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
  Easing,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '@/src/store/gameStore';
import { useQuestStore } from '@/src/store/questStore';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';
import { useSkinsStore } from '@/src/store/skinsStore';
import { usePowerUpsStore } from '@/src/store/powerUpsStore';
import { initSounds } from '@/src/utils/sounds';
import { DailyRewardsModal } from '@/src/components/DailyRewardsModal';
import { SkinsModal } from '@/src/components/SkinsModal';
import { useNetworkStatus, requiresOnline } from '@/src/utils/offlineSupport';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Vibrant gradient colors for logo blocks
const LOGO_COLORS = [
  ['#FF3366', '#FF6B6B'],
  ['#00D9FF', '#00F5A0'],
  ['#FFD93D', '#FF8C00'],
  ['#A855F7', '#EC4899'],
  ['#00F5A0', '#00D9FF'],
  ['#FF6B6B', '#FFD93D'],
  ['#EC4899', '#A855F7'],
  ['#00D9FF', '#A855F7'],
  ['#FFD93D', '#FF3366'],
];

// Animated Logo Block Component
const AnimatedLogoBlock = ({ index, colors }: { index: number; colors: string[] }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const delay = index * 200;
    
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000 + (index * 100),
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000 + (index * 50),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000 + (index * 50),
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500 + (index * 100),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1500 + (index * 100),
          useNativeDriver: false,
        }),
      ])
    );

    setTimeout(() => {
      rotateAnimation.start();
      pulseAnimation.start();
      glowAnimation.start();
    }, delay);

    return () => {
      rotateAnimation.stop();
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, [index]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.logoBlockWrapper,
        {
          transform: [
            { rotateY: rotation },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.logoBlock,
          {
            backgroundColor: colors[0],
            shadowColor: colors[0],
            shadowOpacity: glowAnim,
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        <View style={styles.blockHighlight} />
        <View style={[styles.blockShadow, { backgroundColor: colors[1] }]} />
      </Animated.View>
    </Animated.View>
  );
};

// Main Animated Logo Component
const AnimatedLogo = () => {
  const containerRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(containerRotate, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = containerRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.logoOuterContainer}>
      <Animated.View 
        style={[
          styles.logoGrid,
          { transform: [{ rotate: rotation }] }
        ]}
      >
        {LOGO_COLORS.map((colors, i) => (
          <AnimatedLogoBlock key={i} index={i} colors={colors} />
        ))}
      </Animated.View>
    </View>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { username, setUsername, loadUserData, saveUserData, level, highScore, userId } = useGameStore();
  const { loadQuests, dailyQuests, claimReward } = useQuestStore();
  const { checkAndShowReward, loadRewardsData, totalCoins, currentStreak } = useDailyRewardsStore();
  const { loadSkins } = useSkinsStore();
  const { loadPowerUps } = usePowerUpsStore();
  
  // Network status for offline support
  const networkStatus = useNetworkStatus();
  const isOffline = !networkStatus.isConnected;
  
  const [showNameInput, setShowNameInput] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showSkinsModal, setShowSkinsModal] = useState(false);
  const [tempName, setTempName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const titleGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const initApp = async () => {
      await loadUserData();
      await loadRewardsData();
      await loadSkins();
      await loadPowerUps();
      initSounds();
      
      // Günlük ödül kontrolü
      const shouldShowReward = await checkAndShowReward();
      if (shouldShowReward) {
        setTimeout(() => setShowDailyReward(true), 500);
      }
    };
    
    initApp();
    
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(titleGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(titleGlow, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

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

  const handleClaimQuest = async (questId: string) => {
    const xp = await claimReward(questId);
    if (xp > 0) {
      useGameStore.getState().addXP(xp);
    }
  };

  const completedQuests = dailyQuests.filter(q => q.completed && !q.claimed).length;

  const GameModeButton = ({ 
    title, 
    subtitle, 
    icon, 
    colors, 
    onPress,
    disabled = false
  }: { 
    title: string; 
    subtitle: string; 
    icon: keyof typeof Ionicons.glyphMap; 
    colors: string[]; 
    onPress: () => void;
    disabled?: boolean;
  }) => (
    <TouchableOpacity 
      style={[styles.modeButton, disabled && styles.modeButtonDisabled]} 
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
    >
      <View style={[styles.modeGradient, { backgroundColor: colors[0] }]}>
        <Ionicons name={icon} size={28} color={disabled ? "rgba(255,255,255,0.5)" : "#fff"} />
        <View style={styles.modeTextContainer}>
          <Text style={[styles.modeTitle, disabled && styles.modeTitleDisabled]}>{title}</Text>
          <Text style={[styles.modeSubtitle, disabled && styles.modeSubtitleDisabled]}>{subtitle}</Text>
        </View>
        {disabled ? (
          <Ionicons name="cloud-offline" size={22} color="rgba(255,255,255,0.4)" />
        ) : (
          <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
        )}
      </View>
    </TouchableOpacity>
  );

  const glowColor = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 217, 255, 0.3)', 'rgba(168, 85, 247, 0.6)'],
  });

  // Handle game mode selection with offline check
  const handleModePress = (mode: string, route: string) => {
    if (requiresOnline(mode) && isOffline) {
      Alert.alert(
        'Çevrimdışı Mod',
        `${mode === 'multiplayer' ? 'Çok Oyunculu' : 'Turnuva'} modu için internet bağlantısı gerekli.\n\nKlasik veya Zamanlı modu çevrimdışı oynayabilirsin!`,
        [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Klasik Oyna', onPress: () => router.push('/game?mode=classic') }
        ]
      );
      return;
    }
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Offline Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineBannerText}>Çevrimdışı Mod - Klasik ve Zamanlı oynanabilir</Text>
        </View>
      )}
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Logo Section - Compact */}
          <View style={styles.logoSection}>
            <AnimatedLogo />
            
            <Animated.Text 
              style={[styles.title, { textShadowColor: glowColor }]}
            >
              PUZZLE MASTER
            </Animated.Text>
            <Animated.Text 
              style={[styles.titleBlast, { textShadowColor: glowColor }]}
            >
              BLAST
            </Animated.Text>
          </View>

          {/* User Stats - Compact */}
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.userSection}
              onPress={() => {
                setTempName(username);
                setShowNameInput(true);
              }}
            >
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {username || 'İsim Gir'}
                </Text>
                <Text style={styles.userStats}>Lv.{level} • Rekor: {highScore}</Text>
              </View>
              <Ionicons name="pencil" size={16} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Name Input Modal */}
          {showNameInput && (
            <View style={styles.nameInputContainer}>
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
            <GameModeButton
              title="Klasik Mod"
              subtitle={isOffline ? "Çevrimdışı oyna!" : "Süresiz oyna!"}
              icon="infinite"
              colors={['#4ECDC4', '#44A08D']}
              onPress={() => router.push('/game?mode=classic')}
            />
            
            <GameModeButton
              title="Zamanlı Mod"
              subtitle={isOffline ? "Çevrimdışı oyna!" : "3 dakikada en çok puan!"}
              icon="timer"
              colors={['#FF6B6B', '#FF8E53']}
              onPress={() => router.push('/game?mode=timed')}
            />
            
            <GameModeButton
              title="Çok Oyunculu"
              subtitle={isOffline ? "İnternet gerekli" : "Online yarış!"}
              icon="people"
              colors={isOffline ? ['#555', '#444'] : ['#667eea', '#764ba2']}
              onPress={() => handleModePress('multiplayer', '/multiplayer')}
              disabled={isOffline}
            />
            
            <GameModeButton
              title="Turnuva"
              subtitle={isOffline ? "İnternet gerekli" : "Haftalık ödüller!"}
              icon="trophy"
              colors={isOffline ? ['#555', '#444'] : ['#FFD700', '#FF8C00']}
              onPress={() => handleModePress('tournament', '/tournament')}
              disabled={isOffline}
            />
          </View>

          {/* Bottom Row - Leaderboard & Quests & More */}
          <View style={styles.bottomGrid}>
            <View style={styles.bottomGridRow}>
              <TouchableOpacity 
                style={styles.bottomButton}
                onPress={() => router.push('/leaderboard')}
              >
                <Ionicons name="trophy" size={20} color="#FFD700" />
                <Text style={styles.bottomButtonText}>Sıralama</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bottomButton}
                onPress={() => setShowDailyReward(true)}
              >
                <Ionicons name="gift" size={20} color="#FF6B6B" />
                <Text style={styles.bottomButtonText}>Ödül</Text>
                {currentStreak > 0 && (
                  <View style={[styles.questBadge, { backgroundColor: '#FF6B6B' }]}>
                    <Text style={styles.questBadgeText}>{currentStreak}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.bottomGridRow}>
              <TouchableOpacity 
                style={styles.bottomButton}
                onPress={() => setShowSkinsModal(true)}
              >
                <Ionicons name="color-palette" size={20} color="#BD00FF" />
                <Text style={styles.bottomButtonText}>Temalar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.bottomButton}
                onPress={() => setShowQuestsModal(true)}
              >
                <Ionicons name="flag" size={20} color="#4ECDC4" />
                <Text style={styles.bottomButtonText}>Görevler</Text>
                {completedQuests > 0 && (
                  <View style={styles.questBadge}>
                    <Text style={styles.questBadgeText}>{completedQuests}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Coins Display */}
          <View style={styles.coinsRow}>
            <Ionicons name="logo-bitcoin" size={18} color="#F7931A" />
            <Text style={styles.coinsText}>{totalCoins}</Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Quests Modal */}
      <Modal visible={showQuestsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Günlük Görevler</Text>
              <TouchableOpacity onPress={() => setShowQuestsModal(false)}>
                <Ionicons name="close-circle" size={32} color="#888" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.questList} showsVerticalScrollIndicator={false}>
              {dailyQuests.length > 0 ? (
                dailyQuests.map((quest) => (
                  <View key={quest.id} style={styles.questItem}>
                    <View style={styles.questInfo}>
                      <Text style={styles.questTitle}>{quest.title}</Text>
                      <Text style={styles.questDescription}>{quest.description}</Text>
                      <View style={styles.questProgressBar}>
                        <View 
                          style={[
                            styles.questProgressFill, 
                            { width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.questProgressText}>
                        {quest.progress} / {quest.target}
                      </Text>
                    </View>
                    
                    <View style={styles.questReward}>
                      <Text style={styles.questXP}>+{quest.xpReward}</Text>
                      <Text style={styles.questXPLabel}>XP</Text>
                      {quest.completed && !quest.claimed ? (
                        <TouchableOpacity 
                          style={styles.claimButton}
                          onPress={() => handleClaimQuest(quest.id)}
                        >
                          <Text style={styles.claimButtonText}>AL</Text>
                        </TouchableOpacity>
                      ) : quest.claimed ? (
                        <Ionicons name="checkmark-circle" size={28} color="#4ECDC4" />
                      ) : null}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noQuests}>
                  <Ionicons name="flag-outline" size={48} color="#444" />
                  <Text style={styles.noQuestsText}>Görev bulunamadı</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Daily Rewards Modal */}
      <DailyRewardsModal 
        visible={showDailyReward} 
        onClose={() => setShowDailyReward(false)} 
      />
      
      {/* Skins Modal */}
      <SkinsModal 
        visible={showSkinsModal} 
        onClose={() => setShowSkinsModal(false)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 8,
  },
  logoOuterContainer: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoGrid: {
    width: 100,
    height: 100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBlockWrapper: {
    width: 30,
    height: 30,
    margin: 1,
    perspective: 1000,
  },
  logoBlock: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  blockHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '45%',
    height: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 3,
  },
  blockShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    opacity: 0.5,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  titleBlast: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFD93D',
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginTop: -4,
  },
  statsContainer: {
    marginVertical: 12,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  userStats: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  nameInputContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  inputButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modesSection: {
    flex: 1,
    justifyContent: 'center',
  },
  modeButton: {
    marginBottom: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modeSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 1,
  },
  modeButtonDisabled: {
    opacity: 0.6,
  },
  modeTitleDisabled: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  modeSubtitleDisabled: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  bottomGrid: {
    marginTop: 12,
    gap: 10,
  },
  bottomGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  bottomButtonText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  questBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B6B',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  coinsText: {
    color: '#F7931A',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  questList: {
    flex: 1,
  },
  questItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 3,
  },
  questDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  questProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
  },
  questProgressText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  questReward: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 14,
    minWidth: 60,
  },
  questXP: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  questXPLabel: {
    fontSize: 10,
    color: '#FFD700',
    marginBottom: 6,
  },
  claimButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  noQuests: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noQuestsText: {
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
});
