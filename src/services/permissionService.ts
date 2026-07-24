/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Permission Service - Granular Permission Checker & Multi-tenant Scope Validator
 */

import { UserRole, Permission, UserProfile, Society } from '../types';
import { roleService } from './roleService';

export interface NavItem {
  id: string;
  label: string;
  iconName: string;
  permission?: Permission;
  requiredRoles?: UserRole[];
  badge?: string;
}

export const permissionService = {
  /**
   * Check if a role possesses a specific permission
   */
  hasPermission(role: UserRole | string, permission: Permission): boolean {
    if (!role) return false;
    const permissions = roleService.getPermissionsForRole(role);
    return permissions.includes(permission);
  },

  /**
   * Check if user has ANY of the specified permissions
   */
  hasAnyPermission(role: UserRole | string, permissions: Permission[]): boolean {
    if (!role || !permissions || permissions.length === 0) return false;
    const rolePermissions = roleService.getPermissionsForRole(role);
    return permissions.some((p) => rolePermissions.includes(p));
  },

  /**
   * Check if user has ALL of the specified permissions
   */
  hasAllPermissions(role: UserRole | string, permissions: Permission[]): boolean {
    if (!role || !permissions || permissions.length === 0) return false;
    const rolePermissions = roleService.getPermissionsForRole(role);
    return permissions.every((p) => rolePermissions.includes(p));
  },

  /**
   * Validate if the user is authorized to perform an action in a target society
   */
  validateSocietyScope(user: UserProfile, targetSocietyId: string): boolean {
    if (!user) return false;
    if (user.role === UserRole.SUPER_ADMIN) return true; // Super admin can access any society
    return user.societyId === targetSocietyId; // Tenant isolation rule
  },

  /**
   * Validate user account and society status during authentication flow
   */
  validateUserAuthorization(user: UserProfile, society?: Society | null): {
    authorized: boolean;
    reason?: string;
  } {
    if (!user) {
      return { authorized: false, reason: 'User identity not found.' };
    }

    if (user.isActive === false) {
      return { authorized: false, reason: 'Account is deactivated. Please contact your society administrator.' };
    }

    // Super Admin does not require a bound society
    if (user.role === UserRole.SUPER_ADMIN) {
      return { authorized: true };
    }

    // Tenant roles require a valid societyId
    if (!user.societyId) {
      return { authorized: false, reason: 'No society associated with this user account.' };
    }

    if (society) {
      if (society.status && society.status !== 'ACTIVE') {
        return { authorized: false, reason: `Society "${society.name}" is currently ${society.status.toLowerCase()}. Access restricted.` };
      }
    }

    return { authorized: true };
  }
};
