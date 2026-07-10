import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from './screens/SplashScreen';
import RegisterScreen from './screens/RegisterScreen';
import LoginScreen from './screens/LoginScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import MainTabs from './screens/MainTabs';
import { StatusBar } from 'expo-status-bar';
import { isWebDark, navigationTheme, colors } from './utils/webTheme';
import { getCachedUser } from './utils/storage';
import { identifyUser, installGlobalErrorHandlers, trackScreen } from './utils/analytics';
import { app } from './firebase';

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  const [fontsLoaded, fontError] = useFonts({
    Feather: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Feather.ttf'),
    MaterialCommunityIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
  });

  const navRef = useNavigationContainerRef();
  const routeNameRef = useRef(null);

  useEffect(() => {
    console.log('[AppRoutes] app.options:', app.options);
    installGlobalErrorHandlers();
    (async () => {
      const cached = await getCachedUser();
      if (!cached) return;
      await identifyUser({
        uid: cached.uid,
        universityId: cached.universityId,
        universityName: cached.universityName,
      });
    })();
  }, []);

  // Don't render until fonts are ready (or failed — still render to avoid blank screen)
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isWebDark ? 'light' : 'dark'} translucent backgroundColor="transparent" />
      <NavigationContainer
        theme={navigationTheme}
        ref={navRef}
        onReady={() => {
          const name = navRef.getCurrentRoute()?.name;
          if (name) {
            routeNameRef.current = name;
            trackScreen(name);
          }
        }}
        onStateChange={() => {
          const name = navRef.getCurrentRoute()?.name;
          if (name && routeNameRef.current !== name) {
            routeNameRef.current = name;
            trackScreen(name);
          }
        }}
      >
        <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
