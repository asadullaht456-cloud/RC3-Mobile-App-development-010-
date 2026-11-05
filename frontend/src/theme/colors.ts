export interface ThemeColors {
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  muted: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  line: string;
  primaryBg: string;
  glow: string;
  overlay: string;
}

export const darkColors: ThemeColors = {
  bg: '#0F172A',
  surface: '#1E293B',
  surface2: '#293548',
  text: '#F1F5F9',
  muted: '#94A3B8',
  primary: '#14B8A6',
  onPrimary: '#042F2E',
  secondary: '#38BDF8',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  line: '#334155',
  primaryBg: 'rgba(20, 184, 166, 0.15)',
  glow: 'rgba(20, 184, 166, 0.33)',
  overlay: 'rgba(2, 6, 23, 0.75)',
};

export const lightColors: ThemeColors = {
  bg: '#F0FDFA',
  surface: '#FFFFFF',
  surface2: '#F1F5F9',
  text: '#0F172A',
  muted: '#475569',
  primary: '#0F766E',
  onPrimary: '#FFFFFF',
  secondary: '#0369A1',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
  line: '#CBD5E1',
  primaryBg: '#CCFBF1',
  glow: 'rgba(94, 234, 212, 0.33)',
  overlay: 'rgba(2, 6, 23, 0.75)',
};

export const memberColors: Record<string, string> = {
  M01: '#0F766E', // Ali
  M02: '#0369A1', // Ayesha
  M03: '#7C3AED', // Bilal
  Ali: '#0F766E',
  Ayesha: '#0369A1',
  Bilal: '#7C3AED',
};
