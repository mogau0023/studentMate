import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoHeader, Field, PrimaryButton, Wave, WAVE_HEIGHT } from '../components/UI';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Navigation is handled by auth listener in SplashScreen or AppRoutes, 
      // but since we don't have a global listener wrapping the navigator, 
      // we manually navigate. However, if SplashScreen redirects to Login, 
      // we should replace it. 
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: WAVE_HEIGHT + insets.bottom + 24 }]}>
        <LogoHeader title="Login" />
        <View style={styles.form}>
          <Field label="Email Address" placeholder="Email Address" iconName="mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <Field
            label="Password"
            placeholder="Password"
            iconName="lock"
            isPassword
            value={password}
            onChangeText={setPassword}
            headerRight={
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPasswordInline}>Forgot Password?</Text>
              </TouchableOpacity>
            }
          />
          <PrimaryButton label={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} />
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.secondaryText}>Don&apos;t have an account? <Text style={styles.linkText}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Wave />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 },
  form: { flex: 1, marginTop: 8 },
  forgotPasswordInline: { color: '#0053A9', fontSize: 13, fontWeight: '500' },
  secondaryText: { marginTop: 12, textAlign: 'center', color: '#555', fontSize: 14 },
  linkText: { color: '#0053A9', fontSize: 14, fontWeight: '600' },
});

