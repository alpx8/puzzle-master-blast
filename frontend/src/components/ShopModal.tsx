import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';
import { useSkinsStore } from '@/src/store/skinsStore';
import { usePowerUpsStore } from '@/src/store/powerUpsStore';
import { useInventoryStore } from '@/src/store/inventoryStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Coin Packages
const COIN_PACKAGES = [
  { id: 'coins_500', coins: 500, bonus: 0, price: '₺19.99', icon: 'logo-bitcoin' },
  { id: 'coins_1200', coins: 1000, bonus: 200, price: '₺39.99', icon: 'logo-bitcoin', popular: true },
  { id: 'coins_3000', coins: 2000, bonus: 1000, price: '₺79.99', icon: 'logo-bitcoin' },
  { id: 'coins_8000', coins: 4000, bonus: 4000, price: '₺149.99', icon: 'logo-bitcoin', best: true },
];

// Power-ups
const POWERUPS = [
  { id: 'bomb', name: 'Bomba', icon: 'flame', color: '#FF6B6B', price: 100, description: 'Seçili alanı temizle' },
  { id: 'shuffle', name: 'Karıştır', icon: 'shuffle', color: '#4ECDC4', price: 75, description: 'Blokları yenile' },
  { id: 'undo', name: 'Geri Al', icon: 'arrow-undo', color: '#667eea', price: 50, description: 'Son hamleyi geri al' },
];

type TabType = 'coins' | 'themes' | 'powerups';

