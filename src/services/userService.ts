/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from '../types';

export const SEED_DEMO_USERS: UserProfile[] = [
  {
    uid: 'usr_super_admin_001',
    email: 'superadmin@omnigate.com',
    displayName: 'Global Super Admin',
    phoneNumber: '+91 9000000000',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SUPER_ADMIN,
    societyId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_soc_admin_001',
    email: 'admin@greenwood.com',
    displayName: 'Gokuldham Society Admin',
    phoneNumber: '+91 9111111111',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SOCIETY_ADMIN,
    societyId: 'soc_greenwood_101',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_guard_001',
    email: 'semi.jain@gmail.com',
    displayName: 'Ramesh Security Guard',
    phoneNumber: '+91 9876543210',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SECURITY_GUARD,
    societyId: 'soc_greenwood_101',
    shift: 'Day Shift (08:00 AM - 08:00 PM)',
    gateAssigned: 'Main Gate 01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_guard_002',
    email: 'bahadur.guard@omnigate.com',
    displayName: 'Bahadur Singh (Gatekeeper)',
    phoneNumber: '+91 9876543211',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SECURITY_GUARD,
    societyId: 'soc_greenwood_101',
    shift: 'Night Shift (08:00 PM - 08:00 AM)',
    gateAssigned: 'Tower B Rear Gate',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_guard_003',
    email: 'vikram.patil@omnigate.com',
    displayName: 'Vikram Patil (Patrol Supervisor)',
    phoneNumber: '+91 9876543212',
    photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SECURITY_GUARD,
    societyId: 'soc_greenwood_101',
    shift: 'Evening Shift (04:00 PM - 12:00 AM)',
    gateAssigned: 'Main Visitor Gate',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_res_001',
    email: 'jain.vivek879@gmail.com',
    displayName: 'Vivek Jain (Flat B-504)',
    phoneNumber: '+91 9999988888',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.RESIDENT,
    societyId: 'soc_greenwood_101',
    flatNumber: 'B-504',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_res_002',
    email: 'jethalal@gokuldham.in',
    displayName: 'Jethalal Gada (Flat A-101)',
    phoneNumber: '+91 9820011223',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.RESIDENT,
    societyId: 'soc_greenwood_101',
    flatNumber: 'A-101',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_staff_001',
    email: 'staff@greenwood.com',
    displayName: 'Suresh Kumar (Electrician)',
    phoneNumber: '+91 9812345678',
    photoURL: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.STAFF,
    societyId: 'soc_greenwood_101',
    staffCategory: 'ELECTRICIAN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_staff_002',
    email: 'raju.plumber@greenwood.com',
    displayName: 'Raju Sharma (Senior Plumber)',
    phoneNumber: '+91 9812345679',
    photoURL: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.STAFF,
    societyId: 'soc_greenwood_101',
    staffCategory: 'PLUMBER',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  },
  {
    uid: 'usr_staff_003',
    email: 'sunil.hk@greenwood.com',
    displayName: 'Sunil Kumar (Housekeeping Lead)',
    phoneNumber: '+91 9812345680',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.STAFF,
    societyId: 'soc_greenwood_101',
    staffCategory: 'HOUSEKEEPING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true,
  }
];

