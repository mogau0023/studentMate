import React from 'react';
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

const categories = [
  { id: 'notes', name: 'Notes', icon: 'book-open-page-variant', color: '#3b82f6' },
  { id: 'quiz_tests', name: 'Quiz Tests', icon: 'calculator', color: '#ef4444' },
  { id: 'activities', name: 'Activities', icon: 'pencil', color: '#10b981' },
  { id: 'practice_problems', name: 'Practice Problems', icon: 'file-document-outline', color: '#f59e0b' },
  { id: 'march_tests', name: 'March Tests', icon: 'calendar-month-outline', color: '#8b5cf6' },
  { id: 'june_exams', name: 'June Exams', icon: 'calendar-month-outline', color: '#ec4899' },
  { id: 'preliminary_exams', name: 'Preliminary Exams', icon: 'trophy-outline', color: '#06b6d4' },
  { id: 'november_exams', name: 'November Exams', icon: 'calendar-month-outline', color: '#84cc16' },
];

export default function Dashboard() {
  const navigation = useNavigation();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good morning';
    if (hour < 18) return '🌞 Good afternoon';
    return '🌒 Good evening';
  };

  const handleCategoryPress = (category: any) => {
    navigation.navigate('PaperBrowser', { category: category.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Icon name="menu" size={24} color="#1e3a8a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learner Dashboard</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Icon name="heart-outline" size={24} color="#1e3a8a" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeText}>
            {getGreeting()}, mogau? Stay sharp this bright summer night 🌞!
          </Text>
        </View>

        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            const iconName = category.icon as string;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                  <Icon name={iconName} size={32} color={category.color} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
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
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  favoriteButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  welcomeBanner: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
    textAlign: 'center',
  },
});