interface ShopModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('coins');
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const { totalCoins, addCoins } = useDailyRewardsStore();
  const { skins, backgrounds, activeSkin, activeBackground, setSkin, setBackground } = useSkinsStore();
  const { powerUps, addPowerUp } = usePowerUpsStore();
  const { ownedThemes, ownedBackgrounds, purchaseTheme, purchaseBackground } = useInventoryStore();

  // Use skins as themes - with safe fallback
  const themes = (skins || []).map(skin => ({
    id: skin.id,
    name: skin.name,
    colors: skin.colors?.slice(0, 3) || ['#FF5252', '#00E5FF', '#69F0AE'],
    price: skin.adCost ? skin.adCost * 100 : 0,
  }));

  const safeBackgrounds = backgrounds || [];
  const activeTheme = activeSkin || 'default';
  const setActiveTheme = setSkin;
  const setActiveBackground = setBackground;

  const handleBuyCoin = async (packageItem: typeof COIN_PACKAGES[0]) => {
    if (Platform.OS === 'web') {
      // Simülasyon modu
      Alert.alert(
        'Simülasyon',
        `Bu satın alma simüle edildi.\n+${packageItem.coins + packageItem.bonus} coin eklendi!`,
        [{ text: 'Tamam' }]
      );
      addCoins(packageItem.coins + packageItem.bonus);
    } else {
      // Gerçek IAP (react-native-iap)
      Alert.alert('Bilgi', 'Gerçek satın alma sadece cihazda çalışır.');
    }
  };

  const handleBuyPowerUp = (powerup: typeof POWERUPS[0]) => {
    if (totalCoins >= powerup.price) {
      addCoins(-powerup.price);
      addPowerUp(powerup.id, 1);
      Alert.alert('Başarılı!', `${powerup.name} satın alındı!`);
    } else {
      Alert.alert('Yetersiz Coin', 'Bu güçlendirmeyi almak için yeterli coin yok.');
    }
  };

  const handleBuyTheme = (themeId: string, price: number) => {
    if (ownedThemes.includes(themeId)) {
      setActiveTheme(themeId);
      return;
    }
    
    if (totalCoins >= price) {
      purchaseTheme(themeId);
      addCoins(-price);
      setActiveTheme(themeId);
      Alert.alert('Başarılı!', 'Tema satın alındı ve uygulandı!');
    } else {
      Alert.alert('Yetersiz Coin', 'Bu temayı almak için yeterli coin yok.');
    }
  };

  const handleBuyBackground = (bgId: string, price: number) => {
    const bgPrice = price || 0;
    
    if (ownedBackgrounds.includes(bgId)) {
      setActiveBackground(bgId);
      return;
    }
    
    if (bgPrice === 0 || totalCoins >= bgPrice) {
      purchaseBackground(bgId);
      if (bgPrice > 0) addCoins(-bgPrice);
      setActiveBackground(bgId);
      Alert.alert('Başarılı!', 'Arkaplan satın alındı ve uygulandı!');
    } else {
      Alert.alert('Yetersiz Coin', 'Bu arkaplanı almak için yeterli coin yok.');
    }
  };

  const renderCoinsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Coin Paketleri</Text>
      
      {COIN_PACKAGES.map((pkg) => (
        <TouchableOpacity
          key={pkg.id}
          style={[
            styles.coinPackage,
            pkg.popular && styles.popularPackage,
            pkg.best && styles.bestPackage,
          ]}
          onPress={() => handleBuyCoin(pkg)}
        >
          {pkg.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularBadgeText}>POPÜLER</Text>
            </View>
          )}
          {pkg.best && (
            <View style={[styles.popularBadge, { backgroundColor: '#FFD700' }]}>
              <Text style={[styles.popularBadgeText, { color: '#000' }]}>EN İYİ</Text>
            </View>
          )}
          
          <View style={styles.coinPackageLeft}>
            <Ionicons name="logo-bitcoin" size={36} color="#FFD700" />
            <View style={styles.coinPackageInfo}>
              <Text style={styles.coinPackageAmount}>{pkg.coins.toLocaleString()}</Text>
              {pkg.bonus > 0 && (
                <Text style={styles.coinPackageBonus}>+{pkg.bonus} bonus</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity style={styles.buyButton}>
            <Text style={styles.buyButtonText}>{pkg.price}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
      
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  const renderThemesTab = () => {
    // Safe themes array
    const safeThemes = themes.length > 0 ? themes : [
      { id: 'classic', name: 'Klasik', colors: ['#FF5252', '#00E5FF', '#69F0AE'], price: 0 },
    ];
    
    return (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Blok Temaları</Text>
      
      <View style={styles.themesGrid}>
        {safeThemes.map((theme) => {
          const isOwned = ownedThemes.includes(theme.id) || theme.price === 0;
          const isActive = activeTheme === theme.id;
          
          return (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeCard,
                isActive && styles.themeCardActive,
              ]}
              onPress={() => handleBuyTheme(theme.id, theme.price)}
            >
              <View style={[styles.themePreview, { backgroundColor: theme.colors[0] }]}>
                <View style={[styles.themeBlock, { backgroundColor: theme.colors[1] || theme.colors[0] }]} />
                <View style={[styles.themeBlock, { backgroundColor: theme.colors[2] || theme.colors[0] }]} />
              </View>
              
              <Text style={styles.themeName}>{theme.name}</Text>
              
              {isOwned ? (
                <View style={[styles.themeStatus, isActive && styles.themeStatusActive]}>
                  <Ionicons name={isActive ? 'checkmark-circle' : 'checkmark'} size={14} color={isActive ? '#4ECDC4' : '#888'} />
                  <Text style={[styles.themeStatusText, isActive && { color: '#4ECDC4' }]}>
                    {isActive ? 'Aktif' : 'Sahip'}
                  </Text>
                </View>
              ) : (
                <View style={styles.themePrice}>
                  <Ionicons name="logo-bitcoin" size={12} color="#FFD700" />
                  <Text style={styles.themePriceText}>{theme.price}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Arkaplanlar</Text>
      
      <View style={styles.themesGrid}>
        {safeBackgrounds.length > 0 ? safeBackgrounds.map((bg) => {
          const isOwned = ownedBackgrounds.includes(bg.id) || bg.free;
          const isActive = activeBackground === bg.id;
          const bgPrice = bg.coinCost || 0;
          
          return (
            <TouchableOpacity
              key={bg.id}
              style={[
                styles.themeCard,
                isActive && styles.themeCardActive,
              ]}
              onPress={() => handleBuyBackground(bg.id, bgPrice)}
            >
              <View style={[styles.bgPreview, { backgroundColor: bg.colors[0] }]}>
                <View style={[styles.bgGradient, { backgroundColor: bg.colors[1], opacity: 0.5 }]} />
              </View>
              
              <Text style={styles.themeName}>{bg.name}</Text>
              
              {isOwned ? (
                <View style={[styles.themeStatus, isActive && styles.themeStatusActive]}>
                  <Ionicons name={isActive ? 'checkmark-circle' : 'checkmark'} size={14} color={isActive ? '#4ECDC4' : '#888'} />
                  <Text style={[styles.themeStatusText, isActive && { color: '#4ECDC4' }]}>
                    {isActive ? 'Aktif' : 'Sahip'}
                  </Text>
                </View>
              ) : (
                <View style={styles.themePrice}>
                  <Ionicons name="logo-bitcoin" size={12} color="#FFD700" />
                  <Text style={styles.themePriceText}>{bgPrice}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }) : (
          <Text style={{ color: '#888', padding: 20 }}>Arkaplan yükleniyor...</Text>
        )}
      </View>
      
      <View style={{ height: 20 }} />
    </ScrollView>
  );
  };

  const renderPowerUpsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Güçlendirmeler</Text>
      
      {POWERUPS.map((powerup) => {
        const owned = powerUps[powerup.id] || 0;
        
        return (
          <View key={powerup.id} style={styles.powerupCard}>
            <View style={[styles.powerupIcon, { backgroundColor: powerup.color }]}>
              <Ionicons name={powerup.icon as any} size={28} color="#fff" />
            </View>
            
            <View style={styles.powerupInfo}>
              <View style={styles.powerupHeader}>
                <Text style={styles.powerupName}>{powerup.name}</Text>
                <View style={styles.powerupOwned}>
                  <Text style={styles.powerupOwnedText}>x{owned}</Text>
                </View>
              </View>
              <Text style={styles.powerupDesc}>{powerup.description}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.powerupBuyBtn}
              onPress={() => handleBuyPowerUp(powerup)}
            >
              <Ionicons name="logo-bitcoin" size={14} color="#FFD700" />
              <Text style={styles.powerupBuyText}>{powerup.price}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
      
      {/* Watch Ad Section */}
      <View style={styles.watchAdSection}>
        <Ionicons name="videocam" size={24} color="#4ECDC4" />
        <View style={styles.watchAdInfo}>
          <Text style={styles.watchAdTitle}>Reklam İzle</Text>
          <Text style={styles.watchAdDesc}>Ücretsiz güçlendirme kazan!</Text>
        </View>
        <TouchableOpacity 
          style={styles.watchAdBtn}
          onPress={() => {
            addPowerUp('bomb', 1);
            Alert.alert('Tebrikler!', 'Ücretsiz Bomba kazandın!');
          }}
        >
          <Ionicons name="play-circle" size={20} color="#fff" />
          <Text style={styles.watchAdBtnText}>İzle</Text>
        </TouchableOpacity>
      </View>
      
      <View style={{ height: 20 }} />
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mağaza</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Coin Balance */}
          <View style={styles.balanceBar}>
            <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
            <Text style={styles.balanceText}>{totalCoins.toLocaleString()}</Text>
            <Text style={styles.balanceLabel}>Coin</Text>
          </View>
          
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'coins' && styles.activeTab]}
              onPress={() => setActiveTab('coins')}
            >
              <Ionicons name="logo-bitcoin" size={18} color={activeTab === 'coins' ? '#FFD700' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'coins' && styles.activeTabText]}>Coin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'themes' && styles.activeTab]}
              onPress={() => setActiveTab('themes')}
            >
              <Ionicons name="color-palette" size={18} color={activeTab === 'themes' ? '#A855F7' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'themes' && styles.activeTabText]}>Temalar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'powerups' && styles.activeTab]}
              onPress={() => setActiveTab('powerups')}
            >
              <Ionicons name="flash" size={18} color={activeTab === 'powerups' ? '#FF6B6B' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'powerups' && styles.activeTabText]}>Jokerler</Text>
            </TouchableOpacity>
          </View>
          
          {/* Tab Content */}
          {activeTab === 'coins' && renderCoinsTab()}
          {activeTab === 'themes' && renderThemesTab()}
          {activeTab === 'powerups' && renderPowerUpsTab()}
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
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.85,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  balanceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#888',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  tabText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  // Coin Packages
  coinPackage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  popularPackage: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  bestPackage: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  coinPackageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coinPackageInfo: {
    alignItems: 'flex-start',
  },
  coinPackageAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  coinPackageBonus: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Themes
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeCard: {
    width: (SCREEN_WIDTH - 60) / 3,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeCardActive: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  themePreview: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    padding: 4,
  },
  themeBlock: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  bgPreview: {
    width: 50,
    height: 50,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bgGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  themeName: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  themeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  themeStatusActive: {},
  themeStatusText: {
    fontSize: 10,
    color: '#888',
  },
  themePrice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  themePriceText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  // Power-ups
  powerupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  powerupIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  powerupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  powerupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  powerupName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  powerupOwned: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  powerupOwnedText: {
    fontSize: 11,
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  powerupDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  powerupBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  powerupBuyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  watchAdSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 16,
    borderRadius: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
  },
  watchAdInfo: {
    flex: 1,
    marginLeft: 12,
  },
  watchAdTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  watchAdDesc: {
    fontSize: 12,
    color: '#4ECDC4',
  },
  watchAdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  watchAdBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default ShopModal;
