// Tournament Screen - Haftalık turnuvalar
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TournamentPlayer {
  rank: number;
  username: string;
  score: number;
  isYou?: boolean;
}

// Mock tournament data
const MOCK_LEADERBOARD: TournamentPlayer[] = [
  { rank: 1, username: 'PuzzleMaster99', score: 125000 },
  { rank: 2, username: 'BlockKing', score: 118500 },
  { rank: 3, username: 'TurkishGamer', score: 112300 },
  { rank: 4, username: 'StarPlayer', score: 98700 },
  { rank: 5, username: 'GamePro2024', score: 87600 },
  { rank: 6, username: 'Sen', score: 45000, isYou: true },
  { rank: 7, username: 'NewPlayer', score: 32100 },
  { rank: 8, username: 'Beginner', score: 28500 },
];

const PRIZES = [
  { rank: '1.', prize: '10,000', icon: 'trophy', color: '#FFD700' },
  { rank: '2.', prize: '5,000', icon: 'medal', color: '#C0C0C0' },
  { rank: '3.', prize: '2,500', icon: 'medal', color: '#CD7F32' },
  { rank: '4-10', prize: '500', icon: 'star', color: '#4ECDC4' },
];

export default function TournamentScreen() {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState({ days: 3, hours: 14, minutes: 32 });
  
  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes } = prev;
        minutes--;
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          days--;
        }
        if (days < 0) {
          days = 6;
          hours = 23;
          minutes = 59;
        }
        return { days, hours, minutes };
      });
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  const getRankStyle = (rank: number) => {
    if (rank === 1) return { backgroundColor: '#FFD700', color: '#000' };
    if (rank === 2) return { backgroundColor: '#C0C0C0', color: '#000' };
    if (rank === 3) return { backgroundColor: '#CD7F32', color: '#000' };
    return { backgroundColor: '#2A2A4F', color: '#fff' };
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Haftalık Turnuva</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Timer Banner */}
      <View style={styles.timerBanner}>
        <Ionicons name="time-outline" size={24} color="#FF6B6B" />
        <Text style={styles.timerLabel}>Turnuva Bitimine:</Text>
        <View style={styles.timerBoxes}>
          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>{timeLeft.days}</Text>
            <Text style={styles.timerUnit}>gün</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>{timeLeft.hours}</Text>
            <Text style={styles.timerUnit}>saat</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerValue}>{timeLeft.minutes}</Text>
            <Text style={styles.timerUnit}>dk</Text>
          </View>
        </View>
      </View>
      
      {/* Prizes Section */}
      <View style={styles.prizesSection}>
        <Text style={styles.sectionTitle}>Ödüller</Text>
        <View style={styles.prizesRow}>
          {PRIZES.map((prize, index) => (
            <View key={index} style={styles.prizeCard}>
              <Ionicons name={prize.icon as any} size={24} color={prize.color} />
              <Text style={styles.prizeRank}>{prize.rank}</Text>
              <View style={styles.prizeValue}>
                <Ionicons name="logo-bitcoin" size={14} color="#F7931A" />
                <Text style={styles.prizeAmount}>{prize.prize}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
      
      {/* Leaderboard */}
      <View style={styles.leaderboardSection}>
        <Text style={styles.sectionTitle}>Sıralama</Text>
        <ScrollView style={styles.leaderboardScroll} showsVerticalScrollIndicator={false}>
          {MOCK_LEADERBOARD.map((player) => (
            <View 
              key={player.rank} 
              style={[
                styles.playerRow,
                player.isYou && styles.playerRowYou,
              ]}
            >
              <View 
                style={[
                  styles.rankBadge,
                  { backgroundColor: getRankStyle(player.rank).backgroundColor }
                ]}
              >
                <Text 
                  style={[
                    styles.rankText,
                    { color: getRankStyle(player.rank).color }
                  ]}
                >
                  {player.rank}
                </Text>
              </View>
              <Text style={[styles.playerName, player.isYou && styles.playerNameYou]}>
                {player.username}
                {player.isYou && ' (Sen)'}
              </Text>
              <Text style={styles.playerScore}>
                {player.score.toLocaleString()}
              </Text>
            </View>
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>
      
      {/* Play Button */}
      <TouchableOpacity 
        style={styles.playButton}
        onPress={() => router.push('/game?mode=classic')}
      >
        <Ionicons name="game-controller" size={24} color="#fff" />
        <Text style={styles.playButtonText}>Turnuvaya Katıl</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  timerLabel: {
    color: '#FF6B6B',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  timerBoxes: {
    flexDirection: 'row',
  },
  timerBox: {
    alignItems: 'center',
    marginLeft: 8,
  },
  timerValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerUnit: {
    color: '#888',
    fontSize: 10,
  },
  prizesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  prizesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prizeCard: {
    backgroundColor: '#1A1A3F',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    width: (SCREEN_WIDTH - 56) / 4,
  },
  prizeRank: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  prizeValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  prizeAmount: {
    color: '#F7931A',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  leaderboardSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  leaderboardScroll: {
    flex: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A3F',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  playerRowYou: {
    borderWidth: 2,
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  playerName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  playerNameYou: {
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  playerScore: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 20,
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
