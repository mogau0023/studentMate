import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp, where, doc, getDoc } from 'firebase/firestore';

export default function AddModulesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [uniId, setUniId] = useState(null);

  useEffect(() => {
    const current = auth.currentUser;
    if (!current) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', current.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data?.universityId) setUniId(data.universityId);
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (!uniId) return;
    const q = query(collection(db, 'modules'), where('universityId', '==', uniId));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setCatalog(list);
    });
    return unsub;
  }, [uniId]);

  useEffect(() => {
    const current = auth.currentUser;
    if (!current) return;
    const q = query(collection(db, 'users', current.uid, 'modules'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setMyModules(list);
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return catalog;
    return catalog.filter(
      (m) =>
        (m.code && String(m.code).toLowerCase().includes(s)) ||
        (m.name && String(m.name).toLowerCase().includes(s)) ||
        (m.university && String(m.university).toLowerCase().includes(s))
    );
  }, [search, catalog]);

  const norm = (s) => String(s || '').toUpperCase();
  const isAdded = (code) => myModules.some((m) => norm(m.code) === norm(code));

  const addModule = async (mod) => {
    const current = auth.currentUser;
    if (!current || !mod) return;
    if (isAdded(mod.code)) return;
    try {
      await addDoc(collection(db, 'users', current.uid, 'modules'), {
        code: norm(mod.code),
        name: mod.name || '',
        moduleId: mod.id, // Save the original module ID
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      Alert.alert('Cannot add module', e.message ?? 'Permission or network error');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Modules</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={[styles.searchBar, { marginHorizontal: 24 }]}>
        <Feather name="search" size={18} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search modules"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 24 }}>
        {filtered.map((m) => (
          <View key={`${m.id}-${m.code}`} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.code}>{m.code}</Text>
              <Text style={styles.name}>{m.name}</Text>
            </View>
            {isAdded(m.code) ? (
              <View style={styles.addedBadge}>
                <Feather name="check" size={16} color="#0053A9" />
                <Text style={styles.addedText}>Added</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => addModule(m)} style={styles.plusCircle}>
                <Feather name="plus" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 14, paddingBottom: 8 },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, textAlign: 'left', fontSize: 20, fontWeight: '600', color: '#111827' },
  searchBar: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7deec',
    backgroundColor: '#f7f8fb',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: '#111827', fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 12,
  },
  code: { fontSize: 15, fontWeight: '600', color: '#111827' },
  name: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  plusCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#0053A9', alignItems: 'center', justifyContent: 'center' },
  addedBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, borderColor: '#c7d7f5', paddingHorizontal: 10, paddingVertical: 6 },
  addedText: { marginLeft: 6, color: '#0053A9', fontWeight: '600', fontSize: 12 },
});

