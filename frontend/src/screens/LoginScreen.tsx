import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Card, Button, Input, ThemeToggle } from '../components';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { typography, spacing } from '../theme';

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
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Theme Toggle */}
          <View style={styles.topBar}>
            <ThemeToggle />
          </View>

          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={[styles.logoTile, { backgroundColor: colors.primary }]}>
              <Ionicons name="home" size={44} color={colors.onPrimary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Ghar</Text>
            <Text style={[typography.body, { color: colors.muted }]}>
              Shared Living, Simplified
            </Text>
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
    paddingBottom: 32,
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoTile: {
    width: 84,
    height: 84,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    marginBottom: 4,
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
