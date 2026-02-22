import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Text,
} from 'react-native';
import { useGameStore } from '@/src/store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - BOARD_PADDING * 2, 360);

interface CellAnimation {
  row: number;
  col: number;
  type: 'drop' | 'clear';
  color: string;
}

interface ScorePopup {
  id: string;
  x: number;
  y: number;
  score: number;
}

interface GameBoardProps {
  highlightCells?: { row: number; col: number }[];
  isValidPlacement?: boolean;
  onClearAnimation?: (cells: { row: number; col: number }[]) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  highlightCells = [], 
  isValidPlacement = false,
}) => {
  const { board, boardSize } = useGameStore();
  const cellSize = BOARD_WIDTH / boardSize;
  
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [dropAnimations, setDropAnimations] = useState<Map<string, Animated.Value>>(new Map());
  const clearAnimations = useRef<Map<string, Animated.Value>>(new Map());
  const prevBoard = useRef<(string | null)[][]>([]);

  const highlightSet = new Set(
    highlightCells.map(c => `${c.row}-${c.col}`)
  );

  // Detect new blocks and cleared lines
  useEffect(() => {
    if (prevBoard.current.length === 0) {
      prevBoard.current = board.map(row => [...row]);
      return;
    }

    const newCells: string[] = [];
    const clearedCells: string[] = [];

    // Find new blocks (for drop animation)
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const key = `${r}-${c}`;
        const current = board[r][c];
        const prev = prevBoard.current[r]?.[c];

        if (current && !prev) {
          newCells.push(key);
        } else if (!current && prev) {
          clearedCells.push(key);
        }
      }
    }

    // Trigger drop animations for new cells
    if (newCells.length > 0) {
      const newDropAnims = new Map(dropAnimations);
      newCells.forEach(key => {
        const anim = new Animated.Value(-50);
        newDropAnims.set(key, anim);
        Animated.spring(anim, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        }).start(() => {
          newDropAnims.delete(key);
          setDropAnimations(new Map(newDropAnims));
        });
      });
      setDropAnimations(newDropAnims);
    }

    // Trigger clear animations
    if (clearedCells.length > 0) {
      setClearingCells(new Set(clearedCells));
      
      // Show score popup at center of cleared area
      const clearRows = new Set<number>();
      const clearCols = new Set<number>();
      clearedCells.forEach(key => {
        const [r, c] = key.split('-').map(Number);
        clearRows.add(r);
        clearCols.add(c);
      });
      
      const centerRow = Math.floor([...clearRows].reduce((a, b) => a + b, 0) / clearRows.size);
      const centerCol = Math.floor([...clearCols].reduce((a, b) => a + b, 0) / clearCols.size);
      
      const popup: ScorePopup = {
        id: Date.now().toString(),
        x: centerCol * cellSize + cellSize / 2,
        y: centerRow * cellSize,
        score: clearedCells.length * 10,
      };
      
      setScorePopups(prev => [...prev, popup]);
      
      // Remove popup after animation
      setTimeout(() => {
        setScorePopups(prev => prev.filter(p => p.id !== popup.id));
      }, 1000);
      
      // Clear the clearing state after animation
      setTimeout(() => {
        setClearingCells(new Set());
      }, 300);
    }

    prevBoard.current = board.map(row => [...row]);
  }, [board]);

  const renderCell = (cell: string | null, rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    const isHighlighted = highlightSet.has(key);
    const isClearing = clearingCells.has(key);
    const dropAnim = dropAnimations.get(key);

    return (
      <Animated.View
        key={colIndex}
        style={[
          styles.cell,
          {
            width: cellSize,
            height: cellSize,
          },
          dropAnim && {
            transform: [{ translateY: dropAnim }],
          },
          isClearing && styles.clearingCell,
        ]}
      >
        {cell ? (
          <Animated.View 
            style={[
              styles.filledCell,
              { backgroundColor: cell },
              isClearing && styles.clearingBlock,
            ]}
          >
            {/* 3D Effect */}
            <View style={[styles.cellHighlight, { backgroundColor: lightenColor(cell, 25) }]} />
            <View style={[styles.cellShadow, { backgroundColor: darkenColor(cell, 25) }]} />
          </Animated.View>
        ) : (
          <View 
            style={[
              styles.emptyCell,
              isHighlighted && {
                backgroundColor: isValidPlacement 
                  ? 'rgba(76, 175, 80, 0.4)' 
                  : 'rgba(244, 67, 54, 0.4)',
              },
            ]} 
          />
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.boardContainer, { width: BOARD_WIDTH, height: BOARD_WIDTH }]}>
      <View style={styles.board}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
          </View>
        ))}
      </View>
      
      {/* Score Popups */}
      {scorePopups.map(popup => (
        <ScorePopupComponent key={popup.id} popup={popup} />
      ))}
      
      {/* Grid lines overlay */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {Array(boardSize + 1).fill(null).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.horizontalLine,
              { top: i * cellSize },
            ]}
          />
        ))}
        {Array(boardSize + 1).fill(null).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.verticalLine,
              { left: i * cellSize },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// Score popup component with animation
const ScorePopupComponent: React.FC<{ popup: ScorePopup }> = ({ popup }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -60,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.scorePopup,
        {
          left: popup.x - 30,
          top: popup.y,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Text style={styles.scorePopupText}>+{popup.score}</Text>
    </Animated.View>
  );
};

// Helper functions
const lightenColor = (color: string, percent: number): string => {
  try {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgba(${R}, ${G}, ${B}, 0.5)`;
  } catch {
    return 'rgba(255,255,255,0.3)';
  }
};

const darkenColor = (color: string, percent: number): string => {
  try {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgba(${R}, ${G}, ${B}, 0.4)`;
  } catch {
    return 'rgba(0,0,0,0.3)';
  }
};

const styles = StyleSheet.create({
  boardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e1e32',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  board: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
  },
  emptyCell: {
    width: '92%',
    height: '92%',
    backgroundColor: '#2a2a42',
    borderRadius: 4,
  },
  filledCell: {
    width: '92%',
    height: '92%',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  cellHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '40%',
    height: '40%',
    borderRadius: 3,
  },
  cellShadow: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: '40%',
    height: '40%',
    borderRadius: 3,
  },
  clearingCell: {
    transform: [{ scale: 1.1 }],
  },
  clearingBlock: {
    opacity: 0.5,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  scorePopup: {
    position: 'absolute',
    width: 60,
    alignItems: 'center',
  },
  scorePopupText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export const CELL_SIZE = BOARD_WIDTH / 8;
export const BOARD_DIMENSIONS = BOARD_WIDTH;
