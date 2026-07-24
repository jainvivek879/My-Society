/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
import { Splash } from './presentation/screens/Splash';
import { LoadingScreen } from './presentation/screens/Loading';
import { ErrorScreen } from './presentation/screens/Error';
import { visitorService } from './services/visitorService';

import { Playground } from './presentation/screens/Playground';
import { ForgotPassword } from './presentation/screens/ForgotPassword';
import { Login } from './presentation/screens/Login';

const AppContent: React.FC = () => {
  const { currentUser, loading, error } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState<'login' | 'forgot_password'>('login');

  // Handle splash transition first
  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  // Handle mid-auth transitions
  if (loading) {
    return <LoadingScreen />;
  }

  // Handle active error conditions gracefully
  if (error && !currentUser) {
    // Note: We recover to sign-in by letting the user reload/retry
  }

  // Active session router
  if (currentUser) {
    return <Playground />;
  }

  // Anonymous guest state router
  if (screen === 'forgot_password') {
    return <ForgotPassword onBackToLogin={() => setScreen('login')} />;
  }

  return <Login onForgotPasswordClick={() => setScreen('forgot_password')} />;
};

export default function App() {
  useEffect(() => {
    visitorService.init();
  }, []);

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
