import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { typography, spacing } from '../theme';
import { ThemeToggle } from './ThemeToggle';
import { IconButton } from './IconButton';

interface HeaderProps {
  title: string;
  caption?: string;
  rightAction?: React.ReactNode;
  showThemeToggle?: boolean;
  showSignOut?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  caption,
  rightAction,
  showThemeToggle = true,
  showSignOut = true,
}) => {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();

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
        {showSignOut && user && (
          <IconButton
            name="log-out-outline"
            accessibilityLabel="Sign Out / Switch Account"
            onPress={signOut}
          />
        )}
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
