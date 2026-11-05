import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  Screen,
  Card,
  Button,
  Input,
  ThemeToggle,
  ParticleBackground,
} from '../components';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { typography, spacing } from '../theme';

// Animated Glowing Brand Logo Component
const AnimatedLogo: React.FC<{ colors: any }> = ({ colors }) => {
  const floatY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    // Gentle floating hover motion
    floatY.value = withRepeat(
      withSequence(
        withTiming(-7, {
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(7, {
          duration: 2600,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );

    // Glowing halo pulse wave
    pulseScale.value = withRepeat(
      withTiming(1.38, {
        duration: 2400,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withTiming(0, {
        duration: 2400,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const animatedHaloStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View style={[styles.logoWrapper, animatedLogoStyle]}>
      {/* Outer pulsating aura */}
      <Animated.View
        style={[
          styles.logoHalo,
          {
            borderColor: colors.primary,
            backgroundColor: colors.glow,
          },
          animatedHaloStyle,
        ]}
      />

      {/* Secondary soft ring */}
      <View
        style={[
          styles.logoRing,
          {
            borderColor: 'rgba(20, 184, 166, 0.35)',
          },
        ]}
      />

      {/* Central Brand Badge Tile */}
      <View
        style={[
          styles.logoTile,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          },
        ]}
      >
        <Ionicons name="home" size={46} color={colors.onPrimary} />
      </View>
    </Animated.View>
  );
};

export const LoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState('ali@demo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password);
    } catch (err: any) {
      setError(err?.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen hideGlow>
      {/* Floating Animated Theme Particles */}
      <ParticleBackground />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with Theme Toggle */}
          <View style={styles.topBar}>
            <ThemeToggle />
          </View>

          {/* Logo & Header */}
          <View style={styles.header}>
            <AnimatedLogo colors={colors} />
            <Text style={[styles.title, { color: colors.text }]}>Ghar</Text>
            <View style={styles.subtitleRow}>
              <View
                style={[styles.indicatorDot, { backgroundColor: colors.primary }]}
              />
              <Text style={[typography.body, { color: colors.muted, fontWeight: '600' }]}>
                Shared Living, Simplified
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <Card style={styles.formCard}>
            <Input
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setError(null);
              }}
              placeholder="e.g. ali@demo.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setError(null);
              }}
              placeholder="••••••••"
              secureTextEntry
            />

            {error ? (
              <Text style={[typography.tag, { color: colors.danger, marginBottom: 12 }]}>
                {error}
              </Text>
            ) : null}

            <Button
              label="Sign in"
              icon="log-in-outline"
              loading={loading}
              disabled={loading}
              onPress={handleSignIn}
              style={{ marginTop: 4 }}
            />

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
              <Text style={[typography.caption, { color: colors.muted, marginHorizontal: 12 }]}>
                New here?
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
            </View>

            <Button
              label="Sign up"
              variant="outline"
              icon="person-add-outline"
              disabled={loading}
              onPress={handleSignUp}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 8,
    paddingBottom: 36,
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  logoHalo: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2,
  },
  logoRing: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  logoTile: {
    width: 82,
    height: 82,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  formCard: {
    width: '100%',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
});
