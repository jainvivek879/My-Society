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
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface MaintenanceRecord {
  id: string;
  societyId: string;
  flatId: string;
  flatNumber: string;
  residentName: string;
  amount: number;
  dueDate: string;
  month: string;
  year: number;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  paidAt?: string;
  paymentMode?: 'UPI' | 'CARD' | 'NET_BANKING' | 'CASH' | 'CHEQUE';
  transactionId?: string;
  createdAt: string;
}

const getSeedMaintenanceRecords = (societyId: string): MaintenanceRecord[] => {
  const now = new Date().toISOString();
  return [
    {
      id: `maint_${societyId}_001`,
      societyId,
      flatId: `flat_${societyId}_b504`,
      flatNumber: 'B-504',
      residentName: 'Taarak Mehta',
      amount: 3500,
      dueDate: '2026-08-10',
      month: 'July',
      year: 2026,
      status: 'PAID',
      paidAt: now,
      paymentMode: 'UPI',
      transactionId: 'UPI/20260724/OG-98123',
      createdAt: now,
    },
    {
      id: `maint_${societyId}_002`,
      societyId,
      flatId: `flat_${societyId}_a101`,
      flatNumber: 'A-101',
      residentName: 'Jethalal Gada',
      amount: 3500,
      dueDate: '2026-08-10',
      month: 'July',
      year: 2026,
      status: 'UNPAID',
      createdAt: now,
    },
    {
      id: `maint_${societyId}_003`,
      societyId,
      flatId: `flat_${societyId}_a102`,
      flatNumber: 'A-102',
      residentName: 'Atmaram Bhide',
      amount: 3200,
      dueDate: '2026-08-10',
      month: 'July',
      year: 2026,
      status: 'PAID',
      paidAt: now,
      paymentMode: 'NET_BANKING',
      transactionId: 'TXN/20260724/BHIDE-01',
      createdAt: now,
    },
  ];
};

export const maintenanceService = {
  /**
   * Fetch all maintenance records for a society.
   */
  async getMaintenanceRecords(societyId: string): Promise<MaintenanceRecord[]> {
    try {
      const q = query(collection(db, 'maintenance'), where('societyId', '==', societyId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MaintenanceRecord[];
      return list.length > 0 ? list : getSeedMaintenanceRecords(societyId);
    } catch (error) {
      return getSeedMaintenanceRecords(societyId);
    }
  },

  /**
   * Subscribe to real-time maintenance records.
   */
  subscribeMaintenanceRecords(societyId: string, callback: (records: MaintenanceRecord[]) => void): () => void {
    const q = query(collection(db, 'maintenance'), where('societyId', '==', societyId));
    return onSnapshot(
      q,
      (snap) => {
        const records = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MaintenanceRecord[];
        callback(records.length > 0 ? records : getSeedMaintenanceRecords(societyId));
      },
      (error) => {
        console.error('Maintenance snapshot error:', error);
        callback(getSeedMaintenanceRecords(societyId));
      }
    );
  },

  /**
   * Add a new maintenance bill record.
   */
  async addMaintenanceRecord(
    record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'status'>
  ): Promise<MaintenanceRecord> {
    try {
      const id = 'maint_' + Math.random().toString(36).substring(2, 11);
      const now = new Date().toISOString();
      const newRecord: MaintenanceRecord = {
        ...record,
        id,
        status: 'UNPAID',
        createdAt: now,
      };

      await setDoc(doc(db, 'maintenance', id), newRecord);
      return newRecord;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'maintenance');
      throw error;
    }
  },

  /**
   * Mark a maintenance bill as paid.
   */
  async markAsPaid(
    id: string, 
    paymentMode: MaintenanceRecord['paymentMode'], 
    transactionId?: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'maintenance', id), {
        status: 'PAID',
        paidAt: now,
        paymentMode,
        transactionId: transactionId || 'TXN_' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `maintenance/${id}`);
    }
  },

  /**
   * Delete a maintenance record.
   */
  async deleteMaintenanceRecord(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'maintenance', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `maintenance/${id}`);
    }
  }
};
