import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export default function PracticePapersScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { moduleId, moduleCode, topic } = route.params;
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('AssessmentViewer', { assessment: item })}
    >
      <View style={styles.cardContent}>
        <Feather name="file-text" size={24} color="#0053A9" style={{ marginRight: 12 }} />
        <View>
          <Text style={styles.cardTitle}>{item.title || 'Practice Paper'}</Text>
          <Text style={styles.cardSubtitle}>{new Date(item.createdAt?.toDate()).toLocaleDateString()}</Text>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#0053A9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{topic}</Text>
        <View style={{ width: 40 }} />
      </View>

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
  safeArea: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1b1b1f' },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '500', color: '#333' },
  cardSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyText: { color: '#888', fontSize: 16 },
});
