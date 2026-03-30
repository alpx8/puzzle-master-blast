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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useGameStore, Block, BLOCK_SHAPES } from '@/src/store/gameStore';
import { GameBoard } from '@/src/components/GameBoard';
import { BlockPiece } from '@/src/components/BlockPiece';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || 
                process.env.EXPO_PUBLIC_BACKEND_URL || 
                'https://puzzle-game-56.preview.emergentagent.com';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 32, 300);
const GAME_CELL_SIZE = BOARD_SIZE / 8;

interface Player {
  id: string;
  name: string;
  score: number;
  can_move: boolean;
  ready: boolean;
  is_host: boolean;
  game_over: boolean;
}

export default function GameRoomScreen() {
  const router = useRouter();
  const { roomId, isHost } = useLocalSearchParams<{ roomId: string; isHost: string }>();
  const {
    username,
    userId,
    board,
    boardSize,
    availableBlocks,
    score,
    combo,
    isGameOver,
    placeBlock,
    canPlaceBlock,
    startGame,
    checkAndClearLines,
  } = useGameStore();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [isReady, setIsReady] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string>('');
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentGameOver, setOpponentGameOver] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [myFinalScore, setMyFinalScore] = useState(0);
  const [opponentFinalScore, setOpponentFinalScore] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [earnedXP, setEarnedXP] = useState(0);

  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [highlightCells, setHighlightCells] = useState<{ row: number; col: number }[]>([]);
  const [isValidPlacement, setIsValidPlacement] = useState(false);

  const boardRef = useRef<View>(null);
  const boardPositionRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const myPlayerId = userId || 'user-' + Date.now();
  const myPlayerName = username || 'İsimsiz Oyuncu';

  // Pulse animation for waiting
  useEffect(() => {
    if (gameStatus === 'waiting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [gameStatus]);

  // Socket.IO connection
  useEffect(() => {
    const socketUrl = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    
    const newSocket = io(API_URL, {
      transports: ['polling', 'websocket'],
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);

      newSocket.emit('join_room', {
        room_id: roomId,
        player_id: myPlayerId,
        player_name: myPlayerName,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('room_update', (data) => {
      console.log('Room update:', data);
      if (data.players) {
        setPlayers(data.players);
      }
      if (data.status) {
        setGameStatus(data.status);
      }
    });

    newSocket.on('player_joined', (data) => {
      console.log('Player joined:', data);
      if (data.players) {
        setPlayers(data.players);
      }
    });

    newSocket.on('player_ready', (data) => {
      console.log('Player ready:', data);
      if (data.players) {
        setPlayers(data.players);
      }
    });

    newSocket.on('game_started', (data) => {
      console.log('Game started:', data);
      setGameStatus('playing');
      if (data.players) {
        setPlayers(data.players);
      }
      startGame('classic');
    });

    newSocket.on('score_updated', (data) => {
      if (data.player_id !== myPlayerId) {
        setOpponentScore(data.score);
      }
    });

    newSocket.on('player_game_over', (data) => {
      console.log('Player game over:', data);
      if (data.player_id !== myPlayerId) {
        setOpponentGameOver(true);
        setOpponentFinalScore(data.score);
      }
    });

    newSocket.on('game_ended', (data) => {
      console.log('Game ended:', data);
      setGameStatus('finished');
      setWinner(data.winner_id);
      setWinnerName(data.winner_name);
      setMyFinalScore(score);
      
      // Set rewards from server
      if (data.rewards && data.rewards[myPlayerId]) {
        setEarnedCoins(data.rewards[myPlayerId].coins || 0);
        setEarnedXP(data.rewards[myPlayerId].xp || 0);
      } else {
        // Fallback rewards
        const isWinner = data.winner_id === myPlayerId;
        setEarnedCoins(isWinner ? 100 : 25);
        setEarnedXP(isWinner ? 50 : 15);
      }
      
      const opponent = data.players?.find((p: Player) => p.id !== myPlayerId);
      if (opponent) {
        setOpponentFinalScore(opponent.score);
      }
      
      setShowResultModal(true);
    });

    newSocket.on('player_left', (data) => {
      console.log('Player left:', data);
      if (data.player_id !== myPlayerId) {
        // Opponent left - you win!
        setGameStatus('finished');
        setWinner(myPlayerId);
        setWinnerName(myPlayerName);
        setShowResultModal(true);
      }
    });

    newSocket.on('error', (data) => {
      console.error('Socket error:', data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [roomId]);

  // Send score updates periodically
  useEffect(() => {
    if (socket && gameStatus === 'playing' && !isGameOver) {
      socket.emit('score_update', {
        room_id: roomId,
        player_id: myPlayerId,
        score: score,
      });
    }
  }, [score, socket, gameStatus, isGameOver]);

  // Handle game over
  useEffect(() => {
    if (gameStatus === 'playing' && isGameOver) {
      handleMyGameOver();
    }
  }, [isGameOver, gameStatus]);

  const handleMyGameOver = async () => {
    // Notify server about game over
    if (socket) {
      socket.emit('player_game_over', {
        room_id: roomId,
        player_id: myPlayerId,
        score: score,
      });
    }

    // Also call API
    try {
      await axios.post(`${API_URL}/api/rooms/${roomId}/player_gameover?player_id=${myPlayerId}&score=${score}`);
    } catch (error) {
      console.error('Error reporting game over:', error);
    }

    setMyFinalScore(score);
  };

  const handleReady = () => {
    if (socket) {
      setIsReady(true);
      socket.emit('player_ready', {
        room_id: roomId,
        player_id: myPlayerId,
      });
    }
  };

  const handleStartGame = async () => {
    if (socket && isHost === 'true') {
      try {
        await axios.post(`${API_URL}/api/rooms/${roomId}/start`);
      } catch (error) {
        console.error('Error starting game:', error);
      }
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leave_room', {
        room_id: roomId,
        player_id: myPlayerId,
      });
    }
    router.back();
  };

  const handlePlayAgain = () => {
    setShowResultModal(false);
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

  useEffect(() => {
    if (gameStatus === 'playing') {
      const timer = setTimeout(measureBoard, 100);
      return () => clearTimeout(timer);
    }
  }, [gameStatus, measureBoard]);

  // Pan responder for block dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gameStatus === 'playing' && !isGameOver,
      onMoveShouldSetPanResponder: () => gameStatus === 'playing' && !isGameOver,
      onPanResponderGrant: (evt) => {
        if (gameStatus !== 'playing' || isGameOver) return;
        
        const { pageX, pageY } = evt.nativeEvent;
        const blockIndex = Math.floor((pageX - 16) / (SCREEN_WIDTH / 3));
        
        if (blockIndex >= 0 && blockIndex < availableBlocks.length && availableBlocks[blockIndex]) {
          setDraggingBlock(availableBlocks[blockIndex]);
          setDragPosition({ x: pageX, y: pageY - 60 });
        }
      },
      onPanResponderMove: (evt) => {
        if (!draggingBlock || gameStatus !== 'playing') return;
        
        const { pageX, pageY } = evt.nativeEvent;
        setDragPosition({ x: pageX, y: pageY - 60 });
        
        const boardPos = boardPositionRef.current;
        const relativeX = pageX - boardPos.x;
        const relativeY = pageY - 60 - boardPos.y;
        
        const col = Math.floor(relativeX / GAME_CELL_SIZE);
        const row = Math.floor(relativeY / GAME_CELL_SIZE);
        
        if (row >= 0 && col >= 0) {
          const cells: { row: number; col: number }[] = [];
          draggingBlock.shape.forEach((shapeRow, r) => {
            shapeRow.forEach((cell, c) => {
              if (cell === 1) {
                cells.push({ row: row + r, col: col + c });
              }
            });
          });
          setHighlightCells(cells);
          setIsValidPlacement(canPlaceBlock(draggingBlock, row, col));
        } else {
          setHighlightCells([]);
          setIsValidPlacement(false);
        }
      },
      onPanResponderRelease: (evt) => {
        if (!draggingBlock || gameStatus !== 'playing') {
          setDraggingBlock(null);
          setHighlightCells([]);
          return;
        }
        
        const { pageX, pageY } = evt.nativeEvent;
        const boardPos = boardPositionRef.current;
        const relativeX = pageX - boardPos.x;
        const relativeY = pageY - 60 - boardPos.y;
        
        const col = Math.floor(relativeX / GAME_CELL_SIZE);
        const row = Math.floor(relativeY / GAME_CELL_SIZE);
        
        if (canPlaceBlock(draggingBlock, row, col)) {
          placeBlock(draggingBlock, row, col);
          
          // Send score update
          if (socket) {
            setTimeout(() => {
              socket.emit('score_update', {
                room_id: roomId,
                player_id: myPlayerId,
                score: useGameStore.getState().score,
              });
            }, 100);
          }
        }
        
        setDraggingBlock(null);
        setHighlightCells([]);
        setIsValidPlacement(false);
      },
    })
  ).current;

  const opponent = players.find(p => p.id !== myPlayerId);
  const me = players.find(p => p.id === myPlayerId);
  const allReady = players.length >= 2 && players.every(p => p.ready);
  const isWinner = winner === myPlayerId;

  // Waiting Screen
  if (gameStatus === 'waiting') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleLeaveRoom} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Oyun Odası</Text>
          <View style={[styles.connectionDot, { backgroundColor: connected ? '#4ECDC4' : '#FF6B6B' }]} />
        </View>

        <View style={styles.waitingContainer}>
          <Animated.View style={[styles.waitingIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Ionicons name="people" size={60} color="#4ECDC4" />
          </Animated.View>
          
          <Text style={styles.waitingTitle}>
            {players.length < 2 ? 'Oyuncu Bekleniyor...' : 'Hazır mısınız?'}
          </Text>

          <View style={styles.playersContainer}>
            {/* Me */}
            <View style={styles.playerCard}>
              <View style={[styles.playerAvatar, { backgroundColor: '#4ECDC4' }]}>
                <Text style={styles.playerInitial}>{myPlayerName[0]?.toUpperCase()}</Text>
              </View>
              <Text style={styles.playerName}>{myPlayerName}</Text>
              <Text style={styles.playerStatus}>
                {isReady ? '✅ Hazır' : '⏳ Bekliyor'}
              </Text>
            </View>

            <Text style={styles.vsText}>VS</Text>

            {/* Opponent */}
            <View style={styles.playerCard}>
              {opponent ? (
                <>
                  <View style={[styles.playerAvatar, { backgroundColor: '#FF6B6B' }]}>
                    <Text style={styles.playerInitial}>{opponent.name[0]?.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.playerName}>{opponent.name}</Text>
                  <Text style={styles.playerStatus}>
                    {opponent.ready ? '✅ Hazır' : '⏳ Bekliyor'}
                  </Text>
                </>
              ) : (
                <>
                  <View style={[styles.playerAvatar, { backgroundColor: '#333' }]}>
                    <Ionicons name="help" size={24} color="#666" />
                  </View>
                  <Text style={styles.playerNameWaiting}>Bekleniyor...</Text>
                </>
              )}
            </View>
          </View>

          {players.length >= 2 && !isReady && (
            <TouchableOpacity style={styles.readyButton} onPress={handleReady}>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.readyButtonText}>Hazırım!</Text>
            </TouchableOpacity>
          )}

          {isHost === 'true' && allReady && (
            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Oyunu Başlat</Text>
            </TouchableOpacity>
          )}

          {isReady && !allReady && (
            <Text style={styles.waitingText}>Rakip hazır olana kadar bekleyin...</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Game Screen
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with scores */}
      <View style={styles.gameHeader}>
        <View style={styles.playerScore}>
          <Text style={styles.playerScoreName}>{myPlayerName}</Text>
          <Text style={styles.playerScoreValue}>{score}</Text>
          {isGameOver && <Text style={styles.gameOverLabel}>GAME OVER</Text>}
        </View>

        <View style={styles.vsContainer}>
          <Text style={styles.vsGameText}>VS</Text>
        </View>

        <View style={styles.playerScore}>
          <Text style={styles.playerScoreName}>{opponent?.name || 'Rakip'}</Text>
          <Text style={styles.playerScoreValue}>{opponentScore}</Text>
          {opponentGameOver && <Text style={styles.gameOverLabel}>GAME OVER</Text>}
        </View>
      </View>

      {/* Combo indicator */}
      {combo > 0 && (
        <View style={styles.comboContainer}>
          <Text style={styles.comboText}>COMBO x{combo}</Text>
        </View>
      )}

      {/* Game Board */}
      <View 
        ref={boardRef} 
        style={styles.boardWrapper}
        onLayout={measureBoard}
        {...panResponder.panHandlers}
      >
        <GameBoard 
          highlightCells={highlightCells}
          isValidPlacement={isValidPlacement}
        />
      </View>

      {/* Available Blocks */}
      <View style={styles.blocksContainer}>
        {availableBlocks.map((block, index) => (
          <View key={index} style={styles.blockWrapper}>
            {block ? (
              <View style={styles.blockInner}>
                <BlockPiece block={block} cellSize={GAME_CELL_SIZE * 0.7} />
              </View>
            ) : (
              <View style={styles.emptyBlockSlot} />
            )}
          </View>
        ))}
      </View>

      {/* Dragging Block */}
      {draggingBlock && (
        <View
          style={[
            styles.draggingBlock,
            {
              left: dragPosition.x - (draggingBlock.shape[0].length * GAME_CELL_SIZE) / 2,
              top: dragPosition.y - (draggingBlock.shape.length * GAME_CELL_SIZE) / 2,
            },
          ]}
          pointerEvents="none"
        >
          <BlockPiece block={draggingBlock} cellSize={GAME_CELL_SIZE} opacity={0.8} />
        </View>
      )}

      {/* Game Over for me - waiting for opponent */}
      {isGameOver && !showResultModal && (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverBox}>
            <Ionicons name="hourglass-outline" size={40} color="#FFD700" />
            <Text style={styles.gameOverWaitText}>Skorunuz: {score}</Text>
            <Text style={styles.gameOverWaitSubtext}>Rakibin oyunu bitmesini bekleyin...</Text>
          </View>
        </View>
      )}

      {/* Result Modal */}
      <Modal visible={showResultModal} transparent animationType="fade">
        <View style={styles.resultOverlay}>
          <View style={[styles.resultModal, isWinner ? styles.winModal : styles.loseModal]}>
            <View style={styles.resultIconContainer}>
              <Ionicons 
                name={isWinner ? 'trophy' : 'sad-outline'} 
                size={70} 
                color={isWinner ? '#FFD700' : '#FF6B6B'} 
              />
            </View>

            <Text style={[styles.resultTitle, isWinner ? styles.winTitle : styles.loseTitle]}>
              {isWinner ? 'GALİBİYET!' : 'MAĞLUBİYET'}
            </Text>

            {isWinner && (
              <View style={styles.starsContainer}>
                <Ionicons name="star" size={24} color="#FFD700" />
                <Ionicons name="star" size={32} color="#FFD700" />
                <Ionicons name="star" size={24} color="#FFD700" />
              </View>
            )}

            <View style={styles.resultScores}>
              <View style={styles.resultScoreItem}>
                <Text style={styles.resultScoreName}>Sen</Text>
                <Text style={[styles.resultScoreValue, isWinner && styles.winnerScore]}>
                  {myFinalScore}
                </Text>
              </View>
              <Text style={styles.resultVs}>-</Text>
              <View style={styles.resultScoreItem}>
                <Text style={styles.resultScoreName}>{opponent?.name || 'Rakip'}</Text>
                <Text style={[styles.resultScoreValue, !isWinner && styles.winnerScore]}>
                  {opponentFinalScore}
                </Text>
              </View>
            </View>

            {/* Rewards Section */}
            <View style={styles.rewardsSection}>
              <Text style={styles.rewardsTitle}>Kazandıkların</Text>
              <View style={styles.rewardsRow}>
                <View style={styles.rewardItem}>
                  <Ionicons name="logo-bitcoin" size={24} color="#FFD700" />
                  <Text style={styles.rewardValue}>+{earnedCoins}</Text>
                  <Text style={styles.rewardLabel}>Coin</Text>
                </View>
                <View style={styles.rewardItem}>
                  <Ionicons name="star" size={24} color="#4ECDC4" />
                  <Text style={styles.rewardValue}>+{earnedXP}</Text>
                  <Text style={styles.rewardLabel}>XP</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.resultButton} onPress={handlePlayAgain}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.resultButtonText}>Lobiye Dön</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  waitingIcon: {
    marginBottom: 20,
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  playerCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    minWidth: 120,
  },
  playerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  playerNameWaiting: {
    fontSize: 14,
    color: '#666',
  },
  playerStatus: {
    fontSize: 14,
    color: '#888',
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginHorizontal: 20,
  },
  readyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  waitingText: {
    fontSize: 14,
    color: '#888',
    marginTop: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  playerScore: {
    flex: 1,
    alignItems: 'center',
  },
  playerScoreName: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  playerScoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameOverLabel: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: 'bold',
    marginTop: 2,
  },
  vsContainer: {
    paddingHorizontal: 16,
  },
  vsGameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  comboContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  comboText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  boardWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blocksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(30, 30, 50, 0.9)',
  },
  blockWrapper: {
    alignItems: 'center',
    padding: 8,
  },
  blockInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
    minWidth: 60,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBlockSlot: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  draggingBlock: {
    position: 'absolute',
    zIndex: 1000,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverBox: {
    backgroundColor: '#1a1a2e',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  gameOverWaitText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginTop: 16,
  },
  gameOverWaitSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  winModal: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  loseModal: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  resultIconContainer: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  winTitle: {
    color: '#FFD700',
  },
  loseTitle: {
    color: '#FF6B6B',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  resultScores: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  resultScoreItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  resultScoreName: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  resultScoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  winnerScore: {
    color: '#FFD700',
  },
  resultVs: {
    fontSize: 24,
    color: '#444',
    marginHorizontal: 16,
  },
  rewardsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    width: '100%',
  },
  rewardsTitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  rewardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rewardItem: {
    alignItems: 'center',
    gap: 4,
  },
  rewardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  rewardLabel: {
    fontSize: 11,
    color: '#666',
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
