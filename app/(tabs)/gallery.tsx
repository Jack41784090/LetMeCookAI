import { useLocalImages, type LocalImage } from '@/hooks/useLocalImages';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GalleryScreen() {
  const { images, isLoading, refreshImages } = useLocalImages();
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(true);

  // Refresh images when component mounts and when it becomes visible
  useEffect(() => {
    refreshImages();
    
    // This will run when the component mounts (becomes visible)
    setIsFocused(true);
    
    return () => {
      // This will run when component unmounts (becomes invisible)
      setIsFocused(false);
    };
  }, [refreshImages]);

  const handleSelect = (item: LocalImage) => {
    router.push({ pathname: '/result', params: { image: item.uri, style: item.style } });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (images.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No transformed images yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={images}
      keyExtractor={(item) => item.id}
      numColumns={1}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handleSelect(item)}>
          <Image source={{ uri: item.uri }} style={styles.photo} />
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.list}
      onRefresh={refreshImages}
      refreshing={isLoading}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  text: {
    color: '#888',
    fontSize: 18,
  },
  list: {
    padding: 5,
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    marginVertical: 8,
    borderRadius: 8,
  },
});