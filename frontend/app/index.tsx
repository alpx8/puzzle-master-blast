import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  Platform,
  Easing,
  Modal,
  ScrollView,
  Alert,
  Keyboard,
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
      Keyboard.dismiss();
      setShowNameInput(false);
    }
  };

  const handleCancelNameInput = () => {
    Keyboard.dismiss();
    setShowNameInput(false);
    setTempName(username);
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
          <Text style={styles.offlineBannerText}>Çevrimdışı Mod</Text>
        </View>
      )}
      
      <View style={styles.mainContent}>
        {/* Logo Section - Fixed at top */}
        <View style={styles.logoSection}>
          <AnimatedLogo />
          <Text style={styles.title}>PUZZLE MASTER</Text>
          <Text style={styles.titleBlast}>BLAST</Text>
        </View>

        {/* User Stats - Fixed */}
        <TouchableOpacity 
          style={styles.userSection}
          onPress={() => {
            setTempName(username);
            setShowNameInput(true);
          }}
        >
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{username || 'İsim Gir'}</Text>
            <Text style={styles.userStats}>Lv.{level} • Rekor: {highScore}</Text>
          </View>
          <Ionicons name="pencil" size={14} color="#888" />
        </TouchableOpacity>

        {/* Game Mode Buttons - Fixed height */}
        <View style={styles.modesSection}>
          <GameModeButton
            title="Klasik Mod"
            subtitle={isOffline ? "Çevrimdışı" : "Süresiz oyna!"}
            icon="infinite"
            colors={['#4ECDC4', '#44A08D']}
            onPress={() => router.push('/game?mode=classic')}
          />
          
          <GameModeButton
            title="Zamanlı Mod"
            subtitle={isOffline ? "Çevrimdışı" : "3 dakika!"}
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

        {/* Bottom Row - Fixed at bottom */}
        <View style={styles.bottomSection}>
          <View style={styles.bottomGridRow}>
            <TouchableOpacity 
              style={styles.bottomButton}
              onPress={() => router.push('/leaderboard')}
            >
              <Ionicons name="trophy" size={18} color="#FFD700" />
              <Text style={styles.bottomButtonText}>Sıralama</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bottomButton}
              onPress={() => setShowDailyReward(true)}
            >
              <Ionicons name="gift" size={18} color="#FF6B6B" />
              <Text style={styles.bottomButtonText}>Ödül</Text>
              {currentStreak > 0 && (
                <View style={[styles.questBadge, { backgroundColor: '#FF6B6B' }]}>
                  <Text style={styles.questBadgeText}>{currentStreak}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bottomButton}
              onPress={() => setShowSkinsModal(true)}
            >
              <Ionicons name="color-palette" size={18} color="#BD00FF" />
              <Text style={styles.bottomButtonText}>Temalar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bottomButton}
              onPress={() => setShowQuestsModal(true)}
            >
              <Ionicons name="flag" size={18} color="#4ECDC4" />
              <Text style={styles.bottomButtonText}>Görevler</Text>
              {completedQuests > 0 && (
                <View style={styles.questBadge}>
                  <Text style={styles.questBadgeText}>{completedQuests}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Coins Display */}
          <View style={styles.coinsRow}>
            <Ionicons name="logo-bitcoin" size={16} color="#F7931A" />
            <Text style={styles.coinsText}>{totalCoins}</Text>
          </View>
        </View>
      </View>

      {/* Name Input Modal - Proper Modal */}
      <Modal visible={showNameInput} transparent animationType="fade">
        <View style={styles.nameModalOverlay}>
          <View style={styles.nameModalContent}>
            <Text style={styles.nameModalTitle}>İsim Değiştir</Text>
            <TextInput
              style={styles.nameInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="İsmini gir..."
              placeholderTextColor="#666"
              maxLength={20}
              autoFocus
            />
            <View style={styles.nameModalButtons}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={handleCancelNameInput}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn}
                onPress={handleSaveName}
              >
                <Text style={styles.saveBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  logoOuterContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoGrid: {
    width: 75,
    height: 75,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBlockWrapper: {
    width: 22,
    height: 22,
    margin: 1,
    perspective: 1000,
  },
  logoBlock: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  blockHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '40%',
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 2,
  },
  blockShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '25%',
    opacity: 0.5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  offlineBannerText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 217, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleBlast: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD93D',
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 217, 61, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginTop: -2,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 8,
  },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  userStats: {
    fontSize: 11,
    color: '#888',
    marginTop: 1,
  },
  modesSection: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  modeButton: {
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  modeSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
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
  bottomSection: {
    paddingBottom: 8,
  },
  bottomGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
    position: 'relative',
  },
  bottomButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  questBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4ECDC4',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  questBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
  },
  coinsText: {
    color: '#F7931A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Name Input Modal
  nameModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  nameModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
  },
  nameModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  nameModalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Quests Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  questList: {
    flex: 1,
  },
  questItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  questDescription: {
    fontSize: 11,
    color: '#888',
    marginBottom: 6,
  },
  questProgressBar: {
    height: 5,
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
    fontSize: 10,
    color: '#666',
    marginTop: 3,
  },
  questReward: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    minWidth: 50,
  },
  questXP: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  questXPLabel: {
    fontSize: 9,
    color: '#FFD700',
    marginBottom: 4,
  },
  claimButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  noQuests: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noQuestsText: {
    color: '#666',
    marginTop: 10,
    fontSize: 13,
  },
});
