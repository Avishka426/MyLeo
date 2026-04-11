import { TextStyle } from 'react-native';

export interface Theme {
  colors: {
    // Backgrounds
    background: string;
    surface: string;
    card: string;
    // Text
    text: string;
    textSecondary: string;
    textMuted: string;
    // Brand
    primary: string;
    primaryLight: string;
    accent: string;
    // Semantic
    success: string;
    warning: string;
    error: string;
    info: string;
    // UI chrome
    border: string;
    divider: string;
    overlay: string;
    // Inverse (text on primary bg)
    onPrimary: string;
    onAccent: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    h1: TextStyle;
    h2: TextStyle;
    h3: TextStyle;
    body: TextStyle;
    bodySmall: TextStyle;
    caption: TextStyle;
    label: TextStyle;
    button: TextStyle;
  };
  shadow: {
    sm: object;
    md: object;
    lg: object;
  };
  isDark: boolean;
}

const BASE_RADIUS = { sm: 6, md: 10, lg: 14, xl: 20, full: 9999 };
const BASE_SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14, letterSpacing: 0.2 },
  label: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.1 },
  button: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.1 },
};

export const lightTheme: Theme = {
  colors: {
    background: '#F2F4F8',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#111827',
    textSecondary: '#374151',
    textMuted: '#6B7280',
    primary: '#1B4F8A',
    primaryLight: '#E8F0FB',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    border: '#E5E7EB',
    divider: '#F3F4F6',
    overlay: 'rgba(0,0,0,0.45)',
    onPrimary: '#FFFFFF',
    onAccent: '#1A1A1A',
  },
  radius: BASE_RADIUS,
  spacing: BASE_SPACING,
  typography: TYPOGRAPHY,
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8 },
  },
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    background: '#0F1117',
    surface: '#1A1D27',
    card: '#1E2130',
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textMuted: '#6B7280',
    primary: '#3B82F6',
    primaryLight: '#1E2D4A',
    accent: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#60A5FA',
    border: '#2D3148',
    divider: '#1E2130',
    overlay: 'rgba(0,0,0,0.65)',
    onPrimary: '#FFFFFF',
    onAccent: '#1A1A1A',
  },
  radius: BASE_RADIUS,
  spacing: BASE_SPACING,
  typography: TYPOGRAPHY,
  shadow: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  },
  isDark: true,
};

// STATUS colors work on both light/dark (they're vivid enough)
export const STATUS_COLORS: Record<string, string> = {
  upcoming: '#3B82F6',
  ongoing: '#F59E0B',
  completed: '#10B981',
  pending: '#F59E0B',
  claimed: '#3B82F6',
  joint: '#8B5CF6',
  converted_to_project: '#10B981',
  active: '#10B981',
  inactive: '#EF4444',
  reviewed: '#3B82F6',
};
