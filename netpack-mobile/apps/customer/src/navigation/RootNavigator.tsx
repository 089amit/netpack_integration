import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '@netpack/shared';
import { Ionicons } from '@expo/vector-icons';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { VerifyCodeScreen } from '../screens/auth/VerifyCodeScreen';

import { TrackScreen } from '../screens/main/TrackScreen';
import { BookingsScreen } from '../screens/main/BookingsScreen';
import { BookingDetailScreen } from '../screens/main/BookingDetailScreen';
import { CreateBookingScreen } from '../screens/main/CreateBookingScreen';
import { NotificationsScreen } from '../screens/main/NotificationsScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const MainTab = createBottomTabNavigator();
const BookingsStack = createNativeStackNavigator();

const BookingsNavigator = () => (
  <BookingsStack.Navigator screenOptions={{ headerShown: false }}>
    <BookingsStack.Screen name="BookingsList" component={BookingsScreen} />
    <BookingsStack.Screen name="BookingDetail" component={BookingDetailScreen} />
    <BookingsStack.Screen name="CreateBooking" component={CreateBookingScreen} />
  </BookingsStack.Navigator>
);

const MainTabNavigator = () => (
  <MainTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.accent,
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
        let iconName: any = 'cube-outline';
        if (route.name === 'Track') {
          iconName = focused ? 'navigate' : 'navigate-outline';
        } else if (route.name === 'Shipments') {
          iconName = focused ? 'cube' : 'cube-outline';
        } else if (route.name === 'Notifications') {
          iconName = focused ? 'notifications' : 'notifications-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <MainTab.Screen name="Track" component={TrackScreen} />
    <MainTab.Screen name="Shipments" component={BookingsNavigator} />
    <MainTab.Screen name="Notifications" component={NotificationsScreen} />
    <MainTab.Screen name="Profile" component={ProfileScreen} />
  </MainTab.Navigator>
);

const AuthNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
    <AuthStack.Screen name="VerifyCode" component={VerifyCodeScreen} />
  </AuthStack.Navigator>
);

export const RootNavigator = () => {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
