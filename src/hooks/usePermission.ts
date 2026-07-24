/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from '../services/authContext';
import { Permission } from '../types';
import { permissionService } from '../services/permissionService';

export function usePermission() {
  const { currentUser } = useAuth();
  const role = currentUser?.role || null;

  return {
    hasPermission: (permission: Permission) => 
      role ? permissionService.hasPermission(role, permission) : false,
    hasAnyPermission: (permissions: Permission[]) => 
      role ? permissionService.hasAnyPermission(role, permissions) : false,
    hasAllPermissions: (permissions: Permission[]) => 
      role ? permissionService.hasAllPermissions(role, permissions) : false,
  };
}
