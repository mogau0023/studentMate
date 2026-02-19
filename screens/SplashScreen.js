import React, { useEffect } from 'react';
import { SafeAreaView, View, Image, Text, StyleSheet } from 'react-native';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Small delay to show branding if auth is instant
      setTimeout(() => {
        if (user) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Login');
        }
      }, 1000);
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
