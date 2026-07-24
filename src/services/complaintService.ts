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

export interface Complaint {
  id: string;
  societyId: string;
  flatId: string;
  flatNumber: string;
  residentId: string;
  residentName: string;
  title: string;
  description: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'NOISE' | 'CLEANLINESS' | 'SECURITY' | 'PARKING' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
}

const getSeedComplaints = (societyId: string): Complaint[] => {
  const now = new Date().toISOString();
  return [
    {
      id: `cmp_${societyId}_001`,
      societyId,
      flatId: `flat_${societyId}_b504`,
      flatNumber: 'B-504',
      residentId: `res_${societyId}_001`,
      residentName: 'Taarak Mehta',
      title: 'Water Leakage in Bathroom Pipe',
      description: 'Minor water leakage near main flush tank. Requires plumber inspection.',
      category: 'PLUMBING',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedTo: 'usr_staff_002',
      assignedToName: 'Raju Sharma (Senior Plumber)',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `cmp_${societyId}_002`,
      societyId,
      flatId: `flat_${societyId}_a101`,
      flatNumber: 'A-101',
      residentId: `res_${societyId}_002`,
      residentName: 'Jethalal Gada',
      title: 'Corridor Light Bulb Flicker',
      description: 'The LED tube light outside flat A-101 is flickering intermittently.',
      category: 'ELECTRICAL',
      priority: 'MEDIUM',
      status: 'OPEN',
      assignedTo: 'usr_staff_001',
      assignedToName: 'Suresh Kumar (Electrician)',
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const complaintService = {
  /**
   * Fetch all complaints for a society.
   */
  async getComplaints(societyId: string): Promise<Complaint[]> {
    try {
      const q = query(collection(db, 'complaints'), where('societyId', '==', societyId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Complaint[];
      return list.length > 0 ? list : getSeedComplaints(societyId);
    } catch (error) {
      return getSeedComplaints(societyId);
    }
  },

  /**
   * Subscribe to real-time complaints.
   */
  subscribeComplaints(societyId: string, callback: (complaints: Complaint[]) => void): () => void {
    const q = query(collection(db, 'complaints'), where('societyId', '==', societyId));
    return onSnapshot(
      q,
      (snap) => {
        const complaints = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Complaint[];
        callback(complaints.length > 0 ? complaints : getSeedComplaints(societyId));
      },
      (error) => {
        console.error('Complaint snapshot error:', error);
        callback(getSeedComplaints(societyId));
      }
    );
  },

  /**
   * File a new complaint.
   */
  async addComplaint(complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Complaint> {
    try {
      const id = 'cmp_' + Math.random().toString(36).substring(2, 11);
      const now = new Date().toISOString();
      const newComplaint: Complaint = {
        ...complaint,
        id,
        status: 'OPEN',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'complaints', id), newComplaint);
      return newComplaint;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'complaints');
      throw error;
    }
  },

  /**
   * Update complaint status or assignment.
   */
  async updateComplaintStatus(
    id: string, 
    status: Complaint['status'], 
    assignedToName?: string
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const payload: Record<string, any> = {
        status,
        updatedAt: now,
      };
      if (assignedToName) {
        payload.assignedToName = assignedToName;
      }

      await updateDoc(doc(db, 'complaints', id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `complaints/${id}`);
    }
  },

  /**
   * Delete a complaint.
   */
  async deleteComplaint(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'complaints', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `complaints/${id}`);
    }
  }
};
