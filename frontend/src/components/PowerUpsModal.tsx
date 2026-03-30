// PowerUps Modal - Joker Satın Alma ve Kazanma
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePowerUpsStore, PowerUpType } from '@/src/store/powerUpsStore';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';
import { useQuestStore } from '@/src/store/questStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PowerUpsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PowerUpsModal: React.FC<PowerUpsModalProps> = ({ visible, onClose }) => {
  const { powerUps, watchAdForPowerUp, purchasePowerUp } = usePowerUpsStore();
  const { totalCoins, deductCoins } = useDailyRewardsStore();
  const { updateQuestProgress } = useQuestStore();
  
  const [loadingId, setLoadingId] = useState<PowerUpType | null>(null);
  const [loadingType, setLoadingType] = useState<'ad' | 'coin' | null>(null);

  const handleWatchAd = async (powerUp: typeof powerUps[0]) => {
    setLoadingId(powerUp.id);
    setLoadingType('ad');
    
    try {
      await watchAdForPowerUp(powerUp.id);
      updateQuestProgress('watch_ad', powerUp.adCost);
      Alert.alert(
        'Tebrikler! 🎉',
        `1x ${powerUp.name} kazandınız!`,
        [{ text: 'Tamam' }]
      );
    } catch (error) {
      Alert.alert('Hata', 'Reklam yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoadingId(null);
      setLoadingType(null);
    }
  };

  const handlePurchase = (powerUp: typeof powerUps[0]) => {
    if (totalCoins < powerUp.coinCost) {
      Alert.alert(
        'Yetersiz Coin',
        `Bu joker için ${powerUp.coinCost} coin gerekiyor.\n\nMevcut: ${totalCoins} coin\n\nGörevleri tamamlayarak veya reklam izleyerek coin kazanabilirsiniz!`
      );
      return;
    }
    
    Alert.alert(
      'Joker Satın Al',
      `${powerUp.name} jokerini ${powerUp.coinCost} coin'e satın almak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Satın Al',
          onPress: () => {
            setLoadingId(powerUp.id);
            setLoadingType('coin');
            
            const success = purchasePowerUp(powerUp.id, deductCoins);
            
            setTimeout(() => {
              setLoadingId(null);
              setLoadingType(null);
              
              if (success) {
                Alert.alert(
                  'Satın Alındı! 🎉',
                  `1x ${powerUp.name} envanterinize eklendi!`,
                  [{ text: 'Tamam' }]
                );
              } else {
                Alert.alert('Hata', 'Satın alma başarısız oldu.');
              }
            }, 500);
          }
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="flash" size={24} color="#FFD700" />
              <Text style={styles.title}>Jokerler</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Coins Bar */}
          <View style={styles.coinsBar}>
            <Ionicons name="logo-bitcoin" size={20} color="#F7931A" />
            <Text style={styles.coinsText}>{totalCoins} Coin</Text>
          </View>

          {/* Info */}
          <View style={styles.infoBar}>
            <Ionicons name="information-circle" size={16} color="#4ECDC4" />
            <Text style={styles.infoText}>
              Jokerler oyun içinde kullanılabilir. Reklam izleyerek veya coin ile satın alabilirsiniz.
            </Text>
          </View>

          {/* Power-ups Grid */}
          <View style={styles.grid}>
            {powerUps.map((powerUp) => {
              const isLoading = loadingId === powerUp.id;
              
              return (
                <View key={powerUp.id} style={styles.powerUpCard}>
                  {/* Icon & Count */}
                  <View style={[styles.iconContainer, { backgroundColor: `${powerUp.color}20` }]}>
                    <Ionicons name={powerUp.icon as any} size={36} color={powerUp.color} />
                    {powerUp.count > 0 && (
                      <View style={[styles.countBadge, { backgroundColor: powerUp.color }]}>
                        <Text style={styles.countText}>{powerUp.count}</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <Text style={styles.powerUpName}>{powerUp.name}</Text>
                  <Text style={styles.powerUpDesc}>{powerUp.description}</Text>

                  {/* Current Stock */}
                  <View style={styles.stockRow}>
                    <Text style={styles.stockLabel}>Envanter:</Text>
                    <Text style={[styles.stockValue, { color: powerUp.count > 0 ? '#4ECDC4' : '#666' }]}>
                      {powerUp.count}x
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    {/* Watch Ad Button */}
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.adBtn]}
                      onPress={() => handleWatchAd(powerUp)}
                      disabled={isLoading}
                    >
                      {isLoading && loadingType === 'ad' ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="play-circle" size={16} color="#fff" />
                          <Text style={styles.actionBtnText}>İzle</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Buy Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionBtn, 
                        styles.buyBtn,
                        totalCoins < powerUp.coinCost && styles.buyBtnDisabled
                      ]}
                      onPress={() => handlePurchase(powerUp)}
                      disabled={isLoading}
                    >
                      {isLoading && loadingType === 'coin' ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="logo-bitcoin" size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>{powerUp.coinCost}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Ionicons name="bulb" size={16} color="#FFD700" />
            <Text style={styles.tipsText}>İpucu: Günlük görevleri tamamlayarak coin kazanın!</Text>
          </View>
        </View>
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
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  coinsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247, 147, 26, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 12,
    gap: 8,
  },
  coinsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F7931A',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#4ECDC4',
    lineHeight: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  powerUpCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  countBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#11112B',
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  powerUpName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  powerUpDesc: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  stockLabel: {
    fontSize: 11,
    color: '#666',
  },
  stockValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  adBtn: {
    backgroundColor: '#4ECDC4',
  },
  buyBtn: {
    backgroundColor: '#F7931A',
  },
  buyBtnDisabled: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tipsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  tipsText: {
    fontSize: 12,
    color: '#888',
  },
});

export default PowerUpsModal;
