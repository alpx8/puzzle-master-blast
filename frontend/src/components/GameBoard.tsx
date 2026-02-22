import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useGameStore } from '../store/gameStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_PADDING = 16;
const BOARD_WIDTH = Math.min(SCREEN_WIDTH - BOARD_PADDING * 2, 360);

interface GameBoardProps {
  highlightCells?: { row: number; col: number }[];
  isValidPlacement?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  highlightCells = [], 
  isValidPlacement = false 
}) => {
  const { board, boardSize } = useGameStore();
  const cellSize = BOARD_WIDTH / boardSize;

  const highlightSet = new Set(
    highlightCells.map(c => `${c.row}-${c.col}`)
  );

  return (
    <View style={[styles.boardContainer, { width: BOARD_WIDTH, height: BOARD_WIDTH }]}>
      <View style={styles.board}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isHighlighted = highlightSet.has(`${rowIndex}-${colIndex}`);
              
              return (
                <View
                  key={colIndex}
                  style={[
                    styles.cell,
                    {
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: cell || '#2d2d44',
                    },
                    isHighlighted && {
                      backgroundColor: isValidPlacement 
                        ? 'rgba(76, 175, 80, 0.5)' 
                        : 'rgba(244, 67, 54, 0.5)',
                    },
                  ]}
                >
                  {cell && (
                    <View style={[styles.cellInner, { backgroundColor: cell }]} />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      
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
  cellInner: {
    width: '90%',
    height: '90%',
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
});

export const CELL_SIZE = BOARD_WIDTH / 8;
export const BOARD_DIMENSIONS = BOARD_WIDTH;
