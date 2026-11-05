import React from 'react';
import { View, StyleSheet, SafeAreaView, StyleProp, ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../context/ThemeContext';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hideGlow?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({ children, style, hideGlow = false }) => {
  const { colors, mode } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.container, style]}>
        {!hideGlow && (
          <View
            pointerEvents="none"
            style={[
              styles.glowCircle,
              {
                backgroundColor: colors.glow,
              },
            ]}
          />
        )}
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  glowCircle: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.6,
  },
});
