/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Apartment & Society Management Platform - Multi-tenant Domain Models (Phase 1)
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SOCIETY_ADMIN = 'SOCIETY_ADMIN',
  SECURITY_GUARD = 'SECURITY_GUARD',
  GUARD = 'SECURITY_GUARD',
  RESIDENT = 'RESIDENT',
  STAFF = 'STAFF'
}

export enum Permission {
  // SUPER_ADMIN Permissions
  MANAGE_SOCIETIES = 'MANAGE_SOCIETIES',
  PLATFORM_SETTINGS = 'PLATFORM_SETTINGS',
  SUBSCRIPTION_MANAGEMENT = 'SUBSCRIPTION_MANAGEMENT',
  PLATFORM_REPORTS = 'PLATFORM_REPORTS',
  AUDIT_LOGS = 'AUDIT_LOGS',
  GLOBAL_USER_MANAGEMENT = 'GLOBAL_USER_MANAGEMENT',

  // SOCIETY_ADMIN Permissions
  MANAGE_RESIDENTS = 'MANAGE_RESIDENTS',
  MANAGE_GUARDS = 'MANAGE_GUARDS',
  MANAGE_FLATS = 'MANAGE_FLATS',
  MANAGE_SOCIETY_VISITORS = 'MANAGE_SOCIETY_VISITORS',
  MANAGE_COMPLAINTS = 'MANAGE_COMPLAINTS',
  MANAGE_NOTICES = 'MANAGE_NOTICES',
  MANAGE_MAINTENANCE = 'MANAGE_MAINTENANCE',
  SOCIETY_SETTINGS = 'SOCIETY_SETTINGS',

  // GUARD Permissions
  VISITOR_ENTRY = 'VISITOR_ENTRY',
  VISITOR_EXIT = 'VISITOR_EXIT',
  DELIVERY_ENTRY = 'DELIVERY_ENTRY',
  EMERGENCY_ENTRY = 'EMERGENCY_ENTRY',
  SEARCH_RESIDENTS = 'SEARCH_RESIDENTS',

  // RESIDENT Permissions
  INVITE_VISITORS = 'INVITE_VISITORS',
  APPROVE_VISITORS = 'APPROVE_VISITORS',
  VIEW_MY_COMPLAINTS = 'VIEW_MY_COMPLAINTS',
  VIEW_MAINTENANCE_BILLS = 'VIEW_MAINTENANCE_BILLS',
  VIEW_NOTICES = 'VIEW_NOTICES',
  MANAGE_PROFILE = 'MANAGE_PROFILE',

  // STAFF Permissions
  VIEW_ASSIGNED_TASKS = 'VIEW_ASSIGNED_TASKS',
  UPDATE_TASK_STATUS = 'UPDATE_TASK_STATUS'
}

export enum ResidentType {
  OWNER_RESIDING = 'OWNER_RESIDING',
  OWNER_NON_RESIDING = 'OWNER_NON_RESIDING',
  TENANT = 'TENANT',
  FAMILY_MEMBER = 'FAMILY_MEMBER'
}

export enum VehicleType {
  TWO_WHEELER = 'TWO_WHEELER',
  FOUR_WHEELER = 'FOUR_WHEELER',
  OTHER = 'OTHER'
}

export enum VisitorType {
  GUEST = 'GUEST',
  DELIVERY = 'DELIVERY',
  DAILY_HELP = 'DAILY_HELP',
  CAB = 'CAB',
  OTHER = 'OTHER'
}

export enum DeliveryStatus {
  EXPECTED = 'EXPECTED',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  DENIED = 'DENIED',
  COLLECTED_AT_GATE = 'COLLECTED_AT_GATE'
}

export interface Society {
  id: string; // Tenant ID
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  totalBlocks: number;
  totalFlats: number;
  contactEmail: string;
  contactPhone: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  subscriptionPlan: 'free' | 'growth' | 'enterprise';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  societyId: string | null; // Null for Super Admin, isolated per Tenant otherwise
  createdAt: Date | string;
  updatedAt: Date | string;
  isActive: boolean;
}

