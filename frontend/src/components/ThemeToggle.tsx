import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { mode, toggle, colors } = useTheme();
  const isDark = mode === 'dark';

  const translateX = useSharedValue(isDark ? 24 : 0);

  useEffect(() => {
    translateX.value = withSpring(isDark ? 24 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isDark]);

  const knobAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={[
        styles.track,
        {
          backgroundColor: isDark ? colors.surface2 : colors.primaryBg,
          borderColor: colors.line,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.knob,
          {
            backgroundColor: colors.primary,
          },
          knobAnimatedStyle,
        ]}
      >
        <Ionicons
          name={isDark ? 'moon' : 'sunny'}
          size={13}
          color={colors.onPrimary}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 56,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
