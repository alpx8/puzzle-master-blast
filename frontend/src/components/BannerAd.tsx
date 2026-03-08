// Banner Ad Component for Game Screen
// Web'de placeholder gösterir, native'de gerçek reklam
import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BannerAdProps {
  position?: 'top' | 'bottom';
  testID?: string;
}

export const BannerAd: React.FC<BannerAdProps> = ({ 
  position = 'bottom',
  testID = 'banner-ad-container'
}) => {
  // Web platformunda sadece placeholder göster
  // Native'de gerçek reklam gösterilecek (production build'de)
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
          {Platform.OS === 'web' 
            ? 'Reklam Alanı (Mobil Uygulamada Aktif)'
            : 'Reklam Yükleniyor...'
          }
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default BannerAd;
