import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ScreenHeader } from '../components/UI';
import { colors } from '../utils/webTheme';

export default function EditProfileScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { currentName, currentUni } = route.params || {};
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName: name });
        await updateDoc(doc(db, 'users', user.uid), { name: name });
        Alert.alert('Success', 'Profile updated successfully.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Edit Profile"
        onBack={() => navigation.goBack()}
        iconColor={colors.text}
        containerStyle={styles.header}
        titleStyle={styles.headerTitle}
        buttonStyle={styles.headerButton}
        rightPlaceholderWidth={40}
      />

      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>University</Text>
          <View style={[styles.input, styles.disabledInput]}>
            <Text style={{ color: '#6b7280' }}>{currentUni || 'Not set'}</Text>
            <Feather name="lock" size={16} color="#9ca3af" />
          </View>
          <Text style={styles.helperText}>Contact support to change university.</Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: { padding: 24 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSoft, marginBottom: 8 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.input,
  },
  disabledInput: {
    backgroundColor: colors.surfaceMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: colors.borderSoft,
  },
  helperText: { fontSize: 12, color: colors.muted, marginTop: 6 },
  saveButton: {
    backgroundColor: colors.brandStrong,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
