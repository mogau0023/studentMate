import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import MainTabs from './screens/MainTabs';
import mobileAds from 'react-native-google-mobile-ads';
import { StatusBar } from 'expo-status-bar';
import { SubscriptionProvider } from "./providers/SubscriptionProvider";
import PaywallScreen from './screens/PaywallScreen';

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        // Initialization complete!
      });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <SubscriptionProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="Paywall" component={PaywallScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SubscriptionProvider>
    </GestureHandlerRootView>
  );
}
