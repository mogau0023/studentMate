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

const sampleQuestions = [
  {
    id: '1',
    number: '1.1.1',
    content: 'x² − 7x + 10 = 0',
    marks: 2,
    answer: 'Using the quadratic formula:\n\nx = (7 ± √(49 - 40)) / 2\nx = (7 ± √9) / 2\nx = (7 ± 3) / 2\n\nTherefore: x = 5 or x = 2',
  },
  {
    id: '2',
    number: '1.1.2',
    content: '3x² + 2x + 6 = 10 (correct to two decimal places)',
    marks: 4,
    answer: 'Rearranging: 3x² + 2x - 4 = 0\n\nUsing quadratic formula:\nx = (-2 ± √(4 + 48)) / 6\nx = (-2 ± √52) / 6\nx = (-2 ± 7.21) / 6\n\nx = 0.87 or x = -1.54 (to 2 decimal places)',
  },
  {
    id: '3',
    number: '1.1.3',
    content: 'x³ + 3x² − 28 = 0',
    marks: 4,
    answer: 'By inspection, x = 2 is a root.\n\nUsing polynomial division or synthetic division:\n(x - 2)(x² + 5x + 14) = 0\n\nThe quadratic x² + 5x + 14 has discriminant = 25 - 56 = -31 < 0\n\nTherefore, the only real solution is x = 2',
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
          <Icon name="chevron-left" size={24} color="#1e3a8a" />
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
              <Text style={styles.questionNumber}>{question.number}</Text>
              <Text style={styles.marks}>({question.marks})</Text>
            </View>
            
            <View style={styles.questionContent}>
              <Text style={styles.questionText}>{question.content}</Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleAnswer(question.id)}
              >
                <Text style={styles.actionButtonText}>
                  {showAnswers[question.id] ? 'Hide Answers' : 'View Answers'}
                </Text>
                {showAnswers[question.id] ? (
                  <Icon name="chevron-up" size={16} color="#1e3a8a" />
                ) : (
                  <Icon name="chevron-down" size={16} color="#1e3a8a" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleVideo(question.id)}
              >
                <Text style={styles.actionButtonText}>
                  {showVideo[question.id] ? 'Hide Video' : 'Video Solutions'}
                </Text>
                {showVideo[question.id] ? (
                  <Icon name="chevron-up" size={16} color="#1e3a8a" />
                ) : (
                  <Icon name="chevron-down" size={16} color="#1e3a8a" />
                )}
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
    backgroundColor: '#ffffff',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  marks: {
    fontSize: 16,
    color: '#9ca3af',
  },
  questionContent: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a8a',
  },
  answerSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  answerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  answerText: {
    fontSize: 14,
    color: '#374151',
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
    color: '#6366f1',
  },
});
