/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dynamic Sidebar Generator - Generates navigation menus dynamically based on User Role & Permissions
 */

import React from 'react';
import { useAuth } from '../../services/authContext';
import { UserRole, Permission } from '../../types';
import { permissionService } from '../../services/permissionService';
import { 
  Building2, Users, ShieldCheck, UserCheck, Package, 
  AlertCircle, Bell, Receipt, Wrench, Settings, BarChart3, 
  FileText, Home, Shield, ClipboardList, User, Clock
} from 'lucide-react';

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  permission?: Permission;
  requiredRole?: UserRole;
  badge?: string;
  category: 'primary' | 'management' | 'system';
}

interface SidebarGeneratorProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const SidebarGenerator: React.FC<SidebarGeneratorProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  const { currentUser, currentSociety } = useAuth();

  if (!currentUser) return null;

  const userRole = currentUser.role;

  // Registry of available system navigation modules
  const allMenuItems: SidebarMenuItem[] = [
    // SUPER ADMIN MODULES
    {
      id: 'super_admin_societies',
      label: 'Societies Management',
      icon: <Building2 className="w-4 h-4" />,
      permission: Permission.MANAGE_SOCIETIES,
      category: 'primary',
      badge: 'Global',
    },
    {
      id: 'super_admin_users',
      label: 'Global User Registry',
      icon: <Users className="w-4 h-4" />,
      permission: Permission.GLOBAL_USER_MANAGEMENT,
      category: 'management',
    },
    {
      id: 'super_admin_subscriptions',
      label: 'Subscriptions & Billing',
      icon: <Receipt className="w-4 h-4" />,
      permission: Permission.SUBSCRIPTION_MANAGEMENT,
      category: 'management',
    },
    {
      id: 'super_admin_reports',
      label: 'Platform Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      permission: Permission.PLATFORM_REPORTS,
      category: 'management',
    },
    {
      id: 'super_admin_audit',
      label: 'System Audit Logs',
      icon: <FileText className="w-4 h-4" />,
      permission: Permission.AUDIT_LOGS,
      category: 'system',
    },
    {
      id: 'super_admin_settings',
      label: 'Platform Settings',
      icon: <Settings className="w-4 h-4" />,
      permission: Permission.PLATFORM_SETTINGS,
      category: 'system',
    },

    // SOCIETY ADMIN MODULES
    {
      id: 'society_dashboard',
      label: 'Society Overview',
      icon: <Home className="w-4 h-4" />,
      permission: Permission.SOCIETY_SETTINGS,
      category: 'primary',
    },
    {
      id: 'society_residents',
      label: 'Residents & Flats',
      icon: <Users className="w-4 h-4" />,
      permission: Permission.MANAGE_RESIDENTS,
      category: 'management',
    },
    {
      id: 'society_guards',
      label: 'Guards & Security',
      icon: <ShieldCheck className="w-4 h-4" />,
      permission: Permission.MANAGE_GUARDS,
      category: 'management',
    },
    {
      id: 'society_staff',
      label: 'Staff & Services',
      icon: <Wrench className="w-4 h-4" />,
      permission: Permission.MANAGE_GUARDS,
      category: 'management',
    },
    {
      id: 'society_shifts',
      label: 'Master of Duty Shift',
      icon: <Clock className="w-4 h-4" />,
      permission: Permission.MANAGE_GUARDS,
      category: 'management',
      badge: 'Master',
    },
    {
      id: 'society_visitors',
      label: 'Visitor Logs',
      icon: <UserCheck className="w-4 h-4" />,
      permission: Permission.MANAGE_SOCIETY_VISITORS,
      category: 'management',
    },
    {
      id: 'society_deliveries',
      label: 'Delivery Hub',
      icon: <Package className="w-4 h-4" />,
      permission: Permission.MANAGE_SOCIETY_VISITORS,
      category: 'management',
    },
    {
      id: 'society_complaints',
      label: 'Helpdesk Complaints',
      icon: <AlertCircle className="w-4 h-4" />,
      permission: Permission.MANAGE_COMPLAINTS,
      category: 'management',
    },
    {
      id: 'society_notices',
      label: 'Notice Board',
      icon: <Bell className="w-4 h-4" />,
      permission: Permission.MANAGE_NOTICES,
      category: 'management',
    },
    {
      id: 'society_maintenance',
      label: 'Maintenance Bills',
      icon: <Receipt className="w-4 h-4" />,
      permission: Permission.MANAGE_MAINTENANCE,
      category: 'management',
    },

    // GUARD MODULES
    {
      id: 'guard_visitor_entry',
      label: 'Visitor Entry Terminal',
      icon: <UserCheck className="w-4 h-4" />,
      permission: Permission.VISITOR_ENTRY,
      category: 'primary',
      badge: 'Gate Active',
    },
    {
      id: 'guard_delivery',
      label: 'Delivery Entry',
      icon: <Package className="w-4 h-4" />,
      permission: Permission.DELIVERY_ENTRY,
      category: 'primary',
    },
    {
      id: 'guard_emergency',
      label: 'Emergency Gate Alert',
      icon: <Shield className="w-4 h-4" />,
      permission: Permission.EMERGENCY_ENTRY,
      category: 'primary',
    },
    {
      id: 'guard_resident_search',
      label: 'Resident Directory',
      icon: <Users className="w-4 h-4" />,
      permission: Permission.SEARCH_RESIDENTS,
      category: 'management',
    },

    // RESIDENT MODULES
    {
      id: 'resident_home',
      label: 'Resident Home',
      icon: <Home className="w-4 h-4" />,
      permission: Permission.INVITE_VISITORS,
      category: 'primary',
    },
    {
      id: 'resident_invites',
      label: 'Pre-Approved Passes',
      icon: <UserCheck className="w-4 h-4" />,
      permission: Permission.INVITE_VISITORS,
      category: 'management',
    },
    {
      id: 'resident_deliveries',
      label: 'My Deliveries',
      icon: <Package className="w-4 h-4" />,
      permission: Permission.APPROVE_VISITORS,
      category: 'management',
    },
    {
      id: 'resident_complaints',
      label: 'My Complaints',
      icon: <AlertCircle className="w-4 h-4" />,
      permission: Permission.VIEW_MY_COMPLAINTS,
      category: 'management',
    },
    {
      id: 'resident_bills',
      label: 'My Maintenance',
      icon: <Receipt className="w-4 h-4" />,
      permission: Permission.VIEW_MAINTENANCE_BILLS,
      category: 'management',
    },
    {
      id: 'resident_notices',
      label: 'Society Notices',
      icon: <Bell className="w-4 h-4" />,
      permission: Permission.VIEW_NOTICES,
      requiredRole: UserRole.RESIDENT,
      category: 'management',
    },

    // STAFF MODULES
    {
      id: 'staff_tasks',
      label: 'Assigned Work Tasks',
      icon: <ClipboardList className="w-4 h-4" />,
      permission: Permission.VIEW_ASSIGNED_TASKS,
      requiredRole: UserRole.STAFF,
      category: 'primary',
    },
    {
      id: 'staff_notices',
      label: 'Society Notices',
      icon: <Bell className="w-4 h-4" />,
      permission: Permission.VIEW_NOTICES,
      requiredRole: UserRole.STAFF,
      category: 'management',
    },

    // COMMON SYSTEM MODULE
    {
      id: 'my_profile',
      label: 'My Profile & Security',
      icon: <User className="w-4 h-4" />,
      permission: Permission.MANAGE_PROFILE,
      category: 'system',
    },
  ];

  // Filter menu items dynamically according to user role permissions
  const authorizedItems = allMenuItems.filter((item) => {
    if (item.requiredRole && item.requiredRole !== userRole) return false;
    if (item.permission && !permissionService.hasPermission(userRole, item.permission)) {
      return false;
    }
    return true;
  });

  const primaryItems = authorizedItems.filter((item) => item.category === 'primary');
  const managementItems = authorizedItems.filter((item) => item.category === 'management');
  const systemItems = authorizedItems.filter((item) => item.category === 'system');

  return (
    <aside className={`w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 space-y-6 flex flex-col justify-between ${className}`}>
      <div className="space-y-6">
        {/* User Identity Banner */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-3">
            <img 
              src={currentUser.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`} 
              alt="" 
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-800"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {currentUser.displayName}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 font-mono text-[10px]">
            <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
              {userRole.replace('_', ' ')}
            </span>
            <span className="text-slate-400 truncate max-w-[100px]">
              {currentSociety?.name || 'OmniGate Global'}
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Sections */}
        <div className="space-y-4">
          {/* Primary Section */}
          {primaryItems.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Core Terminal
              </p>
              {primaryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      activeTab === item.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Management Section */}
          {managementItems.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Operations
              </p>
              {managementItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* System Section */}
          {systemItems.length > 0 && (
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                System & Account
              </p>
              {systemItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
