import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';

export const ScoreDisplay: React.FC = () => {
  const { score, highScore, combo, level, xp, xpToNextLevel, gameMode, timeRemaining } = useGameStore();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const xpProgress = (xp / xpToNextLevel) * 100;

  return (
    <View style={styles.container}>
      {/* Score Section */}
      <View style={styles.scoreSection}>
        <View style={styles.scoreItem}>
          <Ionicons name="star" size={20} color="#FFD700" />
          <Text style={styles.scoreLabel}>Skor</Text>
          <Text style={styles.scoreValue}>{score.toLocaleString()}</Text>
        </View>
        
        <View style={styles.scoreItem}>
          <Ionicons name="trophy" size={20} color="#FF6B6B" />
          <Text style={styles.scoreLabel}>En Yüksek</Text>
          <Text style={styles.scoreValue}>{highScore.toLocaleString()}</Text>
        </View>

        {gameMode === 'timed' && (
          <View style={styles.scoreItem}>
            <Ionicons name="time" size={20} color="#4ECDC4" />
            <Text style={styles.scoreLabel}>Süre</Text>
            <Text style={[styles.scoreValue, timeRemaining <= 30 && styles.urgentTime]}>
              {formatTime(timeRemaining)}
            </Text>
          </View>
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
    padding: 12,
    backgroundColor: 'rgba(30, 30, 50, 0.9)',
    borderRadius: 16,
    marginBottom: 12,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  scoreItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  scoreLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  scoreValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  urgentTime: {
    color: '#FF6B6B',
  },
  comboContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 8,
  },
  comboText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  levelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  levelInfo: {
    alignItems: 'center',
    marginRight: 12,
  },
  levelBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelLabel: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  xpBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  xpBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#4ECDC4',
    borderRadius: 10,
  },
  xpText: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});
