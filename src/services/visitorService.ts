/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { VisitorLog, PreApprovedPass, BlacklistedPhone } from '../types';

type VisitorListener = () => void;
const listeners: Set<VisitorListener> = new Set();

let cachedVisitors: VisitorLog[] = [];
let cachedPasses: PreApprovedPass[] = [];
let cachedBlacklist: BlacklistedPhone[] = [];

try {
  const savedPasses = localStorage.getItem('omni_pre_approved_passes');
  if (savedPasses) cachedPasses = JSON.parse(savedPasses);
  const savedLogs = localStorage.getItem('omni_visitor_logs');
  if (savedLogs) cachedVisitors = JSON.parse(savedLogs);
} catch (e) {
  console.warn('Failed to parse cached visitor data:', e);
}

const saveToLocalStorage = () => {
  try {
    localStorage.setItem('omni_pre_approved_passes', JSON.stringify(cachedPasses));
    localStorage.setItem('omni_visitor_logs', JSON.stringify(cachedVisitors));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
};

export const visitorService = {
  init() {
    // Firestore handles persistence natively
  },

  subscribe(listener: VisitorListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notify() {
    saveToLocalStorage();
    listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in listener:', err);
      }
    });
  },

  isOffline(): boolean {
    return !navigator.onLine;
  },

  setOffline(_offline: boolean) {
    this.notify();
  },

  // --- Real-time Listeners ---

  subscribeVisitorLogs(societyId: string, callback: (logs: VisitorLog[]) => void) {
    const q = query(collection(db, 'visitors'), where('societyId', '==', societyId));
    return onSnapshot(
      q,
      (snap) => {
        cachedVisitors = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as VisitorLog[];
        callback(cachedVisitors.filter((v) => v.societyId === societyId));
        this.notify();
      },
      (err) => {
        console.error('Visitor sub error:', err);
        callback(cachedVisitors.filter((v) => v.societyId === societyId));
      }
    );
  },

  subscribePreApprovedPasses(societyId: string, callback: (passes: PreApprovedPass[]) => void) {
    const q = query(collection(db, 'pre_approvals'), where('societyId', '==', societyId));
    return onSnapshot(
      q,
      (snap) => {
        cachedPasses = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PreApprovedPass[];
        callback(cachedPasses.filter((p) => p.societyId === societyId));
        this.notify();
      },
      (err) => {
        console.error('Passes sub error:', err);
        callback(cachedPasses.filter((p) => p.societyId === societyId));
      }
    );
  },

  /**
   * Subscribe to real-time updates for all visitor logs across all societies (Super Admin).
   */
  subscribeAllVisitorLogs(callback: (logs: VisitorLog[]) => void) {
    const q = query(collection(db, 'visitors'));
    return onSnapshot(
      q,
      (snap) => {
        const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as VisitorLog[];
        callback(logs);
      },
      (err) => console.error('All visitors sub error:', err)
    );
  },

  // --- Blacklist Service ---

  getBlacklist(societyId: string): BlacklistedPhone[] {
    return cachedBlacklist;
  },

  async fetchBlacklist(societyId: string): Promise<BlacklistedPhone[]> {
    try {
      const q = query(collection(db, 'blacklist'), where('societyId', '==', societyId));
      const snap = await getDocs(q);
      cachedBlacklist = snap.docs.map((d) => d.data()) as BlacklistedPhone[];
      return cachedBlacklist;
    } catch {
      return cachedBlacklist;
    }
  },

  isBlacklisted(societyId: string, phone: string): boolean {
    const normalized = phone.replace(/\s/g, '');
    return cachedBlacklist.some((item) => item.phone.replace(/\s/g, '') === normalized);
  },

  async addToBlacklist(societyId: string, item: Omit<BlacklistedPhone, 'createdAt'>): Promise<void> {
    const phoneId = item.phone.replace(/[^a-zA-Z0-9]/g, '');
    const newItem: BlacklistedPhone & { societyId: string } = {
      ...item,
      societyId,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'blacklist', phoneId), newItem);
    cachedBlacklist.unshift(newItem);
    this.notify();
  },

  async removeFromBlacklist(societyId: string, phone: string): Promise<void> {
    const phoneId = phone.replace(/[^a-zA-Z0-9]/g, '');
    await deleteDoc(doc(db, 'blacklist', phoneId));
    cachedBlacklist = cachedBlacklist.filter((i) => i.phone !== phone);
    this.notify();
  },

  // --- Visitor Logs Service ---

  getVisitorLogs(societyId: string): VisitorLog[] {
    return cachedVisitors.filter((v) => v.societyId === societyId);
  },

  async fetchVisitorLogs(societyId: string): Promise<VisitorLog[]> {
    try {
      const q = query(collection(db, 'visitors'), where('societyId', '==', societyId));
      const snap = await getDocs(q);
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as VisitorLog[];
      cachedVisitors = [...fetched, ...cachedVisitors.filter(v => v.societyId !== societyId)];
      return fetched;
    } catch {
      return this.getVisitorLogs(societyId);
    }
  },

  async addVisitorLog(
    logData: Omit<VisitorLog, 'id' | 'createdAt' | 'updatedAt' | 'offlineSyncStatus'>
  ): Promise<VisitorLog> {
    const id = 'vis_log_' + Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();
    const newLog: VisitorLog = {
      ...logData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'visitors', id), newLog);
    cachedVisitors.unshift(newLog);
    this.notify();
    return newLog;
  },

  async updateVisitorLogStatus(
    logId: string, 
    status: VisitorLog['status'], 
    extra?: Partial<VisitorLog>
  ): Promise<void> {
    const now = new Date().toISOString();
    const payload = {
      status,
      ...extra,
      updatedAt: now,
    };

    await updateDoc(doc(db, 'visitors', logId), payload);
    const idx = cachedVisitors.findIndex((v) => v.id === logId);
    if (idx !== -1) {
      cachedVisitors[idx] = { ...cachedVisitors[idx], ...payload };
    }
    this.notify();
  },

  // --- Pre-Approved Passes Service ---

  getPreApprovedPasses(societyId: string): PreApprovedPass[] {
    if (cachedPasses.length === 0) {
      this.fetchPreApprovedPasses(societyId);
    }
    return cachedPasses.filter((p) => p.societyId === societyId);
  },

  async fetchPreApprovedPasses(societyId: string): Promise<PreApprovedPass[]> {
    try {
      const q = query(collection(db, 'pre_approvals'), where('societyId', '==', societyId));
      const snap = await getDocs(q);
      cachedPasses = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as PreApprovedPass[];
      return cachedPasses;
    } catch {
      return cachedPasses;
    }
  },

  async addPreApprovedPass(
    passData: Omit<PreApprovedPass, 'id' | 'createdAt' | 'status' | 'qrCode'>
  ): Promise<PreApprovedPass> {
    const id = 'pass_' + Math.random().toString(36).substring(2, 11);
    const randomCode = 'OG-' + (passData.societyId.split('_')[1] || 'GW') + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    const newPass: PreApprovedPass = {
      ...passData,
      id,
      status: 'ACTIVE',
      qrCode: randomCode,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'pre_approvals', id), newPass);
    cachedPasses.unshift(newPass);
    this.notify();
    return newPass;
  },

  async updatePassStatus(passId: string, status: PreApprovedPass['status']): Promise<void> {
    await updateDoc(doc(db, 'pre_approvals', passId), { status });
    const idx = cachedPasses.findIndex((p) => p.id === passId);
    if (idx !== -1) {
      cachedPasses[idx].status = status;
    }
    this.notify();
  },

  getOfflineQueue(): VisitorLog[] {
    return [];
  },

  async syncOfflineQueue(): Promise<number> {
    return 0;
  },
};
