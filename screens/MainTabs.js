import React from 'react';
import { createBottomTabNavigator, BottomTabBar } from '@react-navigation/bottom-tabs';
import { SafeAreaView, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import HomeStack from './HomeStack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { bannerUnitId, adsEnabled } from '../utils/ads';
import { useSubscription } from "../providers/SubscriptionProvider";

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

const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function TabBarWithBanner(props) {
  const { isPro } = useSubscription();
  const insets = useSafeAreaInsets();
  const BANNER_UNIT_ID = bannerUnitId();
  return (
    <View>
      {adsEnabled() ? (
        <View style={{ alignItems: 'center', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
          {!isPro ? (
          <BannerAd
            unitId={BANNER_UNIT_ID}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            onAdLoaded={() => console.log('Global banner loaded')}
            onAdFailedToLoad={(e) => console.log('Global banner failed', e)}
          />
          ) : null}
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
        tabBarStyle: { height: 64, paddingBottom: 10, paddingTop: 8 },
      }}
      tabBar={(p) => <TabBarWithBanner {...p} />}
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
