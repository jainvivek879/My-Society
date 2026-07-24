/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface DeliveryLog {
  id: string;
  societyId: string;
  flatId: string;
  flatNumber: string;
  blockId: string;
  blockName: string;
  companyName: string;
  deliveryPersonName: string;
  deliveryPersonPhone: string;
  vehicleNumber?: string;
  photoURL?: string;
  trackingNumber?: string;
  purpose?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'LEAVE_AT_GATE' | 'LEAVE_AT_RECEPTION' | 'ALLOW_DIRECT_ENTRY' | 'CANCELLED';
  residentId: string;
  residentName: string;
  residentPhone?: string;
  checkedInByGuardId?: string;
  checkedInByGuardName?: string;
  checkedOutByGuardId?: string;
  checkedOutByGuardName?: string;
  entryTime?: string;
  exitTime?: string;
  duration?: number; // In minutes
  createdAt: string;
  updatedAt: string;
  otpVerified?: boolean;
  offlineSyncStatus?: 'PENDING' | 'SYNCED';
}

export interface ExpectedDelivery {
  id: string;
  societyId: string;
  flatId: string;
  flatNumber: string;
  blockId: string;
  blockName: string;
  residentId: string;
  residentName: string;
  companyName: string;
  trackingNumber?: string;
  expectedDate: string; // YYYY-MM-DD
  expectedTime: string; // HH:MM
  qrCode?: string;
  status: 'EXPECTED' | 'ARRIVED' | 'EXPIRED';
  createdAt: string;
}

export interface BlacklistedDeliveryPerson {
  phone: string;
  name: string;
  company: string;
  reason: string;
  blacklistedBy: string;
  createdAt: string;
}

// Predefined delivery companies
export const PREDEFINED_DELIVERIES = [
  'Amazon',
  'Flipkart',
  'Blinkit',
  'Zepto',
  'Instamart',
  'BigBasket',
  'Swiggy',
  'Zomato',
  'Domino\'s',
  'Pizza Hut',
  'Courier',
  'DTDC',
  'Blue Dart',
  'Delhivery',
  'Medicine',
  'Milk',
  'Water',
  'Gas Cylinder',
  'Laundry',
  'Custom Delivery'
];

// LocalStorage Keys
const KEYS = {
  DELIVERIES: 'omnigate_deliveries_v4',
  EXPECTED_DELIVERIES: 'omnigate_expected_deliveries_v4',
  BLACKLIST: 'omnigate_delivery_blacklist_v4',
  OFFLINE_QUEUE: 'omnigate_delivery_offline_queue_v4',
  OFFLINE_MODE: 'omnigate_delivery_is_offline_v4'
};

// Initial empty arrays for clean real-time data
const INITIAL_DELIVERIES = (_societyId: string): DeliveryLog[] => [];
const INITIAL_EXPECTED_DELIVERIES = (_societyId: string): ExpectedDelivery[] => [];
const INITIAL_BLACKLIST: BlacklistedDeliveryPerson[] = [];

type DeliveryListener = () => void;
const listeners: Set<DeliveryListener> = new Set();

