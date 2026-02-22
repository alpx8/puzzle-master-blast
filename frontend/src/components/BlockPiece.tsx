import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Block } from '../store/gameStore';

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
                  backgroundColor: cell === 1 ? color : 'transparent',
                },
                cell === 1 && styles.filledCell,
              ]}
            >
              {cell === 1 && (
                <View style={[styles.cellInner, { backgroundColor: color }]} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
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
    padding: 1,
  },
  filledCell: {
    borderRadius: 4,
  },
  cellInner: {
    width: '85%',
    height: '85%',
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
});
