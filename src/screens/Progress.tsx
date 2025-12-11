import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Target, Clock, Award, TrendingUp } from 'lucide-react-native';

const progressData = {
  totalQuestions: 156,
  completedQuestions: 89,
  studyStreak: 7,
  totalTime: '12h 34m',
  categories: [
    { name: 'Algebra', completed: 25, total: 40 },
    { name: 'Geometry', completed: 18, total: 35 },
    { name: 'Calculus', completed: 15, total: 30 },
    { name: 'Statistics', completed: 12, total: 25 },
    { name: 'Trigonometry', completed: 19, total: 26 },
  ],
};

export default function Progress() {
  const completionPercentage = Math.round((progressData.completedQuestions / progressData.totalQuestions) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress Tracker</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Overview Cards */}
        <View style={styles.overviewCards}>
          <View style={styles.overviewCard}>
            <Target size={32} color="#3b82f6" />
            <Text style={styles.overviewValue}>{completionPercentage}%</Text>
            <Text style={styles.overviewLabel}>Completion</Text>
          </View>
          <View style={styles.overviewCard}>
            <Clock size={32} color="#10b981" />
            <Text style={styles.overviewValue}>{progressData.studyStreak}</Text>
            <Text style={styles.overviewLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.overviewCards}>
          <View style={styles.overviewCard}>
            <Award size={32} color="#f59e0b" />
            <Text style={styles.overviewValue}>{progressData.completedQuestions}</Text>
            <Text style={styles.overviewLabel}>Questions Done</Text>
          </View>
          <View style={styles.overviewCard}>
            <TrendingUp size={32} color="#8b5cf6" />
            <Text style={styles.overviewValue}>{progressData.totalTime}</Text>
            <Text style={styles.overviewLabel}>Study Time</Text>
          </View>
        </View>

        {/* Category Progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Progress</Text>
          {progressData.categories.map((category, index) => {
            const percentage = Math.round((category.completed / category.total) * 100);
            return (
              <View key={index} style={styles.categoryCard}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryPercentage}>{percentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { width: `${percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.categoryStats}>
                  {category.completed} / {category.total} questions
                </Text>
              </View>
            );
          })}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              🎯 Completed 5 algebra questions
            </Text>
            <Text style={styles.activityTime}>2 hours ago</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              📚 Studied for 45 minutes
            </Text>
            <Text style={styles.activityTime}>Yesterday</Text>
          </View>
          <View style={styles.activityCard}>
            <Text style={styles.activityText}>
              🏆 Achieved 7-day study streak
            </Text>
            <Text style={styles.activityTime}>2 days ago</Text>
          </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  scrollContent: {
    padding: 20,
  },
  overviewCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginTop: 8,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  categoryPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  categoryStats: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
  },
  activityCard: {
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
  activityText: {
    fontSize: 16,
    color: '#374151',
  },
  activityTime: {
    fontSize: 14,
    color: '#9ca3af',
  },
});