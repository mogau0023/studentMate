import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth as useClerkAuth, useSignUp, useClerk } from '@clerk/clerk-expo';
import { theme } from '../../theme';

export default function Register({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setActive } = useClerk();
  const { signUp } = useSignUp();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await signUp?.create({ emailAddress: email, password });
      await signUp?.update({ firstName: name });
      await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (error: any) {
      Alert.alert('Registration Error', error?.errors?.[0]?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Error', 'Enter the verification code');
      return;
    }
    setLoading(true);
    try {
      const res = await signUp?.attemptEmailAddressVerification({ code });
      if (res?.status === 'complete' && res?.createdSessionId) {
        await setActive({ session: res.createdSessionId });
        return;
      }
    } catch (error: any) {
      const msg = error?.errors?.[0]?.message || error.message || '';
      const codeName = error?.errors?.[0]?.code || '';
      if (msg.toLowerCase().includes('session already exists') || codeName === 'session_exists') {
        if (signUp?.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
          setPendingVerification(false);
          setCode('');
          return;
        }
      }
      Alert.alert('Verification Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join thousands of students learning math</Text>
        </View>
        {!pendingVerification ? (
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Student Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Register'}</Text>
          </TouchableOpacity>
        </View>
        ) : (
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter Verification Code</Text>
            <TextInput style={styles.input} placeholder="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" />
          </View>
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerify} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
          </TouchableOpacity>
        </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.card },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 8 },
  subtitle: { fontSize: 16, color: theme.colors.muted, textAlign: 'center' },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: theme.colors.bg },
  button: { backgroundColor: theme.colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: { color: theme.colors.primary, fontSize: 14, textDecorationLine: 'underline' },
});
