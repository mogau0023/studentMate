import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ScreenHeader } from '../components/UI';
//import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { adsEnabled, interstitialUnitId } from '../utils/ads';
import { colors } from '../utils/webTheme';

export default function PracticePapersScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { moduleId, moduleCode, topic } = route.params;
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  const interstitialRef = useRef(null);
  const interstitialLoadedRef = useRef(false);
  const pendingAssessmentRef = useRef(null);

  useEffect(() => {
    if (!adsEnabled()) return;

    if (!interstitialRef.current) {
      interstitialRef.current = InterstitialAd.createForAdRequest(interstitialUnitId());
    }

    const interstitial = interstitialRef.current;
    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitialLoadedRef.current = true;
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      interstitialLoadedRef.current = false;
      try {
        interstitial.load();
      } catch {}

      const next = pendingAssessmentRef.current;
      pendingAssessmentRef.current = null;
      if (next) navigation.navigate('AssessmentViewer', { assessment: next });
    });
    const unsubError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
      interstitialLoadedRef.current = false;
      const next = pendingAssessmentRef.current;
      pendingAssessmentRef.current = null;
      if (next) navigation.navigate('AssessmentViewer', { assessment: next });
    });

    interstitial.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, [navigation]);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      const q = query(
        collection(db, 'assessments'),
        where('moduleId', '==', moduleId),
        where('type', '==', 'practice'),
        where('topic', '==', topic),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const papersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setPapers(papersData);
    } catch (error) {
      console.error("Error fetching papers:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAssessment = (assessment) => {
    if (!adsEnabled() || !interstitialLoadedRef.current) {
      navigation.navigate('AssessmentViewer', { assessment });
      try {
        interstitialRef.current?.load();
      } catch {}
      return;
    }

    pendingAssessmentRef.current = assessment;
    try {
      interstitialRef.current?.show();
    } catch {
      pendingAssessmentRef.current = null;
      navigation.navigate('AssessmentViewer', { assessment });
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.row}
      onPress={() => openAssessment(item)}
      activeOpacity={0.7}
    >
      <View>
        <Text style={styles.rowTitle}>{item.title || 'Practice Paper'}</Text>
        <Text style={styles.rowSubtitle}>{new Date(item.createdAt?.toDate()).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={topic}
        onBack={() => navigation.goBack()}
        iconColor={colors.brand}
        containerStyle={styles.header}
        titleStyle={styles.headerTitle}
        buttonStyle={styles.headerButton}
        rightPlaceholderWidth={40}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0053A9" />
        </View>
      ) : (
        <FlatList
          data={papers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No papers found for this topic.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  row: { paddingVertical: 14 },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  rowTitle: { fontSize: 16, fontWeight: '500', color: colors.text },
  rowSubtitle: { fontSize: 12, color: colors.muted, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: colors.muted, fontSize: 16 },
});
