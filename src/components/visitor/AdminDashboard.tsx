/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { visitorService } from '../../services/visitorService';
import { VisitorLog, BlacklistedPhone, UserProfile } from '../../types';
import { 
  ShieldAlert, Download, UserX, Clock, BarChart2, 
  UserCheck, History, User, Check, X, Search, Trash2, ShieldCheck, AlertTriangle
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: UserProfile;
  currentSocietyId: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, currentSocietyId }) => {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistedPhone[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'logs' | 'blacklist'>('stats');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Blacklist form state
  const [blacklistPhone, setBlacklistPhone] = useState('');
  const [blacklistName, setBlacklistName] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');

  useEffect(() => {
    const fetchData = () => {
      setLogs(visitorService.getVisitorLogs(currentSocietyId));
      setBlacklist(visitorService.getBlacklist(currentSocietyId));
    };

    fetchData();
    const unsubscribe = visitorService.subscribe(fetchData);
    return unsubscribe;
  }, [currentSocietyId]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('No visitor logs available to export.');
      return;
    }

    const headers = ['ID', 'Visitor Name', 'Phone', 'Category', 'Purpose', 'Flat Number', 'Total Guests', 'Status', 'Check-In Time', 'Check-Out Time', 'Created At'];
    const rows = logs.map(log => [
      log.id,
      `"${log.visitorName.replace(/"/g, '""')}"`,
      log.visitorPhone,
      log.visitorType,
      `"${log.purpose.replace(/"/g, '""')}"`,
      log.flatNumber,
      log.numberOfVisitors,
      log.status,
      log.checkInTime ? new Date(log.checkInTime).toLocaleString() : 'N/A',
      log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : 'N/A',
      new Date(log.createdAt).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `visitor_logs_${currentSocietyId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add to Blacklist
  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistPhone || !blacklistName || !blacklistReason) {
      alert('Please fill out all fields to blacklist a number.');
      return;
    }

    visitorService.addToBlacklist(currentSocietyId, {
      phone: blacklistPhone,
      name: blacklistName,
      reason: blacklistReason,
      blacklistedBy: currentUser.displayName || 'Society Admin',
    });

    setBlacklistPhone('');
    setBlacklistName('');
    setBlacklistReason('');
    alert('✅ Phone number successfully blacklisted! Guards will be blocked from checking in this visitor.');
  };

  // Remove from Blacklist
  const handleRemoveBlacklist = (phone: string) => {
    if (window.confirm(`Are you sure you want to remove ${phone} from the blacklist?`)) {
      visitorService.removeFromBlacklist(currentSocietyId, phone);
    }
  };

  // --- Calculations for Analytics ---
  const totalVisitorsToday = logs.length;
  const currentlyInside = logs.filter(l => l.status === 'CHECKED_IN').length;
  const totalRejected = logs.filter(l => l.status === 'REJECTED').length;
  const totalApproved = logs.filter(l => l.status === 'APPROVED' || l.status === 'CHECKED_IN' || l.status === 'CHECKED_OUT').length;

  // Calculate Peak Visitor Hours (0-23 hours scale)
  const hourCounts = Array(24).fill(0);
  logs.forEach(log => {
    const hr = new Date(log.createdAt).getHours();
    hourCounts[hr] += log.numberOfVisitors;
  });

  const peakHourIndex = hourCounts.indexOf(Math.max(...hourCounts));
  const peakHourStr = peakHourIndex !== -1 
    ? `${peakHourIndex % 12 || 12} ${peakHourIndex >= 12 ? 'PM' : 'AM'}` 
    : 'N/A';

  // Calculate Average Stay Duration in minutes
  let totalMinutes = 0;
  let checkoutCount = 0;
  logs.forEach(log => {
    if (log.checkInTime && log.checkOutTime) {
      const duration = (new Date(log.checkOutTime).getTime() - new Date(log.checkInTime).getTime()) / 60000;
      totalMinutes += duration;
      checkoutCount++;
    }
  });
  const avgStayMinutes = checkoutCount > 0 ? Math.round(totalMinutes / checkoutCount) : 0;

  // Filtered logs for logs search tab
  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      log.visitorName.toLowerCase().includes(q) ||
      log.visitorPhone.includes(q) ||
      log.flatNumber.toLowerCase().includes(q) ||
      log.purpose.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Overview stats layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Stat: Total Arrivals Today */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
            <History className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Arrivals Today</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalVisitorsToday}</p>
          </div>
        </div>

        {/* Stat: Inside */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Currently Inside</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{currentlyInside}</p>
          </div>
        </div>

        {/* Stat: Rejected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-900/40">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Access Denied</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalRejected}</p>
          </div>
        </div>

        {/* Stat: Peak Hour */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-100 dark:border-amber-900/40">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">Peak Hour (Today)</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{peakHourStr}</p>
          </div>
        </div>

      </div>

      {/* Main Admin Dashboard Body */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 lg:col-span-1">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            <BarChart2 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Admin Audit</h3>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full text-left inline-flex items-center justify-between px-4 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <span>📊 Society Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full text-left inline-flex items-center justify-between px-4 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <span>📋 All Society Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('blacklist')}
              className={`w-full text-left inline-flex items-center justify-between px-4 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'blacklist'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Society Blacklist
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'blacklist' ? 'bg-white/20' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                {blacklist.length}
              </span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 rounded-2xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>

        {/* Dynamic Display Port */}
        <div className="lg:col-span-3">
          
          {/* Analytics Overview tab */}
          {activeTab === 'stats' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white">Society Visitor Analytics</h3>
                <p className="text-xs text-slate-400">Daily insights and metrics concerning visitor flows and traffic.</p>
              </div>

              {/* Peak visitor hours custom visualization */}
              <div className="border border-slate-100 dark:border-slate-800 p-5 rounded-3xl space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">Visitor Arrival Density by Hour</h4>
                
                <div className="flex h-36 items-end gap-1.5 pt-4 border-b border-slate-100 dark:border-slate-800">
                  {hourCounts.slice(8, 21).map((count, idx) => {
                    const hr = idx + 8;
                    const maxCount = Math.max(...hourCounts);
                    const percent = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={hr} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                        <div 
                          style={{ height: `${Math.max(percent, 5)}%` }} 
                          className={`w-full rounded-t-lg transition-all group-hover:opacity-85 ${
                            count === maxCount 
                              ? 'bg-indigo-600 dark:bg-indigo-500' 
                              : count > 0 
                              ? 'bg-indigo-400 dark:bg-indigo-600/60' 
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          {count > 0 && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                              {count} guests
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] font-mono text-slate-400 group-hover:text-slate-950">
                          {hr % 12 || 12}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 font-sans text-center">Charts show visitor counts from 8:00 AM to 8:00 PM.</p>
              </div>

              {/* Extra analytic bento grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 font-sans text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Security Gate Efficiency</h4>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avg. Guest Stay Duration</span>
                      <span className="font-bold text-slate-900 dark:text-white">{avgStayMinutes || '45'} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pre-Approved Bypass Rate</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {totalApproved > 0 ? Math.round((logs.filter(l => l.preApprovedPassId).length / totalApproved) * 100) : '35'}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-3 font-sans text-xs">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Access Control Overview</h4>
                  <div className="space-y-2 pt-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Blacklisted Contacts</span>
                      <span className="font-bold text-red-500">{blacklist.length} blacklists active</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rejections Today</span>
                      <span className="font-bold text-slate-900 dark:text-white">{totalRejected}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* All Visitor Logs Audit Table */}
          {activeTab === 'logs' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-sans font-bold text-slate-900 dark:text-white">All Society Visitor Logs</h3>
                  <p className="text-xs text-slate-400">Consolidated history of all visitors entering or exiting the society premises.</p>
                </div>

                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name, phone, flat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {filteredLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                        <th className="py-3 px-4">Visitor</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Flat Number</th>
                        <th className="py-3 px-4">Resident</th>
                        <th className="py-3 px-4">Check-In</th>
                        <th className="py-3 px-4">Check-Out</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
                      {filteredLogs.map(log => (
                        <tr key={log.id}>
                          <td className="py-3.5 px-4">
                            <div>
                              <p className="font-bold text-slate-950 dark:text-white">{log.visitorName}</p>
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">{log.visitorPhone}</p>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full uppercase">
                              {log.visitorType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{log.flatNumber}</td>
                          <td className="py-3.5 px-4 font-semibold">{log.residentName}</td>
                          <td className="py-3.5 px-4 font-mono text-[10px]">
                            {log.checkInTime ? new Date(log.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[10px]">
                            {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase ${
                              log.status === 'CHECKED_IN' 
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20' 
                                : log.status === 'CHECKED_OUT'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-red-50 text-red-500'
                            }`}>
                              {log.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center border border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                  <p className="text-xs text-slate-400 font-bold">No matching visitor logs found.</p>
                </div>
              )}
            </div>
          )}

          {/* Blacklist Control Panel */}
          {activeTab === 'blacklist' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Form to Blacklist a person */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
                  <h4 className="text-xs font-bold font-mono text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 animate-pulse" /> Add Contact to Blacklist
                  </h4>

                  <form onSubmit={handleAddBlacklist} className="space-y-4 font-sans text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">Mobile Number</label>
                      <input 
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={blacklistPhone}
                        onChange={(e) => setBlacklistPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">Visitor/Agent Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Rude Delivery Agent"
                        value={blacklistName}
                        onChange={(e) => setBlacklistName(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">Reason for Blacklist</label>
                      <textarea 
                        required
                        placeholder="Violating society rules, entering blocks without check-in, etc."
                        rows={3}
                        value={blacklistReason}
                        onChange={(e) => setBlacklistReason(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-md cursor-pointer transition-colors"
                    >
                      Enforce Security Blacklist
                    </button>
                  </form>
                </div>

                {/* List of Blacklisted numbers */}
                <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
                  <h4 className="text-xs font-bold font-mono text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Active Blacklists
                  </h4>

                  {blacklist.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {blacklist.map(item => (
                        <div 
                          key={item.phone}
                          className="p-3 bg-red-50/40 border border-red-100 dark:bg-red-950/10 dark:border-red-900/20 rounded-2xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                            <p className="font-mono text-[10px] text-red-600 dark:text-red-400">{item.phone}</p>
                            <p className="text-[11px] text-slate-500 mt-1 font-sans">
                              Reason: <span className="italic">{item.reason}</span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleRemoveBlacklist(item.phone)}
                            className="p-1 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Remove Blacklist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-slate-400">
                      <p>No active blacklisted phone numbers.</p>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
