import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RiderAuthProvider } from './src/context/RiderAuthContext';
import { RiderRootNavigator } from './src/navigation/RiderRootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <RiderAuthProvider>
        <StatusBar style="light" backgroundColor="#0D1B2A" />
        <RiderRootNavigator />
      </RiderAuthProvider>
    </SafeAreaProvider>
  );
}
