// Skins Shop Modal - Blok tema mağazası (Fixed for Web)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSkinsStore, BlockSkin } from '@/src/store/skinsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 80) / 2;

interface SkinsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SkinsModal: React.FC<SkinsModalProps> = ({ visible, onClose }) => {
  const { skins: storeSkins, activeSkin, unlockedSkins, setSkin, watchAdToUnlock } = useSkinsStore();
  const [loading, setLoading] = useState<string | null>(null);
  
  // Fallback skins if store is empty
  const defaultSkins: BlockSkin[] = [
    { id: 'default', name: 'Klasik', colors: ['#FF5252', '#00E5FF', '#69F0AE', '#FFD740'] },
    { id: 'neon', name: 'Neon', colors: ['#00F0FF', '#FF0099', '#39FF14', '#FAFF00'], glow: true, adCost: 3 },
    { id: 'gold', name: 'Altın', colors: ['#FFD700', '#FFA500', '#FF8C00', '#DAA520'], premium: true, adCost: 5 },
    { id: 'ocean', name: 'Okyanus', colors: ['#00CED1', '#20B2AA', '#48D1CC', '#40E0D0'], adCost: 3 },
    { id: 'sunset', name: 'Gün Batımı', colors: ['#FF6B6B', '#FF8E53', '#FFA07A', '#FFB347'], adCost: 3 },
    { id: 'galaxy', name: 'Galaksi', colors: ['#9B59B6', '#8E44AD', '#663399', '#4B0082'], glow: true, premium: true, adCost: 7 },
  ];
  
  const skins = storeSkins && storeSkins.length > 0 ? storeSkins : defaultSkins;
  
  const handleSelect = (skinId: string) => {
    if (unlockedSkins.includes(skinId)) {
      setSkin(skinId);
    }
  };
  
  const handleUnlock = async (skin: BlockSkin) => {
    setLoading(skin.id);
    await watchAdToUnlock(skin.id);
    setLoading(null);
  };
  
  // Skins'i 2'li gruplara böl
  const skinPairs: BlockSkin[][] = [];
  for (let i = 0; i < skins.length; i += 2) {
    skinPairs.push(skins.slice(i, i + 2));
  }
  
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="color-palette" size={28} color="#BD00FF" />
            <Text style={styles.title}>Blok Temaları</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>
          
          {/* Skins List */}
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {skins.map((skin, index) => {
              const isUnlocked = unlockedSkins.includes(skin.id);
              const isActive = activeSkin === skin.id;
              const isLoading = loading === skin.id;
              
              return (
                <TouchableOpacity
                  key={skin.id}
                  style={[
                    styles.skinRow,
                    isActive && styles.skinRowActive,
                  ]}
                  onPress={() => isUnlocked ? handleSelect(skin.id) : handleUnlock(skin)}
                  disabled={isLoading}
                >
                  {/* Color Preview */}
                  <View style={styles.colorRow}>
                    {skin.colors.slice(0, 4).map((color, i) => (
                      <View 
                        key={i} 
                        style={[styles.colorDot, { backgroundColor: color }]} 
                      />
                    ))}
                  </View>
                  
                  {/* Name & Status */}
                  <View style={styles.skinInfo}>
                    <Text style={styles.skinName}>{skin.name}</Text>
                    {skin.glow && <Ionicons name="sparkles" size={14} color="#00F0FF" style={{ marginLeft: 6 }} />}
                    {skin.premium && <Ionicons name="diamond" size={14} color="#FFD700" style={{ marginLeft: 6 }} />}
                  </View>
                  
                  {/* Action */}
                  {isActive ? (
                    <View style={styles.activeBadge}>
                      <Ionicons name="checkmark-circle" size={18} color="#39FF14" />
                    </View>
                  ) : isUnlocked ? (
                    <TouchableOpacity style={styles.selectBtn} onPress={() => handleSelect(skin.id)}>
                      <Text style={styles.selectText}>Seç</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.unlockBtn} onPress={() => handleUnlock(skin)} disabled={isLoading}>
                      <Ionicons name="play-circle" size={14} color="#FFD700" />
                      <Text style={styles.unlockText}>{isLoading ? '...' : `${skin.adCost || 1}`}</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#11112B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingTop: 20,
    paddingHorizontal: 16,
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
  },
  scrollView: {
    flex: 1,
  },
  skinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A3F',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  skinRowActive: {
    borderWidth: 2,
    borderColor: '#39FF14',
  },
  colorRow: {
    flexDirection: 'row',
    marginRight: 12,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    marginRight: 4,
  },
  skinInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skinName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  activeBadge: {
    padding: 4,
  },
  selectBtn: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  unlockText: {
    color: '#FFD700',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  bottomSpacer: {
    height: 30,
  },
});

export default SkinsModal;
