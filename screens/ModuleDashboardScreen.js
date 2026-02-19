import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_WIDTH = (width - 48 - CARD_GAP) / 2; // 48 padding (24 left + 24 right)

function DashboardCard({ title, icon, color, onPress, library = 'MaterialCommunityIcons' }) {
  const IconComponent = library === 'Feather' ? Feather : MaterialCommunityIcons;
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={[styles.cardTopLine, { backgroundColor: color }]} />
      <View style={styles.cardContent}>
        <IconComponent name={icon} size={32} color={color} style={{ marginBottom: 12 }} />
        <Text style={[styles.cardTitle, { color: color }]}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ModuleDashboardScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { moduleCode, moduleName, moduleId } = route.params || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#0053A9" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{moduleCode}</Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Feather name="heart" size={24} color="#0053A9" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.grid}>
          <DashboardCard
            title="Practice Problems"
            icon="file-document-outline"
            color="#F59E0B" // Orange/Yellow
            onPress={() => navigation.navigate('PracticeTopics', { moduleId: moduleCode, moduleCode })}
          />
          <DashboardCard
            title="Tests"
            icon="clipboard-text-outline"
            color="#8B5CF6" // Purple
            onPress={() => navigation.navigate('AssessmentList', { moduleId: moduleCode, type: 'test', title: 'Tests' })}
          />
          <DashboardCard
            title="Exams"
            icon="school-outline"
            color="#EC4899" // Pink
            onPress={() => navigation.navigate('AssessmentList', { moduleId: moduleCode, type: 'exam', title: 'Exams' })}
          />
          <DashboardCard
            title="Supplementary Exams"
            icon="file-document-edit-outline"
            color="#06B6D4" // Cyan
            onPress={() => navigation.navigate('AssessmentList', { moduleId: moduleCode, type: 'supplementary', title: 'Supplementary Exams' })}
          />
        </View>
      </ScrollView>

      {/* Sticky Bottom Banner Ad */}
      <View style={[styles.bannerContainer, { bottom: insets.bottom }]}>
        <Text style={styles.bannerText}>Ad Banner Placeholder</Text>
      </View>
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
  headerButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0053A9',
  },
  scrollContent: {
    padding: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    marginBottom: CARD_GAP,
    overflow: 'hidden',
    height: 140, // Fixed height for uniformity
  },
  cardTopLine: {
    height: 4,
    width: 40,
    alignSelf: 'center',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: -1, // Pull it up slightly
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  bannerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  bannerText: {
    color: '#888',
    fontSize: 12,
  },
});
