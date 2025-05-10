import { useAWSImageService } from '@/hooks/useAWSImageService';
import { saveImageToLocalStorage } from '@/hooks/useLocalImages';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Download, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Result() {
  const { image, style } = useLocalSearchParams<{ image: string; style: string }>();
  const router = useRouter();
  const [savedLocally, setSavedLocally] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const awsService = useAWSImageService();

  // Save the image to local storage and sync with AWS when component mounts
  useEffect(() => {
    const saveAndSync = async () => {
      try {
        // Save locally first
        await saveImageToLocalStorage(image, style);
        setSavedLocally(true);

        // Now try to sync with AWS
        setSyncing(true);
        const localImage = {
          id: Date.now().toString(),
          uri: image,
          timestamp: Date.now(),
          timeRemaining: null,
          style
        };
        
        try {
          await awsService.uploadImageForProcessing(localImage, style);
          console.log('Image successfully synced with AWS');
        } catch (error) {
          console.error('Failed to sync with AWS:', error);
        } finally {
          setSyncing(false);
        }
      } catch (error) {
        console.error('Failed to save image locally:', error);
      }
    };
    saveAndSync();
  }, [image, style, awsService]);

  const handleShare = async () => {
    try {
      await Sharing.shareAsync(image);
    } catch (error) {
      console.error('Error sharing', error);
    }
  };

  const handleSave = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Need permission to save images');
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(image);
      Alert.alert('Success', 'Image saved to device gallery');
    } catch (error) {
      console.error('Error saving image', error);
    }
  };

  const handleNewPhoto = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleShare}>
          <Share2 color="white" size={24} />
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Download color="white" size={24} />
          <Text style={styles.buttonText}>Save to Device</Text>
        </TouchableOpacity>
      </View>

      {savedLocally && (
        <Text style={styles.savedText}>
          Image saved to app's gallery
          {syncing && " (Syncing with cloud...)"}
        </Text>
      )}

      <TouchableOpacity
        style={styles.newPhotoButton}
        onPress={handleNewPhoto}
      >
        <Text style={styles.newPhotoText}>Transform Another Photo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#333',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    width: '45%',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  savedText: {
    color: '#43a047',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  newPhotoButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  newPhotoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});