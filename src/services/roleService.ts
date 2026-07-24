/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Role Service - Enterprise Role Definitions & Capabilities
 */

import { UserRole, Permission } from '../types';

export interface RoleDefinition {
  id: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  defaultModule: string;
}

export const ROLE_DEFINITIONS: Record<string, RoleDefinition> = {
  [UserRole.SUPER_ADMIN]: {
    id: UserRole.SUPER_ADMIN,
    displayName: 'Super Admin',
    description: 'Platform owner with full access across all societies and tenant configurations.',
    permissions: [
      Permission.MANAGE_SOCIETIES,
      Permission.PLATFORM_SETTINGS,
      Permission.SUBSCRIPTION_MANAGEMENT,
      Permission.PLATFORM_REPORTS,
      Permission.AUDIT_LOGS,
      Permission.GLOBAL_USER_MANAGEMENT,
      // Super admin has fallback access to administrative society tools
      Permission.MANAGE_RESIDENTS,
      Permission.MANAGE_GUARDS,
      Permission.MANAGE_FLATS,
      Permission.MANAGE_SOCIETY_VISITORS,
      Permission.MANAGE_COMPLAINTS,
      Permission.MANAGE_NOTICES,
      Permission.MANAGE_MAINTENANCE,
      Permission.SOCIETY_SETTINGS,
    ],
    defaultModule: 'super_admin_overview',
  },

  [UserRole.SOCIETY_ADMIN]: {
    id: UserRole.SOCIETY_ADMIN,
    displayName: 'Society Admin',
    description: 'Society administrator managing society operations, residents, guards, and settings.',
    permissions: [
      Permission.MANAGE_RESIDENTS,
      Permission.MANAGE_GUARDS,
      Permission.MANAGE_FLATS,
      Permission.MANAGE_SOCIETY_VISITORS,
      Permission.MANAGE_COMPLAINTS,
      Permission.MANAGE_NOTICES,
      Permission.MANAGE_MAINTENANCE,
      Permission.SOCIETY_SETTINGS,
      Permission.VIEW_NOTICES,
      Permission.MANAGE_PROFILE,
    ],
    defaultModule: 'society_management',
  },

  [UserRole.SECURITY_GUARD]: {
    id: UserRole.SECURITY_GUARD,
    displayName: 'Security Guard',
    description: 'Gate security personnel managing visitor entry, exit, and delivery logs.',
    permissions: [
      Permission.VISITOR_ENTRY,
      Permission.VISITOR_EXIT,
      Permission.DELIVERY_ENTRY,
      Permission.EMERGENCY_ENTRY,
      Permission.SEARCH_RESIDENTS,
      Permission.VIEW_NOTICES,
      Permission.MANAGE_PROFILE,
    ],
    defaultModule: 'guard_terminal',
  },

  [UserRole.RESIDENT]: {
    id: UserRole.RESIDENT,
    displayName: 'Resident',
    description: 'Flat owner or tenant managing visitor invites, approvals, bills, and complaints.',
    permissions: [
      Permission.INVITE_VISITORS,
      Permission.APPROVE_VISITORS,
      Permission.VIEW_MY_COMPLAINTS,
      Permission.VIEW_MAINTENANCE_BILLS,
      Permission.VIEW_NOTICES,
      Permission.MANAGE_PROFILE,
    ],
    defaultModule: 'resident_home',
  },

  [UserRole.STAFF]: {
    id: UserRole.STAFF,
    displayName: 'Society Staff',
    description: 'Maintenance or support staff handling assigned society tasks and updates.',
    permissions: [
      Permission.VIEW_ASSIGNED_TASKS,
      Permission.UPDATE_TASK_STATUS,
      Permission.VIEW_NOTICES,
      Permission.MANAGE_PROFILE,
    ],
    defaultModule: 'staff_tasks',
  },
};

export const roleService = {
  /**
   * Get complete definition for a given role
   */
  getRoleDefinition(role: UserRole | string): RoleDefinition {
    const normalizedRole = role === 'GUARD' ? UserRole.SECURITY_GUARD : role;
    return (
      ROLE_DEFINITIONS[normalizedRole] || ROLE_DEFINITIONS[UserRole.RESIDENT]
    );
  },

  /**
   * Get human readable display name for a role
   */
  getRoleLabel(role: UserRole | string): string {
    return this.getRoleDefinition(role).displayName;
  },

  /**
   * Return all permissions for a role
   */
  getPermissionsForRole(role: UserRole | string): Permission[] {
    return this.getRoleDefinition(role).permissions;
  },

  /**
   * Normalize user role string
   */
  normalizeRole(role: string): UserRole {
    if (role === 'GUARD' || role === 'SECURITY_GUARD') return UserRole.SECURITY_GUARD;
    if (role === 'SUPER_ADMIN') return UserRole.SUPER_ADMIN;
    if (role === 'SOCIETY_ADMIN') return UserRole.SOCIETY_ADMIN;
    if (role === 'STAFF') return UserRole.STAFF;
    return UserRole.RESIDENT;
  }
};
