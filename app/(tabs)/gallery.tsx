import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GalleryScreen() {
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleSelect = async (item: MediaLibrary.Asset) => {
    const info = await MediaLibrary.getAssetInfoAsync(item);
    const uri = info.localUri ?? item.uri;
    router.push({ pathname: '/result', params: { image: uri } });
  };

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setLoading(false);
        return;
      }
      const album = await MediaLibrary.getAlbumAsync('LetMeCookAI');
      if (album) {
        const assets = await MediaLibrary.getAssetsAsync({
          album: album.id,
          mediaType: ['photo'],
          first: 100,
          sortBy: [MediaLibrary.SortBy.creationTime],
        });
        setPhotos(assets.assets);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No photos found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={photos}
      keyExtractor={(item) => item.id}
      numColumns={3}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => handleSelect(item)}>
          <Image source={{ uri: item.uri }} style={styles.photo} />
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.list}
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
    width: '32%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
  },
});