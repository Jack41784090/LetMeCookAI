import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { configureAmplify } from '@/utils/amplifyConfig';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function RootLayout() {
  useFrameworkReady();
  
  // Initialize Amplify when the app loads
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="+not-found" />
        
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            gestureEnabled: false,
            gestureDirection: 'horizontal',
          }} 
        />
        
        <Stack.Screen 
          name="processing" 
          options={{ 
            gestureEnabled: false,
            gestureDirection: 'horizontal',
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
