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

export interface Notice {
  id: string;
  societyId: string;
  title: string;
  content: string;
  category: 'GENERAL' | 'MAINTENANCE' | 'EVENT' | 'EMERGENCY' | 'MEETING';
  createdBy: string;
  creatorName: string;
  targetRoles: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const getSeedNotices = (societyId: string): Notice[] => {
  const now = new Date().toISOString();
  return [
    {
      id: `not_${societyId}_001`,
      societyId,
      title: '📢 Annual General Meeting (AGM 2026)',
      content: 'The Annual General Body Meeting for society residents will be held at the Clubhouse Auditorium this Sunday at 10:00 AM. Attendance is requested.',
      category: 'MEETING',
      createdBy: 'usr_soc_admin_001',
      creatorName: 'Society Management Committee',
      targetRoles: ['RESIDENT', 'SOCIETY_ADMIN'],
      isPinned: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `not_${societyId}_002`,
      societyId,
      title: '🚰 Scheduled Water Tank Cleaning Notice',
      content: 'Water overhead tanks in Block A, B, and C will undergo deep sanitation cleaning tomorrow from 01:00 PM to 05:00 PM. Water supply will be paused during these hours.',
      category: 'MAINTENANCE',
      createdBy: 'usr_soc_admin_001',
      creatorName: 'Maintenance Lead',
      targetRoles: ['RESIDENT'],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const noticeService = {
  /**
   * Fetch all notices for a society.
   */
  async getNotices(societyId: string): Promise<Notice[]> {
    try {
      const q = query(collection(db, 'notices'), where('societyId', '==', societyId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Notice[];
      return list.length > 0 ? list : getSeedNotices(societyId);
    } catch (error) {
      return getSeedNotices(societyId);
    }
  },

  /**
   * Subscribe to real-time notices.
   */
  subscribeNotices(societyId: string, callback: (notices: Notice[]) => void): () => void {
    const q = query(collection(db, 'notices'), where('societyId', '==', societyId));
    return onSnapshot(
      q,
      (snap) => {
        const notices = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Notice[];
        callback(notices.length > 0 ? notices : getSeedNotices(societyId));
      },
      (error) => {
        console.error('Notice snapshot error:', error);
        callback(getSeedNotices(societyId));
      }
    );
  },

  /**
   * Add a new notice/announcement.
   */
  async addNotice(notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Notice> {
    try {
      const id = 'not_' + Math.random().toString(36).substring(2, 11);
      const now = new Date().toISOString();
      const newNotice: Notice = {
        ...notice,
        id,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'notices', id), newNotice);
      return newNotice;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notices');
      throw error;
    }
  },

  /**
   * Update an existing notice.
   */
  async updateNotice(id: string, updates: Partial<Notice>): Promise<void> {
    try {
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'notices', id), {
        ...updates,
        updatedAt: now,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notices/${id}`);
    }
  },

  /**
   * Delete a notice.
   */
  async deleteNotice(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'notices', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notices/${id}`);
    }
  }
};
