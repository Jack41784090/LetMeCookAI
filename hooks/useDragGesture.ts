import { Dimensions, LayoutRectangle } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { stylesData } from '../utils/styles-selection/StylesData';

// Screen dimensions
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
  onDragEnd: () => void,
  potLayout: SharedValue<LayoutRectangle | null> // Pass the image container layout
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
      zIndex: isOverPot.value ? 5 : 1,
    }))
  );

  // Create animated style for the pot image overlay
  const potOverlayStyle = useAnimatedStyle(() => ({
    backgroundColor: isOverPot.value 
      ? 'rgba(0, 122, 255, 0.3)' 
      : 'rgba(0, 0, 0, 0.3)',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
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

        // Check if over the pot (image) area using the measured layout
        if (potLayout.value) {
          const pot = potLayout.value;
          
          isOverPot.value =
            event.absoluteX >= pot.x &&
            event.absoluteX <= pot.x + pot.width &&
            event.absoluteY >= pot.y &&
            event.absoluteY <= pot.y + pot.height;
        }
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
    potOverlayStyle,
    createPanGesture,
    isOverPot,
  };
}