import { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
};

export const typography: Record<string, TextStyle> = {
  heroAmount: {
    fontSize: 38,
    lineHeight: 44,
    fontWeight: '800',
  },
  cardAmount: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
  },
  screenTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  tag: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
};
