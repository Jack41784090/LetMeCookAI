import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  withRepeat, 
  withSequence, 
  withTiming,
  useSharedValue
} from 'react-native-reanimated';
import { Wand as Wand2 } from 'lucide-react-native';

export default function Processing() {
  const { image, style } = useLocalSearchParams<{ image: string; style: string }>();
  const router = useRouter();
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(360, { duration: 1000 }),
        withTiming(0, { duration: 0 })
      ),
      -1
    );

    // Simulate API processing time
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/result',
        params: { image, style }
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Wand2 size={48} color="#007AFF" />
      </Animated.View>
      <Text style={styles.text}>Transforming your photo...</Text>
      <Text style={styles.subText}>This may take a minute</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});