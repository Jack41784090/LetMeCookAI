import { ProcessingImage, useAWSImageService } from '@/hooks/useAWSImageService';
import { useLocalImages } from '@/hooks/useLocalImages';
import { PhysicsStylePot } from '@/utils/components/PhysicsStylePot';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, GalleryHorizontal, PanelTop, TicketCheck, Wand2 } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const DEFAULT_PADDING = 10;
const SERVER_REFRESH_INTERVAL = 10000; // 10 seconds

// Debug utility for consistent logging
const DEBUG = {
  log: (component: string, message: string, data?: any) => {
    console.log(`[${component}] ${message}`, data !== undefined ? data : '');
  }
};

export default function GalleryScreen() {
  DEBUG.log('GalleryScreen', 'Component initializing');
  
  const { images: localImages, isLoading, refreshImages, syncImagesWithServer } = useLocalImages();
  const awsService = useAWSImageService();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cooking' | 'gallery'>('cooking');
  const [userImages, setUserImages] = useState<ProcessingImage[]>([]);
  const [displayImages, setDisplayImages] = useState<ProcessingImage[]>([]);
  const [awsImagesLoaded, setAwsImagesLoaded] = useState(false);
  
  const shouldReloadImages = useRef(true);
  const serverRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevProcessedImagesRef = useRef<ProcessingImage[]>([]);
  
  DEBUG.log('GalleryScreen', 'Initial state', { 
    localImagesCount: localImages.length, 
    isLoading, 
    activeTab 
  });
  
  // Load images from both local storage and AWS
  const loadAllImages = useCallback(async () => {
    DEBUG.log('loadAllImages', 'Function called, should reload?', shouldReloadImages.current);
    
    if (!shouldReloadImages.current) {
      DEBUG.log('loadAllImages', 'Skipping reload, flag is false');
      return;
    }
    
    try {
      DEBUG.log('loadAllImages', 'Fetching AWS images with status');
      // Get AWS images with their status
      const awsImages = await awsService.getImagesWithStatus();
      DEBUG.log('loadAllImages', 'AWS images received', { count: awsImages.length });
      
      // Extract server image IDs for synchronization
      const serverImageIds = awsImages.map(img => img.id);
      DEBUG.log('loadAllImages', 'Server image IDs', { ids: serverImageIds });
      
      // Synchronize local storage with server data
      // Delete local images that don't exist on the server
      const deletedCount = await syncImagesWithServer(serverImageIds);
      
      if (deletedCount > 0) {
        // Refresh local images after sync
        await refreshImages();
        DEBUG.log('loadAllImages', `Refreshed local images after deleting ${deletedCount} not on server`);
      }
      
      // Server data is the source of truth
      setUserImages(awsImages);
      setAwsImagesLoaded(true);
      shouldReloadImages.current = false;
    } catch (error) {
      DEBUG.log('loadAllImages', 'Error loading images', {
        error,
        awsError: awsService.error
      });

      // Fallback to local images if server is unavailable
      const localImagesWithStatus = localImages.map(img => ({
        ...img, status: 'finished' as const, timeRemaining: 0,
      }));
      DEBUG.log('loadAllImages', 'Fallback to local images', { count: localImagesWithStatus.length });
      
      setUserImages(localImagesWithStatus);
      setAwsImagesLoaded(true);
      shouldReloadImages.current = false;
    }
  }, [awsService, localImages, refreshImages, syncImagesWithServer]);

  // Setup effects
  useEffect(() => {
    DEBUG.log('ServerRefreshEffect', 'Effect running', { isLoading });
    
    // Skip when loading
    if (isLoading) {
      DEBUG.log('ServerRefreshEffect', 'Loading images, skipping timer setup');
      return;
    }

    DEBUG.log('ServerRefreshEffect', 'Performing initial image load');
    shouldReloadImages.current = true;
    loadAllImages();
    
    // Setup the timer for subsequent refreshes
    if (!serverRefreshTimerRef.current) {
      DEBUG.log('ServerRefreshEffect', `Setting up server refresh timer: ${SERVER_REFRESH_INTERVAL}ms`);
      serverRefreshTimerRef.current = setInterval(() => {
        DEBUG.log('ServerRefreshEffect', 'Timer fired, triggering image reload');
        shouldReloadImages.current = true;
        loadAllImages();
      }, SERVER_REFRESH_INTERVAL);
    }
    
    // Cleanup timer
    return () => {
      if (serverRefreshTimerRef.current) {
        DEBUG.log('ServerRefreshEffect', 'Cleaning up server refresh timer');
        clearInterval(serverRefreshTimerRef.current);
        serverRefreshTimerRef.current = null;
      }
    };
  }, [isLoading, loadAllImages]);

  // Client-side timer effect - updates every second
  useEffect(() => {
    DEBUG.log('InitialRefresh', 'Refreshing images');
    refreshImages(); 

    DEBUG.log('ClientTimerEffect', 'Timer effect initializing');    
    const interval = setInterval(() => {
      DEBUG.log('ClientTimerEffect', 'Timer tick');
      
      setDisplayImages(prevImages => {
        // Check for cooking images on every tick
        const cookingImages = prevImages.filter(img => img.status === 'cooking');
        
        if (cookingImages.length === 0) {
          DEBUG.log('ClientTimerEffect', 'No cooking images found on tick, nothing to update');
          return prevImages; // No changes
        }
        
        DEBUG.log('ClientTimerEffect', `Found ${cookingImages.length} cooking images to update`);
        
        // Clone the array to avoid direct state mutations
        const updatedImages = [...prevImages];
        let updated = false;
        let updatedImagesInfo: { id: string; oldTime: number; newTime: number; }[] = [];
        
        // Update all cooking images timeRemaining
        updatedImages.forEach((img, i) => {
          if (img.status === 'cooking' && img.timeRemaining && img.timeRemaining > 0) {
            const oldTime = img.timeRemaining;
            updatedImages[i].timeRemaining = oldTime - 1;
            updated = true;
            updatedImagesInfo.push({
              id: img.id, 
              oldTime,
              newTime: updatedImages[i].timeRemaining
            });
          }
        });
        
        if (updated) {
          DEBUG.log('ClientTimerEffect', 'Updated images', updatedImagesInfo);
          return updatedImages;
        } else {
          DEBUG.log('ClientTimerEffect', 'No images had time remaining > 0');
          return prevImages;
        }
      });
    }, 1000);

    DEBUG.log('ClientTimerEffect', 'Timer started - will check for cooking images on each tick');
    
    // Clean up interval on unmount
    return () => {
      DEBUG.log('ClientTimerEffect', 'Cleaning up timer');
      clearInterval(interval);
    };
  }, []); // Empty dependency array ensures timer only starts once

  // Sync server state to client display state
  useEffect(() => {
    DEBUG.log('ServerSyncEffect', 'Effect running', {
      processedImagesCount: userImages.length
    });
    
    if (userImages.length === 0) {
      DEBUG.log('ServerSyncEffect', 'Skipping, initial conditions not met');
      return;
    }
    
    // Check if processedImages has actually changed in a meaningful way
    const hasChanged = userImages.some((serverImage, index) => {
      const prevImage = prevProcessedImagesRef.current[index];
      const changed = !prevImage || 
             prevImage.id !== serverImage.id || 
             prevImage.status !== serverImage.status || 
             prevImage.timeRemaining !== serverImage.timeRemaining;
      
      if (changed && prevImage) {
        DEBUG.log('ServerSyncEffect', `Image ${serverImage.id} changed`, {
          prevStatus: prevImage.status,
          newStatus: serverImage.status,
          prevTime: prevImage.timeRemaining,
          newTime: serverImage.timeRemaining
        });
      }
      
      return changed;
    });
    
    DEBUG.log('ServerSyncEffect', 'Images changed?', hasChanged);
    
    // Only update if there are meaningful changes
    if (hasChanged) {
      DEBUG.log('ServerSyncEffect', 'Updating client display images');
      
      setDisplayImages(prevClientImages => {
        const newImages = userImages.map(serverImage => {
          const existingClientImage = prevClientImages.find(c => c.id === serverImage.id);
          
          // Status changed or new image - use server data
          if (!existingClientImage || existingClientImage.status !== serverImage.status) {
            DEBUG.log('ServerSyncEffect', `Using server data for image ${serverImage.id}`, {
              reason: !existingClientImage ? 'new image' : 'status changed',
              status: serverImage.status,
              timeRemaining: serverImage.timeRemaining
            });
            return serverImage;
          }
          
          // Use client timer if it's lower than server timer
          const clientTime = existingClientImage.timeRemaining;
          const serverTime = serverImage.timeRemaining;
          
          const useClientTime = 
            clientTime !== null && 
            serverTime !== null && 
            clientTime < serverTime;
            
          DEBUG.log('ServerSyncEffect', `Time selection for image ${serverImage.id}`, {
            clientTime,
            serverTime,
            selected: useClientTime ? 'client' : 'server'
          });
          
          return {
            ...serverImage,
            timeRemaining: useClientTime ? clientTime : serverTime
          };
        });
        
        return newImages;
      });
    }
    
    // Update our reference of the previous processed images
    prevProcessedImagesRef.current = userImages;
  }, [userImages]);

  // Navigation handler
  const handleSelect = (item: ProcessingImage) => {
    DEBUG.log('handleSelect', 'Navigating to result page', { imageId: item.id, style: item.style });
    router.push({ pathname: '/result', params: { image: item.uri, style: item.style } });
  };

  // Filter images by status
  const imagesByStatus = {
    cooking: displayImages.filter(img => img.status === 'cooking'),
    queued: displayImages.filter(img => img.status === 'queued'),
    finished: displayImages.filter(img => img.status === 'finished')
  };
  
  DEBUG.log('GalleryScreen', 'Images by status', {
    cooking: imagesByStatus.cooking.length,
    queued: imagesByStatus.queued.length,
    finished: imagesByStatus.finished.length
  });

  // Render functions
  const renderTabButton = (tab: 'cooking' | 'gallery', icon: JSX.Element, label: string) => {
    DEBUG.log('renderTabButton', `Rendering ${tab} tab`, { active: activeTab === tab });
    return (
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
        onPress={() => {
          DEBUG.log('TabButton', `Tab pressed: ${tab}`);
          setActiveTab(tab);
        }}
      >
        {icon}
        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTabHeader = () => {
    DEBUG.log('renderTabHeader', 'Rendering tab header', { activeTab });
    return (
      <View style={styles.tabsContainer}>
        {renderTabButton('cooking', 
          <PanelTop size={18} color={activeTab === 'cooking' ? '#fff' : '#888'} />, 
          'Kitchen'
        )}
        {renderTabButton('gallery', 
          <GalleryHorizontal size={18} color={activeTab === 'gallery' ? '#fff' : '#888'} />, 
          'Gallery'
        )}
      </View>
    );
  };

  const renderQueuedImages = () => {
    DEBUG.log('renderQueuedImages', 'Rendering queued images', { count: imagesByStatus.queued.length });
    
    if (imagesByStatus.queued.length === 0) {
      DEBUG.log('renderQueuedImages', 'No queued images, returning null');
      return null;
    }
    
    return (
      <View style={styles.carouselSection}>
        <Text style={styles.sectionTitle}>Up Next</Text>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.queuedCarousel}
        >
          {imagesByStatus.queued.map(item => {
            DEBUG.log('renderQueuedImages', `Rendering queued item ${item.id}`, { style: item.style });
            return (
              <View key={item.id} style={styles.queuedItem}>
                <Image 
                  source={{ uri: item.uri }} 
                  style={styles.queuedImage}
                  contentFit="cover"
                />
                <Text numberOfLines={1} style={styles.queuedLabel}>
                  {item.style || 'Pending'}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderTimeBadge = (item: ProcessingImage) => {
    return item.timeRemaining ? (
      <Text style={styles.timerText}>
        {Math.floor((item.timeRemaining || 0) / 60)}:
        {((item.timeRemaining || 0) % 60).toString().padStart(2, '0')}
      </Text>
    ): (
      <TicketCheck style={styles.timerText}/>
    )
  }

  const renderCookingPot = (item: ProcessingImage) => {
    DEBUG.log('renderCookingPot', `Rendering pot for image ${item.id}`, { 
      timeRemaining: item.timeRemaining,
      style: item.style
    });
    
    return (
      <View key={item.id} style={styles.potWrapper}>
        <View style={styles.potContainer}>
          <View style={styles.potHandleLeft} />
          <View style={styles.potHandleRight} />
          
          <PhysicsStylePot
            imageUri={item.uri}
            selectedStyles={item.style?.split(',') || []}
            containerStyle={styles.potContent}
          />
          
          <View style={styles.timerContainer}>
            <Clock size={16} color="#fff" />
            {renderTimeBadge(item)}
          </View>
          
          <View style={styles.cookingIndicator}>
            <Wand2 size={20} color="#fff" />
          </View>
        </View>
        <Text numberOfLines={1} style={styles.itemLabel}>
          {item.style || 'Processing...'}
        </Text>
      </View>
    );
  };
  
  const renderCookingImages = () => {
    DEBUG.log('renderCookingImages', 'Rendering cooking images', { count: imagesByStatus.cooking.length });
    
    return (
      <View style={styles.cookingSection}>
        <Text style={styles.sectionTitle}>Currently Cooking</Text>
        {imagesByStatus.cooking.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyText}>No images cooking</Text>
          </View>
        ) : (
          <View style={styles.potsContainer}>
            {imagesByStatus.cooking.map(renderCookingPot)}
          </View>
        )}
      </View>
    );
  };

  const renderCookingView = () => {
    DEBUG.log('renderCookingView', 'Rendering cooking view');
    return (
      <View style={styles.tabContent}>
        {renderQueuedImages()}
        {renderCookingImages()}
      </View>
    );
  };

  const renderGalleryView = () => {
    DEBUG.log('renderGalleryView', 'Rendering gallery view', { finishedCount: imagesByStatus.finished.length });
    
    return (
      <View style={styles.tabContent}>
        {imagesByStatus.finished.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyText}>No finished images yet</Text>
          </View>
        ) : (
          <FlatList
            data={imagesByStatus.finished}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => {
              DEBUG.log('renderGalleryView', `Rendering gallery item ${item.id}`);
              return (
                <TouchableOpacity 
                  style={styles.galleryItem}
                  onPress={() => handleSelect(item)}
                >
                  <Image 
                    source={{ uri: item.uri }} 
                    style={styles.galleryImage} 
                    contentFit="cover"
                  />
                  {item.style && (
                    <Text numberOfLines={1} style={styles.galleryItemLabel}>
                      {item.style}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.galleryList}
          />
        )}
      </View>
    );
  };

  // Loading state
  if (!awsImagesLoaded || localImages.length === 0) {
    DEBUG.log('GalleryScreen', 'Showing loading state', { 
      awsImagesLoaded, 
      localImagesCount: localImages.length 
    });
    
    return (
      <View style={styles.center}>
        {!isLoading && awsImagesLoaded ? (
          <Text style={styles.text}>No images found</Text>
        ) : (
          <ActivityIndicator size="large" color="#fff" />
        )}
      </View>
    );
  }

  // Main render
  DEBUG.log('GalleryScreen', 'Rendering main UI', { activeTab });
  
  return (
    <View style={styles.container}>
      {renderTabHeader()}
      {activeTab === 'cooking' ? renderCookingView() : renderGalleryView()}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingTop: 20,
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
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingHorizontal: DEFAULT_PADDING,
    paddingVertical: 10,
    marginBottom: 15,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: DEFAULT_PADDING,
  },
  // Sections
  carouselSection: {
    marginBottom: 20,
  },
  cookingSection: {
    flex: 1,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  // Queued items
  queuedCarousel: {
    paddingHorizontal: 5,
  },
  queuedItem: {
    width: 120,
    marginRight: 15,
    alignItems: 'center',
  },
  queuedImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
    backgroundColor: '#333',
  },
  queuedLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  // Cooking pots
  potsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  potWrapper: {
    width: '48%',
    marginBottom: 15,
    alignItems: 'center',
  },
  potContainer: {
    width: '100%',
    aspectRatio: 1,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#222',
  },
  potContent: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
  },
  potHandleLeft: {
    position: 'absolute',
    left: -10,
    top: '40%',
    height: 40,
    width: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    zIndex: 1,
  },
  potHandleRight: {
    position: 'absolute',
    right: -10,
    top: '40%',
    height: 40,
    width: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    zIndex: 1,
  },
  timerContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 15,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  cookingIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  // Empty states
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
  },
  // Gallery
  galleryList: {
    paddingTop: 5,
  },
  galleryItem: {
    width: '31%',
    aspectRatio: 1,
    marginHorizontal: '1%',
    marginBottom: 10,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  galleryItemLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 3,
    textAlign: 'center',
  }
});