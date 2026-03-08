// ScreenShake - Wrapper component for screen shake effects
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';

interface ScreenShakeProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export interface ScreenShakeRef {
  triggerShake: (intensity?: 'light' | 'medium' | 'heavy') => void;
  triggerCelebration: () => void;
}

export const ScreenShake = forwardRef<ScreenShakeRef, ScreenShakeProps>(
  ({ children, style }, ref) => {
    const shakeX = useRef(new Animated.Value(0)).current;
    const shakeY = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useImperativeHandle(ref, () => ({
      triggerShake: (intensity = 'medium') => {
        const intensityMap = {
          light: { offset: 3, duration: 50, iterations: 3 },
          medium: { offset: 6, duration: 40, iterations: 5 },
          heavy: { offset: 10, duration: 30, iterations: 8 },
        };

        const config = intensityMap[intensity];
        const shakeSequence: Animated.CompositeAnimation[] = [];

        for (let i = 0; i < config.iterations; i++) {
          shakeSequence.push(
            Animated.parallel([
              Animated.timing(shakeX, {
                toValue: (Math.random() - 0.5) * config.offset * 2,
                duration: config.duration,
                useNativeDriver: true,
              }),
              Animated.timing(shakeY, {
                toValue: (Math.random() - 0.5) * config.offset,
                duration: config.duration,
                useNativeDriver: true,
              }),
            ])
          );
        }

        // Return to center
        shakeSequence.push(
          Animated.parallel([
            Animated.timing(shakeX, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(shakeY, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ])
        );

        Animated.sequence(shakeSequence).start();
      },

      triggerCelebration: () => {
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.02,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 100,
            useNativeDriver: true,
          }),
        ]).start();
      },
    }));

    return (
      <Animated.View
        style={[
          styles.container,
          style,
          {
            transform: [
              { translateX: shakeX },
              { translateY: shakeY },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenShake;
