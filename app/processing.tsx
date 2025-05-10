import { useAWSImageService } from '@/hooks/useAWSImageService';
import { useLocalImages } from '@/hooks/useLocalImages';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Wand as Wand2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

export default function Processing() {
  const { image, style } = useLocalSearchParams<{ image: string; style: string }>();
  const router = useRouter();
  const rotation = useSharedValue(0);
  const [uploadStatus, setUploadStatus] = useState<string>('Preparing your image...');
  
  // Get AWS image service and local images hooks
  const awsService = useAWSImageService();
  const { images: localImages } = useLocalImages();

  useEffect(() => {
    // Set up rotation animation
    rotation.value = withRepeat(
      withSequence(
        withTiming(360, { duration: 1000 }),
        withTiming(0, { duration: 0 })
      ),
      -1
    );

    // Process the image with AWS
    const processImage = async () => {
      try {
        // Find the image in local storage
        const localImage = localImages.find(img => img.uri === image);
        
        if (!localImage) {
          console.error('Image not found in local storage');
          setUploadStatus('Error finding image. Please try again.');
          return;
        }
        
        setUploadStatus('Uploading to AWS...');
        
        // Upload the image to AWS for processing
        const processedImage = await awsService.uploadImageForProcessing(
          localImage, 
          style
        );
        
        if (processedImage) {
          setUploadStatus('Processing your image...');
          
          // In a real implementation, you would wait for a webhook or poll 
          // for the status to change to 'finished', but for now simulate with a timeout
          setTimeout(() => {
            router.replace({
              pathname: '/result',
              params: { image, style }
            });
          }, 3000);
        } else {
          setUploadStatus('Error uploading image. Please try again.');
          
          // If AWS upload fails, still navigate to result after delay
          // so the user isn't stuck on this screen
          setTimeout(() => {
            router.replace({
              pathname: '/result',
              params: { image, style }
            });
          }, 3000);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        setUploadStatus('Something went wrong. Using local image instead...');
        
        // Navigate to result after a delay even if processing fails
        setTimeout(() => {
          router.replace({
            pathname: '/result',
            params: { image, style }
          });
        }, 3000);
      }
    };
    
    processImage();
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
      <Text style={styles.subText}>{uploadStatus}</Text>
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