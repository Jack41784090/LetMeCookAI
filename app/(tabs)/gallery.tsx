import { useLocalImages, type LocalImage } from '@/hooks/useLocalImages';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const DEFAULT_NUM_COLUMNS = 2; // Default number of columns for the grid

export default function GalleryScreen() {
  const { images, isLoading, refreshImages } = useLocalImages();
  const router = useRouter();
  const [showEmpty, setShowEmpty] = useState(false);
  const [numColumns, setNumColumns] = useState(DEFAULT_NUM_COLUMNS);
  const { width: windowWidth } = useWindowDimensions();

  // Calculate proper item dimensions based on screen width and number of columns
  const getPhotoStyle = useCallback((columns: number) => {
    const padding = 10; // Total horizontal padding per item
    const spacing = 5 * 2; // Total margin between items (5pt on each side)
    const availableWidth = windowWidth - (padding * 2); // Available width minus container padding
    const itemWidth = (availableWidth / columns) - spacing;
    
    return {
      width: itemWidth,
      height: itemWidth, // Keep 1:1 aspect ratio
      margin: 5,
      borderRadius: 8,
    };
  }, [windowWidth]);
  
  // Adjust columns based on orientation/screen size
  useEffect(() => {
    setNumColumns(DEFAULT_NUM_COLUMNS);
  }, [windowWidth]);

  useEffect(() => {
    if (!isLoading && images.length === 0) {
      setShowEmpty(true);
    } else {
      setShowEmpty(false);
    }
  }, [isLoading, images.length]);

  // Refresh images when component mounts
  useEffect(() => {
    refreshImages();
  }, []);

  const handleSelect = (item: LocalImage) => {
    router.push({ pathname: '/result', params: { image: item.uri, style: item.style } });
  };

  const renderItem = useCallback(({ item }: { item: LocalImage }) => (
    <TouchableOpacity 
      onPress={() => handleSelect(item)}
      style={styles.photoContainer}
    >
      <Image 
        source={{ uri: item.uri }} 
        style={getPhotoStyle(numColumns)} 
        contentFit="cover"
      />
    </TouchableOpacity>
  ), [numColumns, windowWidth]);

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
        {
          showEmpty ? (
            <Text style={styles.text}>No images found</Text>
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )
        }
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        key={`flatlist-${numColumns}`}
        data={images}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onRefresh={refreshImages}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 10,
  },
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
    // Remove any padding that might interfere with our calculated widths
  },
  photoContainer: {
    // Flex properties for item container
    justifyContent: 'center',
    alignItems: 'center',
  },
  // The photo style is now dynamically calculated in the getPhotoStyle function
});