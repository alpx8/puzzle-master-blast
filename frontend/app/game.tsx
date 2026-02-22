import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, Block } from '@/src/store/gameStore';
import { GameBoard } from '@/src/components/GameBoard';
import { BlockPiece } from '@/src/components/BlockPiece';
import { ScoreDisplay } from '@/src/components/ScoreDisplay';

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
  } = useGameStore();

  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [highlightCells, setHighlightCells] = useState<{ row: number; col: number }[]>([]);
  const [isValidPlacement, setIsValidPlacement] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const boardRef = useRef<View>(null);
  const boardPositionRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const gameMode = (mode as 'classic' | 'timed' | 'multiplayer') || 'classic';
    startGame(gameMode);

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
    }
  }, [isGameOver]);

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
      placeBlock(draggingBlock, row, col);
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
  };

  const handleQuit = () => {
    setShowPauseModal(false);
    setShowGameOverModal(false);
    router.back();
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePause} style={styles.headerButton}>
          <Ionicons name="pause" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getModeTitle()}</Text>
        <View style={styles.headerButton} />
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
          <BlockPiece block={draggingBlock} cellSize={GAME_CELL_SIZE} opacity={0.8} />
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
    paddingVertical: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreContainer: {
    paddingHorizontal: 16,
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  blocksContainer: {
    padding: 16,
    backgroundColor: 'rgba(30, 30, 50, 0.9)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  blocksRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 110,
  },
  blockWrapper: {
    alignItems: 'center',
    padding: 8,
  },
  blockInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 12,
    minWidth: 75,
    minHeight: 75,
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
});
