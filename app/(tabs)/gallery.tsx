import { useLocalImages, type LocalImage } from '@/hooks/useLocalImages';
import { PhysicsStylePot } from '@/utils/components/PhysicsStylePot';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Clock, GalleryHorizontal, PanelTop, Wand2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
const TIMER_DURATION = 3; // Timer duration in seconds
const MAX_COOKING_ITEMS = 3; // Maximum number of simultaneously cooking items

// Add a status field to track image processing state
interface ProcessingImage extends LocalImage {
  status: 'cooking' | 'queued' | 'finished';
  timeRemaining?: number;
}

export default function GalleryScreen() {
  const { images, isLoading, refreshImages } = useLocalImages();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cooking' | 'gallery'>('cooking');
  const [processedImages, setProcessedImages] = useState<ProcessingImage[]>([]);

  // Process images and assign initial status
  useEffect(() => {
    if (!isLoading && images.length > 0) {
      const processed = images.map((img, index): ProcessingImage => {
        // First MAX_COOKING_ITEMS are cooking
        if (index < MAX_COOKING_ITEMS) {
          return { 
            ...img, 
            status: 'cooking',
            timeRemaining: TIMER_DURATION
          };
        } 
        // Next 5 are queued
        else if (index < MAX_COOKING_ITEMS + 5) {
          return { ...img, status: 'queued' };
        } 
        // The rest are finished
        else {
          return { ...img, status: 'finished' };
        }
      });
      
      setProcessedImages(processed);
    }
  }, [images, isLoading]);

  // Timer effect
  useEffect(() => {
    if (processedImages.length === 0) return;
    
    const interval = setInterval(() => {
      setProcessedImages(prevImages => {
        let updated = false;
        let newlyFinished = false;
        
        // Create a copy of the array to avoid direct state mutations
        const updatedImages = [...prevImages];
        
        // Update timers and check for completed images
        for (let i = 0; i < updatedImages.length; i++) {
          const img = updatedImages[i];
          
          if (img.status === 'cooking' && img.timeRemaining !== undefined) {
            if (img.timeRemaining > 0) {
              // Decrease timer
              updatedImages[i] = {
                ...img,
                timeRemaining: img.timeRemaining - 1
              };
              updated = true;
            }
            
            // When timer reaches zero, mark as finished
            if (updatedImages[i].timeRemaining === 0) {
              updatedImages[i] = {
                ...img, 
                status: 'finished',
                timeRemaining: undefined
              };
              newlyFinished = true;
              updated = true;
            }
          }
        }
        
        // If an image finished cooking, promote one from the queue
        if (newlyFinished) {
          const cookingCount = updatedImages.filter(img => img.status === 'cooking').length;
          
          // If we have open cooking slots and queued images
          if (cookingCount < MAX_COOKING_ITEMS) {
            const nextQueuedIndex = updatedImages.findIndex(img => img.status === 'queued');
            
            if (nextQueuedIndex !== -1) {
              // Promote to cooking status
              updatedImages[nextQueuedIndex] = {
                ...updatedImages[nextQueuedIndex],
                status: 'cooking',
                timeRemaining: TIMER_DURATION
              };
              updated = true;
            }
          }
        }
        
        return updated ? updatedImages : prevImages;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [processedImages]);

  // Refresh images when component mounts
  useEffect(() => {
    refreshImages();
  }, []);

  const handleSelect = (item: ProcessingImage) => {
    router.push({ pathname: '/result', params: { image: item.uri, style: item.style } });
  };

  // Filter images by status
  const cookingImages = processedImages.filter(img => img.status === 'cooking');
  const queuedImages = processedImages.filter(img => img.status === 'queued');
  const finishedImages = processedImages.filter(img => img.status === 'finished');

  // Tab header component
  const renderTabHeader = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'cooking' && styles.activeTabButton]}
        onPress={() => setActiveTab('cooking')}
      >
        <PanelTop size={18} color={activeTab === 'cooking' ? '#fff' : '#888'} />
        <Text style={[styles.tabText, activeTab === 'cooking' && styles.activeTabText]}>Kitchen</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'gallery' && styles.activeTabButton]}
        onPress={() => setActiveTab('gallery')}
      >
        <GalleryHorizontal size={18} color={activeTab === 'gallery' ? '#fff' : '#888'} />
        <Text style={[styles.tabText, activeTab === 'gallery' && styles.activeTabText]}>Gallery</Text>
      </TouchableOpacity>
    </View>
  );

  // Cooking View
  const renderCookingView = () => (
    <View style={styles.tabContent}>
      {/* Queued Images Carousel */}
      {queuedImages.length > 0 && (
        <View style={styles.carouselSection}>
          <Text style={styles.sectionTitle}>Up Next</Text>
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.queuedCarousel}
          >
            {queuedImages.map(item => (
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
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Currently Cooking Pots */}
      <View style={styles.cookingSection}>
        <Text style={styles.sectionTitle}>Currently Cooking</Text>
        {cookingImages.length === 0 ? (
          <View style={styles.emptyCooking}>
            <Text style={styles.emptyText}>No images cooking</Text>
          </View>
        ) : (
          <View style={styles.potsContainer}>
            {cookingImages.map(item => (
              <View key={item.id} style={styles.potWrapper}>
                {/* Pot Container */}
                <View style={styles.potContainer}>
                  <View style={styles.potHandleLeft} />
                  <View style={styles.potHandleRight} />
                  
                  {/* Use PhysicsStylePot to create bubbling effect */}
                  <PhysicsStylePot
                    imageUri={item.uri}
                    selectedStyles={item.style?.split(',') || []}
                    containerStyle={styles.potContent}
                  />
                  
                  {/* Timer overlay */}
                  <View style={styles.timerContainer}>
                    <Clock size={16} color="#fff" />
                    <Text style={styles.timerText}>
                      {Math.floor((item.timeRemaining || 0) / 60)}:{((item.timeRemaining || 0) % 60).toString().padStart(2, '0')}
                    </Text>
                  </View>
                  
                  {/* Animated cooking indicator */}
                  <View style={styles.cookingIndicator}>
                    <Wand2 size={20} color="#fff" />
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.itemLabel}>
                  {item.style || 'Processing...'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  // Gallery View (Finished Images)
  const renderGalleryView = () => (
    <View style={styles.tabContent}>
      {finishedImages.length === 0 ? (
        <View style={styles.emptyGallery}>
          <Text style={styles.emptyText}>No finished images yet</Text>
        </View>
      ) : (
        <FlatList
          data={finishedImages}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={({ item }) => (
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
          )}
          contentContainerStyle={styles.galleryList}
        />
      )}
    </View>
  );

  return (
    images.length === 0 ?
      <View style={styles.center}>
        {
            !isLoading ? (
            <Text style={styles.text}>No images found</Text>
          ) : (
            <ActivityIndicator size="large" color="#fff" />
          )
        }
      </View>
      :
      <View style={styles.container}>
        {renderTabHeader()}
        {activeTab === 'cooking' ? renderCookingView() : renderGalleryView()}
      </View>
  );
}

// The styles remain the same as before
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
  // Tab navigation
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
  // Cooking tab styles
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
  emptyCooking: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  // Gallery tab styles
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
  },
  emptyGallery: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
  }
});