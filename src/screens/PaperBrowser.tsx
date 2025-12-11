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
import { useNavigation, useRoute } from '@react-navigation/native';

const years = ['2025', '2024', '2023', '2022'];

const samplePapers = {
  '2025': [
    { id: '1', name: 'March Test (EC)', locked: true },
    { id: '2', name: 'March Test (LP)', locked: true },
    { id: '3', name: 'March Test (MP)', locked: true },
    { id: '4', name: 'March Test (NC)', locked: true },
  ],
  '2024': [
    { id: '5', name: 'March Test (KZN)', locked: true },
    { id: '6', name: 'June Exam', locked: false },
    { id: '7', name: 'Preliminary Exam', locked: false },
  ],
  '2023': [
    { id: '8', name: 'March Test (KZN)', locked: false },
    { id: '9', name: 'June Exam', locked: false },
    { id: '10', name: 'November Exam', locked: false },
  ],
  '2022': [
    { id: '11', name: 'March Test', locked: false },
    { id: '12', name: 'June Exam', locked: false },
    { id: '13', name: 'Preliminary Exam', locked: false },
    { id: '14', name: 'November Exam', locked: false },
  ],
};

export default function PaperBrowser() {
  const navigation = useNavigation();
  const route = useRoute();
  const { category } = route.params as { category: string };
  const [selectedYear, setSelectedYear] = useState('2025');

  const getCategoryDisplayName = () => {
    const categoryMap: { [key: string]: string } = {
      'march_tests': 'March Tests',
      'june_exams': 'June Exams',
      'preliminary_exams': 'Preliminary Exams',
      'november_exams': 'November Exams',
      'practice_problems': 'Practice Problems',
      'quiz_tests': 'Quiz Tests',
      'activities': 'Activities',
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
          <Icon name="chevron-left" size={24} color="#1e3a8a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getCategoryDisplayName()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.yearSelector}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[
                styles.yearButton,
                selectedYear === year && styles.yearButtonActive,
              ]}
              onPress={() => setSelectedYear(year)}
            >
              <Text
                style={[
                  styles.yearButtonText,
                  selectedYear === year && styles.yearButtonTextActive,
                ]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.papersSection}>
          <Text style={styles.sectionTitle}>More Papers</Text>
          {samplePapers[selectedYear as keyof typeof samplePapers]?.map((paper) => (
            <TouchableOpacity
              key={paper.id}
              style={styles.paperCard}
              onPress={() => handlePaperPress(paper)}
            >
              <Text style={styles.paperName}>{paper.name}</Text>
              {paper.locked && <Icon name="lock-outline" size={20} color="#6b7280" />}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  yearButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 80,
    alignItems: 'center',
  },
  yearButtonActive: {
    backgroundColor: '#1e40af',
  },
  yearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  yearButtonTextActive: {
    color: '#ffffff',
  },
  papersSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  paperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paperName: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});
