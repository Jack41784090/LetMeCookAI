import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';

// Constants
const IMAGES_DIRECTORY = FileSystem.documentDirectory + 'transformed-images/';

// Types
export interface LocalImage {
  id: string;
  uri: string;
  timestamp: number;
  style?: string;
}

// Helper Functions
export const ensureDirectoryExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIRECTORY);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(IMAGES_DIRECTORY, { intermediates: true });
  }
};

export const saveImageToLocalStorage = async (sourceUri: string, style?: string): Promise<LocalImage> => {
  await ensureDirectoryExists();
  
  const id = Date.now().toString();
  const fileExtension = sourceUri.split('.').pop() || 'jpg';
  const destinationUri = `${IMAGES_DIRECTORY}${id}.${fileExtension}`;
  
  try {
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri
    });
    
    const newImage: LocalImage = {
      id,
      uri: destinationUri,
      timestamp: Date.now(),
      style
    };
    
    // Read existing metadata
    const metadata = await getImagesMetadata();
    metadata.push(newImage);
    
    // Save updated metadata
    await saveImagesMetadata(metadata);
    
    return newImage;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
};

export const getImagesMetadata = async (): Promise<LocalImage[]> => {
  await ensureDirectoryExists();
  
  const metadataPath = IMAGES_DIRECTORY + 'metadata.json';
  const fileExists = await FileSystem.getInfoAsync(metadataPath);
  
  if (!fileExists.exists) {
    await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify([]));
    return [];
  }
  
  try {
    const data = await FileSystem.readAsStringAsync(metadataPath);
    return JSON.parse(data) as LocalImage[];
  } catch (error) {
    console.error('Error reading metadata:', error);
    return [];
  }
};

export const saveImagesMetadata = async (metadata: LocalImage[]) => {
  await ensureDirectoryExists();
  const metadataPath = IMAGES_DIRECTORY + 'metadata.json';
  await FileSystem.writeAsStringAsync(metadataPath, JSON.stringify(metadata));
};

export const deleteLocalImage = async (id: string) => {
  const metadata = await getImagesMetadata();
  const imageToDelete = metadata.find(img => img.id === id);
  
  if (imageToDelete) {
    try {
      await FileSystem.deleteAsync(imageToDelete.uri);
      const updatedMetadata = metadata.filter(img => img.id !== id);
      await saveImagesMetadata(updatedMetadata);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
};

// Hook for accessing images
export const useLocalImages = () => {
  const [images, setImages] = useState<LocalImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const metadata = await getImagesMetadata();
      setImages(metadata.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error('Error loading local images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, []);

  return {
    images,
    isLoading,
    refreshImages: loadImages,
    saveImage: saveImageToLocalStorage,
    deleteImage: deleteLocalImage
  };
};