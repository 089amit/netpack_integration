import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useRiderAuth } from '../context/RiderAuthContext';
import { COLORS } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

import { RiderLoginScreen } from '../screens/auth/RiderLoginScreen';
import { RiderHomeScreen } from '../screens/main/RiderHomeScreen';
import { PickupDetailScreen } from '../screens/main/PickupDetailScreen';
import { VerifyCargoScreen } from '../screens/main/VerifyCargoScreen';
import { ScannerScreen } from '../screens/main/ScannerScreen';
import { RiderProfileScreen } from '../screens/main/RiderProfileScreen';

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const TasksStack = createNativeStackNavigator();

const TasksNavigator = () => (
  <TasksStack.Navigator screenOptions={{ headerShown: false }}>
    <TasksStack.Screen name="TasksList" component={RiderHomeScreen} />
    <TasksStack.Screen name="PickupDetail" component={PickupDetailScreen} />
    <TasksStack.Screen name="VerifyCargo" component={VerifyCargoScreen} />
  </TasksStack.Navigator>
);

const MainTabNavigator = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#059669', // Rider Emerald Green
      tabBarInactiveTintColor: COLORS.muted,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      },
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: any = 'list-outline';
        if (route.name === 'Tasks') {
          iconName = focused ? 'list' : 'list-outline';
        } else if (route.name === 'Scan') {
          iconName = focused ? 'barcode' : 'barcode-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <MainTab.Screen name="Tasks" component={TasksNavigator} />
    <MainTab.Screen name="Scan" component={ScannerScreen} />
    <MainTab.Screen name="Profile" component={RiderProfileScreen} />
  </MainTab.Navigator>
);

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="RiderLogin" component={RiderLoginScreen} />
  </AuthStack.Navigator>
);

export const RiderRootNavigator = () => {
  const { token, isLoading } = useRiderAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
