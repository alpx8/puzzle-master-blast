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
import { QuestsModal } from '@/src/components/QuestsModal';
import { ShopModal } from '@/src/components/ShopModal';
import { useInventoryStore } from '@/src/store/inventoryStore';
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
  const [showShopModal, setShowShopModal] = useState(false);
  const [tempName, setTempName] = useState('');
  
  // Inventory store
  const { loadInventory } = useInventoryStore();

  useEffect(() => {
    const initApp = async () => {
      await loadUserData();
      await loadRewardsData();
      await loadSkins();
      await loadPowerUps();
      await loadInventory();
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
        <Ionicons name={icon} size={32} color={disabled ? "rgba(255,255,255,0.5)" : "#fff"} />
        <View style={styles.modeTextContainer}>
          <Text style={[styles.modeTitle, disabled && styles.modeTitleDisabled]}>{title}</Text>
          <Text style={[styles.modeSubtitle, disabled && styles.modeSubtitleDisabled]}>{subtitle}</Text>
        </View>
        {disabled ? (
          <Ionicons name="cloud-offline" size={24} color="rgba(255,255,255,0.4)" />
        ) : (
          <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.7)" />
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
        {/* Header - User & Coins */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.userChip}
            onPress={() => {
              setTempName(username);
              setShowNameInput(true);
            }}
          >
            <View style={styles.avatarSmall}>
              <Ionicons name="person" size={14} color="#fff" />
            </View>
            <View style={styles.userChipInfo}>
              <Text style={styles.userChipName} numberOfLines={1}>{username || 'İsim Gir'}</Text>
              <Text style={styles.userChipLevel}>Lv.{level}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.coinChip}
            onPress={() => setShowShopModal(true)}
          >
            <Ionicons name="logo-bitcoin" size={18} color="#FFD700" />
            <Text style={styles.coinChipText}>{totalCoins.toLocaleString()}</Text>
            <View style={styles.coinAddBtn}>
              <Ionicons name="add" size={14} color="#1a1a2e" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Logo Section */}
        <View style={styles.logoSection}>
          <AnimatedLogo />
          <Text style={styles.title}>PUZZLE MASTER</Text>
          <Text style={styles.titleBlast}>BLAST</Text>
          <Text style={styles.highScoreText}>En Yüksek Skor: {highScore}</Text>
        </View>

        {/* Game Mode Buttons */}
        <View style={styles.modesSection}>
          <GameModeButton
            title="Klasik Mod"
            subtitle={isOffline ? "Çevrimdışı oynanabilir" : "Süresiz strateji!"}
            icon="infinite"
            colors={['#4ECDC4', '#44A08D']}
            onPress={() => router.push('/game?mode=classic')}
          />
          
          <GameModeButton
            title="Zamanlı Mod"
            subtitle={isOffline ? "Çevrimdışı oynanabilir" : "3 dakikada rekor kır!"}
            icon="timer"
            colors={['#FF6B6B', '#FF8E53']}
            onPress={() => router.push('/game?mode=timed')}
          />
          
          <GameModeButton
            title="Çok Oyunculu"
            subtitle={isOffline ? "İnternet bağlantısı gerekli" : "Online rakiplerle yarış!"}
            icon="people"
            colors={isOffline ? ['#555', '#444'] : ['#667eea', '#764ba2']}
            onPress={() => handleModePress('multiplayer', '/multiplayer')}
            disabled={isOffline}
          />
          
          <GameModeButton
            title="Turnuva"
            subtitle={isOffline ? "İnternet bağlantısı gerekli" : "Haftalık ödüller kazan!"}
            icon="trophy"
            colors={isOffline ? ['#555', '#444'] : ['#FFD700', '#FF8C00']}
            onPress={() => handleModePress('tournament', '/tournament')}
            disabled={isOffline}
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/leaderboard')}
          >
            <Ionicons name="trophy" size={22} color="#FFD700" />
            <Text style={styles.actionButtonText}>Sıralama</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowQuestsModal(true)}
          >
            <Ionicons name="flag" size={22} color="#4ECDC4" />
            <Text style={styles.actionButtonText}>Görevler</Text>
            {completedQuests > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{completedQuests}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowDailyReward(true)}
          >
            <Ionicons name="gift" size={22} color="#FF6B6B" />
            <Text style={styles.actionButtonText}>Ödül</Text>
            {currentStreak > 0 && (
              <View style={[styles.badge, { backgroundColor: '#FF6B6B' }]}>
                <Text style={styles.badgeText}>{currentStreak}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowShopModal(true)}
          >
            <Ionicons name="storefront" size={22} color="#A855F7" />
            <Text style={styles.actionButtonText}>Mağaza</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name Input Modal */}
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
      <QuestsModal 
        visible={showQuestsModal} 
        onClose={() => setShowQuestsModal(false)} 
      />
      
      {/* Daily Rewards Modal */}
      <DailyRewardsModal 
        visible={showDailyReward} 
        onClose={() => setShowDailyReward(false)} 
      />
      
      {/* Shop Modal (includes Coins, Themes, Power-ups) */}
      <ShopModal 
        visible={showShopModal} 
        onClose={() => setShowShopModal(false)} 
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
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userChipInfo: {
    maxWidth: 100,
  },
  userChipName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  userChipLevel: {
    fontSize: 10,
    color: '#888',
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  coinChipText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  coinAddBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Logo Section
  logoSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoOuterContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoGrid: {
    width: 90,
    height: 90,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBlockWrapper: {
    width: 26,
    height: 26,
    margin: 2,
    perspective: 1000,
  },
  logoBlock: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
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
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 217, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleBlast: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFD93D',
    letterSpacing: 4,
    textShadowColor: 'rgba(255, 217, 61, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginTop: -4,
  },
  highScoreText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  // Game Modes
  modesSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
  },
  modeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  modeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  modeTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  modeTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  modeSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
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
  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 14,
    borderRadius: 14,
    position: 'relative',
  },
  actionButtonText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: '#4ECDC4',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
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
});