export const userService = {
  /**
   * Fetch a user profile by UID from Firestore.
   * Checks top-level 'users/{uid}' document first, with backward-compatibility for subcollection format.
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      // 1. Try top-level users/{uid}
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          uid: data.uid || uid,
          email: data.email || '',
          displayName: data.displayName || data.email?.split('@')[0] || 'User',
          phoneNumber: data.phoneNumber || data.phone || '',
          photoURL: data.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
          role: (data.role as UserRole) || UserRole.RESIDENT,
          societyId: data.societyId || null,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          isActive: data.isActive !== false && data.status !== 'INACTIVE',
        };
      }

      // 2. Backward compatibility fallback for users/{uid}/public/profile
      const pubSnap = await getDoc(doc(db, 'users', uid, 'public', 'profile'));
      const privSnap = await getDoc(doc(db, 'users', uid, 'private', 'info'));

      if (pubSnap.exists()) {
        const pubData = pubSnap.data();
        const privData = privSnap.exists() ? privSnap.data() : {};
        return {
          uid,
          email: privData.email || pubData.email || '',
          displayName: pubData.displayName || 'User',
          phoneNumber: privData.phoneNumber || privData.phone || '',
          photoURL: pubData.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
          role: (pubData.role as UserRole) || UserRole.RESIDENT,
          societyId: pubData.societyId || null,
          createdAt: pubData.createdAt || new Date().toISOString(),
          updatedAt: privData.updatedAt || new Date().toISOString(),
          isActive: privData.isActive !== false,
        };
      }

      return null;
    } catch (error) {
      console.warn('getUserProfile Firestore notice (using fallback context):', error);
      return null;
    }
  },

  /**
   * Create a new user profile document in Firestore.
   */
  async createUserProfile(profile: UserProfile & { password?: string }): Promise<void> {
    try {
      const now = new Date().toISOString();
      const userRef = doc(db, 'users', profile.uid);

      const payload = {
        uid: profile.uid,
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phoneNumber || '',
        phoneNumber: profile.phoneNumber || '',
        role: profile.role,
        societyId: profile.societyId || null,
        photoURL: profile.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
        status: profile.isActive ? 'ACTIVE' : 'INACTIVE',
        isActive: profile.isActive !== false,
        password: profile.password || 'password123',
        createdAt: profile.createdAt || now,
        updatedAt: now,
      };

      await setDoc(userRef, payload, { merge: true });

      // Also set public & private subcollections for backward compatibility
      await setDoc(doc(db, 'users', profile.uid, 'public', 'profile'), {
        uid: profile.uid,
        displayName: profile.displayName,
        photoURL: payload.photoURL,
        role: profile.role,
        societyId: profile.societyId,
        createdAt: payload.createdAt,
      }, { merge: true });

      await setDoc(doc(db, 'users', profile.uid, 'private', 'info'), {
        uid: profile.uid,
        email: profile.email,
        phoneNumber: payload.phoneNumber,
        isActive: payload.isActive,
        updatedAt: now,
      }, { merge: true });
    } catch (error) {
      console.warn('createUserProfile Firestore notice:', error);
    }
  },

  /**
   * Update an existing user profile document in Firestore.
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const userRef = doc(db, 'users', uid);

      const payload: Record<string, any> = {
        ...updates,
        updatedAt: now,
      };

      if (updates.phoneNumber !== undefined) {
        payload.phone = updates.phoneNumber;
      }

      await updateDoc(userRef, payload);
    } catch (error) {
      console.warn(`updateUserProfile notice for users/${uid}:`, error);
    }
  },

  /**
   * Fetch a user profile by email from Firestore with stored password verification support.
   */
  async getUserByEmail(email: string): Promise<(UserProfile & { password?: string }) | null> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const d = snap.docs[0].data();
        return {
          uid: d.uid || snap.docs[0].id,
          email: d.email || cleanEmail,
          displayName: d.displayName || cleanEmail.split('@')[0],
          phoneNumber: d.phoneNumber || d.phone || '',
          photoURL: d.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
          role: (d.role as UserRole) || UserRole.RESIDENT,
          societyId: d.societyId || 'soc_greenwood_101',
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
          isActive: d.isActive !== false,
          password: d.password,
        };
      }

      const demoMatch = SEED_DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail);
      if (demoMatch) return demoMatch;

      return null;
    } catch (error) {
      console.warn('getUserByEmail notice:', error);
      const cleanEmail = email.trim().toLowerCase();
      return SEED_DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail) || null;
    }
  },

  /**
   * Fetch a user profile by phone number from Firestore.
   */
  async getUserByPhone(phone: string): Promise<UserProfile | null> {
    try {
      const cleanPhone = phone.replace(/\s/g, '');

      const q = query(collection(db, 'users'), where('phoneNumber', '==', cleanPhone));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const d = snap.docs[0].data();
        return {
          uid: d.uid || snap.docs[0].id,
          email: d.email || '',
          displayName: d.displayName || 'User',
          phoneNumber: d.phoneNumber || d.phone || '',
          photoURL: d.photoURL || '',
          role: (d.role as UserRole) || UserRole.RESIDENT,
          societyId: d.societyId || null,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
          isActive: d.isActive !== false,
        };
      }

      // Try searching for 'phone' field as fallback
      const qAlt = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      const snapAlt = await getDocs(qAlt);
      if (!snapAlt.empty) {
        const d = snapAlt.docs[0].data();
        return {
          uid: d.uid || snapAlt.docs[0].id,
          email: d.email || '',
          displayName: d.displayName || 'User',
          phoneNumber: d.phoneNumber || d.phone || '',
          photoURL: d.photoURL || '',
          role: (d.role as UserRole) || UserRole.RESIDENT,
          societyId: d.societyId || null,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
          isActive: d.isActive !== false,
        };
      }

      const demoPhoneMatch = SEED_DEMO_USERS.find(u => u.phoneNumber.replace(/\s/g, '') === cleanPhone);
      if (demoPhoneMatch) return demoPhoneMatch;

      return null;
    } catch (error) {
      console.warn('getUserByPhone notice:', error);
      const cleanPhone = phone.replace(/\s/g, '');
      return SEED_DEMO_USERS.find(u => u.phoneNumber.replace(/\s/g, '') === cleanPhone) || null;
    }
  },

  /**
   * Fetch all users in a specific society.
   */
  async getUsersBySociety(societyId: string): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, 'users'), where('societyId', '==', societyId));
      const snap = await getDocs(q);
      return snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          uid: d.uid || docSnap.id,
          email: d.email || '',
          displayName: d.displayName || 'User',
          phoneNumber: d.phoneNumber || d.phone || '',
          photoURL: d.photoURL || '',
          role: (d.role as UserRole) || UserRole.RESIDENT,
          societyId: d.societyId || null,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
          isActive: d.isActive !== false,
        };
      });
    } catch (error) {
      console.warn('getUsersBySociety notice:', error);
      return [];
    }
  },

  /**
   * Subscribe to real-time updates for users in a society.
   */
  subscribeUsersBySociety(societyId: string, callback: (users: UserProfile[]) => void): () => void {
    const q = query(collection(db, 'users'), where('societyId', '==', societyId));
    return onSnapshot(
      q,
      (snap) => {
        const firestoreUsers = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            uid: d.uid || docSnap.id,
            email: d.email || '',
            displayName: d.displayName || 'User',
            phoneNumber: d.phoneNumber || d.phone || '',
            photoURL: d.photoURL || '',
            role: (d.role as UserRole) || UserRole.RESIDENT,
            societyId: d.societyId || null,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
            isActive: d.isActive !== false,
          };
        });

        callback(firestoreUsers);
      },
      (error) => {
        console.error('Error in subscribeUsersBySociety:', error);
        callback([]);
      }
    );
  },

  /**
   * Fetch all users across the entire platform (Super Admin).
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          uid: d.uid || docSnap.id,
          email: d.email || '',
          displayName: d.displayName || 'User',
          phoneNumber: d.phoneNumber || d.phone || '',
          photoURL: d.photoURL || '',
          role: (d.role as UserRole) || UserRole.RESIDENT,
          societyId: d.societyId || null,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
          isActive: d.isActive !== false,
        };
      });
    } catch (error) {
      console.warn('getAllUsers notice:', error);
      return [];
    }
  },

  /**
   * Subscribe to real-time updates for all users across the platform.
   */
  subscribeAllUsers(callback: (users: UserProfile[]) => void): () => void {
    return onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const firestoreUsers = snap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            uid: d.uid || docSnap.id,
            email: d.email || '',
            displayName: d.displayName || 'User',
            phoneNumber: d.phoneNumber || d.phone || '',
            photoURL: d.photoURL || '',
            role: (d.role as UserRole) || UserRole.RESIDENT,
            societyId: d.societyId || null,
            createdAt: d.createdAt || new Date().toISOString(),
            updatedAt: d.updatedAt || new Date().toISOString(),
            isActive: d.isActive !== false,
          };
        });

        callback(firestoreUsers);
      },
      (error) => {
        console.error('Error in subscribeAllUsers:', error);
        callback([]);
      }
    );
  },

  /**
   * Delete a user profile document from Firestore.
   */
  async deleteUserProfile(uid: string): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), { isActive: false, status: 'INACTIVE' }, { merge: true });
    } catch (error) {
      console.warn('deleteUserProfile notice:', error);
    }
  }
};
