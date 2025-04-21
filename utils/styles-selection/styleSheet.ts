import { Dimensions, StyleSheet } from 'react-native';

// Get the screen dimensions for proportional layouts
const { height: screenHeight } = Dimensions.get('window');

/**
 * StyleSheet for the style selection screen
 */
export const styleSheet = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    paddingTop: 10, // Reduced top padding for better space utilization
    paddingBottom: 10, // Reduced bottom padding for better space utilization
    justifyContent: 'center', // Center the mainContainer vertically
    alignItems: 'center', // Center the mainContainer horizontally
  },
  mainContainer: {
    height: screenHeight * 0.95, // 95% of screen height
    width: '100%',
    justifyContent: 'space-between', // Distribute space between children
  },
  // Top carousel container - 20% of the parent container
  carouselContainer: {
    height: '20%', // 20% of mainContainer
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  carousel: {
    flexDirection: 'row',
    paddingVertical: 10,
    minWidth: '100%', // Ensure it takes full width even when empty
    alignItems: 'center', // Center items vertically within the row
    justifyContent: 'center', // Center items horizontally
  },
  // Image container - 60% of the parent container
  imageContainer: {
    height: '60%', // 60% of mainContainer
    backgroundColor: '#333',
    borderRadius: 0,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    paddingTop: 20,
    position: 'relative',
  },
  // Transform button area - 20% of the parent container
  transformButton: {
    zIndex: 10,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    height: '15%', // Slightly less than 20% to account for margins
  },
  potHandleLeft: {
    position: 'absolute',
    left: -15,
    top: '40%',
    height: 60,
    width: 30,
    backgroundColor: '#333',
    borderRadius: 15,
    zIndex: 1,
  },
  potHandleRight: {
    position: 'absolute',
    right: -15,
    top: '40%',
    height: 60,
    width: 30,
    backgroundColor: '#333',
    borderRadius: 15,
    zIndex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
    overflow: 'hidden', // Move overflow to image instead of container
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  imageOverlayActive: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  badge: {
    position: 'absolute',
    top: -5, // Move badge up slightly to make it more visible
    right: -5, // Move badge right slightly to make it more visible
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30, // Make badge slightly larger
    height: 30, // Make badge slightly larger
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20, // Increased z-index to ensure it's on top
    elevation: 5, // Add elevation for Android
    shadowColor: '#000', // Add shadow for iOS
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    width: 80,  // Fixed width for circular buttons
    height: 80, // Same as width to make it circular
    borderRadius: 40, // Half of width/height for perfect circle
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedStyle: {
    backgroundColor: '#1e4d8f',
    opacity: 0.8,
  },
  styleIcon: {
    marginBottom: 5,
  },
  styleName: {
    fontSize: 12, // Smaller font for circular buttons
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    maxWidth: 70, // Ensure text doesn't overflow
  },
  styleDescription: {
    fontSize: 14,
    color: '#ccc',
  },
  emptyMessage: {
    color: '#888',
    fontStyle: 'italic',
    alignSelf: 'center',
    paddingVertical: 10,
  },
  transformButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});