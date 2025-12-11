import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { theme } from '../theme';

import Dashboard from '../screens/Dashboard';
import PaperBrowser from '../screens/PaperBrowser';
import QuestionViewer from '../screens/QuestionViewer';
import Favorites from '../screens/Favorites';
import Progress from '../screens/Progress';
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import { useAuth as useClerkAuth } from '@clerk/clerk-expo';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  PaperBrowser: { category: string };
  QuestionViewer: { paperId: string } | undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          tabBarIcon: ({ color }) => <Icon name="home-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Favorites"
        component={Favorites}
        options={{
          tabBarIcon: ({ color }) => <Icon name="heart-outline" size={24} color={color} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={Progress}
        options={{
          tabBarIcon: ({ color }) => <Icon name="chart-bar" size={24} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isSignedIn } = useClerkAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isSignedIn ? (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="PaperBrowser" component={PaperBrowser} />
            <Stack.Screen name="QuestionViewer" component={QuestionViewer} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
