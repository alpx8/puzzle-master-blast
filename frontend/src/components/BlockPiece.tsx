import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Block } from '@/src/store/gameStore';

interface BlockPieceProps {
  block: Block;
  cellSize?: number;
  opacity?: number;
}

export const BlockPiece: React.FC<BlockPieceProps> = ({ 
  block, 
  cellSize = 30,
  opacity = 1 
}) => {
  const { shape, color } = block;

  return (
    <View style={[styles.container, { opacity }]}>
      {shape.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => (
            <View
              key={colIndex}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                },
              ]}
            >
              {cell === 1 && (
                <View 
                  style={[
                    styles.block,
                    { 
                      backgroundColor: color,
                      width: cellSize - 2,
                      height: cellSize - 2,
                    }
                  ]}
                >
                  {/* Inner highlight for 3D effect */}
                  <View style={[styles.highlight, { backgroundColor: lightenColor(color, 30) }]} />
                  <View style={[styles.shadow, { backgroundColor: darkenColor(color, 30) }]} />
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

// Helper functions for 3D effect
const lightenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `rgb(${R}, ${G}, ${B})`;
};

const darkenColor = (color: string, percent: number): string => {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `rgb(${R}, ${G}, ${B})`;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  block: {
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: '50%',
    bottom: '50%',
    borderRadius: 4,
    opacity: 0.4,
  },
  shadow: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    left: '50%',
    top: '50%',
    borderRadius: 4,
    opacity: 0.3,
  },
});
