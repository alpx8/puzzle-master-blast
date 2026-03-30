// Skins Modal - Tema ve Arka Plan Seçimi
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSkinsStore, BlockSkin, Background } from '@/src/store/skinsStore';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';
import { useQuestStore } from '@/src/store/questStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SkinsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SkinsModal: React.FC<SkinsModalProps> = ({ visible, onClose }) => {
  const { 
    skins, 
    backgrounds,
    activeSkin, 
    activeBackground,
    unlockedSkins, 
    unlockedBackgrounds,
    setSkin, 
    setBackground,
    watchAdToUnlock,
    purchaseBackground,
    loadSkins,
  } = useSkinsStore();
  
  const { totalCoins, deductCoins } = useDailyRewardsStore();
  const { updateQuestProgress } = useQuestStore();
  
  const [activeTab, setActiveTab] = useState<'blocks' | 'backgrounds'>('blocks');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadSkins();
    }
  }, [visible]);

  const handleSelectSkin = (skin: BlockSkin) => {
    if (unlockedSkins.includes(skin.id)) {
      setSkin(skin.id);
    } else {
      handleWatchAdForSkin(skin);
    }
  };

  const handleWatchAdForSkin = async (skin: BlockSkin) => {
    const adCount = skin.adCost || 1;
    
    Alert.alert(
      'Tema Aç',
      `"${skin.name}" temasını açmak için ${adCount} reklam izlemeniz gerekiyor.\n\nİzlemek ister misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: `${adCount} Reklam İzle`,
          onPress: async () => {
            setLoadingId(skin.id);
            try {
              // Simulated ad watching - In production, use AdMob rewarded ads
              for (let i = 0; i < adCount; i++) {
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
              
              await watchAdToUnlock(skin.id);
              updateQuestProgress('watch_ad', adCount);
              
              Alert.alert('Tebrikler! 🎉', `"${skin.name}" teması açıldı ve aktif edildi!`);
            } catch (error) {
              Alert.alert('Hata', 'Reklam yüklenemedi. Lütfen tekrar deneyin.');
            } finally {
              setLoadingId(null);
            }
          }
        },
      ]
    );
  };

  const handleSelectBackground = (bg: Background) => {
    if (unlockedBackgrounds.includes(bg.id)) {
      setBackground(bg.id);
    } else {
      handlePurchaseBackground(bg);
    }
  };

  const handlePurchaseBackground = async (bg: Background) => {
    if (totalCoins < bg.coinCost) {
      Alert.alert(
        'Yetersiz Coin',
        `Bu arka plan için ${bg.coinCost} coin gerekiyor.\n\nMevcut: ${totalCoins} coin\n\nGörevleri tamamlayarak ve günlük ödülleri alarak coin kazanabilirsiniz!`
      );
      return;
    }
    
    Alert.alert(
      'Arka Plan Satın Al',
      `"${bg.name}" arka planını ${bg.coinCost} coin'e satın almak istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Satın Al',
          onPress: async () => {
            setLoadingId(bg.id);
            try {
              const success = await purchaseBackground(bg.id, totalCoins, deductCoins);
              if (success) {
                Alert.alert('Tebrikler! 🎉', `"${bg.name}" arka planı satın alındı ve aktif edildi!`);
              }
            } catch (error) {
              Alert.alert('Hata', 'Satın alma başarısız. Lütfen tekrar deneyin.');
            } finally {
              setLoadingId(null);
            }
          }
        },
      ]
    );
  };

  const renderBlockPreview = (skin: BlockSkin) => {
    return (
      <View style={styles.blockPreview}>
        {skin.colors.slice(0, 4).map((color, index) => (
          <View 
            key={index} 
            style={[
              styles.previewBlock, 
              { backgroundColor: color },
              skin.glow && styles.glowBlock,
              skin.neon && styles.neonBlock,
            ]}
          >
            <View style={[styles.previewHighlight, { backgroundColor: `${color}99` }]} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="color-palette" size={24} color="#BD00FF" />
            <Text style={styles.title}>Temalar</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Coins Display */}
          <View style={styles.coinsBar}>
            <Ionicons name="logo-bitcoin" size={18} color="#F7931A" />
            <Text style={styles.coinsText}>{totalCoins} Coin</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'blocks' && styles.activeTab]}
              onPress={() => setActiveTab('blocks')}
            >
              <Ionicons name="cube" size={18} color={activeTab === 'blocks' ? '#BD00FF' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'blocks' && styles.activeTabText]}>
                Bloklar ({skins.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'backgrounds' && styles.activeTab]}
              onPress={() => setActiveTab('backgrounds')}
            >
              <Ionicons name="image" size={18} color={activeTab === 'backgrounds' ? '#BD00FF' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'backgrounds' && styles.activeTabText]}>
                Arka Plan ({backgrounds.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'blocks' ? (
              <View style={styles.grid}>
                {skins.map((skin) => {
                  const isUnlocked = unlockedSkins.includes(skin.id);
                  const isActive = activeSkin === skin.id;
                  const isLoading = loadingId === skin.id;

                  return (
                    <TouchableOpacity
                      key={skin.id}
                      style={[
                        styles.skinCard,
                        isActive && styles.activeSkinCard,
                        !isUnlocked && styles.lockedSkinCard,
                      ]}
                      onPress={() => handleSelectSkin(skin)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color="#BD00FF" />
                          <Text style={styles.loadingText}>Reklam...</Text>
                        </View>
                      ) : (
                        <>
                          {renderBlockPreview(skin)}
                          <Text style={styles.skinName} numberOfLines={1}>{skin.name}</Text>
                          
                          {/* Badges */}
                          {skin.neon && (
                            <View style={[styles.featureBadge, { backgroundColor: '#00FF00' }]}>
                              <Text style={styles.featureBadgeText}>NEON</Text>
                            </View>
                          )}
                          
                          {skin.glow && !skin.neon && (
                            <View style={[styles.featureBadge, { backgroundColor: '#FFD700' }]}>
                              <Text style={styles.featureBadgeText}>GLOW</Text>
                            </View>
                          )}
                          
                          {skin.premium && (
                            <View style={styles.premiumBadge}>
                              <Ionicons name="diamond" size={10} color="#BD00FF" />
                            </View>
                          )}
                          
                          {!isUnlocked && (
                            <View style={styles.lockBadge}>
                              <Ionicons name="play-circle" size={12} color="#FFD700" />
                              <Text style={styles.lockText}>{skin.adCost || 1}</Text>
                            </View>
                          )}
                          
                          {isActive && (
                            <View style={styles.activeBadge}>
                              <Ionicons name="checkmark-circle" size={18} color="#4ECDC4" />
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.grid}>
                {backgrounds.map((bg) => {
                  const isUnlocked = unlockedBackgrounds.includes(bg.id);
                  const isActive = activeBackground === bg.id;
                  const isLoading = loadingId === bg.id;

                  return (
                    <TouchableOpacity
                      key={bg.id}
                      style={[
                        styles.bgCard,
                        isActive && styles.activeBgCard,
                        !isUnlocked && styles.lockedBgCard,
                      ]}
                      onPress={() => handleSelectBackground(bg)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#BD00FF" />
                      ) : (
                        <>
                          <LinearGradient
                            colors={bg.colors}
                            style={styles.bgPreview}
                          >
                            <View style={styles.bgMiniBoard}>
                              {[0, 1, 2, 3].map(i => (
                                <View key={i} style={styles.bgMiniCell} />
                              ))}
                            </View>
                          </LinearGradient>
                          <Text style={styles.bgName} numberOfLines={1}>{bg.name}</Text>
                          
                          {!isUnlocked && (
                            <View style={styles.coinBadge}>
                              <Ionicons name="logo-bitcoin" size={12} color="#F7931A" />
                              <Text style={styles.coinBadgeText}>{bg.coinCost}</Text>
                            </View>
                          )}
                          
                          {bg.free && (
                            <View style={[styles.freeBadge]}>
                              <Text style={styles.freeBadgeText}>ÜCRETSİZ</Text>
                            </View>
                          )}
                          
                          {isActive && (
                            <View style={styles.activeBadge}>
                              <Ionicons name="checkmark-circle" size={18} color="#4ECDC4" />
                            </View>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Info */}
          <View style={styles.infoBar}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.infoText}>
              {activeTab === 'blocks' 
                ? 'Blok temaları reklam izleyerek açılır' 
                : 'Arka planlar coin ile satın alınır'}
            </Text>
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
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  coinsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F7931A',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(189, 0, 255, 0.2)',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#BD00FF',
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  skinCard: {
    width: '31%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 100,
  },
  activeSkinCard: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  lockedSkinCard: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 10,
    color: '#BD00FF',
    marginTop: 4,
  },
  blockPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 44,
    height: 44,
    marginBottom: 6,
  },
  previewBlock: {
    width: 20,
    height: 20,
    margin: 1,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  glowBlock: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  neonBlock: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  previewHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 6,
    height: 6,
    borderRadius: 2,
  },
  skinName: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  featureBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  featureBadgeText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#000',
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
  },
  lockBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  lockText: {
    fontSize: 9,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  activeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  bgCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeBgCard: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  lockedBgCard: {
    opacity: 0.7,
  },
  bgPreview: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgMiniBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 30,
    height: 30,
  },
  bgMiniCell: {
    width: 12,
    height: 12,
    margin: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  bgName: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  coinBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  coinBadgeText: {
    fontSize: 10,
    color: '#F7931A',
    fontWeight: 'bold',
  },
  freeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freeBadgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  infoText: {
    fontSize: 11,
    color: '#666',
  },
});

export default SkinsModal;
