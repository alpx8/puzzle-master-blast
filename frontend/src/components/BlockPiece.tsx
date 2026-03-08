import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Block } from '@/src/store/gameStore';
import { useSkinsStore } from '@/src/store/skinsStore';

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
  const { skins, activeSkin } = useSkinsStore();
  const currentSkin = skins.find(s => s.id === activeSkin);
  const hasGlow = currentSkin?.glow || false;

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
                      width: cellSize - 1,
                      height: cellSize - 1,
                      borderRadius: cellSize * 0.18,
                    },
                    hasGlow && {
                      shadowColor: color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 6,
                      elevation: 8,
                    }
                  ]}
                >
                  {/* Glossy highlight - top left */}
                  <View 
                    style={[
                      styles.glossTop, 
                      { 
                        backgroundColor: lightenColor(color, 50),
                        borderRadius: cellSize * 0.12,
                      }
                    ]} 
                  />
                  {/* Inner shine */}
                  <View 
                    style={[
                      styles.innerShine, 
                      { 
                        backgroundColor: lightenColor(color, 25),
                        borderRadius: cellSize * 0.1,
                      }
                    ]} 
                  />
                  {/* Bottom shadow for 3D depth */}
                  <View 
                    style={[
                      styles.bottomShadow, 
                      { 
                        backgroundColor: darkenColor(color, 40),
                        borderRadius: cellSize * 0.1,
                      }
                    ]} 
                  />
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
  try {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  } catch {
    return color;
  }
};

const darkenColor = (color: string, percent: number): string => {
  try {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  } catch {
    return color;
  }
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
    overflow: 'hidden',
    position: 'relative',
  },
  glossTop: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '40%',
    height: '30%',
    opacity: 0.6,
  },
  innerShine: {
    position: 'absolute',
    top: '15%',
    left: '15%',
    width: '70%',
    height: '70%',
    opacity: 0.2,
  },
  bottomShadow: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: '50%',
    height: '35%',
    opacity: 0.5,
  },
});
