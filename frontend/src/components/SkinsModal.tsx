// Skins Modal - Tema ve Arka Plan Seçimi
import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSkinsStore, BlockSkin } from '@/src/store/skinsStore';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SkinsModalProps {
  visible: boolean;
  onClose: () => void;
}

// Arka plan temaları
const BACKGROUNDS = [
  { id: 'default', name: 'Klasik Gece', colors: ['#0a0a1a', '#1a1a35'], free: true },
  { id: 'ocean', name: 'Okyanus Derinliği', colors: ['#0a192f', '#172a45'], adCost: 2 },
  { id: 'sunset', name: 'Gün Batımı', colors: ['#1a0a0a', '#2d1f1f'], adCost: 2 },
  { id: 'forest', name: 'Gece Ormanı', colors: ['#0a1a0f', '#1a352a'], adCost: 2 },
  { id: 'galaxy', name: 'Galaksi', colors: ['#0f0a1a', '#1f1a35'], adCost: 3 },
  { id: 'neon', name: 'Neon Şehir', colors: ['#0a0a15', '#15152a'], adCost: 3 },
  { id: 'fire', name: 'Volkanik', colors: ['#1a0a0a', '#351a1a'], adCost: 4 },
  { id: 'ice', name: 'Buzul', colors: ['#0a1a1f', '#1a3540'], adCost: 4 },
];

export const SkinsModal: React.FC<SkinsModalProps> = ({ visible, onClose }) => {
  const { skins, activeSkin, unlockedSkins, setSkin, watchAdToUnlock } = useSkinsStore();
  const [activeTab, setActiveTab] = useState<'blocks' | 'backgrounds'>('blocks');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeBackground, setActiveBackground] = useState('default');
  const [unlockedBackgrounds, setUnlockedBackgrounds] = useState(['default']);

  const handleSelectSkin = (skin: BlockSkin) => {
    if (unlockedSkins.includes(skin.id)) {
      setSkin(skin.id);
    } else {
      // Reklam izle ve aç
      handleWatchAdForSkin(skin);
    }
  };

  const handleWatchAdForSkin = async (skin: BlockSkin) => {
    Alert.alert(
      'Reklam İzle',
      `"${skin.name}" temasını açmak için ${skin.adCost || 1} reklam izlemeniz gerekiyor. İzlemek ister misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { 
          text: 'Reklam İzle',
          onPress: async () => {
            setLoadingId(skin.id);
            try {
              // Simüle edilmiş reklam izleme
              await new Promise(resolve => setTimeout(resolve, 2000));
              await watchAdToUnlock(skin.id);
              Alert.alert('Tebrikler!', `"${skin.name}" teması açıldı!`);
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

  const handleSelectBackground = (bg: typeof BACKGROUNDS[0]) => {
    if (unlockedBackgrounds.includes(bg.id)) {
      setActiveBackground(bg.id);
    } else {
      handleWatchAdForBackground(bg);
    }
  };

  const handleWatchAdForBackground = async (bg: typeof BACKGROUNDS[0]) => {
    Alert.alert(
      'Reklam İzle',
      `"${bg.name}" arka planını açmak için ${bg.adCost || 1} reklam izlemeniz gerekiyor.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Reklam İzle',
          onPress: async () => {
            setLoadingId(bg.id);
            try {
              await new Promise(resolve => setTimeout(resolve, 2000));
              setUnlockedBackgrounds(prev => [...prev, bg.id]);
              setActiveBackground(bg.id);
              Alert.alert('Tebrikler!', `"${bg.name}" arka planı açıldı!`);
            } catch (error) {
              Alert.alert('Hata', 'Reklam yüklenemedi.');
            } finally {
              setLoadingId(null);
            }
          }
        },
      ]
    );
  };

  const renderBlockPreview = (colors: string[]) => {
    return (
      <View style={styles.blockPreview}>
        {colors.slice(0, 4).map((color, index) => (
          <View key={index} style={[styles.previewBlock, { backgroundColor: color }]}>
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

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'blocks' && styles.activeTab]}
              onPress={() => setActiveTab('blocks')}
            >
              <Ionicons name="cube" size={18} color={activeTab === 'blocks' ? '#BD00FF' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'blocks' && styles.activeTabText]}>
                Bloklar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'backgrounds' && styles.activeTab]}
              onPress={() => setActiveTab('backgrounds')}
            >
              <Ionicons name="image" size={18} color={activeTab === 'backgrounds' ? '#BD00FF' : '#666'} />
              <Text style={[styles.tabText, activeTab === 'backgrounds' && styles.activeTabText]}>
                Arka Plan
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
                        <ActivityIndicator size="small" color="#BD00FF" />
                      ) : (
                        <>
                          {renderBlockPreview(skin.colors)}
                          <Text style={styles.skinName}>{skin.name}</Text>
                          
                          {!isUnlocked && (
                            <View style={styles.lockBadge}>
                              <Ionicons name="play-circle" size={14} color="#FFD700" />
                              <Text style={styles.lockText}>{skin.adCost || 1}</Text>
                            </View>
                          )}
                          
                          {isActive && (
                            <View style={styles.activeBadge}>
                              <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
                            </View>
                          )}
                          
                          {skin.glow && (
                            <View style={styles.glowBadge}>
                              <Ionicons name="sparkles" size={12} color="#FFD700" />
                            </View>
                          )}
                          
                          {skin.premium && (
                            <View style={styles.premiumBadge}>
                              <Ionicons name="diamond" size={12} color="#BD00FF" />
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
                {BACKGROUNDS.map((bg) => {
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
                            colors={bg.colors as [string, string]}
                            style={styles.bgPreview}
                          >
                            <View style={styles.bgMiniBoard}>
                              {[0, 1, 2, 3].map(i => (
                                <View key={i} style={styles.bgMiniCell} />
                              ))}
                            </View>
                          </LinearGradient>
                          <Text style={styles.bgName}>{bg.name}</Text>
                          
                          {!isUnlocked && (
                            <View style={styles.lockBadge}>
                              <Ionicons name="play-circle" size={14} color="#FFD700" />
                              <Text style={styles.lockText}>{bg.adCost}</Text>
                            </View>
                          )}
                          
                          {isActive && (
                            <View style={styles.activeBadge}>
                              <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
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
            <Text style={styles.infoText}>Reklam izleyerek temaları açabilirsiniz</Text>
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
    maxWidth: 380,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
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
    fontSize: 14,
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
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeSkinCard: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  lockedSkinCard: {
    opacity: 0.8,
  },
  blockPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  previewBlock: {
    width: 22,
    height: 22,
    margin: 1,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  previewHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  skinName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  lockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  lockText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  glowBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  bgCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
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
    opacity: 0.8,
  },
  bgPreview: {
    width: '100%',
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  bgName: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
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
    fontSize: 12,
    color: '#666',
  },
});

export default SkinsModal;
