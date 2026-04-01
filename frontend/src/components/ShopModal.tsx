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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';
import { useSkinsStore } from '@/src/store/skinsStore';
import { usePowerUpsStore } from '@/src/store/powerUpsStore';
import { useInventoryStore } from '@/src/store/inventoryStore';
import { useVIPStore } from '@/src/store/vipStore';
import { getAdUnitId } from '@/src/utils/adManager';

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
  { id: 'extra_life', name: 'Ekstra Can', icon: 'heart', color: '#FF69B4', price: 150, description: 'Oyun bitince devam et' },
];

// Video İzle Ödülleri
const VIDEO_REWARDS = [
  { type: 'coins', min: 5, max: 25, weight: 50 },
  { type: 'bomb', amount: 1, weight: 20 },
  { type: 'shuffle', amount: 1, weight: 15 },
  { type: 'undo', amount: 1, weight: 10 },
  { type: 'extra_life', amount: 1, weight: 5 },
];

type TabType = 'coins' | 'themes' | 'powerups' | 'vip';

interface ShopModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('coins');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [lastReward, setLastReward] = useState<{ type: string; amount: number } | null>(null);
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);
  const rewardScale = useState(new Animated.Value(0))[0];
  
  const { totalCoins, addCoins } = useDailyRewardsStore();
  const { skins, backgrounds, activeSkin, activeBackground, setSkin, setBackground } = useSkinsStore();
  const { powerUps, addPowerUp } = usePowerUpsStore();
  const { ownedThemes, ownedBackgrounds, purchaseTheme, purchaseBackground } = useInventoryStore();
  const { isVIP, price: vipPrice, purchaseVIP, subscriptionEndDate, loadVIPStatus } = useVIPStore();

  useEffect(() => {
    if (visible) {
      loadVIPStatus();
    }
  }, [visible]);

  // Rastgele ödül seç
  const getRandomReward = () => {
    const totalWeight = VIDEO_REWARDS.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const reward of VIDEO_REWARDS) {
      random -= reward.weight;
      if (random <= 0) {
        if (reward.type === 'coins') {
          const amount = Math.floor(Math.random() * (reward.max! - reward.min! + 1)) + reward.min!;
          return { type: 'coins', amount };
        }
        return { type: reward.type, amount: reward.amount! };
      }
    }
    
    return { type: 'coins', amount: 10 };
  };

  // Ödül animasyonu göster
  const showReward = (reward: { type: string; amount: number }) => {
    setLastReward(reward);
    setShowRewardAnimation(true);
    
    Animated.sequence([
      Animated.spring(rewardScale, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(rewardScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowRewardAnimation(false);
      rewardScale.setValue(0);
    });
  };

  // Video izle ve ödül al
  const handleWatchVideo = async () => {
    setIsWatchingAd(true);
    
    if (Platform.OS === 'web') {
      // Web simülasyonu
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const reward = getRandomReward();
      
      // Ödülü ver
      if (reward.type === 'coins') {
        addCoins(reward.amount);
      } else {
        addPowerUp(reward.type, reward.amount);
      }
      
      setIsWatchingAd(false);
      showReward(reward);
      
      const rewardName = reward.type === 'coins' ? `${reward.amount} Coin` :
        reward.type === 'bomb' ? 'Bomba' :
        reward.type === 'shuffle' ? 'Karıştır' :
        reward.type === 'undo' ? 'Geri Al' :
        'Ekstra Can';
      
      Alert.alert('Tebrikler!', `${rewardName} kazandın!`);
    } else {
      // Native'de gerçek reklam
      try {
        const adUnitId = getAdUnitId('REWARDED');
        console.log('[Shop] Showing rewarded ad:', adUnitId);
        
        const reward = getRandomReward();
        
        if (reward.type === 'coins') {
          addCoins(reward.amount);
        } else {
          addPowerUp(reward.type, reward.amount);
        }
        
        showReward(reward);
      } catch (error) {
        console.error('[Shop] Ad error:', error);
        Alert.alert('Hata', 'Reklam yüklenemedi, lütfen tekrar deneyin.');
      }
      setIsWatchingAd(false);
    }
  };

  // VIP satın al
  const handleBuyVIP = async () => {
    setIsPurchasing(true);
    
    const success = await purchaseVIP();
    
    setIsPurchasing(false);
    
    if (success) {
      Alert.alert(
        'Hoş Geldiniz VIP!',
        'Artık reklamsız oynayabilirsiniz! Aboneliğiniz 30 gün geçerlidir.',
        [{ text: 'Harika!' }]
      );
    } else {
      Alert.alert('Hata', 'Satın alma tamamlanamadı.');
    }
  };

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
  const setActiveBackgroundFunc = setBackground;

  const handleBuyCoin = async (packageItem: typeof COIN_PACKAGES[0]) => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Simülasyon',
        `Bu satın alma simüle edildi.\n+${packageItem.coins + packageItem.bonus} coin eklendi!`,
        [{ text: 'Tamam' }]
      );
      addCoins(packageItem.coins + packageItem.bonus);
    } else {
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
      setActiveBackgroundFunc(bgId);
      return;
    }
    
    if (bgPrice === 0 || totalCoins >= bgPrice) {
      purchaseBackground(bgId);
      if (bgPrice > 0) addCoins(-bgPrice);
      setActiveBackgroundFunc(bgId);
      Alert.alert('Başarılı!', 'Arkaplan satın alındı ve uygulandı!');
    } else {
      Alert.alert('Yetersiz Coin', 'Bu arkaplanı almak için yeterli coin yok.');
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'coins': return 'logo-bitcoin';
      case 'bomb': return 'flame';
      case 'shuffle': return 'shuffle';
      case 'undo': return 'arrow-undo';
      case 'extra_life': return 'heart';
      default: return 'gift';
    }
  };

  const getRewardColor = (type: string) => {
    switch (type) {
      case 'coins': return '#FFD700';
      case 'bomb': return '#FF6B6B';
      case 'shuffle': return '#4ECDC4';
      case 'undo': return '#667eea';
      case 'extra_life': return '#FF69B4';
      default: return '#fff';
    }
  };

  // VIP Tab
  const renderVIPTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* VIP Banner */}
      <View style={styles.vipBanner}>
        <View style={styles.vipCrown}>
          <Ionicons name="crown" size={40} color="#FFD700" />
        </View>
        <Text style={styles.vipTitle}>VIP Üyelik</Text>
        <Text style={styles.vipSubtitle}>Reklamsız oyun deneyimi!</Text>
      </View>
      
      {/* VIP Status */}
      {isVIP ? (
        <View style={styles.vipActiveCard}>
          <View style={styles.vipActiveHeader}>
            <Ionicons name="checkmark-circle" size={28} color="#4ECDC4" />
            <Text style={styles.vipActiveTitle}>VIP Üyesiniz!</Text>
          </View>
          <Text style={styles.vipActiveDesc}>
            Tüm reklamlar kaldırıldı. Keyifli oyunlar!
          </Text>
          {subscriptionEndDate && (
            <Text style={styles.vipExpiry}>
              Bitiş: {new Date(subscriptionEndDate).toLocaleDateString('tr-TR')}
            </Text>
          )}
        </View>
      ) : (
        <>
          {/* VIP Features */}
          <View style={styles.vipFeatures}>
            <Text style={styles.sectionTitle}>VIP Avantajları</Text>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                <Ionicons name="close-circle" size={24} color="#FF6B6B" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>Reklamsız Oyun</Text>
                <Text style={styles.featureDesc}>Hiçbir reklam görmeden oyna!</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(78, 205, 196, 0.2)' }]}>
                <Ionicons name="flash" size={24} color="#4ECDC4" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>Hızlı Yükleme</Text>
                <Text style={styles.featureDesc}>Reklam beklemeden direkt oyna</Text>
              </View>
            </View>
            
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                <Ionicons name="star" size={24} color="#A855F7" />
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureName}>VIP Rozeti</Text>
                <Text style={styles.featureDesc}>Özel VIP profil rozeti</Text>
              </View>
            </View>
          </View>
          
          {/* Purchase Button */}
          <TouchableOpacity 
            style={styles.vipPurchaseBtn}
            onPress={handleBuyVIP}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <ActivityIndicator size="small" color="#1a1a2e" />
            ) : (
              <>
                <Ionicons name="crown" size={24} color="#1a1a2e" />
                <View style={styles.vipPurchaseInfo}>
                  <Text style={styles.vipPurchaseText}>VIP Ol</Text>
                  <Text style={styles.vipPurchasePrice}>{vipPrice}</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.vipNote}>
            * Aylık abonelik. İstediğiniz zaman iptal edebilirsiniz.
          </Text>
        </>
      )}
      
      <View style={{ height: 20 }} />
    </ScrollView>
  );

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
      
      {/* Video İzle Bölümü - Rastgele Ödül */}
      <View style={styles.watchVideoSection}>
        <View style={styles.watchVideoHeader}>
          <Ionicons name="videocam" size={28} color="#A855F7" />
          <View style={styles.watchVideoInfo}>
            <Text style={styles.watchVideoTitle}>Video İzle</Text>
            <Text style={styles.watchVideoSubtitle}>Rastgele ödül kazan!</Text>
          </View>
        </View>
        
        {/* Ödül Olasılıkları */}
        <View style={styles.rewardChances}>
          <View style={styles.rewardChanceItem}>
            <Ionicons name="logo-bitcoin" size={16} color="#FFD700" />
            <Text style={styles.rewardChanceText}>5-25 Coin</Text>
          </View>
          <View style={styles.rewardChanceItem}>
            <Ionicons name="flame" size={16} color="#FF6B6B" />
            <Text style={styles.rewardChanceText}>Bomba</Text>
          </View>
          <View style={styles.rewardChanceItem}>
            <Ionicons name="shuffle" size={16} color="#4ECDC4" />
            <Text style={styles.rewardChanceText}>Karıştır</Text>
          </View>
          <View style={styles.rewardChanceItem}>
            <Ionicons name="arrow-undo" size={16} color="#667eea" />
            <Text style={styles.rewardChanceText}>Geri Al</Text>
          </View>
          <View style={styles.rewardChanceItem}>
            <Ionicons name="heart" size={16} color="#FF69B4" />
            <Text style={styles.rewardChanceText}>Ekstra Can</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.watchVideoBtn, isWatchingAd && styles.watchVideoBtnDisabled]}
          onPress={handleWatchVideo}
          disabled={isWatchingAd}
        >
          {isWatchingAd ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.watchVideoBtnText}>Reklam Yükleniyor...</Text>
            </>
          ) : (
            <>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.watchVideoBtnText}>Reklam İzle & Ödül Kazan</Text>
            </>
          )}
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
            {isVIP && (
              <View style={styles.vipBadge}>
                <Ionicons name="crown" size={12} color="#FFD700" />
                <Text style={styles.vipBadgeText}>VIP</Text>
              </View>
            )}
          </View>
          
          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'coins' && styles.activeTab]}
              onPress={() => setActiveTab('coins')}
            >
              <Ionicons name="logo-bitcoin" size={16} color={activeTab === 'coins' ? '#FFD700' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'coins' && styles.activeTabText]}>Coin</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'themes' && styles.activeTab]}
              onPress={() => setActiveTab('themes')}
            >
              <Ionicons name="color-palette" size={16} color={activeTab === 'themes' ? '#A855F7' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'themes' && styles.activeTabText]}>Tema</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'powerups' && styles.activeTab]}
              onPress={() => setActiveTab('powerups')}
            >
              <Ionicons name="flash" size={16} color={activeTab === 'powerups' ? '#FF6B6B' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'powerups' && styles.activeTabText]}>Joker</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'vip' && styles.activeTab, styles.vipTab]}
              onPress={() => setActiveTab('vip')}
            >
              <Ionicons name="crown" size={16} color={activeTab === 'vip' ? '#FFD700' : '#888'} />
              <Text style={[styles.tabText, activeTab === 'vip' && styles.activeTabText]}>VIP</Text>
            </TouchableOpacity>
          </View>
          
          {/* Tab Content */}
          {activeTab === 'coins' && renderCoinsTab()}
          {activeTab === 'themes' && renderThemesTab()}
          {activeTab === 'powerups' && renderPowerUpsTab()}
          {activeTab === 'vip' && renderVIPTab()}
          
          {/* Reward Animation Overlay */}
          {showRewardAnimation && lastReward && (
            <Animated.View style={[styles.rewardOverlay, { transform: [{ scale: rewardScale }] }]}>
              <View style={[styles.rewardBox, { backgroundColor: getRewardColor(lastReward.type) }]}>
                <Ionicons name={getRewardIcon(lastReward.type) as any} size={48} color="#fff" />
                <Text style={styles.rewardAmount}>+{lastReward.amount}</Text>
              </View>
            </Animated.View>
          )}
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
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
    gap: 4,
  },
  vipBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  vipTab: {
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  tabText: {
    fontSize: 11,
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
  // VIP Styles
  vipBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  vipCrown: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  vipTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 4,
  },
  vipSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  vipActiveCard: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    marginBottom: 16,
  },
  vipActiveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  vipActiveTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  vipActiveDesc: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  vipExpiry: {
    fontSize: 12,
    color: '#666',
  },
  vipFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
    marginLeft: 12,
  },
  featureName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  featureDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  vipPurchaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  vipPurchaseInfo: {
    alignItems: 'center',
  },
  vipPurchaseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  vipPurchasePrice: {
    fontSize: 14,
    color: '#1a1a2e',
    opacity: 0.8,
  },
  vipNote: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
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
  // Watch Video Section
  watchVideoSection: {
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  watchVideoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  watchVideoInfo: {
    marginLeft: 12,
  },
  watchVideoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  watchVideoSubtitle: {
    fontSize: 12,
    color: '#A855F7',
  },
  rewardChances: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  rewardChanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rewardChanceText: {
    fontSize: 11,
    color: '#fff',
  },
  watchVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A855F7',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  watchVideoBtnDisabled: {
    opacity: 0.6,
  },
  watchVideoBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Reward Animation
  rewardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  rewardBox: {
    width: 120,
    height: 120,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
});

export default ShopModal;
