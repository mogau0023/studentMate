import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { ModuleCard } from '../components/UI';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import { getCachedUser } from '../utils/storage';

export default function ModulesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [myModules, setMyModules] = useState([]);
  const [userId, setUserId] = useState(auth.currentUser?.uid || null);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let unsubAuth;
    // Fast path: try cached user first
    (async () => {
      if (!userId) {
        const cached = await getCachedUser();
        if (cached?.uid) setUserId(cached.uid);
      }
    })();
    // Subscribe to auth state to catch late initialization
    unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u?.uid) setUserId(u.uid);
    });
    return () => unsubAuth && unsubAuth();
  }, []);

  useEffect(() => {
    setLoading(true);
    if (!userId) return;
    const q = query(collection(db, 'users', userId, 'modules'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setMyModules(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [userId]);

  const deleteModule = async (moduleId) => {
    if (!userId) return;
    await deleteDoc(doc(db, 'users', userId, 'modules', moduleId));
  };

  const openModule = (code, name, id) => {
    navigation.navigate('ModuleDashboard', { moduleCode: code, moduleName: name, moduleId: id });
  };

  const renderDeleteAction = () => {
    return (
      <View style={styles.deleteAction}>
        <Feather name="trash-2" size={24} color="#fff" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.modulesHeader}>
          <View style={styles.modulesTitleRow}>
            <Text style={styles.modulesTitle}>My Modules</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AddModules')} style={styles.addCircle}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerArea}>
            <ActivityIndicator size="large" color="#0053A9" />
          </View>
        ) : myModules.length === 0 ? (
          <View style={styles.centerArea}>
            <View style={styles.emptyState}>
              <TouchableOpacity onPress={() => navigation.navigate('AddModules')} style={styles.bigAdd}>
                <Feather name="plus" size={36} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.emptyTitle}>No modules added</Text>
              <Text style={styles.emptySub}>Add modules to get started</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {myModules.map((m) => (
              <Swipeable
                key={m.id}
                renderRightActions={renderDeleteAction}
                renderLeftActions={renderDeleteAction}
                onSwipeableOpen={() => deleteModule(m.id)}
              >
                <ModuleCard
                  code={m.code}
                  name={m.name}
                  onPress={() => openModule(m.code, m.name, m.moduleId)}
                />
              </Swipeable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 },
  modulesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modulesTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modulesLogo: { width: 32, height: 32, marginRight: 8 },
  modulesTitle: { fontSize: 22, fontWeight: '600', color: '#0053A9' },
  addCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0053A9', alignItems: 'center', justifyContent: 'center' },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center' },
  bigAdd: { width: 96, height: 96, borderRadius: 24, backgroundColor: '#0053A9', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1b1b1f', marginBottom: 4 },
  emptySub: { fontSize: 14, color: '#6b7280' },
  deleteAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 14,
    marginBottom: 10, // Match card margin
  },
});
