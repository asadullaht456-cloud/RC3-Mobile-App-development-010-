import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface ScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hideGlow?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({ children, style, hideGlow = false }) => {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();

  // Ensure robust safe area inset on both Android (where insets.top might be 0 without edge-to-edge) and iOS
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (RNStatusBar.currentHeight || 28) : 20
  );
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: topInset, paddingBottom: bottomInset }]}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
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
