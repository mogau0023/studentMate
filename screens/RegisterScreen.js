import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoHeader, Field, PrimaryButton, Wave, WAVE_HEIGHT } from '../components/UI';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { saveUserToCache } from '../utils/storage';
import { colors, cardShadow } from '../utils/webTheme';
import { identifyUser, trackEvent } from '../utils/analytics';

const LARGE_SCREEN_BREAKPOINT = 600;

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLarge = width >= LARGE_SCREEN_BREAKPOINT;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [uniModal, setUniModal] = useState(false);
  const [uniError, setUniError] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const loadUniversities = async () => {
    try {
      const q = query(collection(db, 'universities'), orderBy('name', 'asc'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUniversities(list);
      setUniError(null);
    } catch (e) {
      setUniError(e?.message || 'Failed to load universities');
    }
  };

  useEffect(() => {
    loadUniversities();
  }, []);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword || !selectedUniversity) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await setDoc(
        doc(db, 'users', userCredential.user.uid),
        {
          name: fullName,
          email: email.trim().toLowerCase(),
          university: selectedUniversity?.name || '',
          universityId: selectedUniversity?.id || '',
          universityName: selectedUniversity?.name || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await saveUserToCache({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: fullName,
        universityId: selectedUniversity?.id || '',
        universityName: selectedUniversity?.name || '',
      });
      await identifyUser({
        uid: userCredential.user.uid,
        universityId: selectedUniversity?.id || '',
        universityName: selectedUniversity?.name || '',
      });
      await trackEvent('sign_up', { method: 'password' });
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Shared university picker modal (used by both layouts)
  const UniModal = (
    <Modal visible={uniModal} transparent animationType="fade" onRequestClose={() => setUniModal(false)}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Select University</Text>
          {uniError ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: '#b91c1c', marginBottom: 8 }}>Error: {uniError}</Text>
              <TouchableOpacity
                onPress={() => { setUniError(null); loadUniversities(); }}
                style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#fee2e2' }}
              >
                <Text style={{ color: '#991b1b', fontWeight: '600' }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <ScrollView style={{ marginTop: 12, maxHeight: 420 }}>
            {universities.map(u => (
              <TouchableOpacity
                key={u.id}
                onPress={() => { setSelectedUniversity(u); setUniModal(false); }}
                style={styles.uniRow}
              >
                {u.logoUrl ? (
                  <Image source={{ uri: u.logoUrl }} style={styles.uniLogo} />
                ) : (
                  <View style={styles.uniFallback}>
                    <Text style={styles.uniFallbackText}>{(u.name || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.uniName}>{u.name}</Text>
                  {u.code ? <Text style={styles.uniCode}>{u.code}</Text> : null}
                </View>
              </TouchableOpacity>
            ))}
            {universities.length === 0 ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <Text style={{ color: '#6b7280' }}>No universities found</Text>
              </View>
            ) : null}
          </ScrollView>
          <TouchableOpacity onPress={() => setUniModal(false)} style={styles.modalCancel}>
            <Text style={styles.modalCancelText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLarge) {
    return (
      <SafeAreaView style={[largeStyles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScrollView
          contentContainerStyle={[largeStyles.scrollContent, { paddingBottom: WAVE_HEIGHT + insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={largeStyles.brandName}>StudentMate</Text>
          <Text style={largeStyles.welcomeTitle}>Create Account</Text>
          <Text style={largeStyles.welcomeSubtitle}>Sign up to get started</Text>

          <View style={largeStyles.card}>
            <Field label="Full Name" placeholder="Full Name" iconName="user" value={fullName} onChangeText={setFullName} />
            <Field label="Email Address" placeholder="Email Address" iconName="mail" value={email} onChangeText={setEmail} keyboardType="email-address" />

            <TouchableOpacity onPress={() => setUniModal(true)} style={styles.selectBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.selectLabel, { marginRight: 8 }]}>Select University</Text>
              </View>
              <View style={styles.selectRow}>
                <Text style={styles.selectValue}>{selectedUniversity ? selectedUniversity.name : 'Select University'}</Text>
                <Text style={styles.selectChevron}>⌄</Text>
              </View>
            </TouchableOpacity>

            <Field label="Password" placeholder="Password" iconName="lock" isPassword value={password} onChangeText={setPassword} />
            <Field label="Confirm Password" placeholder="Confirm Password" iconName="lock" isPassword value={confirmPassword} onChangeText={setConfirmPassword} />

            <PrimaryButton label={loading ? 'Registering...' : 'Register'} onPress={handleRegister} />

            <View style={largeStyles.dividerRow}>
              <View style={largeStyles.dividerLine} />
              <Text style={largeStyles.dividerText}>or</Text>
              <View style={largeStyles.dividerLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={largeStyles.secondaryText}>
                Already have an account?{' '}
                <Text style={largeStyles.linkText}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        {UniModal}
        <Wave />
      </SafeAreaView>
    );
  }

  // ── Original mobile layout (unchanged) ──────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: WAVE_HEIGHT + insets.bottom + 24 }]}>
        <LogoHeader title="Create Account" />
        <View style={styles.form}>
          <Field label="Full Name" placeholder="Full Name" iconName="user" value={fullName} onChangeText={setFullName} />
          <Field label="Email Address" placeholder="Email Address" iconName="mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <TouchableOpacity onPress={() => setUniModal(true)} style={styles.selectBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.selectLabel, { marginRight: 8 }]}>Select University</Text>
            </View>
            <View style={styles.selectRow}>
              <Text style={styles.selectValue}>{selectedUniversity ? selectedUniversity.name : 'Select University'}</Text>
              <Text style={styles.selectChevron}>⌄</Text>
            </View>
          </TouchableOpacity>
          <Field label="Password" placeholder="Password" iconName="lock" isPassword value={password} onChangeText={setPassword} />
          <Field label="Confirm Password" placeholder="Confirm Password" iconName="lock" isPassword value={confirmPassword} onChangeText={setConfirmPassword} />
          <PrimaryButton label={loading ? 'Registering...' : 'Register'} onPress={handleRegister} />
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryText}>Already have an account? <Text style={styles.linkText}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {UniModal}
      <Wave />
    </SafeAreaView>
  );
}

// ── Original mobile styles (untouched) ────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 },
  form: { flex: 1, marginTop: 8 },
  secondaryText: { marginTop: 12, textAlign: 'center', color: colors.muted, fontSize: 14 },
  linkText: { color: colors.brand, fontSize: 14, fontWeight: '600' },
  selectBox: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.input,
  },
  selectLabel: { fontSize: 14, color: colors.muted },
  selectRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { fontSize: 15, color: colors.text },
  selectChevron: { fontSize: 18, color: colors.muted },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  uniRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  uniLogo: { width: 32, height: 32, borderRadius: 6, marginRight: 12, backgroundColor: colors.surfaceMuted },
  uniFallback: { width: 32, height: 32, borderRadius: 6, marginRight: 12, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  uniFallbackText: { color: colors.textSoft, fontWeight: '700' },
  uniName: { fontSize: 15, fontWeight: '600', color: colors.text },
  uniCode: { fontSize: 12, color: colors.muted, marginTop: 2 },
  modalCancel: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12 },
  modalCancelText: { color: colors.brand, fontWeight: '600' },
});

// ── Large-screen styles ────────────────────────────────────────────────────────
const largeStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundAlt,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
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
