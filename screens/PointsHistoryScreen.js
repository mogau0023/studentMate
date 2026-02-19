import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function PointsHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      // Assuming 'pointsHistory' subcollection tracks changes
      // If not, we can simulate or create it when points change
      // For now, let's show a placeholder or empty state if collection doesn't exist
      const q = query(collection(db, 'users', user.uid, 'pointsHistory'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistory(data);
    } catch (error) {
      console.error("Error fetching points history:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#0053A9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0053A9" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
          {history.length > 0 ? (
            history.map((item) => (
              <View key={item.id} style={styles.historyItem}>
                <View style={[styles.iconBox, { backgroundColor: item.type === 'earn' ? '#dcfce7' : '#fee2e2' }]}>
                  <Feather 
                    name={item.type === 'earn' ? 'plus' : 'minus'} 
                    size={18} 
                    color={item.type === 'earn' ? '#16a34a' : '#dc2626'} 
                  />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle}>{item.description || 'Points Transaction'}</Text>
                  <Text style={styles.itemDate}>
                    {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'Unknown Date'}
                  </Text>
                </View>
                <Text style={[styles.itemPoints, { color: item.type === 'earn' ? '#16a34a' : '#dc2626' }]}>
                  {item.type === 'earn' ? '+' : '-'}{item.amount}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Feather name="clock" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No history yet.</Text>
              <Text style={styles.emptySub}>Points earned or spent will appear here.</Text>
            </View>
          )}
        </ScrollView>
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
  content: { padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 16, fontWeight: '500', color: '#1f2937' },
  itemDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  itemPoints: { fontSize: 16, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
});
