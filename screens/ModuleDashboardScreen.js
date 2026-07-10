import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScreenHeader } from '../components/UI';
import { colors, cardShadow } from '../utils/webTheme';
import { trackEvent } from '../utils/analytics';

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
  const { moduleCode } = route.params || {};

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      <ScreenHeader
        title={moduleCode}
        onBack={() => navigation.goBack()}
        iconColor={colors.brand}
        containerStyle={styles.header}
        titleStyle={styles.headerTitle}
        buttonStyle={styles.headerButton}
        rightIconName="heart"
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}>
        <View style={styles.grid}>
          <DashboardCard
            title="Practice Problems"
            icon="file-document-outline"
            color="#F59E0B" // Orange/Yellow
            onPress={() => {
              trackEvent('feature_open', { feature: 'practice_problems', module_code: String(moduleCode || '') });
              navigation.navigate('PracticeTopics', { moduleId: moduleCode, moduleCode });
            }}
          />
          <DashboardCard
            title="Tests"
            icon="clipboard-text-outline"
            color="#8B5CF6" // Purple
            onPress={() => {
              trackEvent('feature_open', { feature: 'tests', module_code: String(moduleCode || '') });
              navigation.navigate('AssessmentList', { moduleId: moduleCode, type: 'test', title: 'Tests' });
            }}
          />
          <DashboardCard
            title="Exams"
            icon="school-outline"
            color="#EC4899" // Pink
            onPress={() => {
              trackEvent('feature_open', { feature: 'exams', module_code: String(moduleCode || '') });
              navigation.navigate('AssessmentList', { moduleId: moduleCode, type: 'exam', title: 'Exams' });
            }}
          />
          <DashboardCard
            title="Supplementary Exams"
            icon="file-document-edit-outline"
            color="#06B6D4" // Cyan
            onPress={() => {
              trackEvent('feature_open', { feature: 'supplementary_exams', module_code: String(moduleCode || '') });
              navigation.navigate('AssessmentList', { moduleId: moduleCode, type: 'supplementary', title: 'Supplementary Exams' });
            }}
          />
        </View>
      </ScrollView>
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
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.brand,
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    marginBottom: CARD_GAP,
    overflow: 'hidden',
    height: 140, // Fixed height for uniformity
    ...cardShadow,
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
  
});
