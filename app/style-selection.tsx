import { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const styles = [
  { id: 'vangogh', name: 'Van Gogh', description: 'Post-impressionist style with bold colors and expressive brushstrokes' },
  { id: 'monet', name: 'Monet', description: 'Impressionist style with soft, dreamlike qualities' },
  { id: 'anime', name: 'Anime', description: 'Japanese animation style with vibrant colors' },
  { id: 'pixar', name: 'Pixar', description: '3D animated style with clean, polished look' },
  { id: 'watercolor', name: 'Watercolor', description: 'Soft, flowing watercolor painting style' },
];

export default function StyleSelection() {
  const { image } = useLocalSearchParams<{ image: string }>();
  const router = useRouter();
  const [selectedStyle, setSelectedStyle] = useState('');

  const handleStyleSelect = async (styleId: string) => {
    setSelectedStyle(styleId);
    
    try {
      // Here we would normally make the API call to OpenAI
      // For now, we'll just simulate the process
      router.push({
        pathname: '/processing',
        params: { image, style: styleId }
      });
    } catch (error) {
      console.error('Error processing image:', error);
    }
  };

  return (
    <View style={styleSheet.container}>
      <View style={styleSheet.imageContainer}>
        <Image
          source={{ uri: image }}
          style={styleSheet.image}
          resizeMode="contain"
        />
      </View>

      <Text style={styleSheet.title}>Choose a Style</Text>
      
      <ScrollView style={styleSheet.styleList}>
        {styles.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styleSheet.styleButton,
              selectedStyle === style.id && styleSheet.selectedStyle
            ]}
            onPress={() => handleStyleSelect(style.id)}
          >
            <Text style={styleSheet.styleName}>{style.name}</Text>
            <Text style={styleSheet.styleDescription}>{style.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
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
  },
  selectedStyle: {
    backgroundColor: '#007AFF',
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
});