import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp, where, doc, getDoc } from 'firebase/firestore';
import { getCachedUser } from '../utils/storage';
import { ScreenHeader } from '../components/UI';
import { colors } from '../utils/webTheme';
import { trackError, trackEvent } from '../utils/analytics';

export default function AddModulesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState([]);
  const [myModules, setMyModules] = useState([]);
  const [uniId, setUniId] = useState(null);
  const [userId, setUserId] = useState(auth.currentUser?.uid || null);
  const lastLoggedSearchRef = useRef('');

  useEffect(() => {
    // Try cached user first for cold start
    (async () => {
      if (!userId) {
        const cached = await getCachedUser();
        if (cached?.uid) setUserId(cached.uid);
      }
    })();
    // Listen for auth ready
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u?.uid) setUserId(u.uid);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', userId));
        if (snap.exists()) {
          const data = snap.data();
          if (data?.universityId) setUniId(data.universityId);
        }
      } catch (e) {}
    })();
  }, [userId]);

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
    if (!userId) return;
    const q = query(collection(db, 'users', userId, 'modules'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setMyModules(list);
    });
    return unsub;
  }, [userId]);

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

  useEffect(() => {
    const q = search.trim();
    if (!q) {
      lastLoggedSearchRef.current = '';
      return;
    }
    const handle = setTimeout(() => {
      if (lastLoggedSearchRef.current === q) return;
      lastLoggedSearchRef.current = q;
      trackEvent('module_search', {
        query_len: q.length,
        results_count: filtered.length,
        failed: filtered.length === 0,
      });
    }, 600);
    return () => clearTimeout(handle);
  }, [search, filtered.length]);

  const norm = (s) => String(s || '').toUpperCase();
  const isAdded = (code) => myModules.some((m) => norm(m.code) === norm(code));

  const addModule = async (mod) => {
    const current = auth.currentUser;
    const uid = current?.uid || userId;
    if (!uid || !mod) return;
    if (isAdded(mod.code)) return;
    try {
      await addDoc(collection(db, 'users', uid, 'modules'), {
        code: norm(mod.code),
        name: mod.name || '',
        moduleId: mod.id, // Save the original module ID
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      trackEvent('module_add', {
        module_code: norm(mod.code),
        module_id: String(mod.id || ''),
      });
    } catch (e) {
      trackError(e, 'add_module');
      Alert.alert('Cannot add module', e.message ?? 'Permission or network error');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Add Modules"
        onBack={() => navigation.goBack()}
        leftIconName="chevron-left"
        iconColor={colors.text}
        containerStyle={styles.headerRow}
        titleStyle={styles.headerTitle}
        buttonStyle={styles.backBtn}
        rightPlaceholderWidth={22}
      />

      <View style={[styles.searchBar, { marginHorizontal: 24 }]}>
        <Feather name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search modules"
          placeholderTextColor={colors.muted}
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
                <Feather name="check" size={16} color={colors.brand} />
                <Text style={styles.addedText}>Added</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => addModule(m)} style={styles.plusCircle} activeOpacity={0.7}>
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
  safeArea: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 14, paddingBottom: 8 },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { flex: 1, textAlign: 'left', fontSize: 20, fontWeight: '600', color: colors.text },
  searchBar: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  code: { fontSize: 15, fontWeight: '600', color: colors.text },
  name: { fontSize: 13, color: colors.muted, marginTop: 2 },
  plusCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brandStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.infoBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.accentSoft,
  },
  addedText: { marginLeft: 6, color: colors.brand, fontWeight: '600', fontSize: 12 },
});

