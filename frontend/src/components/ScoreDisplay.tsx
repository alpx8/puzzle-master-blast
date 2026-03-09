import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '@/src/store/gameStore';

export const ScoreDisplay: React.FC = () => {
  const { score, highScore, combo, level, xp, xpToNextLevel, gameMode, timeRemaining } = useGameStore();
  const timerPulse = useRef(new Animated.Value(1)).current;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (gameMode === 'timed' && timeRemaining <= 10 && timeRemaining > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, {
            toValue: 1.15,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulse, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      timerPulse.setValue(1);
    }
  }, [timeRemaining, gameMode]);

  const xpProgress = (xp / xpToNextLevel) * 100;
  const isUrgent = timeRemaining <= 10;
  const isCritical = timeRemaining <= 5;

  return (
    <View style={styles.container}>
      {/* Compact Score Row */}
      <View style={styles.scoreRow}>
        {/* Score */}
        <View style={styles.scoreBox}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>
        
        {/* Level Badge */}
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LV.{level}</Text>
        </View>
        
        {/* High Score */}
        <View style={styles.scoreBox}>
          <Ionicons name="trophy" size={16} color="#FF6B6B" />
          <Text style={styles.scoreValue}>{highScore.toLocaleString()}</Text>
        </View>

        {/* Timer for Timed Mode */}
        {gameMode === 'timed' && (
          <Animated.View style={[
            styles.timerBox,
            isUrgent && styles.timerUrgent,
            { transform: [{ scale: timerPulse }] }
          ]}>
            <Ionicons 
              name="time" 
              size={16} 
              color={isCritical ? '#FF3366' : isUrgent ? '#FF6B6B' : '#4ECDC4'} 
            />
            <Text style={[
              styles.timerValue, 
              isUrgent && styles.urgentTime,
              isCritical && styles.criticalTime
            ]}>
              {formatTime(timeRemaining)}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Mini XP Bar */}
      <View style={styles.xpBarContainer}>
        <View style={[styles.xpBar, { width: `${xpProgress}%` }]} />
        <Text style={styles.xpText}>{xp}/{xpToNextLevel}</Text>
      </View>

      {/* Combo Display */}
      {combo > 0 && (
        <View style={styles.comboContainer}>
          <Ionicons name="flame" size={18} color="#FF6B6B" />
          <Text style={styles.comboText}>x{combo}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(30, 30, 50, 0.95)',
    borderRadius: 12,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 4,
  },
  timerUrgent: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.5)',
  },
  timerValue: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: 'bold',
  },
  urgentTime: {
    color: '#FF6B6B',
  },
  criticalTime: {
    color: '#FF3366',
  },
  xpBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    marginTop: 6,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  xpBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#4ECDC4',
    borderRadius: 6,
  },
  xpText: {
    color: '#fff',
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '600',
  },
  comboContainer: {
    position: 'absolute',
    right: -5,
    top: -5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 2,
  },
  comboText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
