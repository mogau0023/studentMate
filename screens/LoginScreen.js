import React, { useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoHeader, Field, PrimaryButton, Wave, WAVE_HEIGHT } from '../components/UI';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { saveUserToCache } from '../utils/storage';
import { colors, cardShadow } from '../utils/webTheme';

const LARGE_SCREEN_BREAKPOINT = 600;

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLarge = width >= LARGE_SCREEN_BREAKPOINT;

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
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const u = cred.user;
      let profile = null;
      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        profile = snap.exists() ? snap.data() : null;
      } catch {}
      await saveUserToCache({
        uid: u.uid,
        email: u.email,
        name: profile?.name || u.displayName || '',
        universityId: profile?.universityId || '',
        universityName: profile?.universityName || profile?.university || '',
      });
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

  if (isLarge) {
    return (
      <SafeAreaView style={[largeStyles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {/* Full-height centred container — no scroll */}
        <View style={largeStyles.centerWrap}>
          <Text style={largeStyles.brandName}>StudentMate</Text>
          <Text style={largeStyles.welcomeTitle}>Welcome Back</Text>
          <Text style={largeStyles.welcomeSubtitle}>Login to continue to your account</Text>

          {/* Card */}
          <View style={largeStyles.card}>
            <Field
              label="Email Address"
              placeholder="Email Address"
              iconName="mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Field
              label="Password"
              placeholder="Password"
              iconName="lock"
              isPassword
              value={password}
              onChangeText={setPassword}
              headerRight={
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={largeStyles.forgotPasswordInline}>Forgot Password?</Text>
                </TouchableOpacity>
              }
            />
            <PrimaryButton label={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} />

            {/* Divider */}
            <View style={largeStyles.dividerRow}>
              <View style={largeStyles.dividerLine} />
              <Text style={largeStyles.dividerText}>or</Text>
              <View style={largeStyles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={largeStyles.secondaryText}>
                Don&apos;t have an account?{' '}
                <Text style={largeStyles.linkText}>Register</Text>
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

// ── Original mobile styles (untouched) ────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 },
  form: { flex: 1, marginTop: 8 },
  forgotPasswordInline: { color: colors.brand, fontSize: 13, fontWeight: '500' },
  secondaryText: { marginTop: 12, textAlign: 'center', color: colors.muted, fontSize: 14 },
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
  forgotPasswordInline: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '500',
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
