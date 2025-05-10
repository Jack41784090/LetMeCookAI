import { Schema } from "@/amplify/data/resource";
import { LocalImage, useLocalImages } from "@/hooks/useLocalImages";
import { generateClient } from "aws-amplify/api";
import { getUrl, uploadData } from "aws-amplify/storage";
import * as FileSystem from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from "react";

// Define the ProcessingImage interface that extends LocalImage
export interface ProcessingImage extends LocalImage {
  status: 'cooking' | 'queued' | 'finished';
  timeRemaining: number | null;
}

/**
 * Hook for AWS image service integration
 */
export const useAWSImageService = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { images: localImages } = useLocalImages();
  
  const cachedImages = useRef<ProcessingImage[]>([]);
  const initialFetchDone = useRef(false);
  
  // Generate the Amplify Data client
  const client = generateClient<Schema>();

  /**
   * Get images with their processing status from AWS
   */
  const getImagesWithStatus = useCallback(async (): Promise<ProcessingImage[]> => {
    if (cachedImages.current.length > 0 && initialFetchDone.current) {
      return cachedImages.current;
    }
    
    setIsConnecting(true);
    setError(null);
    
    try {
      // Fetch images from the AWS database
      const response = await client.models.ProcessedImage.list();
      const dbImages = response.data;
      
      // Map database records to ProcessingImage objects
      const processedImages: ProcessingImage[] = await Promise.all(
        dbImages.map(async (dbImage) => {
          // Get presigned URL for the image stored in S3
          let imageUri = dbImage.uri;
          
          // If the URI is an S3 key (not a full URL), get a presigned URL
          if (!imageUri?.startsWith('http')) {
            try {
              const result = await getUrl({
                path: dbImage.uri,
                options: {
                  expiresIn: 3600, // URL expiration in seconds (1 hour)
                  validateObjectExistence: true,
                }
              });
              imageUri = result.url.toString();
            }
            catch (err) {
              console.error('Error getting image URL:', err);
            }
          }
          
          return {
            id: dbImage.id,
            uri: imageUri,
            timestamp: dbImage.timestamp,
            style: dbImage.style,
            status: dbImage.status as 'cooking' | 'queued' | 'finished',
            timeRemaining: dbImage.timeRemaining,
          };
        })
      );
      
      // Store in cache
      cachedImages.current = processedImages;
      initialFetchDone.current = true;
      
      return processedImages;
    }
    catch (err) {
      setError(err instanceof Error ? err : new Error('Error fetching images from AWS'));
      console.error('Error fetching images from AWS:', err);
      
      // Fallback to local images if AWS fetch fails
      if (localImages.length > 0) {
        const processedLocalImages = localImages.map(img => ({
          ...img,
          status: 'finished' as const,
          timeRemaining: null,
        }));
        cachedImages.current = processedLocalImages;
        return processedLocalImages;
      }
      
      return [];
    }
    finally {
      setIsConnecting(false);
    }
  }, [client.models.ProcessedImage, localImages]);

  /**
   * Upload a new image to AWS for processing
   */
  const uploadImageForProcessing = useCallback(async (
    image: LocalImage, 
    style: string | null
  ): Promise<ProcessingImage | null> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // 1. Upload the image file to S3
      const imageData = await FileSystem.readAsStringAsync(image.uri, { encoding: FileSystem.EncodingType.Base64 });
      const imageKey = `images/${Date.now()}-${image.id}.jpg`;
      
      // Upload the file to S3
      await uploadData({
        path: imageKey,
        data: imageData,
        options: {
          contentType: 'image/jpeg'
        }
      });
      
      // 2. Create a database record for the image
      const processedImage = await client.models.ProcessedImage.create({
        uri: imageKey, // Store the S3 key
        timestamp: image.timestamp,
        status: 'queued',
        style,
        timeRemaining: 0
      });

      if (!processedImage.data) {
        throw new Error('Failed to create image record in AWS');
      }
      
      // 3. Return the newly created processed image
      const newImage: ProcessingImage = {
        id: processedImage.data.id,
        uri: image.uri, // Use local URI for immediate display
        timestamp: image.timestamp,
        style: style ?? null,
        status: 'queued',
        timeRemaining: 0
      };
      
      // Update the cache with the new image
      cachedImages.current = [newImage, ...cachedImages.current];
      
      return newImage;
    }
    catch (err) {
      setError(err instanceof Error ? err : new Error('Error uploading image to AWS'));
      console.error('Error uploading image to AWS:', err);
      return null;
    }
    finally {
      setIsConnecting(false);
    }
  }, [client.models.ProcessedImage]);

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
      // 1. Get existing images from AWS
      const awsImages = await getImagesWithStatus();
      
      // 2. Find local images that don't exist in AWS
      const localOnlyImages = localImages.filter(
        localImg => !awsImages.some(awsImg => awsImg.id === localImg.id)
      );
      
      // 3. Upload local-only images to AWS
      for (const localImage of localOnlyImages) {
        await uploadImageForProcessing(localImage, localImage.style);
      }
      
      // 4. Refresh the list of AWS images
      return getImagesWithStatus();
    }
    catch (err) {
      setError(err instanceof Error ? err : new Error('Error syncing images with AWS'));
      console.error('Error syncing images with AWS:', err);
      return [];
    }
    finally {
      setIsConnecting(false);
    }
  }, [getImagesWithStatus, uploadImageForProcessing]);

  /**
   * Delete an image from AWS database
   */
  const deleteImage = useCallback(async (id: string): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Get the image record to find the S3 key
      const imageResult = await client.models.ProcessedImage.get({ id });
      const imageRecord = imageResult.data;
      
      if (imageRecord) {
        // Delete the S3 object if it's an S3 key (not a local file URI)
        if (imageRecord.uri && !imageRecord.uri.startsWith('file://')) {
          try {
            // Remove the file from S3
            // Note: Requires implementing the deleteObject function from Amplify Storage
            // await Storage.remove(imageRecord.uri);
            console.log('Deleting S3 object:', imageRecord.uri);
          } catch (s3Error) {
            console.error('Failed to delete S3 object:', s3Error);
          }
        }
        
        // Delete the database record
        await client.models.ProcessedImage.delete({ id });
        
        // Update the cache
        cachedImages.current = cachedImages.current.filter(img => img.id !== id);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error deleting image from AWS'));
      console.error('Error deleting image from AWS:', err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [client.models.ProcessedImage]);

  // Invalidate cache when component unmounts or dependencies change
  useEffect(() => {
    return () => {
      cachedImages.current = [];
      initialFetchDone.current = false;
    };
  }, [client]);

  return {
    isConnecting,
    error,
    getImagesWithStatus,
    uploadImageForProcessing,
    syncLocalImagesWithAWS,
    deleteImage
  };
};