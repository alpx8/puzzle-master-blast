// Daily Rewards Modal - Günlük ödül modalı
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
  const { isVIP } = useVIPStore();
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
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
    }
  }, [visible]);

  // Reklam gösterme fonksiyonu
  const showInterstitialAd = async () => {
    // VIP kullanıcılara reklam gösterme
    if (isVIP) {
      console.log('[DailyReward] VIP user - skipping ad');
      return;
    }
    
    // Web'de reklam simülasyonu
    if (Platform.OS === 'web') {
      setIsLoadingAd(true);
      // 2 saniye bekleme simülasyonu
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsLoadingAd(false);
      Alert.alert(
        'Reklam (Simülasyon)',
        'Gerçek cihazda burada bir reklam gösterilecek.',
        [{ text: 'Tamam' }]
      );
      return;
    }
    
    // Native'de gerçek reklam göster
    try {
      setIsLoadingAd(true);
      // react-native-google-mobile-ads ile reklam göster
      // Bu kısım gerçek cihazda çalışacak
      const adUnitId = getAdUnitId('INTERSTITIAL');
      console.log('[DailyReward] Showing interstitial ad:', adUnitId);
      
      // AdMob interstitial reklamı yükle ve göster
      // Not: Gerçek implementasyon cihazda test edilmeli
      setIsLoadingAd(false);
    } catch (error) {
      console.error('[DailyReward] Ad error:', error);
      setIsLoadingAd(false);
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
    
    // Kapat
    setTimeout(onClose, 300);
  };

  const todayReward = rewards[currentStreak % 7];
  
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
              
              return (
                <View 
                  key={index}
                  style={[
                    styles.dayBox,
                    isClaimed && styles.dayBoxClaimed,
                    isToday && styles.dayBoxToday,
                  ]}
                >
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                    {DAYS[index]}
                  </Text>
                  
                  {reward.skin ? (
                    <Ionicons 
                      name="color-palette" 
                      size={24} 
                      color={isClaimed ? '#666' : isToday ? '#FFD700' : '#888'} 
                    />
                  ) : (
                    <Ionicons 
                      name="star" 
                      size={24} 
                      color={isClaimed ? '#666' : isToday ? '#FFD700' : '#888'} 
                    />
                  )}
                  
                  <Text style={[styles.dayReward, isClaimed && styles.dayRewardClaimed]}>
                    +{reward.xp}
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
                <Text style={styles.rewardValue}>{todayReward?.coins || 100}</Text>
              </View>
              {todayReward?.skin && (
                <View style={styles.rewardItem}>
                  <Ionicons name="color-palette" size={28} color="#BD00FF" />
                  <Text style={styles.rewardValue}>Skin!</Text>
                </View>
              )}
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
          
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
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
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
});

export default DailyRewardsModal;
