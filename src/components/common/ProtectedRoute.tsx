/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../../services/authContext';
import { UserRole, Permission } from '../../types';
import { permissionService } from '../../services/permissionService';
import { ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiredPermission,
}) => {
  const { currentUser, currentSociety, logout } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Required</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please sign in to access this protected area of OmniGate.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Verify Account & Society Status Authorization
  const statusValidation = permissionService.validateUserAuthorization(currentUser, currentSociety);
  if (!statusValidation.authorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-2xl flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Access Suspended</h3>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium">
              {statusValidation.reason || 'Your account or society status prevents access.'}
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Check Role-based authorization
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Permission Denied</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your role (<span className="font-bold uppercase">{currentUser.role.replace('_', ' ')}</span>) does not have authorization to view this page.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Switch Account
          </button>
        </div>
      </div>
    );
  }

  // Check specific permission authorization
  if (requiredPermission && !permissionService.hasPermission(currentUser.role, requiredPermission)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-950 rounded-3xl p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Unauthorized Module</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You lack the required permission (<span className="font-mono">{requiredPermission}</span>) for this operation.
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Safety
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
