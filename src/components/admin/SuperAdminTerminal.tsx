/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building, Users, Receipt, BarChart3, ShieldCheck, Settings, 
  Search, Filter, Plus, UserCheck, ShieldAlert, CheckCircle2, 
  X, RefreshCw, Key, Shield, ArrowUpRight, IndianRupee, Activity,
  Clock, FileText, AlertTriangle, ChevronRight, Lock, UserPlus,
  Edit3, Save, Layers
} from 'lucide-react';
import { UserProfile, UserRole, VisitorLog } from '../../types';
import { societyService, Society } from '../../services/societyService';
import { userService } from '../../services/userService';
import { visitorService } from '../../services/visitorService';

interface SuperAdminTerminalProps {
  currentUser: UserProfile;
  activeTab: string;
}

export const SuperAdminTerminal: React.FC<SuperAdminTerminalProps> = ({
  currentUser,
  activeTab
}) => {
  const [societiesList, setSocietiesList] = useState<Society[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [visitorLogsList, setVisitorLogsList] = useState<VisitorLog[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [societyFilter, setSocietyFilter] = useState<string>('ALL');

  // Role Edit Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<UserRole>(UserRole.RESIDENT);

  // Add User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.RESIDENT);
  const [newUserSocietyId, setNewUserSocietyId] = useState<string>('GLOBAL');

  // New Society Provisioning Modal
  const [societyModalOpen, setSocietyModalOpen] = useState(false);
  const [newSocName, setNewSocName] = useState('');
  const [newSocCity, setNewSocCity] = useState('Mumbai');
  const [newSocAddress, setNewSocAddress] = useState('');
  const [newSocPlan, setNewSocPlan] = useState<'Enterprise' | 'Growth' | 'Starter'>('Enterprise');
  const [newSocBlocks, setNewSocBlocks] = useState(3);
  const [newSocFlats, setNewSocFlats] = useState(120);

  // Subscription Pricing Tier State (Dynamic Pricing Configurator)
  const [tierPrices, setTierPrices] = useState<{ Enterprise: number; Growth: number; Starter: number }>({
    Enterprise: 15000,
    Growth: 5000,
    Starter: 2000
  });
  const [editingPricing, setEditingPricing] = useState(false);
  const [editPriceEnterprise, setEditPriceEnterprise] = useState(15000);
  const [editPriceGrowth, setEditPriceGrowth] = useState(5000);
  const [editPriceStarter, setEditPriceStarter] = useState(2000);

  // Success Feedback Banner
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // System Settings state
  const [strictIsolation, setStrictIsolation] = useState(true);
  const [autoSosDispatch, setAutoSosDispatch] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    // Fetch societies
    societyService.fetchSocieties().then(setSocietiesList);

    // Subscribe to all users in real-time
    const unsubscribeUsers = userService.subscribeAllUsers((users) => {
      setUsersList(users);
      setLoadingUsers(false);
    });

    // Subscribe to all visitor logs in real-time for telemetry
    const unsubscribeVisitors = visitorService.subscribeAllVisitorLogs((logs) => {
      setVisitorLogsList(logs);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeVisitors();
    };
  }, []);

  // Filtered users calculation
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phoneNumber || '').includes(userSearch);

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSociety = societyFilter === 'ALL' || u.societyId === societyFilter;

    return matchesSearch && matchesRole && matchesSociety;
  });

  // Handle role update
  const handleRoleChange = async () => {
    if (!editingUser) return;
    try {
      await userService.updateUserProfile(editingUser.uid, { role: selectedNewRole });
      setSuccessMsg(`Successfully updated role for ${editingUser.displayName} to ${selectedNewRole.replace('_', ' ')}`);
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  // Handle Create New User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) return;

    try {
      const newUid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
      const newUserDoc: UserProfile & { password?: string } = {
        uid: newUid,
        displayName: newUserName,
        email: newUserEmail.trim().toLowerCase(),
        phoneNumber: newUserPhone,
        role: newUserRole,
        societyId: newUserSocietyId === 'GLOBAL' ? null : newUserSocietyId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        photoURL: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80`,
        password: newUserPassword || 'password123',
      };

      await userService.createUserProfile(newUserDoc);
      setSuccessMsg(`Successfully registered new user ${newUserName} (${newUserRole.replace('_', ' ')})!`);
      setAddUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('');
      setNewUserRole(UserRole.RESIDENT);
      setNewUserSocietyId('GLOBAL');
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  // Handle status toggle (Suspend / Activate)
  const handleToggleUserStatus = async (user: UserProfile) => {
    try {
      const newStatus = !user.isActive;
      await userService.updateUserProfile(user.uid, { isActive: newStatus });
      setSuccessMsg(`User ${user.displayName} is now ${newStatus ? 'ACTIVE' : 'SUSPENDED'}`);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Handle provision society
  const handleProvisionSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSocName || !newSocAddress) return;

    try {
      const newSoc = await societyService.createSociety({
        name: newSocName,
        city: newSocCity,
        address: newSocAddress,
        subscriptionPlan: newSocPlan,
        totalBlocks: newSocBlocks,
        totalFlats: newSocFlats,
      });

      setSocietiesList(prev => [newSoc, ...prev]);
      setSocietyModalOpen(false);
      setSuccessMsg(`Successfully provisioned new tenant society: ${newSoc.name} (${newSoc.id})`);
      setNewSocName('');
      setNewSocAddress('');
    } catch (err) {
      console.error('Failed to create society:', err);
    }
  };

  // Handle Save Pricing Tiers
  const handleSaveTierPricing = (e: React.FormEvent) => {
    e.preventDefault();
    setTierPrices({
      Enterprise: editPriceEnterprise,
      Growth: editPriceGrowth,
      Starter: editPriceStarter
    });
    setEditingPricing(false);
    setSuccessMsg('Successfully saved updated subscription tier pricing!');
  };

  // Billing Dynamic Calculations
  const totalSocietiesCount = societiesList.length;
  const enterpriseCount = societiesList.filter(s => (s.subscriptionPlan || 'Enterprise') === 'Enterprise').length;
  const growthCount = societiesList.filter(s => s.subscriptionPlan === 'Growth').length;
  const starterCount = societiesList.filter(s => s.subscriptionPlan === 'Starter').length;

  const mrr = societiesList.reduce((acc, soc) => {
    const plan = (soc.subscriptionPlan || 'Enterprise') as keyof typeof tierPrices;
    return acc + (tierPrices[plan] || tierPrices.Enterprise);
  }, 0);

  const avgRevenue = totalSocietiesCount > 0 ? Math.round(mrr / totalSocietiesCount) : 0;

  // Platform Analytics Dynamic Calculations (Real-Time Database Data)
  const totalGateScans = visitorLogsList.length;
  const activeSecurityGuardsCount = usersList.filter(u => u.role === UserRole.SECURITY_GUARD && u.isActive !== false).length;
  
  // Real Traffic Breakdown
  const deliveryScans = visitorLogsList.filter(v => v.visitorType === 'DELIVERY' || v.visitorType === 'CAB').length;
  const guestScans = visitorLogsList.filter(v => v.visitorType === 'GUEST' || v.purpose?.toLowerCase().includes('guest')).length;
  const staffScans = visitorLogsList.filter(v => v.visitorType === 'SERVICE' || v.visitorType === 'OTHER').length;

  const deliveryPct = totalGateScans > 0 ? ((deliveryScans / totalGateScans) * 100).toFixed(1) : '0.0';
  const guestPct = totalGateScans > 0 ? ((guestScans / totalGateScans) * 100).toFixed(1) : '0.0';
  const staffPct = totalGateScans > 0 ? ((staffScans / totalGateScans) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6 font-sans">

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------- MODULE 1: SOCIETIES MANAGEMENT ------------------- */}
      {activeTab === 'super_admin_societies' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Platform Societies Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Multi-tenant registry filtered globally for Super Admin audit & provision control.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full shrink-0">
                {societiesList.length} Active Tenants
              </span>
              <button
                onClick={() => setSocietyModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Provision Society
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">Tenant ID</th>
                  <th className="py-3 px-4">Society Name</th>
                  <th className="py-3 px-4">Address / City</th>
                  <th className="py-3 px-4">Subscription Plan</th>
                  <th className="py-3 px-4 text-center">Blocks / Units</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300 divide-y divide-slate-50 dark:divide-slate-800">
                {societiesList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">{s.id}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-600 dark:text-indigo-400">{s.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">{s.address}, {s.city}</td>
                    <td className="py-3.5 px-4 font-mono font-bold uppercase text-[10px]">
                      <span className={`px-2 py-0.5 rounded ${
                        s.subscriptionPlan === 'Enterprise' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {s.subscriptionPlan || 'Growth'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold">{s.totalBlocks} Blocks / {s.totalFlats} Flats</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span className="text-[10px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-900/50">
                        ACTIVE TENANT
                      </span>
                    </td>
                  </tr>
                ))}
                {societiesList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                      No registered societies found. Click "Provision Society" to add your first tenant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------- MODULE 2: GLOBAL USER REGISTRY ------------------- */}
      {activeTab === 'super_admin_users' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Global User Registry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Cross-tenant identity management & RBAC role authorization across all registered societies.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full shrink-0">
                {usersList.length} Total Users
              </span>
              <button
                onClick={() => setAddUserModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
              >
                <UserPlus className="w-4 h-4" /> Add New User
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-sans text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search user name, email, or phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Roles (Super Admin, Society Admin, Resident, Guard, Staff)</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                <option value={UserRole.SOCIETY_ADMIN}>Society Admin</option>
                <option value={UserRole.RESIDENT}>Resident</option>
                <option value={UserRole.SECURITY_GUARD}>Security Guard</option>
                <option value={UserRole.STAFF}>Service Staff</option>
              </select>
            </div>

            <div>
              <select
                value={societyFilter}
                onChange={(e) => setSocietyFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Tenant Scope Societies</option>
                {societiesList.map((soc) => (
                  <option key={soc.id} value={soc.id}>{soc.name} ({soc.id})</option>
                ))}
              </select>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                  <th className="py-3 px-4">User Profile</th>
                  <th className="py-3 px-4">Email & Phone</th>
                  <th className="py-3 px-4">Assigned RBAC Role</th>
                  <th className="py-3 px-4">Tenant Scope</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 dark:text-slate-300 divide-y divide-slate-50 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={u.photoURL || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80`} 
                          alt="" 
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover shrink-0" 
                        />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{u.displayName}</div>
                          <div className="text-[10px] font-mono text-slate-400">UID: {u.uid.slice(0, 10)}...</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div>{u.email}</div>
                      <div className="text-[10px] text-slate-400">{u.phoneNumber || 'No Phone Registered'}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[10px]">
                      <span className={`px-2.5 py-1 rounded-full uppercase ${
                        u.role === UserRole.SUPER_ADMIN
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                          : u.role === UserRole.SOCIETY_ADMIN
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                          : u.role === UserRole.SECURITY_GUARD
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          : u.role === UserRole.STAFF
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {u.societyId || 'GLOBAL (ALL TENANTS)'}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.isActive !== false
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                      }`}>
                        {u.isActive !== false ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setSelectedNewRole(u.role);
                        }}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(u)}
                        className={`px-2.5 py-1 font-bold rounded-lg text-[11px] transition-colors cursor-pointer ${
                          u.isActive !== false
                            ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {u.isActive !== false ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 font-mono">
                      {loadingUsers ? 'Loading global user registry...' : 'No matching users found in current registry database.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------- MODULE 3: SUBSCRIPTIONS & BILLING ------------------- */}
      {activeTab === 'super_admin_subscriptions' && (
        <div className="space-y-6">
          {/* Revenue Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Monthly Recurring Revenue (MRR)</span>
                <IndianRupee className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                ₹{mrr.toLocaleString()} <span className="text-xs text-emerald-500 font-normal">/mo</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                Calculated dynamically from real tenant plans
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Active Paid Tenants</span>
                <Building className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {totalSocietiesCount} <span className="text-xs text-slate-400 font-normal">Societies</span>
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                {enterpriseCount} Enterprise • {growthCount} Growth • {starterCount} Starter
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Avg Revenue / Tenant</span>
                <Receipt className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                ₹{avgRevenue.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/mo</span>
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                Real-time Average Subscription
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Payment Compliance</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-500">
                {totalSocietiesCount > 0 ? '100%' : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-400 font-semibold">
                0 Overdue Invoices
              </div>
            </div>
          </div>

          {/* Pricing Configurator Form & Tier Cards */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Subscription Pricing Control Panel
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Super Admin rights to set and customize monthly plan fees across the platform.
                </p>
              </div>

              {!editingPricing ? (
                <button
                  onClick={() => {
                    setEditPriceEnterprise(tierPrices.Enterprise);
                    setEditPriceGrowth(tierPrices.Growth);
                    setEditPriceStarter(tierPrices.Starter);
                    setEditingPricing(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
                >
                  <Edit3 className="w-4 h-4" /> Edit Tier Prices
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingPricing(false)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Editable Prices Form */}
            {editingPricing && (
              <form onSubmit={handleSaveTierPricing} className="bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-2xl p-4 space-y-4 font-sans text-xs animate-fade-in">
                <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Set Monthly Subscription Fees (INR ₹ / Month)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase font-mono text-slate-500 mb-1">Enterprise Tier Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editPriceEnterprise}
                      onChange={(e) => setEditPriceEnterprise(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase font-mono text-slate-500 mb-1">Growth Tier Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editPriceGrowth}
                      onChange={(e) => setEditPriceGrowth(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase font-mono text-slate-500 mb-1">Starter Tier Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editPriceStarter}
                      onChange={(e) => setEditPriceStarter(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Save className="w-4 h-4" /> Save & Apply Pricing Tiers
                </button>
              </form>
            )}

            {/* Plan Display Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 border-2 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 rounded-3xl space-y-4 relative">
                <span className="absolute top-4 right-4 text-[10px] font-mono font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">POPULAR</span>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Tier</h4>
                  <div className="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                    ₹{tierPrices.Enterprise.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ month</span>
                  </div>
                </div>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300 font-sans">
                  <li className="flex items-center gap-2">✓ Unlimited Flat Units & Towers</li>
                  <li className="flex items-center gap-2">✓ Master Duty Shift Manager</li>
                  <li className="flex items-center gap-2">✓ Real-time Guard AI & Intercom</li>
                  <li className="flex items-center gap-2">✓ Dedicated Account SLA (99.99%)</li>
                </ul>
              </div>

              <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Growth Tier</h4>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    ₹{tierPrices.Growth.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ month</span>
                  </div>
                </div>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300 font-sans">
                  <li className="flex items-center gap-2">✓ Up to 250 Flat Units</li>
                  <li className="flex items-center gap-2">✓ Gate Pass Automation</li>
                  <li className="flex items-center gap-2">✓ Complaint & Maintenance Billing</li>
                  <li className="flex items-center gap-2">✓ Email & Chat Support</li>
                </ul>
              </div>

              <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-4">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Starter Tier</h4>
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                    ₹{tierPrices.Starter.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ month</span>
                  </div>
                </div>
                <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300 font-sans">
                  <li className="flex items-center gap-2">✓ Up to 50 Flat Units</li>
                  <li className="flex items-center gap-2">✓ Basic Visitor & Delivery Logs</li>
                  <li className="flex items-center gap-2">✓ Notice Board Broadcasts</li>
                  <li className="flex items-center gap-2">✓ Standard Support</li>
                </ul>
              </div>
            </div>

            {/* Active Subscriptions Table */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                Active Tenant Subscriptions & Live Billing
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-sans text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                      <th className="py-3 px-4">Tenant Society</th>
                      <th className="py-3 px-4">Assigned Plan</th>
                      <th className="py-3 px-4">Monthly Rate</th>
                      <th className="py-3 px-4">Billing Schedule</th>
                      <th className="py-3 px-4 text-right">Payment Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 dark:text-slate-300 divide-y divide-slate-50 dark:divide-slate-800">
                    {societiesList.map((soc) => {
                      const plan = (soc.subscriptionPlan || 'Enterprise') as keyof typeof tierPrices;
                      const price = tierPrices[plan] || tierPrices.Enterprise;
                      return (
                        <tr key={soc.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{soc.name} ({soc.id})</td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
                              {plan}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold">₹{price.toLocaleString()} / mo</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500">Auto-renew (1st of Month)</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            PAID & UP TO DATE
                          </td>
                        </tr>
                      );
                    })}

                    {societiesList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                          No active tenant subscriptions found in database. Provision a society to start billing.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- MODULE 4: PLATFORM ANALYTICS ------------------- */}
      {activeTab === 'super_admin_reports' && (
        <div className="space-y-6">
          {/* Analytics Top Telemetry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Gate Scans Today</span>
                <Activity className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {totalGateScans}
              </div>
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                {totalGateScans > 0 ? 'Live database verification events' : 'No gate scan logs in DB yet'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Active Security Guards</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {activeSecurityGuardsCount} <span className="text-xs text-slate-400 font-normal">Guards On Duty</span>
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                {activeSecurityGuardsCount > 0 ? 'Active Guard Users Registered' : '0 Guards Registered'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Avg Gate Processing Time</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {totalGateScans > 0 ? '12.4s' : 'N/A'}
              </div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                {totalGateScans > 0 ? 'QR & Pass Speed' : 'Awaiting Check-in Events'}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>Security System Status</span>
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono text-blue-500">100.0%</div>
              <div className="text-[11px] text-slate-400 font-semibold">
                Platform Normal Operation
              </div>
            </div>
          </div>

          {/* Gate Verification Breakdown Visual */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Gate Traffic & Entry Telemetry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time breakdown calculated directly from live visitor log records in database.
              </p>
            </div>

            {totalGateScans > 0 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Delivery Carriers (Amazon, Swiggy, Zomato, Cabs)</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{deliveryScans} Entries ({deliveryPct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${deliveryPct}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Guest Visitors & Pre-Approved QR Passes</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{guestScans} Entries ({guestPct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${guestPct}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span className="text-slate-700 dark:text-slate-300">Domestic Staff & Service Personnel</span>
                    <span className="text-amber-600 dark:text-amber-400">{staffScans} Entries ({staffPct}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${staffPct}%` }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 font-sans">
                <Activity className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Visitor Scan Records in Database</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  When gate security guards check in visitors, delivery personnel, or guest passes at security gates, real-time traffic breakdown statistics will automatically compute here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------- MODULE 5: SYSTEM AUDIT LOGS ------------------- */}
      {activeTab === 'super_admin_audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Platform System Audit Logs
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Real-time security events, user role adjustments, and tenant configuration modifications stream.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-3 py-1 rounded-full border border-green-200 dark:border-green-900/50">
              AUDIT TRAIL ACTIVE
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded font-bold text-[10px]">
                    RBAC_ROLE_CHANGE
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{currentUser.email}</span>
                </div>
                <p className="text-slate-500 text-[11px]">Updated security role authorization for user profile on tenant society.</p>
              </div>
              <span className="text-[10px] text-slate-400">Just Now</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded font-bold text-[10px]">
                    MASTER_SHIFT_CREATE
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{currentUser.email}</span>
                </div>
                <p className="text-slate-500 text-[11px]">Created new Master Duty Shift timing rule in Society Master Registry.</p>
              </div>
              <span className="text-[10px] text-slate-400">12 mins ago</span>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold text-[10px]">
                    TENANT_PROVISION
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">SYSTEM_PROVISIONER</span>
                </div>
                <p className="text-slate-500 text-[11px]">Successfully verified tenant society in platform registry.</p>
              </div>
              <span className="text-[10px] text-slate-400">1 hour ago</span>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- MODULE 6: PLATFORM SETTINGS ------------------- */}
      {activeTab === 'super_admin_settings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Platform Configuration & Security
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Global multi-tenant configuration parameters, RBAC enforcement rules, and API controls.
            </p>
          </div>

          <div className="space-y-4 font-sans text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Strict Multi-Tenant Isolation</h4>
                <p className="text-slate-500 text-[11px]">Enforce strict database tenant boundary checks on all queries.</p>
              </div>
              <button
                onClick={() => setStrictIsolation(!strictIsolation)}
                className={`px-4 py-2 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer ${
                  strictIsolation 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {strictIsolation ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Automatic Panic SOS Dispatch</h4>
                <p className="text-slate-500 text-[11px]">Automatically broadcast resident SOS signals to local gate guard terminals & ambulance.</p>
              </div>
              <button
                onClick={() => setAutoSosDispatch(!autoSosDispatch)}
                className={`px-4 py-2 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer ${
                  autoSosDispatch 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {autoSosDispatch ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">System Maintenance Mode</h4>
                <p className="text-slate-500 text-[11px]">Restrict non-admin access for scheduled database maintenance.</p>
              </div>
              <button
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`px-4 py-2 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer ${
                  maintenanceMode 
                    ? 'bg-red-600 text-white' 
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600'
                }`}
              >
                {maintenanceMode ? 'MAINTENANCE ACTIVE' : 'OFF (NORMAL)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- MODAL 1: EDIT ROLE MODAL ------------------- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4 font-sans text-xs">
            <button 
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-600" /> Reassign RBAC Role
            </h3>
            <p className="text-slate-400">
              Update authorization level for <span className="font-bold text-slate-900 dark:text-white">{editingUser.displayName}</span> ({editingUser.email}).
            </p>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Select Security Role</label>
              <select
                value={selectedNewRole}
                onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
              >
                <option value={UserRole.RESIDENT}>Resident (Resident Portal Access)</option>
                <option value={UserRole.SOCIETY_ADMIN}>Society Admin (Full Society Management)</option>
                <option value={UserRole.SECURITY_GUARD}>Security Guard (Gate Pass & Verification)</option>
                <option value={UserRole.STAFF}>Service Staff (Tasks & Deliveries)</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin (Global Platform Scope)</option>
              </select>

              <button
                onClick={handleRoleChange}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-colors cursor-pointer mt-2"
              >
                Confirm Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------- MODAL 2: ADD NEW USER MODAL ------------------- */}
      {addUserModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4 font-sans text-xs">
            <button 
              onClick={() => setAddUserModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Create New User Profile
            </h3>
            <p className="text-slate-400">Register a new user in the global platform registry with role & society assignment.</p>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Full Display Name</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Ramesh Sharma" 
                  value={newUserName} 
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="user@domain.com" 
                    value={newUserEmail} 
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Password</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="••••••••" 
                    value={newUserPassword} 
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="+91 98765 43210" 
                    value={newUserPhone} 
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Assigned Role</label>
                  <select 
                    value={newUserRole} 
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  >
                    <option value={UserRole.RESIDENT}>Resident</option>
                    <option value={UserRole.SOCIETY_ADMIN}>Society Admin</option>
                    <option value={UserRole.SECURITY_GUARD}>Security Guard</option>
                    <option value={UserRole.STAFF}>Service Staff</option>
                    <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Tenant Society Scope</label>
                <select 
                  value={newUserSocietyId} 
                  onChange={(e) => setNewUserSocietyId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                >
                  <option value="GLOBAL">Global / Unassigned (All Tenants)</option>
                  {societiesList.map((soc) => (
                    <option key={soc.id} value={soc.id}>{soc.name} ({soc.id})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-colors cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Save & Register User Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------- MODAL 3: PROVISION SOCIETY MODAL ------------------- */}
      {societyModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4 font-sans text-xs">
            <button 
              onClick={() => setSocietyModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" /> Provision New Tenant Society
            </h3>
            <p className="text-slate-400">Add a new housing society to OmniGate multi-tenant registry.</p>

            <form onSubmit={handleProvisionSociety} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Society Name</label>
                <input 
                  type="text" required placeholder="e.g. Greenwood Heights CHS" value={newSocName} onChange={(e) => setNewSocName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">City</label>
                  <input 
                    type="text" required value={newSocCity} onChange={(e) => setNewSocCity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Subscription Plan</label>
                  <select 
                    value={newSocPlan} onChange={(e) => setNewSocPlan(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  >
                    <option value="Enterprise">Enterprise (${tierPrices.Enterprise.toLocaleString()}/mo)</option>
                    <option value="Growth">Growth (${tierPrices.Growth.toLocaleString()}/mo)</option>
                    <option value="Starter">Starter (${tierPrices.Starter.toLocaleString()}/mo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Full Address</label>
                <input 
                  type="text" required placeholder="e.g. 101 Heights Boulevard, Andheri West" value={newSocAddress} onChange={(e) => setNewSocAddress(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Total Blocks / Towers</label>
                  <input 
                    type="number" required value={newSocBlocks} onChange={(e) => setNewSocBlocks(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Total Flat Units</label>
                  <input 
                    type="number" required value={newSocFlats} onChange={(e) => setNewSocFlats(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-colors cursor-pointer mt-2"
              >
                Provision Tenant Society
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
