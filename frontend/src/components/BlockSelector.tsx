import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Block, useGameStore } from '../store/gameStore';
import { BlockPiece } from './BlockPiece';
import { BOARD_DIMENSIONS } from './GameBoard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface BlockSelectorProps {
  onDragStart?: (block: Block) => void;
  onDragMove?: (block: Block, x: number, y: number) => void;
  onDragEnd?: (block: Block, x: number, y: number) => void;
  boardRef?: React.RefObject<View>;
}

export const BlockSelector: React.FC<BlockSelectorProps> = ({
  onDragStart,
  onDragMove,
  onDragEnd,
  boardRef,
}) => {
  const { availableBlocks } = useGameStore();
  const [draggingBlock, setDraggingBlock] = useState<Block | null>(null);
  const dragPosition = useRef(new Animated.ValueXY()).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });

  const createPanResponder = (block: Block, index: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        setDraggingBlock(block);
        setDragStartPosition({ x: pageX, y: pageY });
        dragPosition.setValue({ x: 0, y: 0 });
        
        Animated.spring(dragScale, {
          toValue: 1.2,
          useNativeDriver: true,
        }).start();
        
        onDragStart?.(block);
      },
      
      onPanResponderMove: (evt, gestureState) => {
        dragPosition.setValue({ x: gestureState.dx, y: gestureState.dy });
        const currentX = dragStartPosition.x + gestureState.dx;
        const currentY = dragStartPosition.y + gestureState.dy;
        onDragMove?.(block, currentX, currentY);
      },
      
      onPanResponderRelease: (evt, gestureState) => {
        const currentX = dragStartPosition.x + gestureState.dx;
        const currentY = dragStartPosition.y + gestureState.dy;
        
        Animated.spring(dragScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
        
        onDragEnd?.(block, currentX, currentY);
        setDraggingBlock(null);
        dragPosition.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderTerminate: () => {
        setDraggingBlock(null);
        dragPosition.setValue({ x: 0, y: 0 });
        Animated.spring(dragScale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      },
    });
  };

  const panResponders = useRef(
    availableBlocks.map((block, index) => createPanResponder(block, index))
  );

  // Update pan responders when blocks change
  React.useEffect(() => {
    panResponders.current = availableBlocks.map((block, index) => 
      createPanResponder(block, index)
    );
  }, [availableBlocks]);

  return (
    <View style={styles.container}>
      <View style={styles.blocksRow}>
        {availableBlocks.map((block, index) => {
          const isDragging = draggingBlock?.id === block.id;
          const panResponder = panResponders.current[index];
          
          return (
            <Animated.View
              key={block.id}
              style={[
                styles.blockWrapper,
                isDragging && {
                  transform: [
                    { translateX: dragPosition.x },
                    { translateY: dragPosition.y },
                    { scale: dragScale },
                  ],
                  zIndex: 1000,
                },
              ]}
              {...panResponder?.panHandlers}
            >
              <View style={styles.blockContainer}>
                <BlockPiece 
                  block={block} 
                  cellSize={24}
                  opacity={isDragging ? 0.8 : 1}
                />
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: 'rgba(30, 30, 50, 0.9)',
    borderRadius: 16,
    marginTop: 12,
  },
  blocksRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 100,
  },
  blockWrapper: {
    padding: 8,
  },
  blockContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 12,
    minWidth: 80,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
