import React from 'react';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { SafeAreaView, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import HomeStack from './HomeStack';
//import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { bannerUnitId, adsEnabled } from '../utils/ads';
import { colors, isWebDark } from '../utils/webTheme';

function Placeholder() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.text }}>Coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from './ProfileScreen';
import UploadScreen from './UploadScreen';
import EditProfileScreen from './EditProfileScreen';
import TermsScreen from "./TermsScreen";
import PrivacyScreen from "./PrivacyScreen";
import ReportProblemScreen from "./ReportProblemScreen";

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="Terms" component={TermsScreen} />
      <ProfileStack.Screen name="Privacy" component={PrivacyScreen} />
      <ProfileStack.Screen name="ReportProblem" component={ReportProblemScreen} />
    </ProfileStack.Navigator>
  );
}

function TabBarWithBanner(props) {
  const BANNER_UNIT_ID = bannerUnitId();
  return (
    <View>
      {adsEnabled() ? (
        <View style={{ alignItems: 'center', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
          <BannerAd
            unitId={BANNER_UNIT_ID}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            onAdLoaded={() => console.log('Global banner loaded')}
            onAdFailedToLoad={(e) => console.log('Global banner failed', e)}
          />
        </View>
      ) : null}
      <BottomTabBar {...props} />
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
      tabBar={(p) => <TabBarWithBanner {...p} />}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="home" size={22} color={focused ? colors.brand : colors.muted} />
          ),
        }}
      />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="upload" size={22} color={focused ? colors.brand : colors.muted} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Feather name="user" size={22} color={focused ? colors.brand : colors.muted} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
