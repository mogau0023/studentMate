import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { ModuleCard } from '../components/UI';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, limit, onSnapshot, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { Feather } from '@expo/vector-icons';
import { getCachedUser } from '../utils/storage';
import { colors, cardShadow, isWebDark } from '../utils/webTheme';
import { trackError, trackEvent } from '../utils/analytics';

export default function ModulesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [myModules, setMyModules] = useState([]);
  const [userId, setUserId] = useState(auth.currentUser?.uid || null);
  const [universityId, setUniversityId] = useState('');

  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    let unsubAuth;
    (async () => {
      const cached = await getCachedUser();
      if (!userId && cached?.uid) setUserId(cached.uid);
      if (cached?.universityId) setUniversityId(String(cached.universityId));
    })();
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

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = [];
        snap.forEach((d) => {
          const data = d.data() || {};
          const active = data.active !== false;
          const scope = String(data.universityId || 'all');
          const matchesScope = scope === 'all' || (!!universityId && scope === universityId);
          if (active && matchesScope) list.push({ id: d.id, ...data });
        });
        setAnnouncements(list);
      },
      () => setAnnouncements([])
    );
    return unsub;
  }, [universityId]);

  const visibleAnnouncements = useMemo(() => {
    const sorted = [...announcements].sort((a, b) => {
      const at = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const bt = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return bt - at;
    });
    return sorted.slice(0, 3);
  }, [announcements]);

  const deleteModule = async (moduleId) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'users', userId, 'modules', moduleId));
      trackEvent('module_remove', { module_id: String(moduleId || '') });
    } catch (e) {
      trackError(e, 'remove_module');
    }
  };

  const openModule = (code, name, id) => {
    trackEvent('module_open', { module_code: String(code || ''), module_id: String(id || '') });
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
        {visibleAnnouncements.length > 0 ? (
          <View style={styles.annPanel}>
            <View style={styles.annHeader}>
              <Text style={styles.annTitle}>Announcements</Text>
            </View>
            <View>
              {visibleAnnouncements.map((a, idx) => (
                <View key={a.id}>
                  {idx > 0 ? <View style={styles.separator} /> : null}
                  <View style={styles.annRow}>
                    <Text style={styles.annItemTitle} numberOfLines={1}>
                      {String(a.title || 'Announcement')}
                    </Text>
                    <Text style={styles.annItemMsg} numberOfLines={3}>
                      {String(a.message || '')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

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
          <View>
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
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 40 },
  annPanel: {
    marginBottom: 16,
  },
  annHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  annTitle: { fontSize: 14, fontWeight: '700', color: colors.brand },
  annRow: { paddingVertical: 10 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  annItemTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
  annItemMsg: { fontSize: 13, color: colors.textSoft },
  modulesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modulesTitleRow: { flexDirection: 'row', alignItems: 'center' },
  modulesLogo: { width: 32, height: 32, marginRight: 8 },
  modulesTitle: { fontSize: 22, fontWeight: '600', color: colors.brand },
  addCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.brandStrong, alignItems: 'center', justifyContent: 'center' },
  centerArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center' },
  bigAdd: { width: 96, height: 96, borderRadius: 24, backgroundColor: colors.brandStrong, alignItems: 'center', justifyContent: 'center', marginBottom: 24, ...cardShadow },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  emptySub: { fontSize: 14, color: colors.muted },
  deleteAction: {
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 0,
  },
});
