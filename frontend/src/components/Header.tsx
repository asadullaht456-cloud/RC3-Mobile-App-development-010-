import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography, spacing } from '../theme';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title: string;
  caption?: string;
  rightAction?: React.ReactNode;
  showThemeToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  caption,
  rightAction,
  showThemeToggle = true,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {caption ? (
          <Text style={[typography.caption, { color: colors.muted }]}>
            {caption}
          </Text>
        ) : null}
        <Text style={[typography.screenTitle, { color: colors.text }]}>
          {title}
        </Text>
      </View>
      <View style={styles.actions}>
        {showThemeToggle && <ThemeToggle />}
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 12,
    paddingBottom: 16,
  },
  textContainer: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
