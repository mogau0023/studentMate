import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const sampleQuestions = [
  {
    id: '1',
    number: 'Q1',
    content: 'Compute d/dx [x^3 sin(x)]',
    marks: 5,
    answer: "Use product rule: (x^3)' sin x + x^3 (sin x)' = 3x^2 sin x + x^3 cos x",
  },
  {
    id: '2',
    number: 'Q2',
    content: 'Evaluate limit as x→0 of (sin x)/x',
    marks: 3,
    answer: 'Standard limit: lim_{x→0} (sin x)/x = 1',
  },
  {
    id: '3',
    number: 'Q3',
    content: 'Find the derivative of f(x)=e^{2x}',
    marks: 3,
    answer: "f'(x)=2e^{2x}",
  },
];

export default function QuestionViewer() {
  const navigation = useNavigation();
  const [showAnswers, setShowAnswers] = useState<{ [key: string]: boolean }>({});
  const [showVideo, setShowVideo] = useState<{ [key: string]: boolean }>({});
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleAnswer = (questionId: string) => {
    setShowAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleVideo = (questionId: string) => {
    setShowVideo(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const toggleFavorite = (questionId: string) => {
    setFavorites(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
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
        <Text style={styles.headerTitle}>QUESTION 1</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="file-document-outline" size={24} color="#1e3a8a" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="heart-outline" size={24} color="#1e3a8a" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {sampleQuestions.map((question) => (
          <View key={question.id} style={styles.questionCard}>
            <View style={styles.questionHeader}>
              <View style={styles.headerAccent} />
              <Text style={styles.questionNumber}>{question.number}</Text>
              <Text style={styles.marksBadge}>{question.marks}</Text>
            </View>
            
            <View style={styles.questionContent}>
              <Text style={styles.questionText}>{question.content}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.pillButton, showAnswers[question.id] && styles.pillButtonActive]}
                onPress={() => toggleAnswer(question.id)}
              >
                <Text style={styles.actionButtonText}>
                  {showAnswers[question.id] ? 'Hide Answers' : 'View Answers'}
                </Text>
                <Icon name={showAnswers[question.id] ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pillButton, showVideo[question.id] && styles.pillButtonActive]}
                onPress={() => toggleVideo(question.id)}
              >
                <Text style={styles.actionButtonText}>
                  {showVideo[question.id] ? 'Hide Video' : 'Video Solutions'}
                </Text>
                <Icon name={showVideo[question.id] ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {showAnswers[question.id] && (
              <View style={styles.answerSection}>
                <Text style={styles.answerTitle}>Solution:</Text>
                <Text style={styles.answerText}>{question.answer}</Text>
              </View>
            )}

            {showVideo[question.id] && (
              <View style={styles.videoSection}>
                <Text style={styles.videoText}>Video solution would be displayed here</Text>
              </View>
            )}
          </View>
        ))}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerAccent: { width: 4, height: 20, backgroundColor: theme.colors.primary, borderRadius: 4 },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  marksBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: theme.colors.secondaryBg, color: theme.colors.primary, fontWeight: '700' },
  questionContent: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
  },
  actionButtons: { gap: 10, flexDirection: 'row' },
  pillButton: { backgroundColor: theme.colors.secondaryBg, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  pillButtonActive: { backgroundColor: '#e2e8f0' },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  answerSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.bg,
    borderRadius: 8,
  },
  answerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  videoSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    alignItems: 'center',
  },
  videoText: {
    fontSize: 14,
    color: theme.colors.accent,
  },
});
