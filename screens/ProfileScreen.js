import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { saveUserToCache, clearCachedUser } from '../utils/storage';
import { colors, cardShadow } from '../utils/webTheme';

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
        const data = docSnap.data();
        setProfile(data);
        await saveUserToCache({
          uid: user.uid,
          email: user.email,
          name: data?.name || user.displayName || '',
          universityId: data?.universityId || '',
          universityName: data?.universityName || data?.university || '',
        });
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
      await clearCachedUser();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
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

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeader}>Account</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('EditProfile', { currentName: profile?.name, currentUni: profile?.universityName || profile?.university })}
          >
            <Text style={styles.menuText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => console.log('Notifications')}>
            <Text style={styles.menuText}>Notifications</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuHeader}>Support</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => console.log('Help')}>
            <Text style={styles.menuText}>Help & FAQ</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Terms")}>
            <Text style={styles.menuText}>Terms Of Use</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("Privacy")}>
            <Text style={styles.menuText}>Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate("ReportProblem")}>
            <Text style={styles.menuText}>Report a problem</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuText, { color: '#ef4444' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>StudentMATE v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundAlt },
  content: { padding: 24 },
  header: { marginBottom: 24 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: colors.brand },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    ...cardShadow,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brandStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 28, fontWeight: '600', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: colors.muted, marginBottom: 2 },
  userUni: { fontSize: 13, color: colors.brand, fontWeight: '500' },
  menuSection: { marginBottom: 24 },
  menuHeader: { fontSize: 14, fontWeight: '600', color: colors.muted, marginBottom: 12, marginLeft: 4, textTransform: 'uppercase' },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuText: { fontSize: 16, color: colors.textSoft, fontWeight: '500' },
  versionText: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 8 },
});
