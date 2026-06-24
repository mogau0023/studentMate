import React from 'react';
import { StyleSheet, View } from 'react-native';
import LogoLoader from './LogoLoader';

interface FullScreenLoaderProps {
  visible: boolean;
}

export default function FullScreenLoader({ visible }: FullScreenLoaderProps) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <LogoLoader size={200} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});