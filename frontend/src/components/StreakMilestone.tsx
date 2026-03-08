// StreakMilestone - Achievement popup for score milestones
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StreakMilestoneProps {
  score: number;
  visible: boolean;
  onHide: () => void;
}

const MILESTONES = [
  { score: 100, title: 'İLK ADIM!', icon: 'footsteps', color: '#4ECDC4' },
  { score: 500, title: 'ISINIYORUZ!', icon: 'flame', color: '#FF6B6B' },
  { score: 1000, title: 'BİN PUAN!', icon: 'star', color: '#FFD700' },
  { score: 2500, title: 'HARIKA!', icon: 'rocket', color: '#BD00FF' },
  { score: 5000, title: 'EFSANE!', icon: 'trophy', color: '#FF5F1F' },
  { score: 10000, title: 'USTA!', icon: 'medal', color: '#00F5A0' },
  { score: 25000, title: 'ŞAMP!', icon: 'ribbon', color: '#FF0099' },
  { score: 50000, title: 'KRALLIK!', icon: 'crown', color: '#FFD700' },
];

export const StreakMilestone: React.FC<StreakMilestoneProps> = ({ 
  score, 
  visible, 
  onHide 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  const milestone = MILESTONES.find(m => m.score === score);

  useEffect(() => {
    if (visible && milestone) {
      // Epic entrance animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(glowAnim, {
              toValue: 0.5,
              duration: 400,
              useNativeDriver: true,
            }),
          ]),
          { iterations: 3 }
        ),
      ]).start();

      // Auto hide after 2.5s
      const timer = setTimeout(() => {
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(onHide);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, milestone]);

  if (!visible || !milestone) return null;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '10deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { scale: scaleAnim },
            { rotate: rotation },
          ],
        },
      ]}
    >
      <Animated.View 
        style={[
          styles.glowBackground, 
          { 
            backgroundColor: milestone.color,
            opacity: glowAnim,
          }
        ]} 
      />
      
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: milestone.color }]}>
          <Ionicons name={milestone.icon as any} size={40} color="#fff" />
        </View>
        
        <Text style={[styles.title, { color: milestone.color }]}>
          {milestone.title}
        </Text>
        
        <Text style={styles.score}>
          {score.toLocaleString()} PUAN!
        </Text>
        
        <View style={styles.starsRow}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Ionicons name="star" size={24} color="#FFD700" />
          <Ionicons name="star" size={16} color="#FFD700" />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  glowBackground: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  content: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    minWidth: SCREEN_WIDTH * 0.6,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default StreakMilestone;
