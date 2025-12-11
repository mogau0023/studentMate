import React from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '../theme';
import BrandGlyph from '../components/BrandGlyph';

export default function StartupSplash() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <BrandGlyph size={72} primaryColor={theme.colors.primary} secondaryColor={theme.colors.accent} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

