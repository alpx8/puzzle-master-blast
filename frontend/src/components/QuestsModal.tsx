// Quests Modal - Günlük Görevler ve Ödüller
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuestStore, Quest } from '@/src/store/questStore';
import { useDailyRewardsStore } from '@/src/store/dailyRewardsStore';
import { useGameStore } from '@/src/store/gameStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuestsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({ visible, onClose }) => {
  const { dailyQuests, claimReward, loadQuests } = useQuestStore();
  const { addCoins, totalCoins } = useDailyRewardsStore();
  const { userId } = useGameStore();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && userId) {
      loadQuests(userId);
    }
  }, [visible, userId]);

  const handleClaimReward = async (quest: Quest) => {
    if (!quest.completed || quest.claimed) return;
    
    setClaimingId(quest.id);
    try {
      const reward = await claimReward(quest.id);
      if (reward > 0) {
        addCoins(reward);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const getQuestIcon = (type: Quest['type']) => {
    switch (type) {
      case 'score': return 'star';
      case 'clear_lines': return 'grid';
      case 'combo': return 'flame';
      case 'games_played': return 'game-controller';
      case 'level_up': return 'arrow-up-circle';
      default: return 'checkmark-circle';
    }
  };

  const getQuestColor = (type: Quest['type']) => {
    switch (type) {
      case 'score': return '#FFD700';
      case 'clear_lines': return '#4ECDC4';
      case 'combo': return '#FF6B6B';
      case 'games_played': return '#BD00FF';
      case 'level_up': return '#00E5FF';
      default: return '#888';
    }
  };

  const completedCount = dailyQuests.filter(q => q.completed).length;
  const claimedCount = dailyQuests.filter(q => q.claimed).length;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="flag" size={24} color="#4ECDC4" />
              <Text style={styles.title}>Günlük Görevler</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                {completedCount}/{dailyQuests.length} Görev Tamamlandı
              </Text>
              <View style={styles.coinsDisplay}>
                <Ionicons name="logo-bitcoin" size={16} color="#F7931A" />
                <Text style={styles.coinsText}>{totalCoins}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(completedCount / Math.max(dailyQuests.length, 1)) * 100}%` }
                ]} 
              />
            </View>
          </View>

          {/* Quests List */}
          <ScrollView style={styles.questsList} showsVerticalScrollIndicator={false}>
            {dailyQuests.length > 0 ? (
              dailyQuests.map((quest) => {
                const progress = Math.min(quest.progress / quest.target, 1);
                const icon = getQuestIcon(quest.type);
                const color = getQuestColor(quest.type);
                const isClaiming = claimingId === quest.id;

                return (
                  <View 
                    key={quest.id} 
                    style={[
                      styles.questCard,
                      quest.claimed && styles.questCardClaimed,
                    ]}
                  >
                    {/* Icon */}
                    <View style={[styles.questIcon, { backgroundColor: `${color}20` }]}>
                      <Ionicons name={icon as any} size={24} color={color} />
                    </View>

                    {/* Info */}
                    <View style={styles.questInfo}>
                      <Text style={[styles.questTitle, quest.claimed && styles.questTitleClaimed]}>
                        {quest.title}
                      </Text>
                      <Text style={styles.questDescription}>{quest.description}</Text>
                      
                      {/* Progress */}
                      <View style={styles.questProgressContainer}>
                        <View style={styles.questProgressBar}>
                          <View 
                            style={[
                              styles.questProgressFill, 
                              { width: `${progress * 100}%`, backgroundColor: color }
                            ]} 
                          />
                        </View>
                        <Text style={styles.questProgressText}>
                          {quest.progress}/{quest.target}
                        </Text>
                      </View>
                    </View>

                    {/* Reward */}
                    <View style={styles.questReward}>
                      {quest.claimed ? (
                        <View style={styles.claimedBadge}>
                          <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                        </View>
                      ) : quest.completed ? (
                        <TouchableOpacity
                          style={styles.claimButton}
                          onPress={() => handleClaimReward(quest)}
                          disabled={isClaiming}
                        >
                          {isClaiming ? (
                            <Text style={styles.claimButtonText}>...</Text>
                          ) : (
                            <>
                              <Ionicons name="logo-bitcoin" size={14} color="#fff" />
                              <Text style={styles.claimButtonText}>+{quest.xpReward}</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.rewardPreview}>
                          <Ionicons name="logo-bitcoin" size={16} color="#F7931A" />
                          <Text style={styles.rewardText}>{quest.xpReward}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="hourglass-outline" size={48} color="#444" />
                <Text style={styles.emptyText}>Görevler yükleniyor...</Text>
                <Text style={styles.emptySubtext}>Oyun oynayarak görevleri tamamlayın</Text>
              </View>
            )}

            {/* Bonus Section */}
            {completedCount === dailyQuests.length && dailyQuests.length > 0 && (
              <View style={styles.bonusCard}>
                <View style={styles.bonusIcon}>
                  <Ionicons name="gift" size={32} color="#FFD700" />
                </View>
                <View style={styles.bonusInfo}>
                  <Text style={styles.bonusTitle}>Tüm Görevler Tamamlandı!</Text>
                  <Text style={styles.bonusSubtitle}>Yarın yeni görevler için tekrar gelin</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Tips */}
          <View style={styles.tipsSection}>
            <Ionicons name="bulb" size={16} color="#FFD700" />
            <Text style={styles.tipsText}>Oyun oynayarak görevleri otomatik tamamlayın!</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#11112B',
    borderRadius: 20,
    width: '100%',
    maxWidth: 380,
    maxHeight: SCREEN_HEIGHT * 0.8,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  progressSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
  },
  coinsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coinsText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F7931A',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  questsList: {
    flex: 1,
  },
  questCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  questCardClaimed: {
    opacity: 0.6,
  },
  questIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  questTitleClaimed: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  questDescription: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  questProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  questProgressText: {
    fontSize: 11,
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  questReward: {
    marginLeft: 12,
    alignItems: 'center',
  },
  claimedBadge: {
    padding: 4,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  rewardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F7931A',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#444',
    marginTop: 4,
  },
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  bonusIcon: {
    marginRight: 12,
  },
  bonusInfo: {
    flex: 1,
  },
  bonusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  bonusSubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  tipsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  tipsText: {
    fontSize: 12,
    color: '#888',
  },
});

export default QuestsModal;
