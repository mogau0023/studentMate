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
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';

const categories = [
  { id: 'notes', name: 'Notes', icon: 'book-open-page-variant', color: '#3b82f6' },
  { id: 'practice_problems', name: 'Practice Problems', icon: 'file-document-outline', color: '#f59e0b' },
  { id: 'tests', name: 'Tests', icon: 'clipboard-text-outline', color: '#8b5cf6' },
  { id: 'exams', name: 'Exams', icon: 'school-outline', color: '#ec4899' },
  { id: 'supplementary_exams', name: 'Supplementary Exams', icon: 'file-document-edit-outline', color: '#06b6d4' },
];

export default function Dashboard() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

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
          <Icon name="menu" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Learner Dashboard</Text>
        <TouchableOpacity style={styles.favoriteButton}>
          <Icon name="heart-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={[theme.colors.primary, '#3b82f6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.welcomeBanner}>
          <Text style={styles.welcomeText}>
            {getGreeting()} • {theme.brandName} • SMTH011 Introduction to Calculus
          </Text>
        </LinearGradient>

        <View style={styles.categoriesGrid}>
          {categories.map((category) => {
            const iconName = category.icon as keyof typeof Icon.glyphMap;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={[styles.iconContainer, { borderTopColor: category.color, borderTopWidth: 4, backgroundColor: theme.colors.card }] }>
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
  menuButton: {
    padding: 8,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary },
  favoriteButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  welcomeBanner: { marginHorizontal: 20, marginVertical: 16, padding: 16, borderRadius: 12 },
  welcomeText: { fontSize: 18, color: '#ffffff', textAlign: 'center', lineHeight: 24 },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  categoryCard: { width: '48%', backgroundColor: theme.colors.card, borderRadius: 12, paddingVertical: 16, paddingHorizontal: 12, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  iconContainer: { width: 64, height: 64, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  categoryName: { fontSize: 15, fontWeight: '600', color: theme.colors.primary, textAlign: 'center' },
});
