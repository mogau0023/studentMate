import React, { useEffect, useRef } from 'react';
import { SafeAreaView, View, Image, Text, StyleSheet } from 'react-native';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getCachedUser } from '../utils/storage';

export default function SplashScreen({ navigation }) {
  const navigated = useRef(false);
  useEffect(() => {
    const bootstrap = async () => {
      const cached = await getCachedUser();
      if (cached && !navigated.current) {
        navigated.current = true;
        navigation.replace('MainTabs');
      }
    };
    bootstrap();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (navigated.current) return;
      setTimeout(() => {
        navigated.current = true;
        if (user) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      }, 500);
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <Image source={require('../assets/icon.png')} style={styles.logo} />
        <Text style={styles.title}>studentmate</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 96, height: 96, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#0053A9' },
});
