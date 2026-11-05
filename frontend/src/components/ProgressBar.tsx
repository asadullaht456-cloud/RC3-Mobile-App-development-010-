import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { BudgetStatus } from '../types';

interface ProgressBarProps {
  percentage: number;
  status: BudgetStatus;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, status }) => {
  const { colors } = useTheme();
  const clamped = Math.min(Math.max(percentage, 0), 100);

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withTiming(clamped, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedWidth.value}%`,
    };
  });

  const getFillColor = (): string => {
    switch (status) {
      case 'Exceeded':
        return colors.danger;
      case 'Near Limit':
        return colors.warning;
      case 'Safe':
      default:
        return colors.success;
    }
  };

  return (
    <View style={[styles.track, { backgroundColor: colors.surface2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: getFillColor(),
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
});
