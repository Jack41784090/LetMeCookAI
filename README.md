# LetMeCookAI

<div align="center">
  <img src="./assets/images/icon.png" alt="LetMeCookAI Logo" width="120"/>
  <h3>Transform your photos with AI-powered artistic styles</h3>
</div>

## 📱 About

LetMeCookAI is a mobile application that allows users to transform their photos with AI-powered artistic styles. Users can take photos directly with the camera or select images from their gallery, then apply various artistic styles like Van Gogh, Monet, Anime, Pixar, and Watercolor to their images.

## ✨ Features

- **Camera Integration**: Capture photos directly from the app with front and back camera support
- **Gallery Access**: Select existing photos from your device
- **Multiple Artistic Styles**: Apply various art styles to your photos:
  - Van Gogh (Post-impressionist style)
  - Monet (Impressionist style)
  - Anime (Japanese animation style)
  - Pixar (3D animated style)
  - Watercolor (Soft, flowing painting style)
- **Interactive Style Selection**: Drag and drop styles into a virtual "cooking pot"
- **Processing Simulation**: Visual feedback during the image transformation process
- **Image Sharing**: Share your transformed images directly to social media or other apps
- **Local Gallery**: Save and manage your transformed images within the app
- **Cross-Platform**: Works on iOS, Android, and web (with some platform-specific features)

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [Yarn](https://yarnpkg.com/) package manager
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- For iOS/Android development: iOS Simulator or Android Emulator

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/LetMeCookAI.git
   cd LetMeCookAI
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Start the development server:
   ```bash
   yarn dev
   ```

4. Open the app:
   - Scan the QR code with the Expo Go app on your mobile device
   - Press 'i' to open in iOS simulator or 'a' for Android emulator

## 📦 Build

To build the web version:
```bash
yarn build:web
```

## 🛠️ Technologies

- [React Native](https://reactnative.dev/) - Mobile application framework
- [Expo](https://expo.dev/) - React Native toolchain and platform
- [Expo Router](https://docs.expo.dev/routing/introduction/) - File-based routing
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) - Animations
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/) - Gesture management
- [Matter.js](https://brm.io/matter-js/) - 2D physics engine (for the style pot interaction)

## 🌐 AWS Integration

The application includes a placeholder for AWS integration for image processing. This will be implemented in future releases to connect to AWS services for AI image processing.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
