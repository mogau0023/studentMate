import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, isWebDark } from '../utils/webTheme';

export const WAVE_HEIGHT = 160;

export function Wave() {
  const insets = useSafeAreaInsets();
  const gradients = isWebDark
    ? {
        g1: ['#0f172a', '#0b1120'],
        g2: ['#111c34', '#0f172a'],
        g3: ['#172554', '#0f172a'],
      }
    : {
        g1: ['#edf4ff', '#dfeaff'],
        g2: ['#e1ecff', '#cfe2ff'],
        g3: ['#d6e6ff', '#c6dbff'],
      };
  return (
    <View pointerEvents="none" style={[styles.wave, { bottom: -insets.bottom }]}>
      <Svg width="100%" height="160" viewBox="0 0 375 160" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradients.g1[0]} />
            <Stop offset="1" stopColor={gradients.g1[1]} />
          </LinearGradient>
          <LinearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradients.g2[0]} />
            <Stop offset="1" stopColor={gradients.g2[1]} />
          </LinearGradient>
          <LinearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradients.g3[0]} />
            <Stop offset="1" stopColor={gradients.g3[1]} />
          </LinearGradient>
        </Defs>
        <Path
          d="M0 60 C 70 30, 150 80, 230 60 C 295 46, 340 52, 375 48 L 375 160 L 0 160 Z"
          fill="url(#g1)"
        />
        <Path
          d="M0 84 C 80 110, 160 56, 240 84 C 300 104, 335 90, 375 102 L 375 160 L 0 160 Z"
          fill="url(#g2)"
        />
        <Path
          d="M0 108 C 90 130, 190 84, 290 112 C 330 124, 355 120, 375 126 L 375 160 L 0 160 Z"
          fill="url(#g3)"
        />
      </Svg>
    </View>
  );
}

export function LogoHeader({ title }) {
  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>StudentMate</Text>
      </View>
      <Text style={styles.screenTitle}>{title}</Text>
    </View>
  );
}

export function PrimaryButton({ label, onPress }) {
  return (
    <TouchableOpacity style={styles.primaryButton} onPress={onPress}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ScreenHeader({
  title,
  onBack,
  leftIconName = 'arrow-left',
  iconColor = '#0053A9',
  right,
  rightIconName,
  onRightPress,
  containerStyle,
  titleStyle,
  buttonStyle,
  rightPlaceholderWidth = 40,
  titleNumberOfLines = 1,
}) {
  const Right =
    right ??
    (rightIconName ? (
      <TouchableOpacity onPress={onRightPress} style={buttonStyle}>
        <Feather name={rightIconName} size={24} color={iconColor} />
      </TouchableOpacity>
    ) : (
      <View style={{ width: rightPlaceholderWidth }} />
    ));

  return (
    <View style={[styles.screenHeader, containerStyle]}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={buttonStyle}>
          <Feather name={leftIconName} size={24} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: rightPlaceholderWidth }} />
      )}

      <Text style={[styles.screenHeaderTitle, titleStyle]} numberOfLines={titleNumberOfLines}>
        {title}
      </Text>

      {Right}
    </View>
  );
}

export function Field({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  iconName,
  rightIconName,
  headerRight,
  isPassword,
}) {
  const [hidden, setHidden] = useState(true);
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {headerRight}
      </View>
      <View style={styles.inputRow}>
        {iconName ? <Feather name={iconName} size={18} color="#a0a7b5" style={styles.inputIcon} /> : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? hidden : false}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.toggleButton}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : rightIconName ? (
          <Feather name={rightIconName} size={18} color={colors.muted} style={styles.inputRightIcon} />
        ) : null}
      </View>
    </View>
  );
}

export function SectionTitle({ text }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

export function ModuleCard({ code, name, actionLabel, onPress }) {
  const content = (
    <View style={{ flex: 1 }}>
      <Text style={styles.cardCode}>{code}</Text>
      <Text style={styles.cardName}>{name}</Text>
    </View>
  );

  return (
    <View style={styles.listRow}>
      {onPress ? (
        <TouchableOpacity style={{ flex: 1 }} onPress={onPress} activeOpacity={0.7}>
          {content}
        </TouchableOpacity>
      ) : (
        content
      )}

      {actionLabel ? <Text style={styles.listActionText}>{actionLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.brand,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: colors.brandStrong,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  field: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.input,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputRightIcon: {
    marginLeft: 8,
  },
  toggleButton: {
    marginLeft: 8,
    padding: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 160,
    width: '100%',
    overflow: 'hidden',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenHeaderTitle: {
    flex: 1,
    textAlign: 'center',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cardCode: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  cardName: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  listActionText: {
    marginLeft: 12,
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: 8,
  },
});
