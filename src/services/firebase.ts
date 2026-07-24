/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase using environment variables (standard for production/Vercel) or fallback JSON config
const metaEnv = (import.meta as any).env || {};
const resolvedConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfig.firestoreDatabaseId || '(default)',
};

const app = getApps().length === 0 ? initializeApp(resolvedConfig) : getApp();

export const db = getFirestore(app, resolvedConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);

// Operational and Error Handling Enums & Interfaces
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Custom error handler for Firestore operations to log security-rule and operational details.
 * Conforms strictly to the FirestoreErrorInfo guidelines.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const rawMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  let cleanMsg = rawMsg;
  if (rawMsg.includes('Missing or insufficient permissions')) {
    cleanMsg = 'Firestore Permission Denied: Security rules rejected this request. Please ensure you are logged in with correct permissions.';
  } else if (rawMsg.includes('API key not valid') || rawMsg.includes('invalid-api-key')) {
    cleanMsg = 'Firebase API key is invalid or unprovisioned. Please run set_up_firebase to connect your project.';
  }

  throw new Error(cleanMsg);
}

/**
 * Validates connection to Firestore. Satisfies CRITICAL CONSTRAINT to call getFromServer upon startup.
 */
export async function testConnection() {
  if (resolvedConfig.apiKey?.includes('Placeholder') || resolvedConfig.apiKey === '') {
    console.warn("Using placeholder Firebase configuration. Please set up a real Firebase project via the workspace panel.");
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    console.warn("Firestore connection check note:", error instanceof Error ? error.message : error);
  }
}

// Call testConnection upon module load to run a defensive check
testConnection();
