import { Dimensions } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { stylesData } from '../utils/styles-selection/StylesData';

// Screen dimensions for pot position calculation
const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Position data for a draggable style item
interface StylePosition {
  id: string;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
}

/**
 * Custom hook for drag gesture and animations
 */
export function useDragGesture(
  onAddStyle: (id: string) => void,
  onDragStart: () => void,
  onDragEnd: () => void
) {
  // Shared value to track if item is over pot
  const isOverPot = useSharedValue(false);
  
  // Initialize position shared values for all styles
  const styles = stylesData.getStyles();
  const positions = styles.map(style => ({
    id: style.id,
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
  }));

  // Create animated styles for each position
  const animatedStyles = positions.map(pos =>
    useAnimatedStyle(() => ({
      transform: [
        { translateX: pos.translateX.value },
        { translateY: pos.translateY.value },
      ],
    }))
  );

  // Create animated style for the pot
  const potStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(isOverPot.value ? 1.2 : 1) }],
    opacity: withSpring(isOverPot.value ? 1 : 0.8),
  }));

  // Get position by style id
  const getPosition = (id: string): StylePosition | undefined => {
    return positions.find(p => p.id === id);
  };

  // Create pan gesture for a style
  const createPanGesture = (styleId: string) => {
    const position = getPosition(styleId);
    if (!position) return Gesture.Pan();

    return Gesture.Pan()
      .onBegin(() => {
        runOnJS(onDragStart)();
      })
      .onUpdate(event => {
        position.translateX.value = event.translationX;
        position.translateY.value = event.translationY;

        // Check if over the pot area
        const potArea = {
          x: windowWidth / 2 - 50,
          y: windowHeight - 200,
          width: 100,
          height: 100,
        };

        isOverPot.value =
          event.absoluteX >= potArea.x &&
          event.absoluteX <= potArea.x + potArea.width &&
          event.absoluteY >= potArea.y &&
          event.absoluteY <= potArea.y + potArea.height;
      })
      .onEnd(() => {
        if (isOverPot.value) {
          runOnJS(onAddStyle)(styleId);
        }
        position.translateX.value = withSpring(0);
        position.translateY.value = withSpring(0);
        isOverPot.value = false;
        runOnJS(onDragEnd)();
      });
  };

  return {
    styles,
    animatedStyles,
    potStyle,
    createPanGesture,
  };
}