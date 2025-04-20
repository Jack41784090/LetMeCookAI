import { useLocalSearchParams, useRouter } from 'expo-router';
import { CookingPot, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

const styles = [
  {
    id: 'vangogh',
    name: 'Van Gogh',
    description:
      'Post-impressionist style with bold colors and expressive brushstrokes',
  },
  {
    id: 'monet',
    name: 'Monet',
    description: 'Impressionist style with soft, dreamlike qualities',
  },
  {
    id: 'anime',
    name: 'Anime',
    description: 'Japanese animation style with vibrant colors',
  },
  {
    id: 'pixar',
    name: 'Pixar',
    description: '3D animated style with clean, polished look',
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    description: 'Soft, flowing watercolor painting style',
  },
];

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

export default function StyleSelection() {
  const { image } = useLocalSearchParams<{ image: string }>();
  const router = useRouter();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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

  const isOverPot = useSharedValue(false);

  const createStyleGesture = (styleId: string) => {
    return Gesture.Pan()
      .onBegin(() => {
        runOnJS(setIsDragging)(true);
      })
      .onUpdate((event) => {
        // Check if over the pot (bottom center of screen)
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
          runOnJS(setSelectedStyles)((prev) =>
            prev.includes(styleId) ? prev : [...prev, styleId]
          );
        }
        isOverPot.value = false;
        runOnJS(setIsDragging)(false);
      });
  };

  const potStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isOverPot.value ? 1.2 : 1),
        },
      ],
      opacity: withSpring(isOverPot.value ? 1 : 0.8),
    };
  });

  return (
    <GestureHandlerRootView style={styleSheet.container}>
      <View style={styleSheet.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styleSheet.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styleSheet.title}>Drag styles into the pot</Text>

      <View style={styleSheet.styleList}>
        {styles.map((style) => (
          <GestureDetector
            key={style.id}
            gesture={createStyleGesture(style.id)}
          >
            <Animated.View
              style={[
                styleSheet.styleButton,
                selectedStyles.includes(style.id) && styleSheet.selectedStyle,
              ]}
            >
              <Sparkles color="#fff" size={20} style={styleSheet.styleIcon} />
              <View>
                <Text style={styleSheet.styleName}>{style.name}</Text>
                <Text style={styleSheet.styleDescription}>
                  {style.description}
                </Text>
              </View>
            </Animated.View>
          </GestureDetector>
        ))}
      </View>

      <Animated.View style={[styleSheet.potContainer, potStyle]}>
        <CookingPot color="#fff" size={48} />
        {selectedStyles.length > 0 && (
          <View style={styleSheet.badge}>
            <Text style={styleSheet.badgeText}>{selectedStyles.length}</Text>
          </View>
        )}
      </Animated.View>

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

const styleSheet = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#000',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  styleList: {
    flex: 1,
  },
  styleButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedStyle: {
    backgroundColor: '#1e4d8f',
    opacity: 0.8,
  },
  styleIcon: {
    marginRight: 10,
  },
  styleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  styleDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  potContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#333',
    borderRadius: 30,
    padding: 20,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  transformButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  transformButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});