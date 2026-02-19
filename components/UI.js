import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Image, Modal, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const WAVE_HEIGHT = 160;

export function Wave() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="none" style={[styles.wave, { bottom: -insets.bottom }]}>
      <Svg width="100%" height="160" viewBox="0 0 375 160" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#edf4ff" />
            <Stop offset="1" stopColor="#dfeaff" />
          </LinearGradient>
          <LinearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#e1ecff" />
            <Stop offset="1" stopColor="#cfe2ff" />
          </LinearGradient>
          <LinearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#d6e6ff" />
            <Stop offset="1" stopColor="#c6dbff" />
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
          placeholderTextColor="#a0a7b5"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isPassword ? hidden : false}
          keyboardType={keyboardType}
          style={styles.input}
        />
        {isPassword ? (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.toggleButton}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color="#6b7280" />
          </TouchableOpacity>
        ) : rightIconName ? (
          <Feather name={rightIconName} size={18} color="#a0a7b5" style={styles.inputRightIcon} />
        ) : null}
      </View>
    </View>
  );
}

export function SectionTitle({ text }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}

export function ModuleCard({ code, name, actionLabel, onPress }) {
  if (actionLabel) {
    return (
      <View style={styles.cardRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardCode}>{code}</Text>
          <Text style={styles.cardName}>{name}</Text>
        </View>
        <TouchableOpacity onPress={onPress} style={styles.cardAction}>
          <Text style={styles.cardActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.cardRow} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardCode}>{code}</Text>
        <Text style={styles.cardName}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function AddModuleModal({ visible, onClose, onSubmit }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const handleAdd = () => {
    if (!code || !name) return;
    onSubmit({ code: code.trim().toUpperCase(), name: name.trim() });
    setCode('');
    setName('');
  };
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Add Module</Text>
          <View style={{ marginTop: 12 }}>
            <Field
              label="Code"
              placeholder="e.g., COS132"
              value={code}
              onChangeText={setCode}
              iconName="tag"
            />
            <Field
              label="Name"
              placeholder="e.g., Computer Science 132"
              value={name}
              onChangeText={setName}
              iconName="book"
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalSecondary}>
              <Text style={styles.modalSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} style={styles.modalPrimary}>
              <Text style={styles.modalPrimaryText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    color: '#0053A9',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1b1b1f',
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: '#0053A9',
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
    color: '#757d8a',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7deec',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f7f8fb',
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
    color: '#222222',
  },
  wave: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 160,
    width: '100%',
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    marginBottom: 10,
  },
  cardCode: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardName: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  cardAction: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#0053A9',
  },
  cardActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modalSecondaryText: {
    fontSize: 14,
    color: '#4b5563',
  },
  modalPrimary: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#0053A9',
  },
  modalPrimaryText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});

