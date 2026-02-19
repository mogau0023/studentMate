import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import HomeStack from './HomeStack';

function Placeholder() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from './ProfileScreen';
import UploadScreen from './UploadScreen';
import EditProfileScreen from './EditProfileScreen';
import PointsHistoryScreen from './PointsHistoryScreen';

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="PointsHistory" component={PointsHistoryScreen} />
    </ProfileStack.Navigator>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="home" size={22} color={focused ? '#0053A9' : '#7a7f87'} />
          ),
        }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="upload" size={22} color={focused ? '#0053A9' : '#7a7f87'} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={22} color={focused ? '#0053A9' : '#7a7f87'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
