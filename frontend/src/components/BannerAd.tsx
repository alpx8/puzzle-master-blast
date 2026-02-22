// Banner Ad Component for Game Screen
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { getAdUnitId, AdMobConfig } from '../config/admobConfig';

interface BannerAdProps {
  position?: 'top' | 'bottom';
  testID?: string;
}

export const BannerAd: React.FC<BannerAdProps> = ({ 
  position = 'bottom',
  testID = 'banner-ad-container'
}) => {
  const [adError, setAdError] = useState<string | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [BannerComponent, setBannerComponent] = useState<any>(null);
  const [BannerSize, setBannerSize] = useState<any>(null);

  useEffect(() => {
    // Only load AdMob on native platforms
    if (Platform.OS !== 'web') {
      loadAdMobBanner();
    }
  }, []);

  const loadAdMobBanner = async () => {
    try {
      const admob = await import('react-native-google-mobile-ads');
      setBannerComponent(() => admob.BannerAd);
      setBannerSize(admob.BannerAdSize);
    } catch (error) {
      console.log('[BannerAd] AdMob not available:', error);
    }
  };

  // Web platform fallback - show placeholder
  if (Platform.OS === 'web') {
    return (
      <View 
        style={[
          styles.container, 
          position === 'top' ? styles.top : styles.bottom
        ]}
        testID={testID}
      >
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Reklam Alanı (Mobil Uygulamada Görünür)
          </Text>
        </View>
      </View>
    );
  }

  // Native platform with AdMob
  if (BannerComponent && BannerSize) {
    const adUnitId = getAdUnitId('BANNER');
    
    return (
      <View 
        style={[
          styles.container, 
          position === 'top' ? styles.top : styles.bottom
        ]}
        testID={testID}
      >
        <BannerComponent
          unitId={adUnitId}
          size={BannerSize.ANCHORED_ADAPTIVE_BANNER}
          onAdLoaded={() => {
            console.log('[BannerAd] Ad loaded');
            setAdLoaded(true);
            setAdError(null);
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn('[BannerAd] Failed to load:', error);
            setAdError('Reklam yüklenemedi');
            setAdLoaded(false);
          }}
          onAdOpened={() => console.log('[BannerAd] Ad opened')}
          onAdClosed={() => console.log('[BannerAd] Ad closed')}
        />
        {adError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{adError}</Text>
          </View>
        )}
      </View>
    );
  }

  // Loading state
  return (
    <View 
      style={[
        styles.container, 
        position === 'top' ? styles.top : styles.bottom,
        styles.loading
      ]}
      testID={testID}
    >
      <Text style={styles.loadingText}>Reklam yükleniyor...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    minHeight: 50,
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  placeholder: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
  },
  loading: {
    opacity: 0.7,
  },
  loadingText: {
    color: '#666',
    fontSize: 11,
    paddingVertical: 8,
  },
  errorContainer: {
    padding: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default BannerAd;