export interface TowerBlock {
  id: string;
  societyId: string; // Isolated tenant scope
  name: string; // e.g. "Tower A", "Block B"
  totalFloors: number;
  createdAt: Date | string;
}

export interface Flat {
  id: string;
  societyId: string; // Isolated tenant scope
  blockId: string; // Ref to TowerBlock
  flatNumber: string; // e.g., "102", "A-504"
  floor: number;
  status: 'occupied' | 'vacant' | 'under_maintenance';
  createdAt: Date | string;
}

export interface Resident {
  id: string; // Matches UserProfile.uid
  societyId: string; // Tenant isolation
  flatId: string; // Ref to Flat
  residentType: ResidentType;
  familyMembersCount: number;
  isPrimaryContact: boolean;
  emergencyContact: string;
}

export interface SecurityGuard {
  id: string; // Matches UserProfile.uid
  societyId: string; // Tenant isolation
  shift: 'morning' | 'afternoon' | 'night';
  gateAssigned: string; // e.g. "Main Gate", "Back Gate"
  badgeNumber: string;
  activeDuty: boolean;
}

export interface Vehicle {
  id: string;
  societyId: string; // Tenant isolation
  flatId: string; // Ref to Flat
  ownerId: string; // Ref to UserProfile.uid
  vehicleNumber: string; // License Plate
  type: VehicleType;
  makeModel: string; // e.g., "Honda Civic"
  color: string;
  parkingSlotNumber?: string;
}

export interface VisitorLog {
  id: string;
  societyId: string; // Tenant isolation
  flatId: string; // Ref to Flat
  flatNumber: string; // Flat door identifier
  blockId: string; // Block/Tower identifier
  visitorName: string;
  visitorPhone: string;
  visitorType: VisitorType;
  purpose: string;
  vehicleNumber?: string;
  photoURL?: string;
  numberOfVisitors: number;
  expectedDuration?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  residentId: string; // Ref to Resident.id
  residentName: string;
  checkedInByGuardId?: string; // Ref to Guard.id
  checkedInByGuardName?: string;
  checkedOutByGuardId?: string; // Ref to Guard.id
  checkedOutByGuardName?: string;
  preApprovedPassId?: string; // If arrived via pre-approval
  createdAt: Date | string;
  updatedAt: Date | string;
  checkInTime?: Date | string;
  checkOutTime?: Date | string;
}

export interface PreApprovedPass {
  id: string;
  societyId: string;
  flatId: string;
  flatNumber: string;
  blockId: string;
  residentId: string;
  visitorName: string;
  visitorPhone: string;
  purpose: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  numberOfGuests: number;
  vehicleNumber?: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  qrCode: string; // Pass code
  createdAt: Date | string;
}

export interface BlacklistedPhone {
  phone: string;
  name: string;
  reason: string;
  blacklistedBy: string; // UID of Admin
  createdAt: Date | string;
}

export interface DeliveryLog {
  id: string;
  societyId: string; // Tenant isolation
  flatId: string;
  companyName: string; // e.g. "Amazon", "Swiggy"
  deliveryPersonName: string;
  deliveryPersonPhone: string;
  vehicleNumber?: string;
  status: DeliveryStatus;
  checkInTime: Date | string;
  checkOutTime?: Date | string;
  otpVerified: boolean;
}

export interface NotificationPayload {
  id: string;
  societyId: string | null; // Null if global system notice, tenant isolated otherwise
  title: string;
  body: string;
  type: 'announcement' | 'visitor_approval' | 'delivery_alert' | 'emergency';
  targetRoles: UserRole[];
  targetUserIds?: string[]; // Specific targets
  createdAt: Date | string;
  readBy: string[]; // List of User UIDs who read it
}

export interface SocietySettings {
  societyId: string;
  allowGuestSelfCheckIn: boolean;
  requireDeliveryOtp: boolean;
  emergencyContacts?: {
    name: string;
    phone: string;
  }[];
  updatedAt: Date | string;
}
