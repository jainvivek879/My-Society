/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAuth } from '../services/authContext';
import { UserRole } from '../types';
import { roleService } from '../services/roleService';

export function useRole() {
  const { currentUser } = useAuth();

  const role = currentUser?.role ? roleService.normalizeRole(currentUser.role) : null;

  return {
    role,
    roleLabel: role ? roleService.getRoleLabel(role) : 'Guest',
    isSuperAdmin: role === UserRole.SUPER_ADMIN,
    isSocietyAdmin: role === UserRole.SOCIETY_ADMIN,
    isGuard: role === UserRole.SECURITY_GUARD,
    isResident: role === UserRole.RESIDENT,
    isStaff: role === UserRole.STAFF,
    permissions: role ? roleService.getPermissionsForRole(role) : [],
  };
}
