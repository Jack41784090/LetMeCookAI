import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Dimensions, Image, LayoutChangeEvent, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useDragGesture } from '../hooks/useDragGesture';
import { PhysicsStylePot } from '../utils/components/PhysicsStylePot';
import { stylesData } from '../utils/styles-selection/StylesData';
import { styleSheet } from '../utils/styles-selection/styleSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StyleSelection() {
  const { image } = useLocalSearchParams<{ image: string }>();
  const router = useRouter();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  
  const potTranslateX = useSharedValue(0);
  const potOpacity = useSharedValue(1);
  
  const allStyles = stylesData.getStyles();
  const availableStylesData = allStyles.filter(style => !selectedStyles.includes(style.id));  
  const selectedStylesData = allStyles.filter(style => selectedStyles.includes(style.id));  
  const potLayout = useSharedValue<null | {x: number; y: number; width: number; height: number}>(null);
  const potExitAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: potTranslateX.value }],
      opacity: potOpacity.value,
    };
  });
  
  const addSelectedStyle = (styleId: string) => {
    setSelectedStyles(prev => 
      prev.includes(styleId) ? prev : [...prev, styleId]
    );
  };
  const removeSelectedStyle = (styleId: string) => {
    setSelectedStyles(prev => prev.filter(id => id !== styleId));
  };

  const onPotLayout = useCallback((event: LayoutChangeEvent) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    potLayout.value = { x, y, width, height };
  }, [potLayout]);

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

  const navigateToKitchen = useCallback(() => {
    // Replace current screen with gallery (kitchen) tab to prevent back navigation
    router.replace({
      pathname: '/(tabs)/gallery',
      params: {
        image,
        style: selectedStyles.join(','),
      }
    });
  }, [router, image, selectedStyles]);

  const handleCook = useCallback(() => {
    if (selectedStyles.length > 0) {
      // Animate the pot sliding right
      potTranslateX.value = withTiming(SCREEN_WIDTH, { duration: 500 }, () => {
        // Callback after animation is complete
        potOpacity.value = withTiming(0, { duration: 200 });
        runOnJS(navigateToKitchen)();
      });
    }
  }, [selectedStyles, potTranslateX, navigateToKitchen]);
  
  const getAnimatedStyleForId = (styleId: string) => {
    const index = allStylesWithGestures.findIndex(s => s.id === styleId);
    return index >= 0 ? animatedStyles[index] : undefined;
  };

  return (
    <GestureHandlerRootView style={styleSheet.container}>
      <View style={styleSheet.mainContainer}>
        {/* Available Styles Carousel - 20% height */}
        <View style={styleSheet.carouselContainer}>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styleSheet.carousel}
            style={{ alignSelf: 'center', width: '100%' }}
          >
            {availableStylesData.length === 0 ? (
              <Text style={styleSheet.emptyMessage}>No available styles</Text>
            ) : (
              availableStylesData.map(style => {
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
        
        {/* Animated pot container 60% height*/}
        <Animated.View 
          style={[
            { 
              width: '100%',
              flex: 0.6, // Use flex instead of percentage height for more reliable sizing
            }, 
            styleSheet.imageContainer, 
            potExitAnimatedStyle
          ]} 
          onLayout={onPotLayout}
        >  
          <View style={styleSheet.potHandleLeft} />
          <View style={styleSheet.potHandleRight} />
          
          <Image
            source={{ uri: image }}
            style={styleSheet.image}
            resizeMode="cover"
          />
          
          <Animated.View style={[styleSheet.imageOverlay, potOverlayStyle]} />
          
          {/* Physics-based style circles */}
          <PhysicsStylePot
            imageUri={image}
            selectedStyles={selectedStyles}
            onRemoveStyle={removeSelectedStyle}
            containerStyle={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          
          {selectedStyles.length > 0 && (
            <View style={styleSheet.badge}>
              <Text style={styleSheet.badgeText}>{selectedStyles.length}</Text>
            </View>
          )}
        </Animated.View>

        {/* Cook button - 20% height */}
        <View style={{flex: 0.2, justifyContent: 'center', alignItems: 'center'}}>
          {selectedStyles.length > 0 ? (
            <TouchableOpacity
              style={[styleSheet.transformButton]}
              onPress={handleCook}
            >
              <Text style={styleSheet.transformButtonText}>
                COOK
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styleSheet.emptyButtonSpace} />
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}