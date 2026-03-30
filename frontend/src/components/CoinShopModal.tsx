// Coin Shop Modal - Profesyonel Mağaza
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCoinShopStore, COIN_PRODUCTS, CoinProductKey } from '@/src/store/coinShopStore';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CoinShopModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CoinShopModal: React.FC<CoinShopModalProps> = ({ visible, onClose }) => {
  const { products, purchaseCoins, isPurchasing, initializeIAP, purchaseHistory, error } = useCoinShopStore();
  const { totalCoins, addCoins } = useDailyRewardsStore();
  const [selectedPackage, setSelectedPackage] = useState<CoinProductKey | null>(null);

  useEffect(() => {
    if (visible) {
      initializeIAP();
    }
  }, [visible]);

  const handlePurchase = async (productKey: CoinProductKey) => {
    const product = products[productKey];
    
    Alert.alert(
      'Satın Almayı Onayla',
      `${product.coins + product.bonus} Coin satın almak istediğinizden emin misiniz?\n\nFiyat: ${product.price}`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Satın Al',
          onPress: async () => {
            setSelectedPackage(productKey);
            const success = await purchaseCoins(productKey, addCoins);
            if (success) {
              Alert.alert(
                'Satın Alma Başarılı! 🎉',
                `${product.coins + product.bonus} Coin hesabınıza eklendi!`,
                [{ text: 'Tamam' }]
              );
            }
            setSelectedPackage(null);
          },
        },
      ]
    );
  };

  const productKeys = Object.keys(products) as CoinProductKey[];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <Ionicons name="storefront" size={28} color="#1a1a2e" />
              <Text style={styles.title}>Coin Mağazası</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#1a1a2e" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Current Balance */}
          <View style={styles.balanceBar}>
            <Text style={styles.balanceLabel}>Mevcut Bakiye</Text>
            <View style={styles.balanceRow}>
              <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
              <Text style={styles.balanceText}>{totalCoins.toLocaleString()}</Text>
            </View>
          </View>

          {/* Products */}
          <ScrollView style={styles.productsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.productsGrid}>
              {productKeys.map((key) => {
                const product = products[key];
                const isLoading = isPurchasing && selectedPackage === key;
                const totalCoinsPackage = product.coins + product.bonus;
                
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.productCard,
                      product.popular && styles.popularCard,
                      product.bestValue && styles.bestValueCard,
                    ]}
                    onPress={() => handlePurchase(key)}
                    disabled={isPurchasing}
                  >
                    {/* Badge */}
                    {product.popular && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>POPÜLER</Text>
                      </View>
                    )}
                    {product.bestValue && (
                      <View style={[styles.badge, styles.bestValueBadge]}>
                        <Text style={styles.badgeText}>EN İYİ DEĞER</Text>
                      </View>
                    )}

                    {/* Coin Icon */}
                    <View style={styles.coinIconContainer}>
                      <Ionicons name="logo-bitcoin" size={40} color="#FFD700" />
                      {product.bonus > 0 && (
                        <View style={styles.bonusTag}>
                          <Text style={styles.bonusTagText}>+{Math.round((product.bonus / product.coins) * 100)}%</Text>
                        </View>
                      )}
                    </View>

                    {/* Coin Amount */}
                    <Text style={styles.coinAmount}>{totalCoinsPackage.toLocaleString()}</Text>
                    <Text style={styles.coinLabel}>Coin</Text>
                    
                    {product.bonus > 0 && (
                      <Text style={styles.bonusText}>
                        ({product.coins} + {product.bonus} bonus)
                      </Text>
                    )}

                    {/* Price Button */}
                    <LinearGradient
                      colors={product.bestValue ? ['#4ECDC4', '#2ECC71'] : ['#FFD700', '#FFA500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.priceButton}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#1a1a2e" />
                      ) : (
                        <Text style={styles.priceText}>{product.price}</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons name="shield-checkmark" size={20} color="#4ECDC4" />
                <Text style={styles.infoText}>Güvenli ödeme</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="flash" size={20} color="#FFD700" />
                <Text style={styles.infoText}>Anında teslimat</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="infinite" size={20} color="#BD00FF" />
                <Text style={styles.infoText}>Coinler kaybolmaz</Text>
              </View>
            </View>

            {/* Purchase History */}
            {purchaseHistory.length > 0 && (
              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Son Satın Almalar</Text>
                {purchaseHistory.slice(-3).reverse().map((purchase, index) => (
                  <View key={purchase.id} style={styles.historyItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
                    <Text style={styles.historyText}>
                      {purchase.coins} Coin - {purchase.price}
                    </Text>
                    <Text style={styles.historyDate}>
                      {new Date(purchase.date).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Terms */}
            <Text style={styles.termsText}>
              Satın almalar Google Play hesabınızdan tahsil edilir.
              Tüm satışlar kesindir ve iade edilemez.
            </Text>
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
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  closeBtn: {
    padding: 4,
  },
  balanceBar: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  productsScroll: {
    paddingHorizontal: 16,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  productCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  popularCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  bestValueCard: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestValueBadge: {
    backgroundColor: '#4ECDC4',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  coinIconContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  bonusTag: {
    position: 'absolute',
    bottom: -4,
    right: -12,
    backgroundColor: '#FF5F1F',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bonusTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  coinAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  coinLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  bonusText: {
    fontSize: 10,
    color: '#4ECDC4',
    marginBottom: 8,
  },
  priceButton: {
    width: '100%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 8,
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#888',
  },
  historySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  historyText: {
    flex: 1,
    fontSize: 13,
    color: '#ccc',
  },
  historyDate: {
    fontSize: 11,
    color: '#666',
  },
  termsText: {
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    lineHeight: 14,
  },
});

export default CoinShopModal;
