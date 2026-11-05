import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme';

interface TagProps {
  label: string;
  variant?: 'pending' | 'bought' | 'safe' | 'near_limit' | 'exceeded' | 'neutral';
}

export const Tag: React.FC<TagProps> = ({ label, variant = 'neutral' }) => {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'pending':
      case 'near_limit':
        return {
          bg: 'rgba(251, 191, 36, 0.15)',
          text: colors.warning,
          border: 'rgba(251, 191, 36, 0.3)',
        };
      case 'bought':
      case 'safe':
        return {
          bg: 'rgba(52, 211, 153, 0.15)',
          text: colors.success,
          border: 'rgba(52, 211, 153, 0.3)',
        };
      case 'exceeded':
        return {
          bg: 'rgba(248, 113, 113, 0.15)',
          text: colors.danger,
          border: 'rgba(248, 113, 113, 0.3)',
        };
      case 'neutral':
      default:
        return {
          bg: colors.surface2,
          text: colors.muted,
          border: colors.line,
        };
    }
  };

  const scheme = getColors();

  return (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: scheme.bg,
          borderColor: scheme.border,
        },
      ]}
    >
      <Text style={[typography.tag, { color: scheme.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
