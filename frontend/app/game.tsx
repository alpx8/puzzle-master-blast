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
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, Block } from '@/src/store/gameStore';
import { useQuestStore } from '@/src/store/questStore';
import { usePowerUpsStore, PowerUpType } from '@/src/store/powerUpsStore';
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
  playGameOverSound,
  playHighScoreSound,
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
    continueGame,
    generateNewBlocks,
    useBomb,
    clearRow,
  } = useGameStore();

  const { loadQuests, updateQuestProgress, dailyQuests, claimReward } = useQuestStore();
  
  // Power-ups
  const { powerUps, usePowerUp, setActivePowerUp, activePowerUp, loadPowerUps, watchAdForPowerUp } = usePowerUpsStore();
  const [showPowerUpModal, setShowPowerUpModal] = useState(false);
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUpType | null>(null);

  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [highlightCells, setHighlightCells] = useState<{ row: number; col: number }[]>([]);
  const [isValidPlacement, setIsValidPlacement] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [showQuestsModal, setShowQuestsModal] = useState(false);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [isMuted, setIsMuted] = useState(!getSoundsEnabled());
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [previousHighScore, setPreviousHighScore] = useState(0);
  const [continuesUsed, setContinuesUsed] = useState(0);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  
  // Animations
  const continueModalScale = useRef(new Animated.Value(0)).current;
  const continueModalOpacity = useRef(new Animated.Value(0)).current;
  const heartPulse = useRef(new Animated.Value(1)).current;
  const countdownValue = useRef(new Animated.Value(5)).current;
  const [countdown, setCountdown] = useState(5);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const boardRef = useRef<View>(null);
  const boardPositionRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const prevScore = useRef(0);
  const prevCombo = useRef(0);
  const prevLevel = useRef(1);

  // Initialize sounds and ads
  useEffect(() => {
    initSounds();
    loadPowerUps();
    // AdMob sadece native'de çalışır - production build'de aktif olacak
    if (userId) {
      loadQuests(userId);
    }
    
    return () => {
      unloadSounds();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [userId]);
  
  // Power-up handlers
  const handleUsePowerUp = (type: PowerUpType) => {
    const powerUp = powerUps.find(p => p.id === type);
    if (!powerUp) return;
    
    if (powerUp.count > 0) {
      // Kullan
      if (type === 'shuffle') {
        // Yeni bloklar al
        usePowerUp(type);
        generateNewBlocks?.();
        playClearSound();
      } else if (type === 'extraTime' && gameMode === 'timed') {
        // +30 saniye
        usePowerUp(type);
        useGameStore.setState(state => ({ timeRemaining: state.timeRemaining + 30 }));
        playComboSound();
      } else if (type === 'bomb' || type === 'clearRow') {
        // Aktif power-up olarak seç - board'a tıklanmasını bekle
        setActivePowerUp(type);
      }
    } else {
      // Reklam izle
      setSelectedPowerUp(type);
      setShowPowerUpModal(true);
    }
  };
  
  // Bomb power-up - board üzerinde tıklama ile çalışır
  const handleBombUse = (row: number, col: number) => {
    if (activePowerUp !== 'bomb') return;
    
    const powerUp = powerUps.find(p => p.id === 'bomb');
    if (!powerUp || powerUp.count <= 0) {
      setActivePowerUp(null);
      return;
    }
    
    // Bomb'u kullan
    usePowerUp('bomb');
    const clearedCells = useBomb(row, col);
    
    if (clearedCells > 0) {
      playClearSound();
      triggerComboHaptic();
    }
    
    setActivePowerUp(null);
  };
  
  // ClearRow power-up - satıra tıklama ile çalışır
  const handleClearRowUse = (row: number) => {
    if (activePowerUp !== 'clearRow') return;
    
    const powerUp = powerUps.find(p => p.id === 'clearRow');
    if (!powerUp || powerUp.count <= 0) {
      setActivePowerUp(null);
      return;
    }
    
    // ClearRow'u kullan
    usePowerUp('clearRow');
    const clearedCells = clearRow(row);
    
    if (clearedCells > 0) {
      playClearSound();
      triggerComboHaptic();
    }
    
    setActivePowerUp(null);
  };
  
  const handleWatchAdForPowerUp = async () => {
    if (!selectedPowerUp) return;
    await watchAdForPowerUp(selectedPowerUp);
    setShowPowerUpModal(false);
    setSelectedPowerUp(null);
  };
  
  // Sosyal paylaşım
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Puzzle Master Blast'ta ${score.toLocaleString()} puan yaptım! Sen de dene! 🎮🏆`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  useEffect(() => {
    const gameMode = (mode as 'classic' | 'timed' | 'multiplayer') || 'classic';
    // Save the current high score before starting new game
    setPreviousHighScore(highScore);
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
      // Check if new high score - score must be greater than previous high score
      const isNewRecord = score > previousHighScore && previousHighScore >= 0;
      
      // İlk 3 devam hakkında "Devam Et" seçeneği göster
      if (continuesUsed < 3) {
        setShowContinueModal(true);
        startContinueCountdown();
        animateContinueModal(true);
      } else {
        // 3 kez kullanıldıysa direkt game over
        showFinalGameOver(isNewRecord);
      }
    }
  }, [isGameOver]);

  const startContinueCountdown = () => {
    setCountdown(5);
    if (countdownRef.current) clearInterval(countdownRef.current);
    
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          handleDeclineContinue();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Heart pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartPulse, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heartPulse, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateContinueModal = (show: boolean) => {
    Animated.parallel([
      Animated.spring(continueModalScale, {
        toValue: show ? 1 : 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(continueModalOpacity, {
        toValue: show ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const showFinalGameOver = (isNewRecord: boolean) => {
    if (isNewRecord) {
      setIsNewHighScore(true);
      playHighScoreSound();
    } else {
      setIsNewHighScore(false);
      playGameOverSound();
    }
    setShowGameOverModal(true);
    saveUserData();
    updateQuestProgress('score', score);
    
    // Interstitial ad göster - sadece native'de çalışır
    // Production build'de aktif olacak
  };

  const handleWatchAdToContinue = async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setIsLoadingAd(true);
    
    // Web'de simüle et, Native'de gerçek reklam gösterilecek
    // Production build'de AdMob aktif olacak
    setTimeout(() => {
      // Reklam izlendi (veya simüle edildi), oyuna devam et
      setIsLoadingAd(false);
      setShowContinueModal(false);
      setContinuesUsed(prev => prev + 1);
      
      // Oyunu devam ettir - yeni bloklar ver
      if (continueGame) {
        continueGame();
      } else if (generateNewBlocks) {
        generateNewBlocks();
      }
      
      // Reset game over state
      useGameStore.setState({ isGameOver: false });
    }, Platform.OS === 'web' ? 1000 : 100); // Web'de 1 saniye bekle (simülasyon)
  };

  const handleDeclineContinue = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    animateContinueModal(false);
    
    setTimeout(() => {
      setShowContinueModal(false);
      const isNewRecord = score > previousHighScore && previousHighScore >= 0;
      showFinalGameOver(isNewRecord);
    }, 200);
  };

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
      
      {/* Power-ups Bar */}
      <View style={styles.powerUpsBar}>
        {powerUps.slice(0, 3).map((powerUp) => (
          <TouchableOpacity
            key={powerUp.id}
            style={[
              styles.powerUpButton,
              activePowerUp === powerUp.id && styles.powerUpButtonActive,
              powerUp.count === 0 && styles.powerUpButtonEmpty,
            ]}
            onPress={() => handleUsePowerUp(powerUp.id)}
          >
            <Ionicons 
              name={powerUp.icon as any} 
              size={20} 
              color={powerUp.count > 0 ? powerUp.color : '#555'} 
            />
            {powerUp.count > 0 ? (
              <Text style={[styles.powerUpCount, { color: powerUp.color }]}>
                {powerUp.count}
              </Text>
            ) : (
              <Ionicons name="add" size={12} color="#FFD700" style={styles.powerUpPlus} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Active Power-up Indicator */}
      {activePowerUp && (
        <View style={styles.powerUpIndicator}>
          <Ionicons 
            name={activePowerUp === 'bomb' ? 'flame' : 'remove-circle'} 
            size={16} 
            color={activePowerUp === 'bomb' ? '#FF5F1F' : '#39FF14'} 
          />
          <Text style={styles.powerUpIndicatorText}>
            {activePowerUp === 'bomb' ? 'Bomba için tahtaya dokun!' : 'Temizlemek için satıra dokun!'}
          </Text>
          <TouchableOpacity onPress={() => setActivePowerUp(null)}>
            <Ionicons name="close-circle" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      )}

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
            activePowerUp={activePowerUp === 'bomb' || activePowerUp === 'clearRow' ? activePowerUp : null}
            onBombUse={handleBombUse}
            onClearRowUse={handleClearRowUse}
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

      {/* Banner Ad Placeholder - Production'da aktif */}
      <View style={styles.bannerPlaceholder}>
        <Text style={styles.bannerPlaceholderText}>Reklam Alanı</Text>
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

      {/* Continue Modal - Ekstra Can İster misiniz? */}
      <Modal visible={showContinueModal} transparent animationType="none">
        <View style={styles.continueModalOverlay}>
          <Animated.View 
            style={[
              styles.continueModalContent,
              {
                opacity: continueModalOpacity,
                transform: [{ scale: continueModalScale }],
              }
            ]}
          >
            {/* Animated Heart */}
            <Animated.View style={[styles.heartContainer, { transform: [{ scale: heartPulse }] }]}>
              <View style={styles.heartGlow} />
              <Ionicons name="heart" size={80} color="#FF6B6B" />
              <View style={styles.heartPlusContainer}>
                <Text style={styles.heartPlus}>+1</Text>
              </View>
            </Animated.View>
            
            {/* Title */}
            <Text style={styles.continueTitle}>Devam Et?</Text>
            <Text style={styles.continueSubtitle}>Skorun: {score.toLocaleString()}</Text>
            
            {/* Countdown Timer */}
            <View style={styles.countdownContainer}>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
              <Text style={styles.countdownLabel}>saniye</Text>
            </View>
            
            {/* Continue Chances Left */}
            <View style={styles.chancesContainer}>
              {[0, 1, 2].map((i) => (
                <View 
                  key={i} 
                  style={[
                    styles.chanceHeart,
                    continuesUsed > i && styles.chanceHeartUsed
                  ]}
                >
                  <Ionicons 
                    name="heart" 
                    size={20} 
                    color={continuesUsed > i ? '#444' : '#FF6B6B'} 
                  />
                </View>
              ))}
            </View>
            <Text style={styles.chancesText}>{3 - continuesUsed} devam hakkın kaldı</Text>
            
            {/* Watch Ad Button */}
            <TouchableOpacity 
              style={styles.watchAdButton}
              onPress={handleWatchAdToContinue}
              disabled={isLoadingAd}
            >
              <View style={styles.watchAdButtonInner}>
                {isLoadingAd ? (
                  <Text style={styles.watchAdText}>Reklam Yükleniyor...</Text>
                ) : (
                  <>
                    <Ionicons name="play-circle" size={28} color="#fff" />
                    <Text style={styles.watchAdText}>Reklam İzle & Devam Et</Text>
                  </>
                )}
              </View>
              <View style={styles.watchAdBadge}>
                <Text style={styles.watchAdBadgeText}>ÜCRETSİZ</Text>
              </View>
            </TouchableOpacity>
            
            {/* Decline Button */}
            <TouchableOpacity 
              style={styles.declineButton}
              onPress={handleDeclineContinue}
            >
              <Text style={styles.declineText}>Hayır, Bitir</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Game Over Modal */}
      <Modal visible={showGameOverModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isNewHighScore && styles.highScoreModalContent]}>
            {isNewHighScore ? (
              <>
                <View style={styles.celebrationContainer}>
                  <Ionicons name="trophy" size={60} color="#FFD700" />
                </View>
                <Text style={styles.newHighScoreTitle}>NEW HIGH SCORE!</Text>
                <View style={styles.starsContainer}>
                  <Ionicons name="star" size={24} color="#FFD700" />
                  <Ionicons name="star" size={32} color="#FFD700" />
                  <Ionicons name="star" size={24} color="#FFD700" />
                </View>
                <Text style={styles.congratsText}>Tebrikler!</Text>
              </>
            ) : (
              <>
                <View style={styles.gameOverIconContainer}>
                  <Ionicons name="sad-outline" size={60} color="#FF6B6B" />
                </View>
                <Text style={styles.gameOverTitle}>GAME OVER</Text>
                <Text style={styles.tryAgainText}>Tekrar dene!</Text>
              </>
            )}
            <View style={styles.finalScoreContainer}>
              <Text style={styles.finalScoreLabel}>Skorun</Text>
              <Text style={[styles.finalScore, isNewHighScore && styles.highScoreValue]}>
                {score.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Seviye</Text>
                <Text style={styles.statValue}>{level}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>En Yüksek</Text>
                <Text style={[styles.statValue, isNewHighScore && styles.highScoreStatValue]}>
                  {highScore.toLocaleString()}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.modalButton, isNewHighScore && styles.highScoreButton]} 
              onPress={handleRestart}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Tekrar Oyna</Text>
            </TouchableOpacity>
            
            {/* Share Button */}
            <TouchableOpacity 
              style={[styles.modalButton, styles.shareButton]} 
              onPress={handleShare}
            >
              <Ionicons name="share-social" size={24} color="#fff" />
              <Text style={styles.modalButtonText}>Paylaş</Text>
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
    fontSize: 36,
    fontWeight: '900',
    color: '#FF6B6B',
    marginTop: 16,
    letterSpacing: 2,
  },
  gameOverIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tryAgainText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  newHighScoreTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD700',
    marginTop: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
  highScoreModalContent: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  celebrationContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  congratsText: {
    fontSize: 16,
    color: '#FFD700',
    marginTop: 4,
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
  highScoreValue: {
    color: '#FFD700',
  },
  highScoreStatValue: {
    color: '#FFD700',
  },
  highScoreButton: {
    backgroundColor: '#FFD700',
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
  // Continue Modal Styles
  continueModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueModalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.88,
    maxWidth: 380,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  heartContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heartGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 107, 0.3)',
  },
  heartPlusContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4ECDC4',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heartPlus: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  continueTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  continueSubtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 4,
  },
  countdownContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  countdownCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderWidth: 3,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  countdownLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  chancesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chanceHeart: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chanceHeartUsed: {
    backgroundColor: 'rgba(68, 68, 68, 0.3)',
  },
  chancesText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 20,
  },
  watchAdButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  watchAdButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  watchAdText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  watchAdBadge: {
    position: 'absolute',
    top: -1,
    right: 10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  watchAdBadgeText: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  declineButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  declineText: {
    color: '#666',
    fontSize: 16,
  },
  bannerPlaceholder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  bannerPlaceholderText: {
    color: '#555',
    fontSize: 11,
  },
  // Power-ups Bar
  powerUpsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    marginBottom: 4,
  },
  powerUpButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 6,
  },
  powerUpButtonActive: {
    borderWidth: 2,
    borderColor: '#39FF14',
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
  },
  powerUpButtonEmpty: {
    opacity: 0.6,
  },
  powerUpCount: {
    fontSize: 12,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 4,
    right: 6,
  },
  powerUpPlus: {
    position: 'absolute',
    bottom: 4,
    right: 6,
  },
  // Share Button
  shareButton: {
    backgroundColor: '#1DA1F2',
    marginTop: 8,
  },
  // Power-up Indicator
  powerUpIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    marginBottom: 4,
  },
  powerUpIndicatorText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
