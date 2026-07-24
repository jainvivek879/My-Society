/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/authContext';
import { societyService, TowerBlock, Flat, Society } from '../../services/societyService';
import { 
  LogOut, ShieldCheck, Database, Building, User, Users, 
  Settings, Shield, Lock
} from 'lucide-react';
import { GuardDashboard } from '../../components/visitor/GuardDashboard';
import { ResidentDashboard } from '../../components/visitor/ResidentDashboard';
import { AdminDashboard } from '../../components/visitor/AdminDashboard';
import { SocietyAdminDashboard } from '../../components/society/SocietyAdminDashboard';
import { DeliveryDashboard } from '../../components/delivery/DeliveryDashboard';
import { SuperAdminTerminal } from '../../components/admin/SuperAdminTerminal';
import { ProtectedRoute } from '../../components/common/ProtectedRoute';
import { SidebarGenerator } from '../../components/common/SidebarGenerator';
import { UserRole, Permission } from '../../types';
import { roleService } from '../../services/roleService';

export const PlaygroundContent: React.FC = () => {
  const { currentUser, currentSociety, logout, theme, toggleTheme } = useAuth();

  // Role-based default active tab selection
  const defaultTab = currentUser?.role === UserRole.SUPER_ADMIN
    ? 'super_admin_societies'
    : currentUser?.role === UserRole.SECURITY_GUARD
    ? 'guard_visitor_entry'
    : currentUser?.role === UserRole.RESIDENT
    ? 'resident_home'
    : currentUser?.role === UserRole.STAFF
    ? 'staff_tasks'
    : 'society_dashboard';

  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  const [blocks, setBlocks] = useState<TowerBlock[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [societiesList, setSocietiesList] = useState<Society[]>([]);

  const mySocietyId = currentUser?.societyId || currentSociety?.id || 'soc_greenwood_101';

  useEffect(() => {
    if (currentUser) {
      societyService.fetchTowers(mySocietyId).then(setBlocks);
      societyService.fetchFlats(mySocietyId).then(setFlats);
      societyService.fetchSocieties().then(setSocietiesList);
    }
  }, [currentUser, mySocietyId]);

  if (!currentUser) return null;

  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
            </div>
            <div>
              <span className="font-sans font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                OmniGate
              </span>
              <span className="font-mono text-[9px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 px-2 py-0.5 rounded-full font-bold uppercase">
                RBAC Active
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Logout */}
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body: Dynamic Sidebar + Dynamic Role Terminal */}
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col md:flex-row gap-6 p-6">
        
        {/* Dynamic Navigation Sidebar generated from User Role & Permissions */}
        <SidebarGenerator activeTab={activeTab} onTabChange={setActiveTab} className="rounded-3xl shadow-sm h-fit" />

        {/* Dynamic Active Module Area */}
        <main className="flex-1 space-y-6 min-w-0">
          
          {/* Active Role Status Banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-950 dark:to-slate-900 border border-indigo-200 dark:border-indigo-900/40 p-5 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-200" /> 
                {roleService.getRoleLabel(currentUser.role)} Terminal
              </h2>
              <p className="text-xs text-indigo-100 dark:text-indigo-300 font-sans">
                Logged in as <span className="font-bold underline">{currentUser.displayName}</span> • Tenant Scope: <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">{currentUser.societyId || 'GLOBAL (ALL)'}</span>
              </p>
            </div>
            
            <div className="shrink-0 flex items-center gap-2 bg-white/10 border border-white/15 px-3 py-1.5 rounded-xl font-mono text-[11px]">
              <Lock className="w-3.5 h-3.5 text-indigo-200" />
              <span>Permission Guard: Standard Enforced</span>
            </div>
          </div>

          {/* DYNAMIC ROLE ROUTING VIEWS */}

          {/* 1. VISITOR / GUARD / RESIDENT ENTRY TERMINALS */}
          {(activeTab === 'guard_visitor_entry' || activeTab === 'guard_emergency' || activeTab === 'guard_resident_search' || activeTab === 'resident_home' || activeTab === 'society_visitors') && (
            <div className="space-y-6">
              {currentUser.role === UserRole.SECURITY_GUARD && (
                <GuardDashboard currentUser={currentUser} currentSocietyId={mySocietyId} activeTab={activeTab} />
              )}
              {currentUser.role === UserRole.RESIDENT && (
                <ResidentDashboard currentUser={currentUser} currentSocietyId={mySocietyId} />
              )}
              {(currentUser.role === UserRole.SOCIETY_ADMIN || currentUser.role === UserRole.SUPER_ADMIN) && (
                <AdminDashboard currentUser={currentUser} currentSocietyId={mySocietyId} />
              )}
            </div>
          )}

          {/* 2. SOCIETY & RESIDENTS OPERATIONS */}
          {(activeTab === 'society_dashboard' || activeTab === 'society_residents' || activeTab === 'society_guards' || activeTab === 'society_staff' || activeTab === 'society_shifts' || activeTab === 'society_complaints' || activeTab === 'society_notices' || activeTab === 'society_maintenance') && (
            <div className="space-y-6">
              <SocietyAdminDashboard 
                currentUser={{
                  uid: currentUser.uid,
                  displayName: currentUser.displayName,
                  role: currentUser.role,
                  email: currentUser.email
                }}
                currentSocietyId={mySocietyId}
                activeTab={activeTab}
              />
            </div>
          )}

          {/* 3. DELIVERIES TERMINAL */}
          {(activeTab === 'guard_delivery' || activeTab === 'society_deliveries' || activeTab === 'resident_deliveries') && (
            <div className="space-y-6">
              <DeliveryDashboard 
                currentUser={{
                  uid: currentUser.uid,
                  displayName: currentUser.displayName,
                  role: currentUser.role,
                  email: currentUser.email,
                  photoURL: currentUser.photoURL
                }}
                currentSocietyId={mySocietyId}
              />
            </div>
          )}

          {/* 4. SUPER ADMIN MODULES & TERMINALS */}
          {(activeTab === 'super_admin_societies' || activeTab === 'super_admin_users' || activeTab === 'super_admin_subscriptions' || activeTab === 'super_admin_reports' || activeTab === 'super_admin_audit' || activeTab === 'super_admin_settings') && (
            <div className="space-y-6">
              <SuperAdminTerminal currentUser={currentUser} activeTab={activeTab} />
            </div>
          )}

          {/* 5. RESIDENT SPECIALIZED MODULES */}
          {(activeTab === 'resident_invites' || activeTab === 'resident_complaints' || activeTab === 'resident_bills' || activeTab === 'resident_notices') && (
            <div className="space-y-6">
              <ResidentDashboard currentUser={currentUser} currentSocietyId={mySocietyId} activeTab={activeTab} />
            </div>
          )}

          {/* 6. STAFF WORK TASKS MODULE */}
          {(activeTab === 'staff_tasks' || activeTab === 'staff_notices') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Assigned Society Staff Work Tasks</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tasks assigned to maintenance and support staff.</p>
                </div>
                <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full">
                  2 Pending Work Orders
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Elevator Maintenance Inspection (Tower A)</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Assigned by Secretary • Scheduled for 04:00 PM</p>
                  </div>
                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors">
                    Mark In Progress
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Water Pump Pressure Check</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Assigned by Maintenance Head • Urgent</p>
                  </div>
                  <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors">
                    Complete Task
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 7. MY PROFILE & ACCOUNT IDENTITY */}
          {activeTab === 'my_profile' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                  <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Profile Credentials</h3>
                </div>

                <div className="flex items-center gap-4">
                  <img src={currentUser.photoURL} alt="" className="w-14 h-14 rounded-full border border-slate-200 dark:border-slate-800 object-cover" />
                  <div className="min-w-0">
                    <p className="text-base font-bold text-slate-950 dark:text-white truncate">
                      {currentUser.displayName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
                      UID: {currentUser.uid}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3 font-sans">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500">Security Role</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide font-mono bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                      {currentUser.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500">Email Address</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">{currentUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400 dark:text-slate-500">Tenant Society ID</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                      {currentUser.societyId || 'GLOBAL (SUPER ADMIN)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Role Capabilities</h3>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  {roleService.getPermissionsForRole(currentUser.role).map((perm) => (
                    <div key={perm} className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{perm}</span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        GRANTED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer Info */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-[10px] font-sans text-slate-400 dark:text-slate-500 transition-colors">
        © 2026 OmniGate. Smart Housing Society Management. All Rights Reserved.
      </footer>
    </div>
  );
};

export const Playground: React.FC = () => {
  return (
    <ProtectedRoute>
      <PlaygroundContent />
    </ProtectedRoute>
  );
};
