import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Block shapes definitions - Brighter colors
export const BLOCK_SHAPES = {
  // Single block (1 point)
  single: { shape: [[1]], color: '#FF5252', points: 1 },
  
  // 2-block shapes (2 points)
  horizontal2: { shape: [[1, 1]], color: '#00E5FF', points: 2 },
  vertical2: { shape: [[1], [1]], color: '#40C4FF', points: 2 },
  
  // 3-block shapes (3 points)
  horizontal3: { shape: [[1, 1, 1]], color: '#69F0AE', points: 3 },
  vertical3: { shape: [[1], [1], [1]], color: '#FFD740', points: 3 },
  lShape: { shape: [[1, 0], [1, 0], [1, 1]], color: '#EA80FC', points: 4 },
  lShapeReverse: { shape: [[0, 1], [0, 1], [1, 1]], color: '#64FFDA', points: 4 },
  
  // 4-block shapes (4-5 points)
  square: { shape: [[1, 1], [1, 1]], color: '#FFFF00', points: 4 },
  horizontal4: { shape: [[1, 1, 1, 1]], color: '#E040FB', points: 4 },
  vertical4: { shape: [[1], [1], [1], [1]], color: '#18FFFF', points: 4 },
  tShape: { shape: [[1, 1, 1], [0, 1, 0]], color: '#FF9100', points: 5 },
  sShape: { shape: [[0, 1, 1], [1, 1, 0]], color: '#FF1744', points: 5 },
  zShape: { shape: [[1, 1, 0], [0, 1, 1]], color: '#D500F9', points: 5 },
  
  // 5-block shapes (6-8 points)
  horizontal5: { shape: [[1, 1, 1, 1, 1]], color: '#1DE9B6', points: 6 },
  vertical5: { shape: [[1], [1], [1], [1], [1]], color: '#00B0FF', points: 6 },
  plusShape: { shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: '#FF6D00', points: 7 },
  bigL: { shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: '#00E676', points: 7 },
  
  // Large shapes (9-12 points)
  bigSquare: { shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: '#FF4081', points: 9 },
};

export type BlockType = keyof typeof BLOCK_SHAPES;

export interface Block {
  id: string;
  type: BlockType;
  shape: number[][];
  color: string;
  points: number;
}

export interface GameState {
  // Game board
  board: (string | null)[][];
  boardSize: number;
  
  // Available blocks to place
  availableBlocks: Block[];
  
  // Scoring
  score: number;
  highScore: number;
  combo: number;
  lastClearTime: number;
  
  // User stats
  level: number;
  xp: number;
  xpToNextLevel: number;
  
  // Game state
  gameMode: 'classic' | 'timed' | 'multiplayer';
  timeRemaining: number;
  isGameOver: boolean;
  isPaused: boolean;
  
  // User info
  username: string;
  userId: string;
}

export interface GameActions {
  // Board actions
  initBoard: () => void;
  placeBlock: (block: Block, startRow: number, startCol: number) => boolean;
  canPlaceBlock: (block: Block, startRow: number, startCol: number) => boolean;
  canPlaceAnyBlock: () => boolean;
  
  // Block actions
  generateNewBlocks: () => void;
  
  // Game flow
  startGame: (mode: 'classic' | 'timed' | 'multiplayer') => void;
  endGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  updateTimer: () => void;
  continueGame: () => void; // NEW: Continue after watching ad
  
  // Power-up actions
  useBomb: (centerRow: number, centerCol: number) => number; // Returns cells cleared
  clearRow: (rowIndex: number) => number; // Returns cells cleared
  
  // User actions
  setUsername: (name: string) => void;
  loadUserData: () => Promise<void>;
  saveUserData: () => Promise<void>;
  addXP: (amount: number) => void;
  
  // Scoring
  resetCombo: () => void;
}

const BOARD_SIZE = 8;
const COMBO_TIMEOUT = 3000; // 3 seconds to maintain combo
const TIMED_GAME_DURATION = 180; // 3 minutes

const generateRandomBlock = (): Block => {
  const blockTypes = Object.keys(BLOCK_SHAPES) as BlockType[];
  const randomType = blockTypes[Math.floor(Math.random() * blockTypes.length)];
  const blockDef = BLOCK_SHAPES[randomType];
  
  return {
    id: Math.random().toString(36).substring(7),
    type: randomType,
    shape: blockDef.shape,
    color: blockDef.color,
    points: blockDef.points,
  };
};

const createEmptyBoard = (size: number): (string | null)[][] => {
  return Array(size).fill(null).map(() => Array(size).fill(null));
};

const calculateXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  // Initial state
  board: createEmptyBoard(BOARD_SIZE),
  boardSize: BOARD_SIZE,
  availableBlocks: [],
  score: 0,
  highScore: 0,
  combo: 0,
  lastClearTime: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  gameMode: 'classic',
  timeRemaining: TIMED_GAME_DURATION,
  isGameOver: false,
  isPaused: false,
  username: '',
  userId: '',

  // Board actions
  initBoard: () => {
    set({
      board: createEmptyBoard(BOARD_SIZE),
      score: 0,
      combo: 0,
      isGameOver: false,
      isPaused: false,
      timeRemaining: TIMED_GAME_DURATION,
    });
    get().generateNewBlocks();
  },

  canPlaceBlock: (block: Block, startRow: number, startCol: number) => {
    const { board, boardSize } = get();
    const shape = block.shape;
    
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          const boardRow = startRow + r;
          const boardCol = startCol + c;
          
          // Check bounds
          if (boardRow < 0 || boardRow >= boardSize || 
              boardCol < 0 || boardCol >= boardSize) {
            return false;
          }
          
          // Check if cell is occupied
          if (board[boardRow][boardCol] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  },

  canPlaceAnyBlock: () => {
    const { availableBlocks, boardSize, canPlaceBlock } = get();
    
    for (const block of availableBlocks) {
      for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
          if (canPlaceBlock(block, row, col)) {
            return true;
          }
        }
      }
    }
    return false;
  },

  placeBlock: (block: Block, startRow: number, startCol: number) => {
    const state = get();
    if (!state.canPlaceBlock(block, startRow, startCol)) {
      return false;
    }

    const newBoard = state.board.map(row => [...row]);
    const shape = block.shape;

    // Place block on board
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 1) {
          newBoard[startRow + r][startCol + c] = block.color;
        }
      }
    }

    // Remove block from available blocks
    const newAvailableBlocks = state.availableBlocks.filter(b => b.id !== block.id);

    // Check for completed lines
    let linesCleared = 0;
    const rowsToClear: number[] = [];
    const colsToClear: number[] = [];

    // Check rows
    for (let r = 0; r < BOARD_SIZE; r++) {
      if (newBoard[r].every(cell => cell !== null)) {
        rowsToClear.push(r);
        linesCleared++;
      }
    }

    // Check columns
    for (let c = 0; c < BOARD_SIZE; c++) {
      let columnFull = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (newBoard[r][c] === null) {
          columnFull = false;
          break;
        }
      }
      if (columnFull) {
        colsToClear.push(c);
        linesCleared++;
      }
    }

    // Clear completed lines
    for (const row of rowsToClear) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        newBoard[row][c] = null;
      }
    }
    for (const col of colsToClear) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        newBoard[r][col] = null;
      }
    }

    // Calculate score
    const now = Date.now();
    let newCombo = state.combo;
    let scoreMultiplier = 1;

    if (linesCleared > 0) {
      // Check if within combo time window
      if (now - state.lastClearTime < COMBO_TIMEOUT && state.lastClearTime > 0) {
        newCombo = state.combo + 1;
      } else {
        newCombo = 1;
      }
      scoreMultiplier = newCombo;
    } else {
      // No lines cleared, reset combo if timeout
      if (now - state.lastClearTime > COMBO_TIMEOUT) {
        newCombo = 0;
      }
    }

    // Base score: block points + line clear bonus
    const lineBonus = linesCleared * linesCleared * 10; // Exponential bonus for multiple lines
    const totalScore = (block.points + lineBonus) * scoreMultiplier;

    // XP calculation: double XP on combos
    const xpGained = linesCleared > 0 
      ? (block.points + lineBonus) * (newCombo > 1 ? 2 : 1)
      : block.points;

    const newScore = state.score + totalScore;
    const newHighScore = Math.max(newScore, state.highScore);

    set({
      board: newBoard,
      availableBlocks: newAvailableBlocks,
      score: newScore,
      highScore: newHighScore,
      combo: newCombo,
      lastClearTime: linesCleared > 0 ? now : state.lastClearTime,
    });

    // Add XP
    get().addXP(xpGained);

    // Generate new blocks if all placed
    if (newAvailableBlocks.length === 0) {
      get().generateNewBlocks();
    }

    // Check game over
    setTimeout(() => {
      if (!get().canPlaceAnyBlock()) {
        get().endGame();
      }
    }, 100);

    return true;
  },

  generateNewBlocks: () => {
    const newBlocks = [
      generateRandomBlock(),
      generateRandomBlock(),
      generateRandomBlock(),
    ];
    set({ availableBlocks: newBlocks });
  },

  // Game flow
  startGame: (mode) => {
    set({
      gameMode: mode,
      isGameOver: false,
      isPaused: false,
      score: 0,
      combo: 0,
      timeRemaining: TIMED_GAME_DURATION,
    });
    get().initBoard();
  },

  endGame: () => {
    const state = get();
    set({ isGameOver: true });
    state.saveUserData();
  },

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  // Continue game after watching rewarded ad
  continueGame: () => {
    // Generate new blocks that can be placed
    const board = get().board;
    let attempts = 0;
    let validBlocks: Block[] = [];
    
    // Try to generate blocks that can actually be placed
    while (validBlocks.length < 3 && attempts < 50) {
      const newBlock = generateRandomBlock();
      
      // Check if this block can be placed anywhere on the board
      let canPlace = false;
      for (let row = 0; row < BOARD_SIZE && !canPlace; row++) {
        for (let col = 0; col < BOARD_SIZE && !canPlace; col++) {
          // Check if block fits at this position
          let fits = true;
          for (let r = 0; r < newBlock.shape.length && fits; r++) {
            for (let c = 0; c < newBlock.shape[r].length && fits; c++) {
              if (newBlock.shape[r][c] === 1) {
                const boardRow = row + r;
                const boardCol = col + c;
                if (
                  boardRow >= BOARD_SIZE ||
                  boardCol >= BOARD_SIZE ||
                  board[boardRow][boardCol] !== null
                ) {
                  fits = false;
                }
              }
            }
          }
          if (fits) canPlace = true;
        }
      }
      
      if (canPlace) {
        validBlocks.push(newBlock);
      }
      attempts++;
    }
    
    // If we couldn't find 3 valid blocks, use smaller blocks
    while (validBlocks.length < 3) {
      validBlocks.push({
        id: Math.random().toString(36).substring(7),
        type: 'single',
        shape: [[1]],
        color: '#FF5252',
        points: 1,
      });
    }
    
    set({
      availableBlocks: validBlocks,
      isGameOver: false,
    });
  },

  updateTimer: () => {
    const state = get();
    if (state.gameMode === 'timed' && !state.isPaused && !state.isGameOver) {
      const newTime = state.timeRemaining - 1;
      if (newTime <= 0) {
        set({ timeRemaining: 0 });
        get().endGame();
      } else {
        set({ timeRemaining: newTime });
      }
    }
  },

  // User actions
  setUsername: (name) => set({ username: name }),

  loadUserData: async () => {
    try {
      const userData = await AsyncStorage.getItem('blockBlastUser');
      if (userData) {
        const parsed = JSON.parse(userData);
        set({
          username: parsed.username || '',
          userId: parsed.userId || Math.random().toString(36).substring(7),
          level: parsed.level || 1,
          xp: parsed.xp || 0,
          xpToNextLevel: parsed.xpToNextLevel || 100,
          highScore: parsed.highScore || 0,
        });
      } else {
        const newUserId = Math.random().toString(36).substring(7);
        set({ userId: newUserId });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  },

  saveUserData: async () => {
    try {
      const state = get();
      const userData = {
        username: state.username,
        userId: state.userId,
        level: state.level,
        xp: state.xp,
        xpToNextLevel: state.xpToNextLevel,
        highScore: state.highScore,
      };
      await AsyncStorage.setItem('blockBlastUser', JSON.stringify(userData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  },

  addXP: (amount) => {
    const state = get();
    let newXP = state.xp + amount;
    let newLevel = state.level;
    let newXPToNext = state.xpToNextLevel;

    // Level up check
    while (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel++;
      newXPToNext = calculateXPForLevel(newLevel);
    }

    set({
      xp: newXP,
      level: newLevel,
      xpToNextLevel: newXPToNext,
    });
  },

  resetCombo: () => set({ combo: 0 }),

  // Power-up: Bomb - Clear 3x3 area around center
  useBomb: (centerRow, centerCol) => {
    const { board, score, highScore } = get();
    const newBoard = board.map(row => [...row]);
    let cellsCleared = 0;
    
    // Clear 3x3 area around center
    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      for (let c = centerCol - 1; c <= centerCol + 1; c++) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (newBoard[r][c] !== null) {
            newBoard[r][c] = null;
            cellsCleared++;
          }
        }
      }
    }
    
    // Calculate score bonus for cleared cells
    const bonusScore = cellsCleared * 5;
    const newScore = score + bonusScore;
    
    set({
      board: newBoard,
      score: newScore,
      highScore: Math.max(newScore, highScore),
    });
    
    // Add XP for using power-up
    get().addXP(cellsCleared * 2);
    
    return cellsCleared;
  },

  // Power-up: Clear entire row
  clearRow: (rowIndex) => {
    const { board, score, highScore } = get();
    
    if (rowIndex < 0 || rowIndex >= BOARD_SIZE) return 0;
    
    const newBoard = board.map(row => [...row]);
    let cellsCleared = 0;
    
    // Clear the entire row
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (newBoard[rowIndex][c] !== null) {
        newBoard[rowIndex][c] = null;
        cellsCleared++;
      }
    }
    
    // Calculate score bonus
    const bonusScore = cellsCleared * 3;
    const newScore = score + bonusScore;
    
    set({
      board: newBoard,
      score: newScore,
      highScore: Math.max(newScore, highScore),
    });
    
    // Add XP
    get().addXP(cellsCleared * 2);
    
    return cellsCleared;
  },
}));
