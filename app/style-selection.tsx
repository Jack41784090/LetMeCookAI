import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Image, LayoutChangeEvent, Text, TouchableOpacity, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useDragGesture } from '../hooks/useDragGesture';
import { styleSheet } from '../utils/styles-selection/styleSheet';

export default function StyleSelection() {
  const { image } = useLocalSearchParams<{ image: string }>();
  const router = useRouter();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Track the pot's position and dimensions
  const potLayout = useSharedValue<null | {x: number; y: number; width: number; height: number}>(null);
  
  // Handler for adding a style to selection
  const addSelectedStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId) ? prev : [...prev, styleId]
    );
  };

  // Handle measuring the pot (image container)
  const onPotLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    potLayout.value = { x, y, width, height };
  }, [potLayout]);

  // Use our custom hook for drag gesture handling
  const { 
    styles, 
    animatedStyles, 
    potOverlayStyle,
    createPanGesture 
  } = useDragGesture(
    addSelectedStyle,
    () => setIsDragging(true),
    () => setIsDragging(false),
    potLayout
  );

  // Handler for transform button
  const handleTransform = () => {
    if (selectedStyles.length > 0) {
      router.push({
        pathname: '/processing',
        params: {
          image,
          style: selectedStyles.join(','),
        },
      });
    }
  };

  return (
    <GestureHandlerRootView style={styleSheet.container}>
      
      <View style={styleSheet.imageContainer} onLayout={onPotLayout}>
        <View style={styleSheet.potHandleLeft} />
        <View style={styleSheet.potHandleRight} />
        
        <Image
          source={{ uri: image }}
          style={styleSheet.image}
          resizeMode="cover"
        />
        
        <Animated.View style={[styleSheet.imageOverlay, potOverlayStyle]} />
        
        {selectedStyles.length > 0 && (
          <View style={styleSheet.badge}>
            <Text style={styleSheet.badgeText}>{selectedStyles.length}</Text>
          </View>
        )}
      </View>

      <View style={styleSheet.styleList}>
        {styles.map((style, index) => {
          // Create gesture handler for this style
          const gesture = createPanGesture(style.id);
          
          return (
            <GestureDetector key={style.id} gesture={gesture}>
              <Animated.View style={[
                styleSheet.styleButton,
                selectedStyles.includes(style.id) && styleSheet.selectedStyle,
                animatedStyles[index],
              ]}>
                <Sparkles color="#fff" size={20} style={styleSheet.styleIcon} />
                <View>
                  <Text style={styleSheet.styleName}>{style.name}</Text>
                  {/* <Text style={styleSheet.styleDescription}>
                    {style.description}
                  </Text> */}
                </View>
              </Animated.View>
            </GestureDetector>
          );
        })}
      </View>

      {selectedStyles.length > 0 && (
        <TouchableOpacity
          style={styleSheet.transformButton}
          onPress={handleTransform}
        >
          <Text style={styleSheet.transformButtonText}>
            Transform with {selectedStyles.length} style
            {selectedStyles.length > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
    </GestureHandlerRootView>
  );
}