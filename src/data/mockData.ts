/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Society, UserProfile, UserRole, TowerBlock, Flat, Resident, SecurityGuard, SocietySettings, ResidentType } from '../types';

export const mockSocieties: Society[] = [
  {
    id: 'soc_greenwood_101',
    name: 'Gokuldham Co-operative Housing Society (CHS)',
    address: 'Film City Road, Goregaon East',
    city: 'Mumbai',
    state: 'Maharashtra',
    zipCode: '400063',
    totalBlocks: 3,
    totalFlats: 120,
    contactEmail: 'mgmt@gokuldhamchs.in',
    contactPhone: '+91 22 2685 0199',
    subscriptionPlan: 'growth',
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-06-15T12:00:00Z'
  },
  {
    id: 'soc_golden_202',
    name: 'Prestige Palms Residency',
    address: 'Sector 3, Outer Ring Road, HSR Layout',
    city: 'Bengaluru',
    state: 'Karnataka',
    zipCode: '560102',
    totalBlocks: 2,
    totalFlats: 80,
    contactEmail: 'admin@prestigepalms.in',
    contactPhone: '+91 80 4125 0288',
    subscriptionPlan: 'enterprise',
    createdAt: '2026-02-15T09:30:00Z',
    updatedAt: '2026-07-01T15:45:00Z'
  }
];

export const mockUsers: UserProfile[] = [
  // Super Admin
  {
    uid: 'user_super_admin',
    email: 'jain.vivek879@gmail.com',
    displayName: 'Vivek Jain (Super Admin)',
    phoneNumber: '+91 98765 43210',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SUPER_ADMIN,
    societyId: null, // Super Admin owns all societies
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-07-20T10:00:00Z',
    isActive: true
  },
  // Gokuldham Society Admin
  {
    uid: 'user_greenwood_admin',
    email: 'admin@gokuldhamchs.in',
    displayName: 'Jethalal Gada (Society Admin)',
    phoneNumber: '+91 98223 45678',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SOCIETY_ADMIN,
    societyId: 'soc_greenwood_101',
    createdAt: '2026-01-11T09:00:00Z',
    updatedAt: '2026-07-15T14:30:00Z',
    isActive: true
  },
  // Gokuldham Resident
  {
    uid: 'user_greenwood_resident',
    email: 'resident@gokuldhamchs.in',
    displayName: 'Taarak Mehta (Resident)',
    phoneNumber: '+91 98334 56789',
    photoURL: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.RESIDENT,
    societyId: 'soc_greenwood_101',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-07-18T11:20:00Z',
    isActive: true
  },
  // Gokuldham Security Guard
  {
    uid: 'user_greenwood_guard',
    email: 'guard@gokuldhamchs.in',
    displayName: 'Shankar Singh (Security Guard)',
    phoneNumber: '+91 98445 67890',
    photoURL: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SECURITY_GUARD,
    societyId: 'soc_greenwood_101',
    createdAt: '2026-01-20T06:00:00Z',
    updatedAt: '2026-07-19T18:00:00Z',
    isActive: true
  },
  // Prestige Palms Society Admin
  {
    uid: 'user_golden_admin',
    email: 'admin@prestigepalms.in',
    displayName: 'Ananth Narayan (Society Admin)',
    phoneNumber: '+91 91234 56789',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.SOCIETY_ADMIN,
    societyId: 'soc_golden_202',
    createdAt: '2026-02-16T10:00:00Z',
    updatedAt: '2026-07-10T16:00:00Z',
    isActive: true
  },
  // Prestige Palms Resident
  {
    uid: 'user_golden_resident',
    email: 'resident@prestigepalms.in',
    displayName: 'Vikram Hegde (Resident)',
    phoneNumber: '+91 99001 12233',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    role: UserRole.RESIDENT,
    societyId: 'soc_golden_202',
    createdAt: '2026-02-20T11:00:00Z',
    updatedAt: '2026-07-12T09:00:00Z',
    isActive: true
  }
];

export const mockTowerBlocks: TowerBlock[] = [
  { id: 'blk_gw_a', societyId: 'soc_greenwood_101', name: 'A Wing (Sun)', totalFloors: 10, createdAt: '2026-01-10T08:00:00Z' },
  { id: 'blk_gw_b', societyId: 'soc_greenwood_101', name: 'B Wing (Orchid)', totalFloors: 10, createdAt: '2026-01-10T08:00:00Z' },
  { id: 'blk_gw_c', societyId: 'soc_greenwood_101', name: 'C Wing (Lotus)', totalFloors: 12, createdAt: '2026-01-10T08:00:00Z' },
  { id: 'blk_gh_x', societyId: 'soc_golden_202', name: 'Tower Alpha', totalFloors: 8, createdAt: '2026-02-15T09:30:00Z' },
  { id: 'blk_gh_y', societyId: 'soc_golden_202', name: 'Tower Beta', totalFloors: 8, createdAt: '2026-02-15T09:30:00Z' }
];

export const mockFlats: Flat[] = [
  { id: 'flat_gw_a_101', societyId: 'soc_greenwood_101', blockId: 'blk_gw_a', flatNumber: 'A-101', floor: 1, status: 'occupied', createdAt: '2026-01-10T08:00:00Z' },
  { id: 'flat_gw_a_102', societyId: 'soc_greenwood_101', blockId: 'blk_gw_a', flatNumber: 'A-102', floor: 1, status: 'vacant', createdAt: '2026-01-10T08:00:00Z' },
  { id: 'flat_gw_b_504', societyId: 'soc_greenwood_101', blockId: 'blk_gw_b', flatNumber: 'B-504', floor: 5, status: 'occupied', createdAt: '2026-01-10T08:00:00Z' },
  { id: 'flat_gh_x_302', societyId: 'soc_golden_202', blockId: 'blk_gh_x', flatNumber: 'X-302', floor: 3, status: 'occupied', createdAt: '2026-02-15T09:30:00Z' }
];

export const mockResidents: Resident[] = [
  {
    id: 'user_greenwood_resident',
    societyId: 'soc_greenwood_101',
    flatId: 'flat_gw_b_504',
    residentType: ResidentType.OWNER_RESIDING,
    familyMembersCount: 4,
    isPrimaryContact: true,
    emergencyContact: '+91 22 2685 9111'
  },
  {
    id: 'user_golden_resident',
    societyId: 'soc_golden_202',
    flatId: 'flat_gh_x_302',
    residentType: ResidentType.TENANT,
    familyMembersCount: 2,
    isPrimaryContact: true,
    emergencyContact: '+91 80 4125 9222'
  }
];

export const mockGuards: SecurityGuard[] = [
  {
    id: 'user_greenwood_guard',
    societyId: 'soc_greenwood_101',
    shift: 'morning',
    gateAssigned: 'Main Entrance Gate 1',
    badgeNumber: 'GK-GUARD-108',
    activeDuty: true
  }
];

export const mockSocietySettings: SocietySettings[] = [
  {
    societyId: 'soc_greenwood_101',
    allowGuestSelfCheckIn: true,
    requireDeliveryOtp: true,
    updatedAt: '2026-07-15T12:00:00Z'
  },
  {
    societyId: 'soc_golden_202',
    allowGuestSelfCheckIn: false,
    requireDeliveryOtp: true,
    updatedAt: '2026-07-10T16:00:00Z'
  }
];
