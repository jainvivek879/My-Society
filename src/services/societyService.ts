/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserRole } from '../types';

// --- Interfaces & Types ---

export interface Society {
  id: string;
  name: string;
  logo?: string;
  registrationNumber?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string; // PIN Code
  pincode?: string;
  contactPhone: string;
  contactEmail: string;
  emergencyContacts?: { name: string; phone: string }[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  totalBlocks: number;
  totalFlats: number;
  subscriptionPlan: 'free' | 'growth' | 'enterprise';
  adminUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Floor {
  floorNumber: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TowerBlock {
  id: string;
  societyId: string;
  name: string;
  code: string;
  totalFloors: number;
  status: 'ACTIVE' | 'INACTIVE';
  floors: Floor[];
  createdAt: string;
}

export interface Flat {
  id: string;
  societyId: string;
  blockId: string; // Tower/Wing ID
  flatNumber: string;
  floor: number;
  ownerName?: string;
  tenantName?: string;
  status: 'occupied' | 'vacant' | 'under_maintenance';
  area?: number; // Sq. Ft.
  parkingSlot?: string;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  photoURL?: string;
  mobile: string;
  email: string;
  emergencyContact: string;
}

export interface ResidentVehicle {
  id: string;
  vehicleNumber: string;
  type: 'TWO_WHEELER' | 'FOUR_WHEELER' | 'OTHER';
  brand: string;
  color: string;
  parkingSlot?: string;
  stickerNumber?: string;
}

export interface Resident {
  id: string;
  societyId: string;
  flatId: string; // Links to Unit/Flat
  photoURL?: string;
  name: string;
  mobile: string;
  email: string;
  residentType: 'OWNER' | 'TENANT';
  moveInDate?: string;
  moveOutDate?: string;
  emergencyContact: string;
  occupation?: string;
  dob?: string;
  gender?: string;
  status: 'ACTIVE' | 'INACTIVE';
  familyMembers: FamilyMember[];
  vehicles: ResidentVehicle[];
  createdAt: string;
  updatedAt: string;
}

export interface SecurityGuard {
  id: string;
  societyId: string;
  name: string;
  mobile: string;
  email?: string;
  shift: 'morning' | 'afternoon' | 'night';
  gateAssigned: string;
  badgeNumber: string;
  activeDuty: boolean;
  createdAt: string;
}

// In-memory cache for quick sync reads where components rely on synchronous initial renders
let cachedSocieties: Society[] = [];
let cachedTowers: Record<string, TowerBlock[]> = {};
let cachedFlats: Record<string, Flat[]> = {};
let cachedResidents: Record<string, Resident[]> = {};

// Helper: Bootstrap default seed data to Firestore if completely empty
const seedInitialDataIfNeeded = async () => {
  try {
    const snap = await getDocs(collection(db, 'societies'));
    if (snap.empty) {
      const now = new Date().toISOString();
      const defaultSociety: Society = {
        id: 'soc_greenwood_101',
        name: 'Greenwood Heights Society',
        logo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=120&h=120&q=80',
        registrationNumber: 'REG/MUM-WEST/101/2026',
        address: '101 Heights Boulevard, Andheri West',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400053',
        pincode: '400053',
        contactPhone: '+91 22 2685 0100',
        contactEmail: 'admin@greenwoodheights.in',
        status: 'ACTIVE',
        totalBlocks: 3,
        totalFlats: 120,
        subscriptionPlan: 'enterprise',
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'societies', defaultSociety.id), defaultSociety);

      // Seed default block
      const defaultBlock: TowerBlock = {
        id: 'blk_gw_b',
        societyId: defaultSociety.id,
        name: 'Block B',
        code: 'B',
        totalFloors: 10,
        status: 'ACTIVE',
        floors: Array.from({ length: 10 }, (_, i) => ({ floorNumber: i + 1, name: `${i + 1}st Floor`, status: 'ACTIVE' })),
        createdAt: now,
      };
      await setDoc(doc(db, 'societies', defaultSociety.id, 'blocks', defaultBlock.id), defaultBlock);

      // Seed default flat
      const defaultFlat: Flat = {
        id: 'flat_gw_b_504',
        societyId: defaultSociety.id,
        blockId: defaultBlock.id,
        flatNumber: 'B-504',
        floor: 5,
        ownerName: 'Taarak Mehta',
        status: 'occupied',
        area: 1200,
        parkingSlot: 'P-504',
        createdAt: now,
      };
      await setDoc(doc(db, 'societies', defaultSociety.id, 'flats', defaultFlat.id), defaultFlat);

      // Seed default resident
      const defaultResident: Resident = {
        id: 'res_001',
        societyId: defaultSociety.id,
        flatId: defaultFlat.id,
        photoURL: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80',
        name: 'Taarak Mehta',
        mobile: '+91 98334 56789',
        email: 'resident@gokuldhamchs.in',
        residentType: 'OWNER',
        moveInDate: '2026-01-15',
        emergencyContact: '+91 22 2685 9111',
        occupation: 'Writer & Journalist',
        dob: '1985-05-24',
        gender: 'Male',
        status: 'ACTIVE',
        familyMembers: [
          {
            id: 'fam_001',
            name: 'Anjali Mehta',
            relationship: 'Spouse',
            mobile: '+91 98334 56780',
            email: 'anjali@gokuldhamchs.in',
            emergencyContact: '+91 98334 56789',
          },
        ],
        vehicles: [
          {
            id: 'veh_001',
            vehicleNumber: 'MH-02-CD-5678',
            type: 'FOUR_WHEELER',
            brand: 'Honda City',
            color: 'Silver',
            parkingSlot: 'P-504',
            stickerNumber: 'OG-GW-0504-V1',
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(doc(db, 'societies', defaultSociety.id, 'residents', defaultResident.id), defaultResident);
    }
  } catch (e) {
    console.warn('Notice seeding initial society data:', e);
  }
};

seedInitialDataIfNeeded();

export const societyService = {
  /**
   * Subscribe to live updates of societies from Firestore.
   */
  subscribe(callback: () => void): () => void {
    const unsub = onSnapshot(collection(db, 'societies'), (snapshot) => {
      cachedSocieties = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Society[];
      callback();
    });
    return unsub;
  },

  /**
   * Fetch all societies from Firestore.
   */
  async fetchSocieties(): Promise<Society[]> {
    try {
      const snap = await getDocs(collection(db, 'societies'));
      cachedSocieties = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Society[];
      return cachedSocieties;
    } catch (err) {
      console.warn('fetchSocieties notice:', err);
      return cachedSocieties;
    }
  },

  /**
   * Create a new society document in Firestore.
   */
  async createSociety(params: {
    name: string;
    city: string;
    address: string;
    subscriptionPlan?: 'enterprise' | 'growth' | 'free' | 'Enterprise' | 'Growth' | 'Starter';
    totalBlocks?: number;
    totalFlats?: number;
  }): Promise<Society> {
    const id = 'soc_' + params.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 15) + '_' + Math.floor(100 + Math.random() * 900);
    const now = new Date().toISOString();
    const newSoc: Society = {
      id,
      name: params.name,
      address: params.address,
      city: params.city,
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400001',
      contactPhone: '+91 22 2000 1000',
      contactEmail: `admin@${id}.in`,
      status: 'ACTIVE',
      totalBlocks: params.totalBlocks || 3,
      totalFlats: params.totalFlats || 100,
      subscriptionPlan: (params.subscriptionPlan as any) || 'Enterprise',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await setDoc(doc(db, 'societies', id), newSoc);
      cachedSocieties.unshift(newSoc);
    } catch (err) {
      console.warn('createSociety notice:', err);
    }
    return newSoc;
  },

  /**
   * Synchronous getter returning cached societies list.
   */
  getSocieties(): Society[] {
    if (cachedSocieties.length === 0) {
      this.fetchSocieties();
    }
    return cachedSocieties;
  },

  /**
   * Get single society by ID from Firestore.
   */
  async getSocietyById(id: string): Promise<Society | null> {
    const fallbackSociety: Society = {
      id: id || 'soc_greenwood_101',
      name: 'Greenwood Heights Society',
      logo: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=120&h=120&q=80',
      registrationNumber: 'REG/MUM-WEST/101/2026',
      address: '101 Heights Boulevard, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      zipCode: '400053',
      pincode: '400053',
      contactPhone: '+91 22 2685 0100',
      contactEmail: 'admin@greenwoodheights.in',
      status: 'ACTIVE',
      totalBlocks: 3,
      totalFlats: 120,
      subscriptionPlan: 'enterprise',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const snap = await getDoc(doc(db, 'societies', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Society;
      }
      return fallbackSociety;
    } catch (err) {
      console.warn('getSocietyById Firestore notice (using default society context):', err);
      return fallbackSociety;
    }
  },

  /**
   * Register a new society in Firestore.
   */
  async addSociety(societyData: Omit<Society, 'id' | 'createdAt' | 'updatedAt'>): Promise<Society> {
    try {
      const id = 'soc_' + Math.random().toString(36).substring(2, 11);
      const now = new Date().toISOString();
      const newSociety: Society = {
        ...societyData,
        id,
        pincode: societyData.zipCode,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'societies', id), newSociety);
      cachedSocieties.push(newSociety);
      return newSociety;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'societies');
      throw err;
    }
  },

  /**
   * Update society details in Firestore.
   */
  async updateSociety(id: string, updates: Partial<Society>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const payload = {
        ...updates,
        updatedAt: now,
      };
      await updateDoc(doc(db, 'societies', id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `societies/${id}`);
    }
  },

  /**
   * Delete society from Firestore.
   */
  async deleteSociety(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'societies', id));
      cachedSocieties = cachedSocieties.filter((s) => s.id !== id);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `societies/${id}`);
    }
  },

  // --- Tower Blocks Services ---

  async fetchTowers(societyId: string): Promise<TowerBlock[]> {
    try {
      const snap = await getDocs(collection(db, 'societies', societyId, 'blocks'));
      const towers = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as TowerBlock[];
      cachedTowers[societyId] = towers;
      return towers;
    } catch (err) {
      return cachedTowers[societyId] || [];
    }
  },

  getTowers(societyId: string): TowerBlock[] {
    return cachedTowers[societyId] || [];
  },

  async addTower(societyId: string, tower: Omit<TowerBlock, 'id' | 'societyId' | 'createdAt' | 'floors'>): Promise<TowerBlock> {
    const id = 'blk_' + Math.random().toString(36).substring(2, 11);
    const floors: Floor[] = Array.from({ length: tower.totalFloors }, (_, i) => ({
      floorNumber: i + 1,
      name: `${i + 1}st Floor`,
      status: 'ACTIVE',
    }));

    const newTower: TowerBlock = {
      ...tower,
      id,
      societyId,
      floors,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'societies', societyId, 'blocks', id), newTower);
    if (!cachedTowers[societyId]) cachedTowers[societyId] = [];
    cachedTowers[societyId].push(newTower);
    return newTower;
  },

  async updateTower(societyId: string, id: string, updates: Partial<TowerBlock>): Promise<void> {
    await updateDoc(doc(db, 'societies', societyId, 'blocks', id), updates);
  },

  async deleteTower(societyId: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'societies', societyId, 'blocks', id));
  },

  // --- Flat Services ---

  async fetchFlats(societyId: string): Promise<Flat[]> {
    try {
      const snap = await getDocs(collection(db, 'societies', societyId, 'flats'));
      const flats = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Flat[];
      cachedFlats[societyId] = flats;
      return flats;
    } catch {
      return cachedFlats[societyId] || [];
    }
  },

  getFlats(societyId: string): Flat[] {
    return cachedFlats[societyId] || [];
  },

  async addFlat(societyId: string, flat: Omit<Flat, 'id' | 'societyId' | 'createdAt'>): Promise<{ success: boolean; error?: string; data?: Flat }> {
    try {
      const id = 'flat_' + Math.random().toString(36).substring(2, 11);
      const newFlat: Flat = {
        ...flat,
        id,
        societyId,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'societies', societyId, 'flats', id), newFlat);
      if (!cachedFlats[societyId]) cachedFlats[societyId] = [];
      cachedFlats[societyId].push(newFlat);
      return { success: true, data: newFlat };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to add flat.' };
    }
  },

  async updateFlat(id: string, flatData: Partial<Flat>): Promise<{ success: boolean; error?: string }> {
    try {
      const societyId = flatData.societyId || 'soc_greenwood_101';
      await updateDoc(doc(db, 'societies', societyId, 'flats', id), flatData);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update flat.' };
    }
  },

  async deleteFlat(id: string, societyId = 'soc_greenwood_101'): Promise<void> {
    await deleteDoc(doc(db, 'societies', societyId, 'flats', id));
  },

  // --- Resident Services ---

  async fetchResidents(societyId: string): Promise<Resident[]> {
    try {
      const snap = await getDocs(collection(db, 'societies', societyId, 'residents'));
      const residents = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Resident[];
      cachedResidents[societyId] = residents;
      return residents;
    } catch {
      return cachedResidents[societyId] || [];
    }
  },

  getResidents(societyId: string): Resident[] {
    return cachedResidents[societyId] || [];
  },

  async addResident(
    societyId: string, 
    resident: Omit<Resident, 'id' | 'societyId' | 'createdAt' | 'updatedAt'>
  ): Promise<{ success: boolean; error?: string; data?: Resident }> {
    try {
      const id = 'res_' + Math.random().toString(36).substring(2, 11);
      const now = new Date().toISOString();
      const newResident: Resident = {
        ...resident,
        id,
        societyId,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'societies', societyId, 'residents', id), newResident);
      if (!cachedResidents[societyId]) cachedResidents[societyId] = [];
      cachedResidents[societyId].push(newResident);
      return { success: true, data: newResident };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to add resident.' };
    }
  },

  async updateResident(id: string, updates: Partial<Resident>): Promise<{ success: boolean; error?: string }> {
    try {
      const societyId = updates.societyId || 'soc_greenwood_101';
      const now = new Date().toISOString();
      await updateDoc(doc(db, 'societies', societyId, 'residents', id), {
        ...updates,
        updatedAt: now,
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update resident.' };
    }
  },

  async deleteResident(id: string, societyId = 'soc_greenwood_101'): Promise<void> {
    await deleteDoc(doc(db, 'societies', societyId, 'residents', id));
  },

  // --- Global Search ---
  globalSearch(societyId: string, queryStr: string) {
    const q = queryStr.toLowerCase().replace(/\s/g, '');
    if (!q) {
      return { residents: [], flats: [], vehicles: [], towers: [] };
    }

    const residents = this.getResidents(societyId);
    const flats = this.getFlats(societyId);
    const towers = this.getTowers(societyId);

    const matchedResidents = residents.filter(
      (r) =>
        (r.name || '').toLowerCase().includes(q) ||
        (r.mobile || '').replace(/\s/g, '').includes(q) ||
        (r.email || '').toLowerCase().includes(q)
    );

    const matchedFlats = flats
      .filter((f) => (f.flatNumber || '').toLowerCase().replace(/\s/g, '').includes(q))
      .map((f) => {
        const block = towers.find((t) => t.id === f.blockId);
        return {
          ...f,
          blockName: block ? block.name : 'Unknown Wing',
        };
      });

    const matchedVehicles: { vehicle: ResidentVehicle; residentName: string; flatNumber: string }[] = [];
    residents.forEach((r) => {
      const flat = flats.find((f) => f.id === r.flatId);
      (r.vehicles || []).forEach((v) => {
        if (
          (v.vehicleNumber || '').toLowerCase().replace(/\s/g, '').includes(q) ||
          (v.brand || '').toLowerCase().includes(q) ||
          (v.color || '').toLowerCase().includes(q)
        ) {
          matchedVehicles.push({
            vehicle: v,
            residentName: r.name || 'Resident',
            flatNumber: flat ? flat.flatNumber : 'N/A',
          });
        }
      });
    });

    const matchedTowers = towers.filter(
      (t) => (t.name || '').toLowerCase().includes(q) || (t.code || '').toLowerCase().includes(q)
    );

    return {
      residents: matchedResidents,
      flats: matchedFlats,
      vehicles: matchedVehicles,
      towers: matchedTowers,
    };
  },
};
