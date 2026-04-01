// Daily Rewards Modal - Günlük ödül modalı (7. gün VIP deneme özellikli)
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';
import { useVIPStore } from '@/src/store/vipStore';
import { getAdUnitId } from '@/src/utils/adManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyRewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({ visible, onClose }) => {
  const { currentStreak, rewards, claimReward, totalCoins, setShouldShowAd } = useDailyRewardsStore();
  const { isVIP, canActivateTrial, activateTrialVIP, hasUsedTrial, loadVIPStatus } = useVIPStore();
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [showVIPTrialOffer, setShowVIPTrialOffer] = useState(false);
  const [isActivatingTrial, setIsActivatingTrial] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const crownAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      loadVIPStatus();
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      setShowVIPTrialOffer(false);
    }
  }, [visible]);

  // Crown animasyonu
  useEffect(() => {
    if (showVIPTrialOffer) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(crownAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(crownAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [showVIPTrialOffer]);

  // Reklam gösterme fonksiyonu
  const showInterstitialAd = async (): Promise<boolean> => {
    // VIP kullanıcılara reklam gösterme
    if (isVIP) {
      console.log('[DailyReward] VIP user - skipping ad');
      return true;
    }
    
    // Web'de reklam simülasyonu
    if (Platform.OS === 'web') {
      setIsLoadingAd(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoadingAd(false);
      return true;
    }
    
    // Native'de gerçek reklam göster
    try {
      setIsLoadingAd(true);
      const adUnitId = getAdUnitId('INTERSTITIAL');
      console.log('[DailyReward] Showing interstitial ad:', adUnitId);
      setIsLoadingAd(false);
      return true;
    } catch (error) {
      console.error('[DailyReward] Ad error:', error);
      setIsLoadingAd(false);
      return false;
    }
  };

  // VIP deneme için reklam izle
  const handleWatchAdForTrial = async () => {
    setIsActivatingTrial(true);
    
    // Reklam göster
    const adWatched = await showInterstitialAd();
    
    if (adWatched) {
      // VIP denemeyi aktive et
      const success = await activateTrialVIP();
      
      setIsActivatingTrial(false);
      
      if (success) {
        Alert.alert(
          '🎉 Tebrikler!',
          '1 günlük VIP denemeniz aktive edildi!\n\n24 saat boyunca reklamsız oynayabilirsiniz.',
          [{ text: 'Harika!', onPress: onClose }]
        );
      } else {
        Alert.alert('Hata', 'VIP deneme aktive edilemedi.');
      }
    } else {
      setIsActivatingTrial(false);
      Alert.alert('Hata', 'Reklam izlenemedi, lütfen tekrar deneyin.');
    }
  };

  const handleClaim = async () => {
    // Ödülü al
    const reward = await claimReward();
    console.log('[DailyReward] Claimed:', reward);
    
    // Reklam göster (VIP değilse)
    await showInterstitialAd();
    
    // Flag'i sıfırla
    setShouldShowAd(false);
    
    // 7. gün ve VIP deneme kullanılabilir mi kontrol et
    const newStreak = currentStreak + 1;
    if (newStreak >= 7 && canActivateTrial()) {
      // 7 günlük seri tamamlandı ve VIP deneme hakkı var
      setShowVIPTrialOffer(true);
    } else {
      // Normal kapat
      setTimeout(onClose, 300);
    }
  };

  const todayReward = rewards[currentStreak % 7];
  const is7thDay = (currentStreak + 1) >= 7;
  const crownScale = crownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });
  
  // VIP Deneme Teklifi Ekranı
  if (showVIPTrialOffer) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.container,
              styles.vipTrialContainer,
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            {/* Confetti efekti */}
            <View style={styles.confetti}>
              <Text style={styles.confettiEmoji}>🎉</Text>
              <Text style={styles.confettiEmoji}>🎊</Text>
              <Text style={styles.confettiEmoji}>✨</Text>
            </View>
            
            {/* Crown */}
            <Animated.View style={[styles.crownContainer, { transform: [{ scale: crownScale }] }]}>
              <Ionicons name="crown" size={60} color="#FFD700" />
            </Animated.View>
            
            <Text style={styles.vipTrialTitle}>7 Günlük Seri!</Text>
            <Text style={styles.vipTrialSubtitle}>Tebrikler! 7 gün üst üste giriş yaptın!</Text>
            
            {/* VIP Deneme Teklifi */}
            <View style={styles.vipTrialOffer}>
              <Text style={styles.vipTrialOfferTitle}>🎁 Özel Ödül</Text>
              <Text style={styles.vipTrialOfferDesc}>
                1 günlük VIP deneme kazan!{'\n'}
                Reklamsız oyna!
              </Text>
              
              {!hasUsedTrial ? (
                <TouchableOpacity 
                  style={styles.watchAdBtn}
                  onPress={handleWatchAdForTrial}
                  disabled={isActivatingTrial}
                >
                  {isActivatingTrial ? (
                    <ActivityIndicator size="small" color="#1a1a2e" />
                  ) : (
                    <>
                      <Ionicons name="videocam" size={24} color="#1a1a2e" />
                      <Text style={styles.watchAdBtnText}>Reklam İzle & VIP Kazan</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.trialUsedBox}>
                  <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                  <Text style={styles.trialUsedText}>VIP deneme daha önce kullanıldı</Text>
                </View>
              )}
            </View>
            
            {/* Kapat */}
            <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
              <Text style={styles.skipBtnText}>
                {hasUsedTrial ? 'Kapat' : 'Şimdilik Geç'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
            <Ionicons name="gift" size={32} color="#FFD700" />
            <Text style={styles.title}>Günlük Ödül</Text>
            <Text style={styles.subtitle}>
              {currentStreak > 0 ? `${currentStreak} Gün Serisi!` : 'Hoş Geldin!'}
            </Text>
          </View>
          
          {/* Days Row */}
          <View style={styles.daysContainer}>
            {rewards.map((reward, index) => {
              const isToday = index === currentStreak % 7;
              const isClaimed = index < currentStreak % 7 || (currentStreak > 0 && index < rewards.filter(r => r.claimed).length);
              const is7thDayBox = index === 6;
              
              return (
                <View 
                  key={index}
                  style={[
                    styles.dayBox,
                    isClaimed && styles.dayBoxClaimed,
                    isToday && styles.dayBoxToday,
                    is7thDayBox && styles.dayBox7th,
                  ]}
                >
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                    {DAYS[index]}
                  </Text>
                  
                  {is7thDayBox ? (
                    <Ionicons 
                      name="crown" 
                      size={24} 
                      color={isClaimed ? '#666' : isToday ? '#FFD700' : '#A855F7'} 
                    />
                  ) : (
                    <Ionicons 
                      name="star" 
                      size={24} 
                      color={isClaimed ? '#666' : isToday ? '#FFD700' : '#888'} 
                    />
                  )}
                  
                  <Text style={[styles.dayReward, isClaimed && styles.dayRewardClaimed]}>
                    +{reward.coins}
                  </Text>
                  
                  {isClaimed && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark" size={14} color="#39FF14" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
          
          {/* 7. Gün VIP Bonus Bilgisi */}
          {is7thDay && canActivateTrial() && (
            <View style={styles.vipBonusHint}>
              <Ionicons name="crown" size={16} color="#FFD700" />
              <Text style={styles.vipBonusHintText}>
                7. gün için 1 günlük VIP deneme!
              </Text>
            </View>
          )}
          
          {/* Today's Reward */}
          <View style={styles.todayReward}>
            <Text style={styles.todayLabel}>Bugünkü Ödül</Text>
            <View style={styles.rewardRow}>
              <View style={styles.rewardItem}>
                <Ionicons name="star" size={28} color="#FFD700" />
                <Text style={styles.rewardValue}>{todayReward?.xp || 50} XP</Text>
              </View>
              <View style={styles.rewardItem}>
                <Ionicons name="logo-bitcoin" size={28} color="#F7931A" />
                <Text style={styles.rewardValue}>{todayReward?.coins || 1}</Text>
              </View>
            </View>
          </View>
          
          {/* Claim Button */}
          <TouchableOpacity 
            style={[styles.claimButton, isLoadingAd && styles.claimButtonDisabled]} 
            onPress={handleClaim}
            disabled={isLoadingAd}
          >
            {isLoadingAd ? (
              <>
                <ActivityIndicator size="small" color="#0A0A1A" />
                <Text style={styles.claimText}>Reklam Yükleniyor...</Text>
              </>
            ) : (
              <>
                <Ionicons name="gift-outline" size={24} color="#0A0A1A" />
                <Text style={styles.claimText}>Ödülü Al!</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Coins Display */}
          <View style={styles.coinsDisplay}>
            <Ionicons name="logo-bitcoin" size={18} color="#F7931A" />
            <Text style={styles.coinsText}>Toplam: {totalCoins}</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#11112B',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  vipTrialContainer: {
    borderColor: '#A855F7',
    backgroundColor: '#1a1a3e',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginTop: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 2,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayBox: {
    width: 40,
    height: 65,
    backgroundColor: '#1A1A3F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  dayBoxClaimed: {
    backgroundColor: '#0A0A1A',
    opacity: 0.7,
  },
  dayBoxToday: {
    backgroundColor: '#2A1A4F',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  dayBox7th: {
    borderWidth: 1,
    borderColor: '#A855F7',
  },
  dayLabel: {
    fontSize: 10,
    color: '#888',
    marginBottom: 4,
  },
  dayLabelToday: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  dayReward: {
    fontSize: 10,
    color: '#888',
    marginTop: 4,
  },
  dayRewardClaimed: {
    color: '#444',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  vipBonusHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  vipBonusHintText: {
    fontSize: 12,
    color: '#A855F7',
    fontWeight: '600',
  },
  todayReward: {
    backgroundColor: '#1A1A3F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  todayLabel: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  rewardItem: {
    alignItems: 'center',
    gap: 4,
  },
  rewardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  claimButton: {
    flexDirection: 'row',
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  claimText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0A0A1A',
  },
  claimButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#CCA500',
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  coinsText: {
    color: '#888',
    fontSize: 14,
  },
  // VIP Trial Styles
  confetti: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 10,
  },
  confettiEmoji: {
    fontSize: 32,
  },
  crownContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  vipTrialTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 4,
  },
  vipTrialSubtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: 20,
  },
  vipTrialOffer: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A855F7',
    marginBottom: 16,
  },
  vipTrialOfferTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  vipTrialOfferDesc: {
    fontSize: 14,
    color: '#A855F7',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  watchAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    width: '100%',
  },
  watchAdBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  trialUsedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  trialUsedText: {
    fontSize: 13,
    color: '#4ECDC4',
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    color: '#888',
  },
});

export default DailyRewardsModal;
