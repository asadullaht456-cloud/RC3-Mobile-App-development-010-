import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  onPress: () => void;
  accessibilityLabel: string;
  badge?: boolean;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  name,
  size = 20,
  onPress,
  accessibilityLabel,
  badge = false,
  style,
  color,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.line,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={color || colors.text} />
      {badge && (
        <TouchableOpacity
          style={[styles.badge, { backgroundColor: colors.danger }]}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
