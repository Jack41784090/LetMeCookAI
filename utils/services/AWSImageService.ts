import { LocalImage, useLocalImages } from "@/hooks/useLocalImages";
import { useCallback, useRef, useState } from "react";

// Define the ProcessingImage interface that extends LocalImage
export interface ProcessingImage extends LocalImage {
  status: 'cooking' | 'queued' | 'finished';
  timeRemaining?: number;
}

/**
 * Hook for AWS image service integration
 * This is currently a placeholder that will be implemented when connecting to AWS
 */
export const useAWSImageService = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Move useLocalImages to the top level of the component
  const { images: localImages } = useLocalImages();
  // Cache for processed images to maintain stability
  const cachedImages = useRef<ProcessingImage[]>([]);
  // Track if the initial fetch is done
  const initialFetchDone = useRef(false);

  /**
   * Get images with their processing status from AWS
   * This will be implemented to fetch data from AWS database
   */
  const getImagesWithStatus = useCallback(async (): Promise<ProcessingImage[]> => {
    // If we already have fetched images and this isn't the first load,
    // return the cached version to avoid constant refreshing
    if (cachedImages.current.length > 0 && initialFetchDone.current) {
      return cachedImages.current;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // TODO: Replace with actual AWS API calls
      // Example API call would be:
      // const response = await API.graphql(graphqlOperation(listImages, { filter: { userId: { eq: currentUserId } } }));
      // return response.data.listImages.items;
      
      // Use a deterministic way to assign statuses instead of completely random
      // This ensures more stability between renders
      const processedImages = localImages.map((i, index) => {
        // Assign status based on the image's index for consistency
        let status: 'cooking' | 'queued' | 'finished';
        
        // Check if we already have this image in our cache
        const existingImage = cachedImages.current.find(img => img.id === i.id);
        if (existingImage) {
          // Keep its existing status
          return existingImage;
        }
        
        // For new images, assign a status based on index
        if (index % 5 === 0) status = 'cooking';
        else if (index % 5 === 1) status = 'queued';
        else status = 'finished';
        
        return {
          ...i,
          status,
          timeRemaining: status === 'cooking' ? 3 : 0
        };
      });
      
      // Store in cache
      cachedImages.current = processedImages;
      initialFetchDone.current = true;
      
      return processedImages;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error fetching images from AWS'));
      console.error('Error fetching images from AWS:', err);
      return cachedImages.current;
    } finally {
      setIsConnecting(false);
    }
  }, [localImages]);

  /**
   * Upload a new image to AWS for processing
   */
  const uploadImageForProcessing = useCallback(async (
    image: LocalImage, 
    style?: string
  ): Promise<ProcessingImage | null> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // TODO: Replace with actual AWS API calls
      // Example of what this would do:
      // 1. Upload image to S3
      // 2. Create record in DynamoDB
      // 3. Trigger Lambda for processing
      
      // For now, just return a mock object
      return null;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error uploading image to AWS'));
      console.error('Error uploading image to AWS:', err);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /**
   * Sync local images with AWS database
   * Upload local images that don't exist in AWS yet
   */
  const syncLocalImagesWithAWS = useCallback(async (
    localImages: LocalImage[]
  ): Promise<ProcessingImage[]> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // TODO: Replace with actual AWS API calls
      // 1. Get existing images from AWS
      const awsImages = await getImagesWithStatus();
      
      // 2. Find local images that don't exist in AWS
      const localOnlyImages = localImages.filter(
        localImg => !awsImages.some(awsImg => awsImg.id === localImg.id)
      );
      
      // 3. Upload local-only images to AWS
      // This would be implemented when connected to AWS
      
      return awsImages;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error syncing images with AWS'));
      console.error('Error syncing images with AWS:', err);
      return [];
    } finally {
      setIsConnecting(false);
    }
  }, [getImagesWithStatus]);

  /**
   * Delete an image from AWS database
   */
  const deleteImage = useCallback(async (id: string): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // TODO: Replace with actual AWS API calls
      // Example API call would be:
      // await API.graphql(graphqlOperation(deleteImage, { input: { id } }));
      // await Storage.remove(`images/${id}`);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error deleting image from AWS'));
      console.error('Error deleting image from AWS:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return {
    isConnecting,
    error,
    getImagesWithStatus,
    uploadImageForProcessing,
    syncLocalImagesWithAWS,
    deleteImage
  };
};