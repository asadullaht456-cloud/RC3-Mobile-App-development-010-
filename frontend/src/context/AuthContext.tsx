import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Member } from '../types';
import { api, setAuthTokenGetter, setOnUnauthorized } from '../api/client';

interface AuthContextType {
  user: Member | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  directLogin: (memberId?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'auth_session_user_v2';

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  directLogin: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Provide token getter to API client
    setAuthTokenGetter(async () => {
      // In mock mode, return a dummy mock token
      return user ? 'mock_firebase_id_token' : null;
    });

    setOnUnauthorized(() => {
      signOut();
    });

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (saved) {
          setUser(JSON.parse(saved));
        } else {
          // Keep user as null so the Sign In / Sign Up screen is presented
          setUser(null);
        }
      } catch (err) {
        console.warn('Failed restoring auth session', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, _pass: string) => {
    setLoading(true);
    try {
      const members = await api.getMembers();
      const matched = members.find(
        (m) => m.email.toLowerCase() === email.trim().toLowerCase()
      );

      const loggedInUser: Member = matched || {
        id: `M${Date.now()}`,
        name: email.split('@')[0],
        email: email.trim(),
      };

      setUser(loggedInUser);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedInUser));
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string) => {
    return signIn(email, pass);
  };

  const directLogin = async (memberId: string = 'M01') => {
    setLoading(true);
    try {
      const members = await api.getMembers();
      const matched =
        members.find((m) => m.id === memberId) ||
        members[0] || { id: 'M01', name: 'Ali', email: 'ali@demo.com' };
      setUser(matched);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(matched));
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, directLogin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
