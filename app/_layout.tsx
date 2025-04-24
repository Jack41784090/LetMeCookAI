import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useFrameworkReady();

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
