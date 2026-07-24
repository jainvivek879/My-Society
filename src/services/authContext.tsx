/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Society } from '../types';
import { authService } from './authService';
import { userService } from './userService';
import { societyService } from './societyService';

export type Theme = 'light' | 'dark';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentSociety: Society | null;
  loading: boolean;
  error: string | null;
  theme: Theme;
  toggleTheme: () => void;
  loginWithEmail: (email: string, password?: string) => Promise<UserProfile>;
  loginWithOTP: (phone: string, otp: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentSociety, setCurrentSociety] = useState<Society | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');

  // Initialize Theme and listen to Auth State
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }

    // Check stored active user for instant session restore
    const storedUserRaw = localStorage.getItem('omnigate_active_user');
    if (storedUserRaw) {
      try {
        const parsedUser: UserProfile = JSON.parse(storedUserRaw);
        setCurrentUser(parsedUser);
        if (parsedUser.societyId) {
          societyService.getSocietyById(parsedUser.societyId).then(soc => setCurrentSociety(soc));
        }
      } catch (e) {
        console.warn("Could not parse stored active user:", e);
      }
    }

    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const profile = await userService.getUserProfile(firebaseUser.uid);
          if (profile && profile.isActive) {
            setCurrentUser(profile);
            localStorage.setItem('omnigate_active_user', JSON.stringify(profile));

            if (profile.societyId) {
              const society = await societyService.getSocietyById(profile.societyId);
              setCurrentSociety(society);
            } else {
              setCurrentSociety(null);
            }
          } else {
            console.warn("User profile does not exist or is inactive in Firestore.");
            setCurrentUser(null);
            setCurrentSociety(null);
            localStorage.removeItem('omnigate_active_user');
          }
        } catch (err: any) {
          console.warn("Auth state observer notice:", err);
          setCurrentUser(null);
          setCurrentSociety(null);
          localStorage.removeItem('omnigate_active_user');
        }
      } else {
        setCurrentUser(null);
        setCurrentSociety(null);
        localStorage.removeItem('omnigate_active_user');
      }
      setLoading(false);
    });

    setLoading(false);
    return () => unsubscribe();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const loginWithEmail = async (email: string, password?: string): Promise<UserProfile> => {
    setLoading(true);
    setError(null);
    try {
      const profile = await authService.loginWithEmail(email, password);
      setCurrentUser(profile);
      if (profile.societyId) {
        const society = await societyService.getSocietyById(profile.societyId);
        setCurrentSociety(society);
      }
      return profile;
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || 'Invalid email address or credentials.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithOTP = async (phone: string, otp: string): Promise<UserProfile> => {
    setLoading(true);
    setError(null);
    try {
      const profile = await authService.loginWithOTP(phone, otp);
      setCurrentUser(profile);
      if (profile.societyId) {
        const society = await societyService.getSocietyById(profile.societyId);
        setCurrentSociety(society);
      }
      return profile;
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || 'OTP verification failed.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    setLoading(true);
    setError(null);
    try {
      const profile = await authService.loginWithGoogle();
      setCurrentUser(profile);
      if (profile.societyId) {
        const society = await societyService.getSocietyById(profile.societyId);
        setCurrentSociety(society);
      }
      return profile;
    } catch (err: any) {
      setLoading(false);
      const msg = err.message || 'Failed to sign in with Google account.';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    setError(null);
    try {
      await authService.forgotPassword(email);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setCurrentUser(null);
      setCurrentSociety(null);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentSociety,
        loading,
        error,
        theme,
        toggleTheme,
        loginWithEmail,
        loginWithOTP,
        loginWithGoogle,
        forgotPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
