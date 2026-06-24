import { Platform } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';

export const isWebDark = Platform.OS === 'web';

export const colors = isWebDark
  ? {
      brand: '#60a5fa',
      brandStrong: '#3b82f6',
      background: '#020617',
      backgroundAlt: '#0b1120',
      surface: '#0f172a',
      surfaceAlt: '#111c34',
      surfaceMuted: '#16213a',
      input: '#0b1220',
      border: '#24324d',
      borderSoft: '#1b2940',
      text: '#e5eefc',
      textSoft: '#cbd5e1',
      muted: '#94a3b8',
      accentSoft: '#11213f',
      infoSurface: '#0f213f',
      infoBorder: '#24446f',
      successSurface: '#052e2b',
      successText: '#5eead4',
      danger: '#ef4444',
      dangerSoft: '#3a1217',
      overlay: 'rgba(2, 6, 23, 0.82)',
      white: '#ffffff',
    }
  : {
      brand: '#0053A9',
      brandStrong: '#0053A9',
      background: '#ffffff',
      backgroundAlt: '#f8f9fb',
      surface: '#ffffff',
      surfaceAlt: '#f7f8fb',
      surfaceMuted: '#f3f4f6',
      input: '#f7f8fb',
      border: '#d7deec',
      borderSoft: '#e5e7eb',
      text: '#111827',
      textSoft: '#374151',
      muted: '#6b7280',
      accentSoft: '#eff6ff',
      infoSurface: '#eff6ff',
      infoBorder: '#dbeafe',
      successSurface: '#f0fdf4',
      successText: '#065f46',
      danger: '#ef4444',
      dangerSoft: '#fee2e2',
      overlay: 'rgba(0, 0, 0, 0.2)',
      white: '#ffffff',
    };

export const cardShadow = isWebDark
  ? {
      shadowColor: '#000',
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    }
  : {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    };

export const navigationTheme = isWebDark
  ? {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        primary: colors.brand,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    }
  : {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        primary: colors.brand,
      },
    };
