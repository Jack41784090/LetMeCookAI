import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Image, LayoutChangeEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useDragGesture } from '../hooks/useDragGesture';
import { stylesData } from '../utils/styles-selection/StylesData';
import { styleSheet } from '../utils/styles-selection/styleSheet';

export default function StyleSelection() {
  const { image } = useLocalSearchParams<{ image: string }>();
  const router = useRouter();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Get all available styles
  const allStyles = stylesData.getStyles();
  
  // Filtered styles for top carousel (available styles)
  const availableStyles = allStyles.filter(style => !selectedStyles.includes(style.id));
  
  // Filtered styles for bottom carousel (selected styles)
  const selectedStylesData = allStyles.filter(style => selectedStyles.includes(style.id));
  
  // Track the pot's position and dimensions
  const potLayout = useSharedValue<null | {x: number; y: number; width: number; height: number}>(null);
  
  // Handler for adding a style to selection
  const addSelectedStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId) ? prev : [...prev, styleId]
    );
  };
  
  // Handler for removing a style from selection
  const removeSelectedStyle = (styleId: string) => {
    setSelectedStyles(prev => prev.filter(id => id !== styleId));
  };

  // Handle measuring the pot (image container)
  const onPotLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    potLayout.value = { x, y, width, height };
  }, [potLayout]);

  // Use our custom hook for drag gesture handling
  const { 
    styles: allStylesWithGestures, 
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
  
  // Get animated style for a specific style ID
  const getAnimatedStyleForId = (styleId: string) => {
    const index = allStylesWithGestures.findIndex(s => s.id === styleId);
    return index >= 0 ? animatedStyles[index] : undefined;
  };

  return (
    <GestureHandlerRootView style={styleSheet.container}>
      
      {/* Available Styles Carousel - Fixed Height */}
      <View style={styleSheet.carouselContainer}>
        <Text style={styleSheet.carouselTitle}>Available Styles</Text>
        <View style={{ height: 90 }}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styleSheet.carousel}
          >
            {availableStyles.length === 0 ? (
              <Text style={styleSheet.emptyMessage}>No available styles</Text>
            ) : (
              availableStyles.map(style => {
                // Create gesture handler for this style
                const gesture = createPanGesture(style.id);
                const animStyle = getAnimatedStyleForId(style.id);
                
                return (
                  <GestureDetector key={style.id} gesture={gesture}>
                    <Animated.View style={[
                      styleSheet.styleButton,
                      animStyle,
                    ]}>
                      <Sparkles color="#fff" size={20} style={styleSheet.styleIcon} />
                      <Text numberOfLines={1} style={styleSheet.styleName}>{style.name}</Text>
                    </Animated.View>
                  </GestureDetector>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
      
      {/* Image Pot */}
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

      {/* Selected Styles Carousel - Fixed Height */}
      <View style={styleSheet.carouselContainer}>
        <Text style={styleSheet.carouselTitle}>Selected Styles</Text>
        <View style={{ height: 90 }}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styleSheet.carousel}
          >
            {selectedStylesData.length === 0 ? (
              <Text style={styleSheet.emptyMessage}>
                Drag styles from above into the pot
              </Text>
            ) : (
              selectedStylesData.map(style => (
                <TouchableOpacity 
                  key={style.id}
                  style={[styleSheet.styleButton, styleSheet.selectedStyle]}
                  onPress={() => removeSelectedStyle(style.id)}
                >
                  <Sparkles color="#fff" size={20} style={styleSheet.styleIcon} />
                  <Text numberOfLines={1} style={styleSheet.styleName}>{style.name}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
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