// Confetti celebration effect component
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotation: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
}

interface ConfettiCelebrationProps {
  visible: boolean;
  onComplete?: () => void;
  duration?: number;
  pieceCount?: number;
}

const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#FFD700', '#FF00FF', '#00FF00',
  '#00FFFF', '#FF5F1F', '#BD00FF', '#39FF14', '#FF0099',
];

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  visible,
  onComplete,
  duration = 3000,
  pieceCount = 40,
}) => {
  const confettiPieces = useRef<ConfettiPiece[]>([]);

  useEffect(() => {
    if (visible) {
      // Create confetti pieces
      confettiPieces.current = Array.from({ length: pieceCount }, () => ({
        x: new Animated.Value(Math.random() * SCREEN_WIDTH),
        y: new Animated.Value(-50),
        rotation: new Animated.Value(0),
        scale: new Animated.Value(Math.random() * 0.5 + 0.5),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: Math.random() * 12 + 6,
      }));

      // Animate each piece
      const animations = confettiPieces.current.map((piece, index) => {
        const delay = Math.random() * 500;
        const xTarget = piece.x._value + (Math.random() - 0.5) * 200;
        const rotations = Math.floor(Math.random() * 4) + 2;

        return Animated.parallel([
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(piece.y, {
              toValue: SCREEN_HEIGHT + 50,
              duration: duration + Math.random() * 1000,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(piece.x, {
              toValue: xTarget,
              duration: duration,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.loop(
            Animated.timing(piece.rotation, {
              toValue: rotations,
              duration: duration / rotations,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          ),
        ]);
      });

      Animated.stagger(20, animations).start(() => {
        onComplete?.();
      });
    }
  }, [visible]);

  if (!visible || confettiPieces.current.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.current.map((piece, index) => {
        const rotation = piece.rotation.interpolate({
          inputRange: [0, 1, 2, 3, 4],
          outputRange: ['0deg', '360deg', '720deg', '1080deg', '1440deg'],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.confettiPiece,
              {
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { scale: piece.scale },
                  { rotate: rotation },
                ],
                width: piece.size,
                height: piece.size * (Math.random() > 0.5 ? 1.5 : 1),
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? piece.size / 2 : 2,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
  },
});

export default ConfettiCelebration;
