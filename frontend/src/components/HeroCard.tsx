import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radii, spacing } from '../theme';

interface HeroCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const HeroCard: React.FC<HeroCardProps> = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        },
        style,
      ]}
    >
      {/* Translucent decorative circles */}
      <View style={styles.circleTopRight} pointerEvents="none" />
      <View style={styles.circleBottomLeft} pointerEvents="none" />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.heroCard,
    padding: spacing.xl,
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 8,
  },
  circleTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
