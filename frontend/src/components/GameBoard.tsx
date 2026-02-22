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

// Colors for row and column clearing effects
const ROW_CLEAR_COLOR = '#00F5A0';
const COL_CLEAR_COLOR = '#FF6B6B';

// Vibrant neon colors for combo levels
const COMBO_COLORS = [
  '#00FF88', // Level 1 - Neon Green
  '#00D4FF', // Level 2 - Neon Cyan
  '#FF00FF', // Level 3 - Neon Magenta
  '#FFD700', // Level 4 - Neon Gold
  '#FF3366', // Level 5 - Neon Red-Pink
  '#9D00FF', // Level 6 - Neon Purple
  '#00FFFF', // Level 7+ - Neon Electric Blue
];

// Pixel font definitions - each letter is a 5x5 grid (1 = filled, 0 = empty)
const PIXEL_FONT: { [key: string]: number[][] } = {
  'C': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  'O': [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ],
  'M': [
    [1,0,0,0,1],
    [1,1,0,1,1],
    [1,0,1,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  'B': [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,1,1,1,0],
  ],
  'G': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,0,1,1,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ],
  'R': [
    [1,1,1,1,0],
    [1,0,0,0,1],
    [1,1,1,1,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
  ],
  'E': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,0],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  'A': [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ],
  'T': [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  'W': [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,1,0,1],
    [1,1,0,1,1],
    [1,0,0,0,1],
  ],
  'S': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [1,1,1,1,1],
  ],
  'N': [
    [1,0,0,0,1],
    [1,1,0,0,1],
    [1,0,1,0,1],
    [1,0,0,1,1],
    [1,0,0,0,1],
  ],
  'I': [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [1,1,1,1,1],
  ],
  'X': [
    [1,0,0,0,1],
    [0,1,0,1,0],
    [0,0,1,0,0],
    [0,1,0,1,0],
    [1,0,0,0,1],
  ],
  '!': [
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,0,0,0],
    [0,0,1,0,0],
  ],
  '0': [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ],
  '1': [
    [0,0,1,0,0],
    [0,1,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,1,1,1,0],
  ],
  '2': [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,1],
  ],
  '3': [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,1,1,1,1],
    [0,0,0,0,1],
    [1,1,1,1,1],
  ],
  '4': [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,0,1],
  ],
  '5': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [1,1,1,1,1],
  ],
  '6': [
    [1,1,1,1,1],
    [1,0,0,0,0],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ],
  '7': [
    [1,1,1,1,1],
    [0,0,0,0,1],
    [0,0,0,1,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ],
  '8': [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ],
  '9': [
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [0,0,0,0,1],
    [1,1,1,1,1],
  ],
};

interface ScorePopup {
  id: string;
  x: number;
  y: number;
  score: number;
}

interface ComboPopup {
  id: string;
  combo: number;
}

interface ClearEffect {
  id: string;
  type: 'row' | 'column';
  index: number;
  color: string;
}

interface FallingCell {
  id: string;
  row: number;
  col: number;
  color: string;
}

interface ParticleEffect {
  id: string;
  x: number;
  y: number;
  color: string;
}

