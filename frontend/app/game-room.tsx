import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useGameStore, Block } from '@/src/store/gameStore';
import { GameBoard } from '@/src/components/GameBoard';
import { BlockPiece } from '@/src/components/BlockPiece';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 320);
const GAME_CELL_SIZE = BOARD_SIZE / 8;

interface Player {
  id: string;
  name: string;
  score: number;
  can_move: boolean;
  ready: boolean;
  is_host: boolean;
}

export default function GameRoomScreen() {
  const router = useRouter();
  const { roomId, isHost } = useLocalSearchParams<{ roomId: string; isHost: string }>();
  const {
    username,
    userId,
    board,
    availableBlocks,
    score,
    combo,
    level,
    isGameOver,
    placeBlock,
    canPlaceBlock,
    initBoard,
    generateNewBlocks,
  } = useGameStore();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [isReady, setIsReady] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [opponentScore, setOpponentScore] = useState(0);

  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [highlightCells, setHighlightCells] = useState<{ row: number; col: number }[]>([]);
  const [isValidPlacement, setIsValidPlacement] = useState(false);

  const boardRef = useRef<View>(null);
  const boardPositionRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Socket.IO connection
  useEffect(() => {
    const newSocket = io(`${API_URL}`, {
      transports: ['polling', 'websocket'],
      path: '/socket.io/',
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);

      // Join the room
      newSocket.emit('join_room', {
        room_id: roomId,
        player_id: userId,
        player_name: username || 'İsimsiz',
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('room_update', (data) => {
      console.log('Room update:', data);
      setPlayers(data.players || []);
      setGameStatus(data.status);
    });

    newSocket.on('player_ready', (data) => {
      console.log('Player ready:', data);
      setPlayers(data.players || []);
    });

    newSocket.on('game_started', (data) => {
      console.log('Game started:', data);
      setGameStatus('playing');
      setPlayers(data.players || []);
      initBoard();
    });

    newSocket.on('score_updated', (data) => {
      console.log('Score updated:', data);
      if (data.player_id !== userId) {
        setOpponentScore(data.score);
      }
    });

    newSocket.on('player_stuck', (data) => {
      console.log('Player stuck:', data);
      setPlayers(prev => prev.map(p => 
        p.id === data.player_id ? { ...p, can_move: false } : p
      ));
    });

    newSocket.on('game_over', (data) => {
      console.log('Game over:', data);
      setGameStatus('finished');
      setWinner(data.winner);
    });

    newSocket.on('player_left', (data) => {
      console.log('Player left:', data);
      setPlayers(prev => prev.filter(p => p.id !== data.player_id));
    });

    newSocket.on('room_closed', () => {
      console.log('Room closed');
      router.back();
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, userId, username]);

  // Send score updates
  useEffect(() => {
    if (socket && gameStatus === 'playing') {
      socket.emit('score_update', {
        room_id: roomId,
        player_id: userId,
        score: score,
      });
    }
  }, [score, socket, gameStatus, roomId, userId]);

  // Check if player can't move
  useEffect(() => {
    if (gameStatus === 'playing' && isGameOver && socket) {
      socket.emit('cannot_move', {
        room_id: roomId,
        player_id: userId,
      });
    }
  }, [isGameOver, gameStatus, socket, roomId, userId]);

  const handleReady = () => {
    if (socket) {
      setIsReady(true);
      socket.emit('player_ready', {
        room_id: roomId,
        player_id: userId,
      });
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave_room', {
        room_id: roomId,
        player_id: userId,
      });
    }
    router.back();
  };

  // Board measurement
  const measureBoard = useCallback(() => {
    if (boardRef.current) {
      boardRef.current.measure((x, y, width, height, pageX, pageY) => {
        boardPositionRef.current = { x: pageX, y: pageY, width, height };
      });
    }
  }, []);

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

  const currentPlayer = players.find(p => p.id === userId);
  const opponent = players.find(p => p.id !== userId);
  const allReady = players.length >= 2 && players.every(p => p.ready);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLeaveRoom} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Çok Oyunculu</Text>
        <View style={[styles.connectionIndicator, { backgroundColor: connected ? '#4ECDC4' : '#FF6B6B' }]} />
      </View>

      {/* Waiting Room */}
      {gameStatus === 'waiting' && (
        <View style={styles.waitingRoom}>
          <Text style={styles.waitingTitle}>Oyun Odası</Text>
          <Text style={styles.waitingSubtitle}>Oyuncular hazır olduğunda oyun başlayacak</Text>

          <View style={styles.playersList}>
            {players.map((player, index) => (
              <View key={player.id} style={styles.playerCard}>
                <View style={[styles.playerAvatar, { backgroundColor: index === 0 ? '#4ECDC4' : '#FF6B6B' }]}>
                  <Text style={styles.playerAvatarText}>{player.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>{player.name}</Text>
                  <Text style={styles.playerStatus}>
                    {player.is_host ? 'Kurucu' : 'Oyuncu'}
                  </Text>
                </View>
                {player.ready ? (
                  <View style={styles.readyBadge}>
                    <Text style={styles.readyText}>HAZIR</Text>
                  </View>
                ) : (
                  <View style={styles.waitingBadge}>
                    <Text style={styles.waitingBadgeText}>Bekliyor</Text>
                  </View>
                )}
              </View>
            ))}

            {players.length < 2 && (
              <View style={[styles.playerCard, styles.emptySlot]}>
                <ActivityIndicator size="small" color="#888" />
                <Text style={styles.emptySlotText}>Oyuncu bekleniyor...</Text>
              </View>
            )}
          </View>

          {!isReady && players.length >= 2 && (
            <TouchableOpacity style={styles.readyButton} onPress={handleReady}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.readyButtonText}>Hazırım!</Text>
            </TouchableOpacity>
          )}

          {isReady && !allReady && (
            <View style={styles.waitingForOther}>
              <ActivityIndicator size="small" color="#4ECDC4" />
              <Text style={styles.waitingForOtherText}>Diğer oyuncu bekleniyor...</Text>
            </View>
          )}
        </View>
      )}

      {/* Game Playing */}
      {gameStatus === 'playing' && (
        <View style={styles.gameContainer}>
          {/* Score Comparison */}
          <View style={styles.scoreComparison}>
            <View style={styles.playerScoreBox}>
              <Text style={styles.playerScoreName}>{username || 'Sen'}</Text>
              <Text style={styles.playerScoreValue}>{score}</Text>
            </View>
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            <View style={styles.playerScoreBox}>
              <Text style={styles.playerScoreName}>{opponent?.name || 'Rakip'}</Text>
              <Text style={[styles.playerScoreValue, { color: '#FF6B6B' }]}>{opponentScore}</Text>
            </View>
          </View>

          {/* Combo Display */}
          {combo > 0 && (
            <View style={styles.comboDisplay}>
              <Ionicons name="flame" size={20} color="#FF6B6B" />
              <Text style={styles.comboText}>KOMBO x{combo}</Text>
            </View>
          )}

          {/* Game Board */}
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

          {/* Block Selector */}
          <View style={styles.blocksContainer}>
            <View style={styles.blocksRow}>
              {availableBlocks.map((block) => {
                const panResponder = createBlockPanResponder(block);
                const isDragging = draggingBlock?.id === block.id;

                return (
                  <View
                    key={block.id}
                    style={[styles.blockWrapper, isDragging && styles.draggingBlock]}
                    {...panResponder.panHandlers}
                  >
                    <View style={styles.blockInner}>
                      <BlockPiece block={block} cellSize={18} opacity={isDragging ? 0.3 : 1} />
                    </View>
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
        </View>
      )}

      {/* Game Over Modal */}
      <Modal visible={gameStatus === 'finished'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {winner?.id === userId ? (
              <>
                <Ionicons name="trophy" size={80} color="#FFD700" />
                <Text style={styles.winnerTitle}>Kazandın!</Text>
              </>
            ) : (
              <>
                <Ionicons name="sad" size={80} color="#888" />
                <Text style={styles.loserTitle}>Kaybettin</Text>
              </>
            )}

            <View style={styles.finalScores}>
              <View style={styles.finalScoreItem}>
                <Text style={styles.finalScoreLabel}>Senin Skorun</Text>
                <Text style={styles.finalScoreValue}>{score}</Text>
              </View>
              <View style={styles.finalScoreItem}>
                <Text style={styles.finalScoreLabel}>Rakip Skoru</Text>
                <Text style={styles.finalScoreValue}>{opponentScore}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.exitButton} onPress={handleLeaveRoom}>
              <Text style={styles.exitButtonText}>Lobiye Dön</Text>
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
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  waitingRoom: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  waitingTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  waitingSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  playersList: {
    width: '100%',
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 16,
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  playerStatus: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  readyBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  waitingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  waitingBadgeText: {
    fontSize: 14,
    color: '#888',
  },
  emptySlot: {
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent',
    gap: 12,
  },
  emptySlotText: {
    fontSize: 14,
    color: '#666',
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    marginTop: 32,
    gap: 8,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  waitingForOther: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  waitingForOtherText: {
    fontSize: 16,
    color: '#888',
  },
  gameContainer: {
    flex: 1,
    padding: 16,
  },
  scoreComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  playerScoreBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
  },
  playerScoreName: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  playerScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  comboDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 12,
    gap: 8,
  },
  comboText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  blocksContainer: {
    backgroundColor: 'rgba(30, 30, 50, 0.9)',
    borderRadius: 16,
    padding: 12,
  },
  blocksRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 80,
  },
  blockWrapper: {
    padding: 8,
  },
  blockInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 10,
    minWidth: 60,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
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
  winnerTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 16,
  },
  loserTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#888',
    marginTop: 16,
  },
  finalScores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 24,
  },
  finalScoreItem: {
    alignItems: 'center',
  },
  finalScoreLabel: {
    fontSize: 14,
    color: '#888',
  },
  finalScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  exitButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  exitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
