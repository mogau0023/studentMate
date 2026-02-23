import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { PrimaryButton } from '../components/UI';

export default function UploadScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleAdminAccess = () => {
    // In a real app, this would open the web admin panel URL
    Linking.openURL('https://studentmate-admin.web.app');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
        
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Upload Content</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Feather name="cloud-lightning" size={32} color="#0053A9" />
          </View>
          <Text style={styles.infoTitle}>Contribute to StudentMATE</Text>
          <Text style={styles.infoText}>
            Help us grow by adding new modules, past papers, and memos. 
            All uploads are reviewed by our team before going live.
          </Text>
        </View>

        <View style={styles.actionSection}>
          <Text style={styles.sectionHeader}>What would you like to upload?</Text>
          
          <TouchableOpacity style={styles.uploadOption}>
            <View style={[styles.optionIcon, { backgroundColor: '#e0f2fe' }]}>
              <Feather name="file-text" size={24} color="#0284c7" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Past Paper / Test</Text>
              <Text style={styles.optionSub}>Upload a PDF of a test or exam</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadOption}>
            <View style={[styles.optionIcon, { backgroundColor: '#dcfce7' }]}>
              <Feather name="check-circle" size={24} color="#16a34a" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Memorandum</Text>
              <Text style={styles.optionSub}>Upload the solution or memo</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.uploadOption}>
            <View style={[styles.optionIcon, { backgroundColor: '#fef3c7' }]}>
              <Feather name="book" size={24} color="#d97706" />
            </View>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>New Module</Text>
              <Text style={styles.optionSub}>Request to add a missing module</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.adminBox}>
          <Text style={styles.adminText}>Are you an Administrator?</Text>
          <TouchableOpacity onPress={handleAdminAccess}>
            <Text style={styles.adminLink}>Go to Admin Panel</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fb' },
  content: { padding: 24 },
  header: { marginBottom: 24 },
  screenTitle: { fontSize: 28, fontWeight: '700', color: '#0053A9' },
  
  infoCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  infoTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  infoText: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },

  actionSection: { marginBottom: 32 },
  sectionHeader: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 16 },
  
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  optionSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },

  adminBox: {
    alignItems: 'center',
    marginTop: 20,
  },
  adminText: { fontSize: 14, color: '#9ca3af', marginBottom: 4 },
  adminLink: { fontSize: 14, fontWeight: '600', color: '#0053A9' },
});
