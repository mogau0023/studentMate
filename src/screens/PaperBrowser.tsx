import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { theme } from '../theme';
import { ScrollView as HScrollView } from 'react-native-gesture-handler';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const years = ['2025', '2024', '2023', '2022'];
const tests = ['Test 1', 'Test 2', 'Test 3', 'Test 4'];

type PaperItem = { id: string; name: string; locked: boolean };
const samplePapersByCategory: Record<string, Record<string, PaperItem[]>> = {
  tests: years.reduce((acc, y) => ({
    ...acc,
    [y]: tests.map((t, idx) => ({ id: `smth011-${y}-t${idx+1}`, name: `SMTH011 ${t} – ${y}`, locked: idx % 2 === 1 }))
  }), {} as Record<string, Array<{id:string; name:string; locked:boolean}>>),
  exams: {
    '2025': [ { id: 'smth011-ex-2025', name: 'SMTH011 Exam – 2025', locked: false } ],
    '2024': [ { id: 'smth011-ex-2024', name: 'SMTH011 Exam – 2024', locked: false } ],
    '2023': [ { id: 'smth011-ex-2023', name: 'SMTH011 Exam – 2023', locked: false } ],
    '2022': [ { id: 'smth011-ex-2022', name: 'SMTH011 Exam – 2022', locked: false } ],
  },
  supplementary_exams: {
    '2025': [ { id: 'smth011-sup-2025', name: 'SMTH011 Supplementary – 2025', locked: false } ],
    '2024': [ { id: 'smth011-sup-2024', name: 'SMTH011 Supplementary – 2024', locked: false } ],
    '2023': [ { id: 'smth011-sup-2023', name: 'SMTH011 Supplementary – 2023', locked: false } ],
    '2022': [ { id: 'smth011-sup-2022', name: 'SMTH011 Supplementary – 2022', locked: false } ],
  }
};

export default function PaperBrowser() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PaperBrowser'>>();
  const { category } = route.params as { category: string };
  const isTests = category === 'tests';
  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [selectedTest, setSelectedTest] = useState(tests[0]);

  const getCategoryDisplayName = () => {
    const categoryMap: { [key: string]: string } = {
      'tests': 'Tests',
      'exams': 'Exams',
      'supplementary_exams': 'Supplementary Exams',
      'practice_problems': 'Practice Problems',
      'notes': 'Notes',
    };
    return categoryMap[category] || category;
  };

  const handlePaperPress = (paper: any) => {
    if (paper.locked) {
      // Handle locked content - could show upgrade prompt
      return;
    }
    navigation.navigate('QuestionViewer', { paperId: paper.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getCategoryDisplayName()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <HScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearSelector}>
          {years.map((year) => (
            <TouchableOpacity key={year} style={[styles.yearChip, selectedYear === year && styles.yearChipActive]} onPress={() => setSelectedYear(year)}>
              <Text style={[styles.yearChipText, selectedYear === year && styles.yearChipTextActive]}>{year}</Text>
            </TouchableOpacity>
          ))}
        </HScrollView>

        {isTests && (
          <HScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearSelector}>
            {tests.map((t) => (
              <TouchableOpacity key={t} style={[styles.yearChip, selectedTest === t && styles.yearChipActive]} onPress={() => setSelectedTest(t)}>
                <Text style={[styles.yearChipText, selectedTest === t && styles.yearChipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </HScrollView>
        )}

        <View style={styles.papersSection}>
          <Text style={styles.sectionTitle}>More Papers</Text>
          {(isTests
            ? (samplePapersByCategory.tests?.[selectedYear] || []).filter((p: PaperItem) => p.name.includes(selectedTest))
            : (samplePapersByCategory[category]?.[selectedYear] || [])
          ).map((paper: PaperItem) => (
            <TouchableOpacity
              key={paper.id}
              style={styles.paperCard}
              onPress={() => handlePaperPress(paper)}
            >
              <Text style={styles.paperName}>{paper.name}</Text>
              <Icon name={paper.locked ? 'lock-outline' : 'chevron-right'} size={20} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  scrollContent: { paddingBottom: 24 },
  yearSelector: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  yearChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: theme.colors.card },
  yearChipActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.secondaryBg },
  yearChipText: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  yearChipTextActive: { color: theme.colors.primary },
  papersSection: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  paperCard: { backgroundColor: theme.colors.card, borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  paperName: { fontSize: 16, color: theme.colors.text, fontWeight: '500' },
});