export const deliveryService = {
  init(_societyId: string = 'soc_greenwood_101') {
    const existingDel = localStorage.getItem(KEYS.DELIVERIES);
    if (!existingDel || existingDel.includes('del_log_001')) {
      localStorage.setItem(KEYS.DELIVERIES, JSON.stringify([]));
    }
    const existingExp = localStorage.getItem(KEYS.EXPECTED_DELIVERIES);
    if (!existingExp || existingExp.includes('exp_del_001')) {
      localStorage.setItem(KEYS.EXPECTED_DELIVERIES, JSON.stringify([]));
    }
    const existingBl = localStorage.getItem(KEYS.BLACKLIST);
    if (!existingBl || existingBl.includes('Mohit Sharma')) {
      localStorage.setItem(KEYS.BLACKLIST, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.OFFLINE_QUEUE)) {
      localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify([]));
    }
  },

  subscribe(listener: DeliveryListener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notify() {
    listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('Error in delivery listener:', err);
      }
    });
  },

  // --- Offline Mode ---
  isOffline(): boolean {
    return localStorage.getItem(KEYS.OFFLINE_MODE) === 'true';
  },

  setOffline(offline: boolean) {
    localStorage.setItem(KEYS.OFFLINE_MODE, String(offline));
    this.notify();
    if (!offline) {
      this.syncOfflineQueue();
    }
  },

  async syncOfflineQueue() {
    const queue = JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE) || '[]') as DeliveryLog[];
    if (queue.length === 0) return;

    // Attempt offline queue sync silently
    const successfulIds: string[] = [];

    for (const item of queue) {
      try {
        const deliveryRef = doc(db, 'societies', item.societyId, 'deliveries', item.id);
        const { offlineSyncStatus, ...payload } = item;
        await setDoc(deliveryRef, {
          ...payload,
          updatedAt: new Date().toISOString()
        });
        successfulIds.push(item.id);
      } catch (err) {
        console.error(`Failed to sync delivery ${item.id}:`, err);
      }
    }

    // Remove successful syncs
    const updatedQueue = queue.filter(item => !successfulIds.includes(item.id));
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(updatedQueue));

    // Update main deliveries status
    const allDeliveries = JSON.parse(localStorage.getItem(KEYS.DELIVERIES) || '[]') as DeliveryLog[];
    allDeliveries.forEach(item => {
      if (successfulIds.includes(item.id)) {
        item.offlineSyncStatus = 'SYNCED';
      }
    });
    localStorage.setItem(KEYS.DELIVERIES, JSON.stringify(allDeliveries));
    this.notify();
  },

  // --- Real-time Listeners ---
  subscribeDeliveries(societyId: string, callback: (deliveries: DeliveryLog[]) => void) {
    this.init(societyId);

    // Initial load from local
    const localData = this.getDeliveriesLocal(societyId);
    callback(localData);

    if (this.isOffline()) {
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'societies', societyId, 'deliveries'),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const firestoreData: DeliveryLog[] = [];
        snapshot.forEach((docSnap) => {
          firestoreData.push({ id: docSnap.id, ...docSnap.data() } as DeliveryLog);
        });

        if (firestoreData.length > 0) {
          // Merge local pending offline with firestore
          const offlineQueue = JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE) || '[]') as DeliveryLog[];
          const offlineMap = new Map(offlineQueue.map(item => [item.id, item]));

          const merged = [...offlineQueue];
          firestoreData.forEach(item => {
            if (!offlineMap.has(item.id)) {
              merged.push(item);
            }
          });

          // Sort by date desc
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          localStorage.setItem(KEYS.DELIVERIES, JSON.stringify(merged));
          callback(merged);
        }
      }, (error) => {
        console.warn("Firestore deliveries subscribe error, falling back to local state.", error);
      });
    } catch (err) {
      console.warn("Could not bind Firestore listener:", err);
      return () => {};
    }
  },

  subscribeExpectedDeliveries(societyId: string, callback: (expected: ExpectedDelivery[]) => void) {
    this.init(societyId);

    // Initial load from local
    const localData = this.getExpectedDeliveriesLocal(societyId);
    callback(localData);

    if (this.isOffline()) {
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'societies', societyId, 'expected_deliveries'),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const firestoreData: ExpectedDelivery[] = [];
        snapshot.forEach((docSnap) => {
          firestoreData.push({ id: docSnap.id, ...docSnap.data() } as ExpectedDelivery);
        });

        if (firestoreData.length > 0) {
          localStorage.setItem(KEYS.EXPECTED_DELIVERIES, JSON.stringify(firestoreData));
          callback(firestoreData);
        }
      }, (error) => {
        console.warn("Firestore expected deliveries subscribe error, falling back to local state.", error);
      });
    } catch (err) {
      console.warn("Could not bind expected deliveries Firestore listener:", err);
      return () => {};
    }
  },

  // --- Local Fetch Getters ---
  getDeliveriesLocal(societyId: string): DeliveryLog[] {
    try {
      const data = JSON.parse(localStorage.getItem(KEYS.DELIVERIES) || '[]');
      return data.filter((item: DeliveryLog) => item.societyId === societyId);
    } catch {
      return INITIAL_DELIVERIES(societyId);
    }
  },

  getExpectedDeliveriesLocal(societyId: string): ExpectedDelivery[] {
    try {
      const data = JSON.parse(localStorage.getItem(KEYS.EXPECTED_DELIVERIES) || '[]');
      return data.filter((item: ExpectedDelivery) => item.societyId === societyId);
    } catch {
      return INITIAL_EXPECTED_DELIVERIES(societyId);
    }
  },

  // --- CRUD Operations ---
  async addDeliveryLog(
    societyId: string,
    logData: Omit<DeliveryLog, 'id' | 'createdAt' | 'updatedAt' | 'offlineSyncStatus'>
  ): Promise<DeliveryLog> {
    this.init(societyId);
    const logs = JSON.parse(localStorage.getItem(KEYS.DELIVERIES) || '[]') as DeliveryLog[];

    const newLog: DeliveryLog = {
      ...logData,
      id: 'del_log_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      offlineSyncStatus: 'SYNCED'
    };

    if (this.isOffline()) {
      newLog.offlineSyncStatus = 'PENDING';
      const queue = JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE) || '[]');
      queue.push(newLog);
      localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } else {
      try {
        const docRef = doc(db, 'societies', societyId, 'deliveries', newLog.id);
        await setDoc(docRef, { ...newLog });
      } catch (err) {
        console.warn("Failed saving delivery to Firestore, queuing locally instead.", err);
        newLog.offlineSyncStatus = 'PENDING';
        const queue = JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE) || '[]');
        queue.push(newLog);
        localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      }
    }

    logs.unshift(newLog);
    localStorage.setItem(KEYS.DELIVERIES, JSON.stringify(logs));
    this.notify();
    return newLog;
  },

  async updateDeliveryStatus(
    societyId: string,
    id: string,
    status: DeliveryLog['status'],
    extra: Partial<DeliveryLog> = {}
  ): Promise<void> {
    this.init(societyId);
    const logs = JSON.parse(localStorage.getItem(KEYS.DELIVERIES) || '[]') as DeliveryLog[];
    const idx = logs.findIndex(l => l.id === id);

    if (idx !== -1) {
      const updatedLog = {
        ...logs[idx],
        status,
        ...extra,
        updatedAt: new Date().toISOString()
      };

      logs[idx] = updatedLog;
      localStorage.setItem(KEYS.DELIVERIES, JSON.stringify(logs));

      if (!this.isOffline()) {
        try {
          const docRef = doc(db, 'societies', societyId, 'deliveries', id);
          await updateDoc(docRef, {
            status,
            ...extra,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn(`Firestore update failed for delivery ${id}:`, err);
        }
      } else {
        // If we are offline and update an existing log, store in queue
        const queue = JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE) || '[]') as DeliveryLog[];
        const qIdx = queue.findIndex(item => item.id === id);
        if (qIdx !== -1) {
          queue[qIdx] = updatedLog;
        } else {
          queue.push(updatedLog);
        }
        localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
      }

      this.notify();
    }
  },

  // --- Expected Deliveries ---
  async addExpectedDelivery(
    societyId: string,
    data: Omit<ExpectedDelivery, 'id' | 'createdAt'>
  ): Promise<ExpectedDelivery> {
    this.init(societyId);
    const expected = JSON.parse(localStorage.getItem(KEYS.EXPECTED_DELIVERIES) || '[]') as ExpectedDelivery[];

    const newExpected: ExpectedDelivery = {
      ...data,
      id: 'exp_del_' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };

    expected.unshift(newExpected);
    localStorage.setItem(KEYS.EXPECTED_DELIVERIES, JSON.stringify(expected));

    if (!this.isOffline()) {
      try {
        const docRef = doc(db, 'societies', societyId, 'expected_deliveries', newExpected.id);
        await setDoc(docRef, { ...newExpected });
      } catch (err) {
        console.warn("Failed expected delivery sync to Firestore:", err);
      }
    }

    this.notify();
    return newExpected;
  },

  async deleteExpectedDelivery(societyId: string, id: string): Promise<void> {
    this.init(societyId);
    const expected = JSON.parse(localStorage.getItem(KEYS.EXPECTED_DELIVERIES) || '[]') as ExpectedDelivery[];
    const updated = expected.filter(item => item.id !== id);
    localStorage.setItem(KEYS.EXPECTED_DELIVERIES, JSON.stringify(updated));

    if (!this.isOffline()) {
      try {
        const docRef = doc(db, 'societies', societyId, 'expected_deliveries', id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn("Failed deleting expected delivery from Firestore:", err);
      }
    }

    this.notify();
  },

  // --- Blacklist Delivery Person ---
  getBlacklist(): BlacklistedDeliveryPerson[] {
    try {
      return JSON.parse(localStorage.getItem(KEYS.BLACKLIST) || '[]');
    } catch {
      return INITIAL_BLACKLIST;
    }
  },

  isBlacklisted(phone: string): boolean {
    const list = this.getBlacklist();
    const cleanPhone = phone.replace(/\s/g, '');
    return list.some(item => item.phone.replace(/\s/g, '') === cleanPhone);
  },

  addToBlacklist(item: BlacklistedDeliveryPerson) {
    const list = this.getBlacklist();
    list.unshift(item);
    localStorage.setItem(KEYS.BLACKLIST, JSON.stringify(list));
    this.notify();
  },

  removeFromBlacklist(phone: string) {
    const list = this.getBlacklist();
    const updated = list.filter(item => item.phone !== phone);
    localStorage.setItem(KEYS.BLACKLIST, JSON.stringify(updated));
    this.notify();
  }
};
