/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  sendPasswordResetEmail, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from './firebase';
import { userService } from './userService';
import { UserProfile, UserRole } from '../types';

export const authService = {
  /**
   * Email/Password sign in.
   * Authenticates with Firestore user profile or Firebase Auth.
   */
  async loginWithEmail(email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    // 1. First check if a matching user profile exists in Firestore
    let profile = await userService.getUserByEmail(cleanEmail);

    if (profile) {
      if (!profile.isActive) {
        throw new Error('Your account is inactive. Contact your Society Administrator.');
      }
      if (profile.password && password && profile.password !== password) {
        throw new Error('Incorrect email or password.');
      }
      localStorage.setItem('omnigate_active_user', JSON.stringify(profile));
      return profile;
    }

    // 2. Try Firebase Auth sign-in if not in local/custom list
    if (password) {
      try {
        const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (credential && credential.user) {
          profile = await userService.getUserProfile(credential.user.uid);
          if (profile) {
            if (!profile.isActive) {
              throw new Error('Your account is inactive. Contact your Society Administrator.');
            }
            localStorage.setItem('omnigate_active_user', JSON.stringify(profile));
            return profile;
          }
        }
      } catch (err: any) {
        console.warn("Firebase auth sign in notice:", err?.code || err?.message);
      }
    }

    throw new Error('Your account has not yet been created or invalid credentials. Please contact your Society Administrator.');
  },

  /**
   * Register a new user with Firebase Authentication and create a Firestore User Profile document.
   * Used strictly by Society/Super Admin workflows for onboarding users.
   */
  async registerUser(
    email: string, 
    password?: string, 
    displayName?: string, 
    role: UserRole = UserRole.RESIDENT, 
    societyId: string | null = null,
    phoneNumber?: string
  ): Promise<UserProfile> {
    const pass = password || 'OmniGatePass@2026';
    const cleanEmail = email.trim().toLowerCase();

    const credential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    const firebaseUser = credential.user;

    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      phoneNumber: phoneNumber || firebaseUser.phoneNumber || '',
      photoURL: firebaseUser.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
      role,
      societyId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    await userService.createUserProfile(profile);
    return profile;
  },

  /**
   * Google OAuth popup sign in.
   * Validates account with Google and checks Firestore for registered user profile.
   */
  async loginWithGoogle(): Promise<UserProfile> {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const firebaseUser = credential.user;

      let profile = await userService.getUserProfile(firebaseUser.uid);

      if (!profile && firebaseUser.email) {
        profile = await userService.getUserByEmail(firebaseUser.email.toLowerCase());
      }

      // STRICT CHECK: Never auto-create user profile on Google login
      if (!profile) {
        throw new Error('Your account has not yet been created. Please contact your Society Administrator.');
      }

      if (!profile.isActive) {
        throw new Error('Your account is inactive. Contact your Society Administrator.');
      }

      localStorage.setItem('omnigate_active_user', JSON.stringify(profile));
      return profile;
    } catch (err: any) {
      if (err?.message?.includes('not yet been created') || err?.message?.includes('inactive')) {
        throw err;
      }
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in was cancelled. Please try again.');
      }
      if (err?.code === 'auth/popup-blocked') {
        throw new Error('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      }
      if (err?.code === 'auth/user-disabled') {
        throw new Error('Your account is inactive. Contact your Society Administrator.');
      }
      throw new Error('Unable to connect. Please try again.');
    }
  },

  /**
   * Mobile phone sign-in helper.
   * Fetches user profile matching phone number from Firestore.
   */
  async loginWithOTP(phone: string, otp: string): Promise<UserProfile> {
    if (!otp || otp.length < 4) {
      throw new Error('Please enter a valid verification code.');
    }

    const cleanPhone = phone.replace(/\s/g, '');
    const userProfile = await userService.getUserByPhone(cleanPhone);

    if (!userProfile) {
      throw new Error('Your account has not yet been created. Please contact your Society Administrator.');
    }

    if (!userProfile.isActive) {
      throw new Error('Your account is inactive. Contact your Society Administrator.');
    }

    localStorage.setItem('omnigate_active_user', JSON.stringify(userProfile));
    return userProfile;
  },

  /**
   * Sign out current user.
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      // Silent error handler
    }
    localStorage.removeItem('omnigate_active_user');
  },

  /**
   * Send password reset email.
   */
  async forgotPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: any) {
      if (
        err?.code === 'auth/invalid-continue-uri' ||
        err?.code === 'auth/unauthorized-continue-uri' ||
        err?.code === 'auth/missing-continue-uri'
      ) {
        return;
      }
      if (err?.code === 'auth/user-not-found') {
        throw new Error('No registered account found with this email address.');
      }
      throw new Error('Unable to send password reset email. Please try again.');
    }
  },

  /**
   * Listen to Firebase Authentication state changes.
   */
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};

