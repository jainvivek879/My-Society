/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../services/authContext';
import { UserRole, Permission } from '../../types';
import { permissionService } from '../../services/permissionService';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRoles,
  requiredPermission,
  requiredPermissions,
  fallback = null,
}) => {
  const { currentUser } = useAuth();

  if (!currentUser) return <>{fallback}</>;

  const userRole = currentUser.role;

  // Role check
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(userRole)) {
      return <>{fallback}</>;
    }
  }

  // Single permission check
  if (requiredPermission) {
    if (!permissionService.hasPermission(userRole, requiredPermission)) {
      return <>{fallback}</>;
    }
  }

  // Multiple permissions check
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!permissionService.hasAnyPermission(userRole, requiredPermissions)) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
};
