import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
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
  const { signIn, signUp, directLogin } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('ali@demo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (isSignUp && !name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err?.message || (isSignUp ? 'Sign up failed.' : 'Login failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDirectLogin = async (memberId: string) => {
    setError(null);
    setLoading(true);
    try {
      await directLogin(memberId);
    } catch (err: any) {
      setError(err?.message || 'Direct login failed');
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
          {/* Top Bar with Direct Login at corner & Theme Toggle */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={[
                styles.cornerDirectBtn,
                {
                  backgroundColor: colors.primaryBg,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => handleDirectLogin('M01')}
              activeOpacity={0.8}
            >
              <Ionicons name="flash" size={14} color={colors.primary} />
              <Text style={[styles.cornerDirectText, { color: colors.primary }]}>
                Direct Login
              </Text>
            </TouchableOpacity>

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
            {/* Mode Switcher Tabs */}
            <View style={[styles.tabContainer, { backgroundColor: colors.bg, borderColor: colors.line }]}>
              <TouchableOpacity
                style={[
                  styles.authTab,
                  !isSignUp && { backgroundColor: colors.surface },
                ]}
                onPress={() => {
                  setIsSignUp(false);
                  setError(null);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: !isSignUp ? colors.primary : colors.muted },
                    !isSignUp && { fontWeight: '700' },
                  ]}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.authTab,
                  isSignUp && { backgroundColor: colors.surface },
                ]}
                onPress={() => {
                  setIsSignUp(true);
                  setError(null);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isSignUp ? colors.primary : colors.muted },
                    isSignUp && { fontWeight: '700' },
                  ]}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {isSignUp && (
              <Input
                label="Full Name"
                icon="person-outline"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  setError(null);
                }}
                placeholder="e.g. Danish or Zainab"
                autoCapitalize="words"
              />
            )}

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
              label={isSignUp ? 'Sign up new member' : 'Sign in'}
              icon={isSignUp ? 'person-add-outline' : 'log-in-outline'}
              loading={loading}
              disabled={loading}
              onPress={handleSubmit}
              style={{ marginTop: 6 }}
            />

            {/* Quick 1-Tap Demo Logins */}
            <View style={styles.quickLoginSection}>
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
                <Text style={[typography.caption, { color: colors.muted, marginHorizontal: 10 }]}>
                  Instant Demo Login
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
              </View>

              <View style={styles.demoChipsRow}>
                <TouchableOpacity
                  style={[styles.demoChip, { borderColor: colors.line, backgroundColor: colors.bg }]}
                  onPress={() => handleDirectLogin('M01')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.demoChipText, { color: colors.primary }]}>Ali</Text>
                  <Text style={[styles.demoChipSub, { color: colors.muted }]}>M01</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoChip, { borderColor: colors.line, backgroundColor: colors.bg }]}
                  onPress={() => handleDirectLogin('M02')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.demoChipText, { color: colors.primary }]}>Ayesha</Text>
                  <Text style={[styles.demoChipSub, { color: colors.muted }]}>M02</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.demoChip, { borderColor: colors.line, backgroundColor: colors.bg }]}
                  onPress={() => handleDirectLogin('M03')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.demoChipText, { color: colors.primary }]}>Bilal</Text>
                  <Text style={[styles.demoChipSub, { color: colors.muted }]}>M03</Text>
                </TouchableOpacity>
              </View>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cornerDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  cornerDirectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoWrapper: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
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
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
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
  tabContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  authTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickLoginSection: {
    marginTop: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  demoChipsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  demoChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  demoChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  demoChipSub: {
    fontSize: 10,
    marginTop: 1,
    fontWeight: '500',
  },
});