interface GameBoardProps {
  highlightCells?: { row: number; col: number }[];
  isValidPlacement?: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({ 
  highlightCells = [], 
  isValidPlacement = false,
}) => {
  const { board, boardSize, combo } = useGameStore();
  const cellSize = BOARD_WIDTH / boardSize;
  
  const [clearEffects, setClearEffects] = useState<ClearEffect[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [comboPopups, setComboPopups] = useState<ComboPopup[]>([]);
  const [particles, setParticles] = useState<ParticleEffect[]>([]);
  const [fallingCells, setFallingCells] = useState<FallingCell[]>([]);
  const [flashingCells, setFlashingCells] = useState<Map<string, string>>(new Map());
  
  const prevBoard = useRef<(string | null)[][]>([]);
  const prevCombo = useRef(0);

  const highlightSet = new Set(
    highlightCells.map(c => `${c.row}-${c.col}`)
  );

  // Detect combo changes for pixel popup
  useEffect(() => {
    if (combo > prevCombo.current && combo >= 1) {
      const popup: ComboPopup = {
        id: Date.now().toString(),
        combo: combo,
      };
      setComboPopups(prev => [...prev, popup]);
      
      setTimeout(() => {
        setComboPopups(prev => prev.filter(p => p.id !== popup.id));
      }, 2000);
    }
    prevCombo.current = combo;
  }, [combo]);

  // Detect board changes and trigger animations
  useEffect(() => {
    if (prevBoard.current.length === 0) {
      prevBoard.current = board.map(row => [...row]);
      return;
    }

    const newCells: { row: number; col: number; color: string }[] = [];
    const clearedCells: { row: number; col: number; color: string }[] = [];
    const clearedRows = new Set<number>();
    const clearedCols = new Set<number>();

    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c < boardSize; c++) {
        const current = board[r][c];
        const prev = prevBoard.current[r]?.[c];

        if (current && !prev) {
          newCells.push({ row: r, col: c, color: current });
        } else if (!current && prev) {
          clearedCells.push({ row: r, col: c, color: prev });
        }
      }
    }

    // Trigger falling animation for new cells
    if (newCells.length > 0) {
      const newFalling = newCells.map(cell => ({
        id: `fall-${cell.row}-${cell.col}-${Date.now()}`,
        row: cell.row,
        col: cell.col,
        color: cell.color,
      }));
      setFallingCells(newFalling);
      
      setTimeout(() => {
        setFallingCells([]);
      }, 350);
    }

    // Detect full row/column clears
    if (clearedCells.length > 0) {
      for (let r = 0; r < boardSize; r++) {
        const rowCells = clearedCells.filter(c => c.row === r);
        if (rowCells.length === boardSize) {
          clearedRows.add(r);
        }
      }
      
      for (let c = 0; c < boardSize; c++) {
        const colCells = clearedCells.filter(cell => cell.col === c);
        if (colCells.length === boardSize) {
          clearedCols.add(c);
        }
      }
    }

    // Trigger row clear effects
    if (clearedRows.size > 0) {
      const newFlashing = new Map(flashingCells);
      clearedRows.forEach(rowIndex => {
        for (let c = 0; c < boardSize; c++) {
          newFlashing.set(`${rowIndex}-${c}`, ROW_CLEAR_COLOR);
        }
        
        setClearEffects(prev => [...prev, {
          id: `row-${rowIndex}-${Date.now()}`,
          type: 'row',
          index: rowIndex,
          color: ROW_CLEAR_COLOR,
        }]);
      });
      setFlashingCells(newFlashing);
      
      setTimeout(() => {
        setFlashingCells(new Map());
      }, 300);
    }

    // Trigger column clear effects
    if (clearedCols.size > 0) {
      const newFlashing = new Map(flashingCells);
      clearedCols.forEach(colIndex => {
        for (let r = 0; r < boardSize; r++) {
          newFlashing.set(`${r}-${colIndex}`, COL_CLEAR_COLOR);
        }
        
        setClearEffects(prev => [...prev, {
          id: `col-${colIndex}-${Date.now()}`,
          type: 'column',
          index: colIndex,
          color: COL_CLEAR_COLOR,
        }]);
      });
      setFlashingCells(newFlashing);
      
      setTimeout(() => {
        setFlashingCells(new Map());
      }, 300);
    }

    // Generate particles
    if (clearedCells.length > 0) {
      const newParticles: ParticleEffect[] = [];
      clearedCells.forEach(cell => {
        for (let i = 0; i < 4; i++) {
          newParticles.push({
            id: `${cell.row}-${cell.col}-${i}-${Date.now()}`,
            x: cell.col * cellSize + cellSize / 2,
            y: cell.row * cellSize + cellSize / 2,
            color: cell.color,
          });
        }
      });
      setParticles(newParticles);
      
      setTimeout(() => {
        setParticles([]);
      }, 600);

      const linesCleared = clearedRows.size + clearedCols.size;
      
      if (linesCleared > 0) {
        const centerRow = clearedCells.reduce((sum, c) => sum + c.row, 0) / clearedCells.length;
        const centerCol = clearedCells.reduce((sum, c) => sum + c.col, 0) / clearedCells.length;
        
        const popup: ScorePopup = {
          id: Date.now().toString(),
          x: centerCol * cellSize + cellSize / 2,
          y: centerRow * cellSize,
          score: linesCleared * linesCleared * 10,
        };
        
        setScorePopups(prev => [...prev, popup]);
        
        setTimeout(() => {
          setScorePopups(prev => prev.filter(p => p.id !== popup.id));
        }, 1200);
      }
    }

    setTimeout(() => {
      setClearEffects([]);
    }, 500);

    prevBoard.current = board.map(row => [...row]);
  }, [board, boardSize, cellSize]);

