import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Image as ImageIcon, SwitchCameraIcon, Wand as Wand2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const router = useRouter();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' && permission?.granted) {
      setCameraType('back');
    }
  }, [permission]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 1,
    });

    if (!result.canceled) {
      router.push({
        pathname: '/style-selection',
        params: { image: result.assets[0].uri }
      });
    }
  };

  const handleTakePicture = async () => {
    if (!cameraRef) return;

    try {
      const photo = await cameraRef.takePictureAsync();
      if (!photo) throw new Error('Failed to take picture');
      router.push({
        pathname: '/style-selection',
        params: { image: photo.uri }
      });
    } catch (error) {
      console.error('Failed to take picture:', error);
    }
  };

  const toggleCameraType = () => {
    if (Platform.OS !== 'web') {
      setCameraType(current => (
        current === ImagePicker.CameraType.back
          ? ImagePicker.CameraType.front
          : ImagePicker.CameraType.back
      ));
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera is not supported on web.</Text>
        <TouchableOpacity style={styles.button} onPress={handlePickImage}>
          <Text style={styles.buttonText}>Select Image from Gallery</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to use the camera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={setCameraRef}
        style={styles.camera}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleCameraType}>
            <SwitchCameraIcon color="white" size={24} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.captureButton}
            onPress={handleTakePicture}>
            <Wand2 color="white" size={32} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePickImage}>
            <ImageIcon color="white" size={24} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    marginHorizontal: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});