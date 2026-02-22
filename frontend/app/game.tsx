import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Modal,
  Animated,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, Block } from '@/src/store/gameStore';
import { useQuestStore } from '@/src/store/questStore';
import { GameBoard } from '@/src/components/GameBoard';
import { BlockPiece } from '@/src/components/BlockPiece';
import { ScoreDisplay } from '@/src/components/ScoreDisplay';
import {
  initSounds,
  playPlaceSound,
  playDropSound,
  playClearSound,
  playComboSound,
  playLevelUpSound,
  triggerComboHaptic,
  unloadSounds,
  toggleSounds,
  getSoundsEnabled,
} from '@/src/utils/sounds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;
const BOARD_SIZE = Math.min(SCREEN_WIDTH - BOARD_PADDING * 2, 360);
const GAME_CELL_SIZE = BOARD_SIZE / 8;

export default function GameScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const {
    startGame,
    board,
    boardSize,
    availableBlocks,
    score,
    highScore,
    combo,
    level,
    isGameOver,
    isPaused,
    gameMode,
    timeRemaining,
    pauseGame,
    resumeGame,
    placeBlock,
    canPlaceBlock,
    updateTimer,
    saveUserData,
    userId,
  } = useGameStore();

  const { loadQuests, updateQuestProgress, dailyQuests, claimReward } = useQuestStore();

  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [highlightCells, setHighlightCells] = useState<{ row: number; col: number }[]>([]);
  const [isValidPlacement, setIsValidPlacement] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [isMuted, setIsMuted] = useState(!getSoundsEnabled());

  const boardRef = useRef<View>(null);
  const boardPositionRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevScore = useRef(0);
  const prevCombo = useRef(0);
  const prevLevel = useRef(1);

  // Initialize sounds
  useEffect(() => {
    initSounds();
    if (userId) {
      loadQuests(userId);
    }
    
    return () => {
      unloadSounds();
    };
  }, [userId]);

  useEffect(() => {
    const gameMode = (mode as 'classic' | 'timed' | 'multiplayer') || 'classic';
    startGame(gameMode);
    setGamesPlayed(prev => prev + 1);
    updateQuestProgress('games_played', 1);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [mode]);

  useEffect(() => {
    if (gameMode === 'timed' && !isPaused && !isGameOver) {
      timerRef.current = setInterval(() => {
        updateTimer();
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameMode, isPaused, isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      setShowGameOverModal(true);
      saveUserData();
      // Update quest for total score
      updateQuestProgress('score', score);
    }
  }, [isGameOver]);

  // Sound effects based on game state changes
  useEffect(() => {
    if (score > prevScore.current && prevScore.current > 0) {
      playDropSound();
    }
    prevScore.current = score;
  }, [score]);

  // Combo sound and haptic
  useEffect(() => {
    if (combo > prevCombo.current && combo >= 2) {
      playComboSound();
      triggerComboHaptic();
      updateQuestProgress('combo', 1);
    }
    prevCombo.current = combo;
  }, [combo]);

  // Level up sound
  useEffect(() => {
    if (level > prevLevel.current) {
      playLevelUpSound();
      updateQuestProgress('level_up', 1);
    }
    prevLevel.current = level;
  }, [level]);

  const measureBoard = useCallback(() => {
    if (boardRef.current) {
      boardRef.current.measure((x, y, width, height, pageX, pageY) => {
        boardPositionRef.current = { x: pageX, y: pageY, width, height };
      });
    }
  }, []);

  useEffect(() => {
    setTimeout(measureBoard, 100);
  }, [measureBoard]);

  const calculateBoardPosition = (touchX: number, touchY: number, block: Block) => {
    const boardPos = boardPositionRef.current;
    const relativeX = touchX - boardPos.x;
    const relativeY = touchY - boardPos.y - (block.shape.length * GAME_CELL_SIZE / 2);

    const col = Math.floor(relativeX / GAME_CELL_SIZE);
    const row = Math.floor(relativeY / GAME_CELL_SIZE);

    return { row, col };
  };

  const getHighlightCells = (block: Block, startRow: number, startCol: number) => {
    const cells: { row: number; col: number }[] = [];
    for (let r = 0; r < block.shape.length; r++) {
      for (let c = 0; c < block.shape[r].length; c++) {
        if (block.shape[r][c] === 1) {
          cells.push({ row: startRow + r, col: startCol + c });
        }
      }
    }
    return cells;
  };

  const handleDragStart = (block: Block, touchX: number, touchY: number) => {
    setDraggingBlock(block);
    setDragPosition({ x: touchX, y: touchY });
    measureBoard();
  };

  const handleDragMove = (touchX: number, touchY: number) => {
    if (!draggingBlock) return;

    setDragPosition({ x: touchX, y: touchY });

    const { row, col } = calculateBoardPosition(touchX, touchY, draggingBlock);
    const cells = getHighlightCells(draggingBlock, row, col);
    const valid = canPlaceBlock(draggingBlock, row, col);

    setHighlightCells(cells);
    setIsValidPlacement(valid);
  };

  const handleDragEnd = (touchX: number, touchY: number) => {
    if (!draggingBlock) return;

    const { row, col } = calculateBoardPosition(touchX, touchY, draggingBlock);

    if (canPlaceBlock(draggingBlock, row, col)) {
      // Play place sound
      playPlaceSound();
      
      const result = placeBlock(draggingBlock, row, col);
      
      // Check if lines were cleared
      if (result) {
        // Count cleared lines (this is approximate, actual count is in store)
        setTimeout(() => {
          playClearSound();
          updateQuestProgress('clear_lines', 1);
        }, 200);
      }
    }

    setDraggingBlock(null);
    setHighlightCells([]);
    setIsValidPlacement(false);
  };

  const createBlockPanResponder = (block: Block) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleDragStart(block, evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderMove: (evt) => {
        handleDragMove(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderRelease: (evt) => {
        handleDragEnd(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
      },
      onPanResponderTerminate: () => {
        setDraggingBlock(null);
        setHighlightCells([]);
      },
    });
  };

  const handlePause = () => {
    pauseGame();
    setShowPauseModal(true);
  };

  const handleResume = () => {
    setShowPauseModal(false);
    resumeGame();
  };

  const handleRestart = () => {
    setShowPauseModal(false);
    setShowGameOverModal(false);
    startGame(gameMode);
    updateQuestProgress('games_played', 1);
  };

  const handleQuit = () => {
    setShowPauseModal(false);
    setShowGameOverModal(false);
    router.back();
  };

  const handleClaimQuest = async (questId: string) => {
    const xp = await claimReward(questId);
    if (xp > 0) {
      // Add XP to user - this would trigger level up sound if applicable
      useGameStore.getState().addXP(xp);
    }
  };

  const handleToggleMute = () => {
    const newState = toggleSounds();
    setIsMuted(!newState);
  };

  const getModeTitle = () => {
    switch (gameMode) {
      case 'classic':
        return 'Klasik Mod';
      case 'timed':
        return 'Zamanlı Mod';
      case 'multiplayer':
        return 'Çok Oyunculu';
      default:
        return 'Block Blast';
    }
  };

  const completedQuests = dailyQuests.filter(q => q.completed && !q.claimed).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePause} style={styles.headerButton}>
          <Ionicons name="pause" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getModeTitle()}</Text>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity 
            onPress={handleToggleMute} 
            style={[styles.headerButton, styles.muteButton]}
          >
            <Ionicons 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={22} 
              color={isMuted ? "#FF6B6B" : "#4ECDC4"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowQuestsModal(true)} 
            style={styles.headerButton}
          >
            <Ionicons name="trophy" size={24} color="#FFD700" />
            {completedQuests > 0 && (
              <View style={styles.questBadge}>
                <Text style={styles.questBadgeText}>{completedQuests}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Score Display */}
      <View style={styles.scoreContainer}>
        <ScoreDisplay />
      </View>

      {/* Game Board */}
      <View style={styles.boardWrapper}>
        <View
          ref={boardRef}
          style={styles.boardContainer}
          onLayout={measureBoard}
        >
          <GameBoard
            highlightCells={highlightCells}
            isValidPlacement={isValidPlacement}
          />
        </View>
      </View>

      {/* Block Selector */}
      <View style={styles.blocksContainer}>
        <View style={styles.blocksRow}>
          {availableBlocks.map((block) => {
            const panResponder = createBlockPanResponder(block);
            const isDragging = draggingBlock?.id === block.id;

            return (
              <View
                key={block.id}
                style={[
                  styles.blockWrapper,
                  isDragging && styles.draggingBlock,
                ]}
                {...panResponder.panHandlers}
              >
                <View style={styles.blockInner}>
                  <BlockPiece block={block} cellSize={22} opacity={isDragging ? 0.3 : 1} />
                </View>
                <Text style={styles.blockPoints}>+{block.points}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Dragging Block Overlay */}
      {draggingBlock && (
        <View
          style={[
            styles.dragOverlay,
            {
              left: dragPosition.x - (draggingBlock.shape[0].length * GAME_CELL_SIZE) / 2,
              top: dragPosition.y - (draggingBlock.shape.length * GAME_CELL_SIZE),
            },
          ]}
          pointerEvents="none"
        >
          <BlockPiece block={draggingBlock} cellSize={GAME_CELL_SIZE} opacity={0.9} />
        </View>
      )}

      {/* Pause Modal */}
      <Modal visible={showPauseModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Oyun Duraklatıldı</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleResume}>
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Devam Et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleRestart}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Yeniden Başla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.quitButton]} onPress={handleQuit}>
              <Ionicons name="exit" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Çıkış</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Game Over Modal */}
      <Modal visible={showGameOverModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trophy" size={60} color="#FFD700" />
            <Text style={styles.gameOverTitle}>Oyun Bitti!</Text>
            <View style={styles.finalScoreContainer}>
              <Text style={styles.finalScoreLabel}>Skorun</Text>
              <Text style={styles.finalScore}>{score.toLocaleString()}</Text>
              {score >= highScore && score > 0 && (
                <View style={styles.newRecordBadge}>
                  <Text style={styles.newRecordText}>YENİ REKOR!</Text>
                </View>
              )}
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Seviye</Text>
                <Text style={styles.statValue}>{level}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>En Yüksek</Text>
                <Text style={styles.statValue}>{highScore.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={handleRestart}>
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Tekrar Oyna</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.quitButton]} onPress={handleQuit}>
              <Ionicons name="home" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Ana Menü</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Daily Quests Modal */}
      <Modal visible={showQuestsModal} transparent animationType="slide">
        <View style={styles.questModalOverlay}>
          <View style={styles.questModalContent}>
            <View style={styles.questModalHeader}>
              <Text style={styles.questModalTitle}>Günlük Görevler</Text>
              <TouchableOpacity onPress={() => setShowQuestsModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.questList}>
              {dailyQuests.map((quest) => (
                <View key={quest.id} style={styles.questItem}>
                  <View style={styles.questInfo}>
                    <Text style={styles.questTitle}>{quest.title}</Text>
                    <Text style={styles.questDescription}>{quest.description}</Text>
                    <View style={styles.questProgressBar}>
                      <View 
                        style={[
                          styles.questProgressFill, 
                          { width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }
                        ]} 
                      />
                    </View>
                    <Text style={styles.questProgressText}>
                      {quest.progress} / {quest.target}
                    </Text>
                  </View>
                  
                  <View style={styles.questReward}>
                    <Text style={styles.questXP}>+{quest.xpReward} XP</Text>
                    {quest.completed && !quest.claimed ? (
                      <TouchableOpacity 
                        style={styles.claimButton}
                        onPress={() => handleClaimQuest(quest.id)}
                      >
                        <Text style={styles.claimButtonText}>Al</Text>
                      </TouchableOpacity>
                    ) : quest.claimed ? (
                      <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                    ) : null}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  muteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  questBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B6B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scoreContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxHeight: '55%',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blocksContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    backgroundColor: 'rgba(30, 30, 50, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  blocksRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 100,
  },
  blockWrapper: {
    alignItems: 'center',
    padding: 6,
  },
  blockInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 12,
    minWidth: 70,
    minHeight: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockPoints: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  draggingBlock: {
    opacity: 0.3,
  },
  dragOverlay: {
    position: 'absolute',
    zIndex: 1000,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d2d44',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 12,
    width: '100%',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  quitButton: {
    backgroundColor: '#FF6B6B',
  },
  gameOverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  finalScoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  finalScoreLabel: {
    fontSize: 14,
    color: '#888',
  },
  finalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  newRecordBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  newRecordText: {
    color: '#1a1a2e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Quest Modal Styles
  questModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  questModalContent: {
    backgroundColor: '#2d2d44',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  questModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  questModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  questList: {
    flex: 1,
  },
  questItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  questInfo: {
    flex: 1,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  questDescription: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  questProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  questProgressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
  },
  questProgressText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  questReward: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  questXP: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  claimButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
