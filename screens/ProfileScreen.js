import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const user = auth.currentUser;
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profile</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.name || 'Student'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <Text style={styles.userUni}>{profile?.universityName || profile?.university || 'University not set'}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile?.points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e0f2fe' }]}>
            <Text style={[styles.statValue, { color: '#0284c7' }]}>
              {profile?.subscriptionActive ? 'PRO' : 'FREE'}
            </Text>
            <Text style={[styles.statLabel, { color: '#0369a1' }]}>Plan</Text>
          </View>
        </View>

        {/* Upgrade Banner */}
        {!profile?.subscriptionActive && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => console.log('Go to subscription')}>
            <View>
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeSub}>Get unlimited access to memos & videos</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeader}>Account</Text>
          
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('EditProfile', { currentName: profile?.name, currentUni: profile?.universityName || profile?.university })}
          >
            <Feather name="edit-2" size={20} color="#666" />
            <Text style={styles.menuText}>Edit Profile</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => navigation.navigate('PointsHistory')}
          >
            <Feather name="clock" size={20} color="#666" />
            <Text style={styles.menuText}>Points History</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => console.log('Notifications')}>
            <Feather name="bell" size={20} color="#666" />
            <Text style={styles.menuText}>Notifications</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuHeader}>Support</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => console.log('Help')}>
            <Feather name="help-circle" size={20} color="#666" />
            <Text style={styles.menuText}>Help & FAQ</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => console.log('Terms')}>
            <Feather name="file-text" size={20} color="#666" />
            <Text style={styles.menuText}>Terms & Privacy</Text>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Feather name="log-out" size={20} color="#ef4444" />
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>StudentMATE v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fb' },
  content: { padding: 24 },
  header: { marginBottom: 24 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: '#0053A9' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0053A9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6b7280', marginBottom: 2 },
  userUni: { fontSize: 13, color: '#0053A9', fontWeight: '500' },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  statValue: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0053A9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  upgradeTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  upgradeSub: { fontSize: 12, color: '#dbeafe' },
  menuSection: { marginBottom: 24 },
  menuHeader: { fontSize: 14, fontWeight: '600', color: '#9ca3af', marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuText: { flex: 1, fontSize: 16, color: '#374151', marginLeft: 12, fontWeight: '500' },
  versionText: { textAlign: 'center', color: '#9ca3af', fontSize: 12, marginTop: 8 },
});
