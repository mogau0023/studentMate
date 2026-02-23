import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoHeader, Field, PrimaryButton, Wave, WAVE_HEIGHT } from '../components/UI';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      Alert.alert('Email Sent', 'Check your inbox for password reset instructions.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: WAVE_HEIGHT + insets.bottom + 24 }]}>
        <LogoHeader title="Forgot Password?" />
        <View style={styles.form}>
          <Field label="Email Address" placeholder="Email Address" iconName="mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <PrimaryButton label={loading ? 'Sending...' : 'Reset Password'} onPress={handleReset} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
            <Text style={styles.linkText}>Back to login</Text>
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
  linkText: { color: '#0053A9', fontSize: 14, fontWeight: '600' },
});
