import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert, Modal, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoHeader, Field, PrimaryButton, Wave, WAVE_HEIGHT } from '../components/UI';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { saveUserToCache } from '../utils/storage';

export default function RegisterScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [uniModal, setUniModal] = useState(false);
  const [uniError, setUniError] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
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
    load();
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
        points: 0,
        subscriptionActive: false,
      });
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
      <Modal visible={uniModal} transparent animationType="fade" onRequestClose={() => setUniModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select University</Text>
            {uniError ? (
              <View style={{ paddingVertical: 10 }}>
                <Text style={{ color: '#b91c1c', marginBottom: 8 }}>Error: {uniError}</Text>
                <TouchableOpacity onPress={() => {
                  setUniError(null);
                  (async () => {
                    try {
                      const q = query(collection(db, 'universities'), orderBy('name', 'asc'));
                      const snap = await getDocs(q);
                      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                      setUniversities(list);
                    } catch (e) {
                      setUniError(e?.message || 'Failed to load universities');
                    }
                  })();
                }} style={{ alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#fee2e2' }}>
                  <Text style={{ color: '#991b1b', fontWeight: '600' }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <ScrollView style={{ marginTop: 12, maxHeight: 420 }}>
              {universities.map(u => (
                <TouchableOpacity
                  key={u.id}
                  onPress={() => {
                    setSelectedUniversity(u);
                    setUniModal(false);
                  }}
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
      <Wave />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 },
  form: { flex: 1, marginTop: 8 },
  secondaryText: { marginTop: 12, textAlign: 'center', color: '#555', fontSize: 14 },
  linkText: { color: '#0053A9', fontSize: 14, fontWeight: '600' },
  selectBox: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d7deec',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f7f8fb',
  },
  selectLabel: { fontSize: 14, color: '#757d8a' },
  selectRow: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectValue: { fontSize: 15, color: '#222' },
  selectChevron: { fontSize: 18, color: '#6b7280' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  uniRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  uniLogo: { width: 32, height: 32, borderRadius: 6, marginRight: 12, backgroundColor: '#f3f4f6' },
  uniFallback: { width: 32, height: 32, borderRadius: 6, marginRight: 12, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  uniFallbackText: { color: '#374151', fontWeight: '700' },
  uniName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  uniCode: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  modalCancel: { alignSelf: 'flex-end', marginTop: 12, paddingVertical: 8, paddingHorizontal: 12 },
  modalCancelText: { color: '#0053A9', fontWeight: '600' },
});
