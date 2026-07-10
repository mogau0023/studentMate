import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ScreenHeader } from '../components/UI';
import { colors } from '../utils/webTheme';
import { trackError, trackEvent } from '../utils/analytics';

export default function PracticeTopicsScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { moduleId, moduleCode } = route.params;
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackEvent('practice_topics_open', { module_id: String(moduleId || ''), module_code: String(moduleCode || '') });
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const q = query(
        collection(db, 'assessments'),
        where('moduleId', '==', moduleId),
        where('type', '==', 'practice')
      );
      
      const snapshot = await getDocs(q);
      const uniqueTopics = new Set();
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.topic) {
          uniqueTopics.add(data.topic);
        }
      });

      setTopics(Array.from(uniqueTopics).sort());
    } catch (error) {
      console.error("Error fetching topics:", error);
      trackError(error, 'fetch_practice_topics');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.row}
      onPress={() => {
        trackEvent('practice_topic_open', { module_id: String(moduleId || ''), topic: String(item || '') });
        navigation.navigate('PracticePapers', { moduleId, moduleCode, topic: item });
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.rowTitle}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Practice Topics"
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
          data={topics}
          renderItem={renderItem}
          keyExtractor={(item) => item}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No practice topics found.</Text>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: colors.muted, fontSize: 16 },
});
