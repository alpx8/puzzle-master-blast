// AnimatedBlock - Block with smooth placement animation
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Block } from '@/src/store/gameStore';
import { useSkinsStore } from '@/src/store/skinsStore';

interface AnimatedBlockProps {
  block: Block;
  cellSize?: number;
  opacity?: number;
  isDragging?: boolean;
  dragPosition?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  onPlacementComplete?: () => void;
}

export const AnimatedBlock: React.FC<AnimatedBlockProps> = ({
  block,
  cellSize = 30,
  opacity = 1,
  isDragging = false,
  dragPosition,
  targetPosition,
  onPlacementComplete,
}) => {
  const { shape, color } = block;
  const { skins, activeSkin } = useSkinsStore();
  const currentSkin = skins.find(s => s.id === activeSkin);
  const hasGlow = currentSkin?.glow || false;

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(isDragging ? 1.1 : 1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isDragging) {
      // Dragging animation - subtle scale up and rotation wobble
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 2,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: -2,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();

      // Glow effect while dragging
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      // Reset when not dragging
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isDragging]);

  // Slide-in animation when block is placed
  const playPlacementAnimation = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 80,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(bounceAnim, {
            toValue: 1,
            friction: 3,
            tension: 150,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      onPlacementComplete?.();
    });
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [-5, 5],
    outputRange: ['-5deg', '5deg'],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity,
          transform: [
            { scale: Animated.multiply(scaleAnim, bounceAnim) },
            { rotate: rotation },
          ],
        }
      ]}
    >
      {/* Glow effect background */}
      {isDragging && (
        <Animated.View
          style={[
            styles.glowEffect,
            {
              backgroundColor: color,
              opacity: glowOpacity,
              width: cellSize * shape[0].length + 20,
              height: cellSize * shape.length + 20,
              borderRadius: cellSize * 0.3,
            },
          ]}
        />
      )}
      
      {shape.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => (
            <View
              key={colIndex}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                },
              ]}
            >
              {cell === 1 && (
                <View 
                  style={[
                    styles.block,
                    { 
                      backgroundColor: color,
                      width: cellSize - 1,
                      height: cellSize - 1,
                      borderRadius: cellSize * 0.18,
                    },
                    hasGlow && {
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 6,
                      elevation: 8,
                    }
                  ]}
                >
                  {/* 3D Effect layers */}
                  <View 
                    style={[
                      styles.glossTop, 
                      { 
                        backgroundColor: lightenColor(color, 50),
                        borderRadius: cellSize * 0.12,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.innerShine, 
                      { 
                        backgroundColor: lightenColor(color, 25),
                        borderRadius: cellSize * 0.1,
                      }
                    ]} 
                  />
                  <View 
                    style={[
                      styles.bottomShadow, 
                      { 
                        backgroundColor: darkenColor(color, 40),
                        borderRadius: cellSize * 0.1,
                      }
                    ]} 
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </Animated.View>
  );
};

// Color helper functions
const lightenColor = (color: string, percent: number): string => {
  try {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  } catch {
    return color;
  }
};

const darkenColor = (color: string, percent: number): string => {
  try {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  } catch {
    return color;
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  block: {
    overflow: 'hidden',
    position: 'relative',
  },
  glossTop: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '40%',
    height: '30%',
    opacity: 0.6,
  },
  innerShine: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '70%',
    height: '70%',
    opacity: 0.2,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: '50%',
    height: '35%',
    opacity: 0.5,
  },
  glowEffect: {
    position: 'absolute',
    top: -10,
    left: -10,
  },
});

export default AnimatedBlock;
