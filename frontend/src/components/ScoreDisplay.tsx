import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '@/src/store/gameStore';

export const ScoreDisplay: React.FC = () => {
  const { score, highScore, combo, level, xp, xpToNextLevel, gameMode, timeRemaining } = useGameStore();
  const timerPulse = useRef(new Animated.Value(1)).current;
  const timerColor = useRef(new Animated.Value(0)).current;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer warning animation
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
      {/* Score Section */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreItem}>
          <View style={styles.iconContainer}>
            <Ionicons name="star" size={22} color="#FFD700" />
          </View>
          <Text style={styles.scoreLabel}>Skor</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>
        
        <View style={styles.scoreItem}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
            <Ionicons name="trophy" size={22} color="#FF6B6B" />
          </View>
          <Text style={styles.scoreLabel}>En Yüksek</Text>
          <Text style={styles.scoreValue}>{highScore.toLocaleString()}</Text>
        </View>

        {gameMode === 'timed' && (
          <Animated.View style={[
            styles.scoreItem, 
            styles.timerItem,
            isUrgent && styles.timerUrgent,
            { transform: [{ scale: timerPulse }] }
          ]}>
            <View style={[styles.iconContainer, { backgroundColor: isUrgent ? 'rgba(255, 51, 102, 0.2)' : 'rgba(78, 205, 196, 0.2)' }]}>
              <Ionicons 
                name="time" 
                size={22} 
                color={isCritical ? '#FF3366' : isUrgent ? '#FF6B6B' : '#4ECDC4'} 
              />
            </View>
            <Text style={styles.scoreLabel}>Süre</Text>
            <Text style={[
              styles.scoreValue, 
              isUrgent && styles.urgentTime,
              isCritical && styles.criticalTime
            ]}>
              {formatTime(timeRemaining)}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Combo Display */}
      {combo > 0 && (
        <View style={styles.comboContainer}>
          <Ionicons name="flame" size={24} color="#FF6B6B" />
          <Text style={styles.comboText}>KOMBO x{combo}</Text>
          <Ionicons name="flame" size={24} color="#FF6B6B" />
        </View>
      )}

      {/* Level Progress */}
      <View style={styles.levelSection}>
        <View style={styles.levelInfo}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelNumber}>{level}</Text>
          </View>
          <Text style={styles.levelLabel}>Seviye</Text>
        </View>
        
        <View style={styles.xpBarContainer}>
          <View style={[styles.xpBar, { width: `${xpProgress}%` }]} />
          <Text style={styles.xpText}>{xp} / {xpToNextLevel} XP</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: 'rgba(30, 30, 50, 0.9)',
    borderRadius: 14,
    marginBottom: 8,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  scoreItem: {
    alignItems: 'center',
    minWidth: 70,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  scoreLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 1,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  urgentTime: {
    color: '#FF6B6B',
  },
  criticalTime: {
    color: '#FF3366',
    fontWeight: '900',
  },
  timerItem: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerUrgent: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.4)',
  },
  comboContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginVertical: 6,
  },
  comboText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 6,
  },
  levelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  levelInfo: {
    alignItems: 'center',
    marginRight: 10,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelLabel: {
    color: '#888',
    fontSize: 9,
    marginTop: 1,
  },
  xpBarContainer: {
    flex: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 9,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  xpBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#4ECDC4',
    borderRadius: 9,
  },
  xpText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
});
