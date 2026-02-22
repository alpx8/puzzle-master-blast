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
  ScrollView,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '@/src/store/gameStore';
import { useQuestStore } from '@/src/store/questStore';
import { initSounds } from '@/src/utils/sounds';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Vibrant gradient colors for logo blocks
const LOGO_COLORS = [
  ['#FF3366', '#FF6B6B'], // Vibrant Red-Pink
  ['#00D9FF', '#00F5A0'], // Cyan-Green
  ['#FFD93D', '#FF8C00'], // Gold-Orange
  ['#A855F7', '#EC4899'], // Purple-Pink
  ['#00F5A0', '#00D9FF'], // Green-Cyan
  ['#FF6B6B', '#FFD93D'], // Red-Gold
  ['#EC4899', '#A855F7'], // Pink-Purple
  ['#00D9FF', '#A855F7'], // Cyan-Purple
  ['#FFD93D', '#FF3366'], // Gold-Red
];

// Animated Logo Block Component
const AnimatedLogoBlock = ({ index, colors }: { index: number; colors: string[] }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Staggered rotation animation
    const delay = index * 200;
    
    // Continuous rotation
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000 + (index * 100),
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    // Pulse animation
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

    // Glow animation
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
        {/* Glossy highlight */}
        <View style={styles.blockHighlight} />
        {/* Bottom shadow for 3D effect */}
        <View style={[styles.blockShadow, { backgroundColor: colors[1] }]} />
      </Animated.View>
    </Animated.View>
  );
};

// Main Animated Logo Component
const AnimatedLogo = () => {
  const containerRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow continuous rotation for the entire grid
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
  const { loadQuests, dailyQuests } = useQuestStore();
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const titleGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
    initSounds();
    
    // Entry animation
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

    // Title glow animation
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

  const glowColor = titleGlow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 217, 255, 0.3)', 'rgba(168, 85, 247, 0.6)'],
  });

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
              <AnimatedLogo />
              
              <Animated.Text 
                style={[
                  styles.title,
                  { textShadowColor: glowColor }
                ]}
              >
                PUZZLE MASTER
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.titleBlast,
                  { textShadowColor: glowColor }
                ]}
              >
                BLAST
              </Animated.Text>
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

            {/* Daily Quests Preview */}
            {dailyQuests.length > 0 && (
              <View style={styles.questsPreview}>
                <Text style={styles.questsPreviewTitle}>Günlük Görevler</Text>
                {dailyQuests.slice(0, 2).map((quest) => (
                  <View key={quest.id} style={styles.questPreviewItem}>
                    <View style={styles.questPreviewInfo}>
                      <Text style={styles.questPreviewName}>{quest.title}</Text>
                      <View style={styles.questPreviewProgress}>
                        <View 
                          style={[
                            styles.questPreviewFill, 
                            { width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }
                          ]} 
                        />
                      </View>
                    </View>
                    <Text style={styles.questPreviewXP}>+{quest.xpReward} XP</Text>
                    {quest.completed && !quest.claimed && (
                      <View style={styles.questClaimDot} />
                    )}
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  logoOuterContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoGrid: {
    width: 120,
    height: 120,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBlockWrapper: {
    width: 36,
    height: 36,
    margin: 2,
    perspective: 1000,
  },
  logoBlock: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
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
    borderRadius: 4,
  },
  blockShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    opacity: 0.5,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 3,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleBlast: {
    fontSize: 44,
    fontWeight: '900',
    color: '#FFD93D',
    letterSpacing: 6,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 25,
    marginTop: -5,
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  leaderboardText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  // Quest Preview Styles
  questsPreview: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  questsPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  questPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  questPreviewInfo: {
    flex: 1,
  },
  questPreviewName: {
    fontSize: 13,
    color: '#ccc',
    marginBottom: 4,
  },
  questPreviewProgress: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  questPreviewFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 2,
  },
  questPreviewXP: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 12,
  },
  questClaimDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
    marginLeft: 8,
  },
});
