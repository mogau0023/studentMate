import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoHeader, Field, PrimaryButton, Wave, WAVE_HEIGHT } from '../components/UI';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { colors, cardShadow } from '../utils/webTheme';

const LARGE_SCREEN_BREAKPOINT = 600;

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLarge = width >= LARGE_SCREEN_BREAKPOINT;

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

  if (isLarge) {
    return (
      <SafeAreaView style={[largeStyles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={largeStyles.centerWrap}>
          <Text style={largeStyles.brandName}>StudentMate</Text>
          <Text style={largeStyles.welcomeTitle}>Forgot Password?</Text>
          <Text style={largeStyles.welcomeSubtitle}>Enter your email and we'll send reset instructions</Text>

          <View style={largeStyles.card}>
            <Field
              label="Email Address"
              placeholder="Email Address"
              iconName="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <PrimaryButton label={loading ? 'Sending...' : 'Reset Password'} onPress={handleReset} />

            <View style={largeStyles.dividerRow}>
              <View style={largeStyles.dividerLine} />
              <Text style={largeStyles.dividerText}>or</Text>
              <View style={largeStyles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={largeStyles.secondaryText}>
                Remembered it?{' '}
                <Text style={largeStyles.linkText}>Back to Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Wave />
      </SafeAreaView>
    );
  }

  // ── Original mobile layout (unchanged) ──────────────────────────────────────
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

// ── Original mobile styles (untouched) ────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 },
  form: { flex: 1, marginTop: 8 },
  linkText: { color: colors.brand, fontSize: 14, fontWeight: '600' },
});

// ── Large-screen styles ────────────────────────────────────────────────────────
const largeStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: WAVE_HEIGHT,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.brand,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...cardShadow,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: colors.muted,
  },
  secondaryText: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 14,
  },
  linkText: {
    color: colors.brand,
    fontSize: 14,
    fontWeight: '600',
  },
});
