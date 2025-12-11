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
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../contexts/AuthContext';
import BrandGlyph from '../components/BrandGlyph';

const categories = [
  { id: 'notes', name: 'Notes', icon: 'book-open-page-variant', color: '#3b82f6' },
  { id: 'practice_problems', name: 'Practice Problems', icon: 'file-document-outline', color: '#f59e0b' },
  { id: 'tests', name: 'Tests', icon: 'clipboard-text-outline', color: '#8b5cf6' },
  { id: 'exams', name: 'Exams', icon: 'school-outline', color: '#ec4899' },
  { id: 'supplementary_exams', name: 'Supplementary Exams', icon: 'file-document-edit-outline', color: '#06b6d4' },
];

export default function Dashboard() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good morning';
    if (hour < 18) return '🌞 Good afternoon';
    return '🌒 Good evening';
  };

  const handleCategoryPress = (category: any) => {
    navigation.navigate('PaperBrowser', { category: category.id });
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(!menuOpen)}>
          <Icon name="menu" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <BrandGlyph size={20} primaryColor={theme.colors.primary} secondaryColor={theme.colors.accent} />
          <Text style={styles.headerTitle}>SMTH011</Text>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Icon name="heart-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <>
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)} />
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Icon name={"logout" as keyof typeof Icon.glyphMap} size={20} color={theme.colors.primary} />
              <Text style={styles.menuItemText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} pointerEvents={menuOpen ? 'none' : 'auto'}>


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
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  menuDropdown: { position: 'absolute', top: 64, left: 16, backgroundColor: theme.colors.card, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 8, width: 180, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 10, zIndex: 1001 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  menuItemText: { fontSize: 15, color: theme.colors.text, fontWeight: '600' },
});