  const renderCell = (cell: string | null, rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    const isHighlighted = highlightSet.has(key);
    const flashColor = flashingCells.get(key);
    const isFalling = fallingCells.some(f => f.row === rowIndex && f.col === colIndex);

    return (
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
        {cell ? (
          isFalling ? (
            <FallingCellComponent 
              color={cell} 
              cellSize={cellSize}
            />
          ) : (
            <View 
              style={[
                styles.filledCell,
                { backgroundColor: flashColor || cell },
                flashColor && styles.flashingCell,
              ]}
            >
              <View style={[styles.cellHighlight, { backgroundColor: lightenColor(flashColor || cell, 30) }]} />
              <View style={[styles.cellShadow, { backgroundColor: darkenColor(flashColor || cell, 30) }]} />
            </View>
          )
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
      </View>
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
      
      {/* Clear Line Effects */}
      {clearEffects.map(effect => (
        <ClearLineEffect key={effect.id} effect={effect} cellSize={cellSize} boardSize={boardSize} />
      ))}
      
      {/* Particle Effects */}
      {particles.map(particle => (
        <ParticleComponent key={particle.id} particle={particle} />
      ))}
      
      {/* Score Popups */}
      {scorePopups.map(popup => (
        <ScorePopupComponent key={popup.id} popup={popup} />
      ))}
      
      {/* Pixel Block Combo Popups */}
      {comboPopups.map(popup => (
        <PixelComboPopup key={popup.id} combo={popup.combo} />
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

// Falling Cell Animation
const FallingCellComponent: React.FC<{ color: string; cellSize: number }> = ({ color, cellSize }) => {
  const translateY = useRef(new Animated.Value(-cellSize * 3)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 0.9,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.filledCell,
        { 
          backgroundColor: color,
          transform: [
            { translateY },
            { scale: Animated.multiply(scaleAnim, bounceAnim) },
          ],
        },
      ]}
    >
      <View style={[styles.cellHighlight, { backgroundColor: lightenColor(color, 30) }]} />
      <View style={[styles.cellShadow, { backgroundColor: darkenColor(color, 30) }]} />
    </Animated.View>
  );
};

// Pixel Block Letter Component
const PixelLetter: React.FC<{ 
  letter: string; 
  color: string; 
  blockSize: number;
  delay: number;
}> = ({ letter, color, blockSize, delay }) => {
  const grid = PIXEL_FONT[letter] || PIXEL_FONT['X'];
  const scaleAnims = useRef(grid.flat().map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    const animations = scaleAnims.map((anim, index) => {
      return Animated.sequence([
        Animated.delay(delay + index * 15),
        Animated.spring(anim, {
          toValue: 1,
          friction: 4,
          tension: 150,
          useNativeDriver: true,
        }),
      ]);
    });
    
    Animated.parallel(animations).start();
  }, [delay]);

  return (
    <View style={{ marginHorizontal: 2 }}>
      {grid.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row' }}>
          {row.map((cell, colIndex) => {
            const animIndex = rowIndex * 5 + colIndex;
            return (
              <Animated.View
                key={colIndex}
                style={{
                  width: blockSize,
                  height: blockSize,
                  margin: 0.5,
                  backgroundColor: cell === 1 ? color : 'transparent',
                  borderRadius: 2,
                  transform: [{ scale: cell === 1 ? scaleAnims[animIndex] : 1 }],
                  shadowColor: cell === 1 ? color : 'transparent',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: cell === 1 ? 0.8 : 0,
                  shadowRadius: 4,
                  elevation: cell === 1 ? 4 : 0,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
};

// Pixel Block Combo Popup
const PixelComboPopup: React.FC<{ combo: number }> = ({ combo }) => {
  const containerScale = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const colorIndex = Math.min(combo - 1, COMBO_COLORS.length - 1);
  const color = COMBO_COLORS[colorIndex];

  // Get text based on combo level
  const getText = () => {
    if (combo >= 7) return 'WOW';
    if (combo >= 5) return 'GREAT';
    if (combo >= 3) return 'NICE';
    return 'COMBO';
  };

  const text = getText();
  const comboText = `X${combo}`;
  const blockSize = combo >= 5 ? 5 : 6;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(containerScale, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      combo >= 3 ? Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -3,
            duration: 50,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 4 }
      ) : Animated.timing(shakeAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start();

    // Fade out
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(containerScale, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, 1500);
  }, [combo]);

  return (
    <Animated.View
      style={[
        styles.pixelComboContainer,
        {
          opacity: containerOpacity,
          transform: [
            { scale: containerScale },
            { translateX: shakeAnim },
          ],
        },
      ]}
    >
      {/* Main text made of pixel blocks */}
      <View style={styles.pixelTextRow}>
        {text.split('').map((char, index) => (
          <PixelLetter 
            key={index} 
            letter={char} 
            color={color} 
            blockSize={blockSize}
            delay={index * 50}
          />
        ))}
      </View>
      
      {/* Combo number */}
      <View style={[styles.pixelTextRow, { marginTop: 8 }]}>
        {comboText.split('').map((char, index) => (
          <PixelLetter 
            key={index} 
            letter={char} 
            color={color} 
            blockSize={blockSize + 2}
            delay={text.length * 50 + index * 50}
          />
        ))}
      </View>
    </Animated.View>
  );
};

// Clear Line Effect Component
const ClearLineEffect: React.FC<{ effect: ClearEffect; cellSize: number; boardSize: number }> = ({ 
  effect, 
  cellSize, 
  boardSize 
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isRow = effect.type === 'row';
  const position = effect.index * cellSize;

  return (
    <Animated.View
      style={[
        styles.clearLineEffect,
        {
          backgroundColor: effect.color,
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
          ...(isRow ? {
            top: position,
            left: 0,
            right: 0,
            height: cellSize,
          } : {
            top: 0,
            left: position,
            bottom: 0,
            width: cellSize,
          }),
        },
      ]}
    />
  );
};

// Particle Component
const ParticleComponent: React.FC<{ particle: ParticleEffect }> = ({ particle }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 30 + Math.random() * 40;
    const targetX = Math.cos(angle) * distance;
    const targetY = Math.sin(angle) * distance;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: targetX,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: targetY,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.x - 6,
          top: particle.y - 6,
          backgroundColor: particle.color,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
};

// Score popup component
const ScorePopupComponent: React.FC<{ popup: ScorePopup }> = ({ popup }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.3,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 1000,
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
          left: popup.x - 40,
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
    return `rgba(${R}, ${G}, ${B}, 0.6)`;
  } catch {
    return 'rgba(255,255,255,0.4)';
  }
};

const darkenColor = (color: string, percent: number): string => {
  try {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgba(${R}, ${G}, ${B}, 0.5)`;
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
  },
  emptyCell: {
    width: '96%',
    height: '96%',
    backgroundColor: '#2a2a42',
    borderRadius: 5,
  },
  filledCell: {
    width: '96%',
    height: '96%',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  flashingCell: {
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  cellHighlight: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: '40%',
    height: '40%',
    borderRadius: 4,
  },
  cellShadow: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: '40%',
    height: '40%',
    borderRadius: 4,
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
  clearLineEffect: {
    position: 'absolute',
    opacity: 0.6,
    borderRadius: 4,
  },
  particle: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  scorePopup: {
    position: 'absolute',
    width: 80,
    alignItems: 'center',
  },
  scorePopupText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFD700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  pixelComboContainer: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pixelTextRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const CELL_SIZE = BOARD_WIDTH / 8;
export const BOARD_DIMENSIONS = BOARD_WIDTH;
