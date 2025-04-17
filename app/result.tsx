import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Download, Share2 } from 'lucide-react-native';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Result() {
  const { image } = useLocalSearchParams<{ image: string }>();
  const router = useRouter();

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
      let album = await MediaLibrary.getAlbumAsync('LetMeCookAI');
      if (!album) {
        await MediaLibrary.createAlbumAsync('LetMeCookAI', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album.id, false);
      }
      Alert.alert('Success', 'Image saved to gallery');
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
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>

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