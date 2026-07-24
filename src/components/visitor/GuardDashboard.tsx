/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { visitorService } from '../../services/visitorService';
import { societyService } from '../../services/societyService';
import { VisitorLog, VisitorType, UserProfile } from '../../types';
import { 
  ShieldCheck, UserPlus, Search, Phone, Clock, ArrowRightLeft, 
  Camera, AlertTriangle, CheckCircle, XCircle, ScanLine, Wifi, 
  WifiOff, UserCheck, History, User, Check, X, Car, Plus, LogOut
} from 'lucide-react';

interface GuardDashboardProps {
  currentUser: UserProfile;
  currentSocietyId: string;
  activeTab?: string;
}

export const GuardDashboard: React.FC<GuardDashboardProps> = ({ currentUser, currentSocietyId, activeTab: propActiveTab }) => {
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [passes, setPasses] = useState<any[]>([]);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'inside' | 'new_walkin' | 'preapproved' | 'history'>('today');

  useEffect(() => {
    if (propActiveTab) {
      if (propActiveTab === 'guard_visitor_entry') setActiveTab('today');
      else if (propActiveTab === 'guard_preapproved') setActiveTab('preapproved');
      else if (propActiveTab === 'guard_resident_search') setActiveTab('new_walkin');
    }
  }, [propActiveTab]);

  // Form State for Walk-In Visitor
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorType, setVisitorType] = useState<VisitorType>(VisitorType.GUEST);
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [numberOfVisitors, setNumberOfVisitors] = useState(1);
  const [expectedDuration, setExpectedDuration] = useState('1 hour');
  
  // Flat selection
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [flatSearchText, setFlatSearchText] = useState('');
  const [matchingFlats, setMatchingFlats] = useState<any[]>([]);

  // Camera emulator state
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoSelected, setPhotoSelected] = useState(0);

  // QR Scan manual simulation
  const [manualPassCode, setManualPassCode] = useState('');
  const [scannedPassInfo, setScannedPassInfo] = useState<any | null>(null);

  // Connection Simulation state
  const [isOffline, setIsOffline] = useState(false);
  const [offlineStatusMsg, setOfflineStatusMsg] = useState('');

  // Dynamic values from societyService
  const myBlocks = societyService.getTowers(currentSocietyId);
  const myFlats = societyService.getFlats(currentSocietyId);
  const myResidents = societyService.getResidents(currentSocietyId);

  const purposes = [
    'Meeting Resident / Guest',
    'Swiggy / Zomato (Food Delivery)',
    'Zepto / Blinkit / BigBasket (Grocery)',
    'Amazon / Flipkart / Myntra (E-commerce Courier)',
    'Ola / Uber / BluSmart (Cab)',
    'Maid / Daily Help (Kamwali Bai)',
    'Milkman / Doodhwala',
    'Newspaper Boy',
    'Urban Company / Electrician / Plumber (Services)',
    'Other Business'
  ];

  const simulatedAvatars = [
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80',
  ];

  useEffect(() => {
    // Initial fetch from memory / local cache
    setLogs(visitorService.getVisitorLogs(currentSocietyId));
    setPasses(visitorService.getPreApprovedPasses(currentSocietyId));
    setBlacklist(visitorService.getBlacklist(currentSocietyId));
    setIsOffline(visitorService.isOffline());

    // Firestore Real-Time Subscriptions
    const unsubLogs = visitorService.subscribeVisitorLogs(currentSocietyId, (data) => {
      setLogs(data);
    });

    const unsubPasses = visitorService.subscribePreApprovedPasses(currentSocietyId, (data) => {
      setPasses(data);
    });

    // Live sync subscription for service notifications
    const unsubscribeService = visitorService.subscribe(() => {
      setLogs(visitorService.getVisitorLogs(currentSocietyId));
      setPasses(visitorService.getPreApprovedPasses(currentSocietyId));
      setBlacklist(visitorService.getBlacklist(currentSocietyId));
      setIsOffline(visitorService.isOffline());
    });

    return () => {
      unsubLogs();
      unsubPasses();
      unsubscribeService();
    };
  }, [currentSocietyId]);

  // Handle Flat Search
  useEffect(() => {
    if (!flatSearchText) {
      setMatchingFlats([]);
      return;
    }
    const q = flatSearchText.toLowerCase();
    const filtered = myFlats.filter(f => 
      f.societyId === currentSocietyId && 
      f.flatNumber.toLowerCase().includes(q)
    );
    setMatchingFlats(filtered);
  }, [flatSearchText, currentSocietyId]);

  // Sync Offline toggle
  const toggleOffline = () => {
    const nextState = !isOffline;
    visitorService.setOffline(nextState);
    if (!nextState) {
      setOfflineStatusMsg('Offline queue synced successfully!');
      setTimeout(() => setOfflineStatusMsg(''), 4000);
    }
  };

  // Walk-In Submit
  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!visitorName || !visitorPhone || !selectedFlatId) {
      alert('Please fill out visitor name, phone, and select a target flat.');
      return;
    }

    // Check Blacklist
    const isPhoneBlacklisted = visitorService.isBlacklisted(currentSocietyId, visitorPhone);
    if (isPhoneBlacklisted) {
      const bItem = blacklist.find(b => b.phone.replace(/\s/g, '') === visitorPhone.replace(/\s/g, ''));
      alert(`⚠️ SECURITY ALERT: This visitor phone number is BLACKLISTED!\nReason: ${bItem?.reason || 'Security Violation'}`);
      return;
    }

    const flat = myFlats.find(f => f.id === selectedFlatId);
    if (!flat) {
      alert('⚠️ Please select a valid flat unit before recording visitor entry.');
      return;
    }

    const block = myBlocks.find(b => b.id === flat.blockId) || myBlocks[0] || { id: 'blk_gw_b', name: 'Block B' };
    
    // Find resident belonging to this flat from societyService
    const flatResidents = myResidents.filter(r => r.flatId === selectedFlatId);
    const targetResident = flatResidents.find(r => r.id === selectedResidentId) || flatResidents[0] || { id: 'unknown_res', name: 'Resident Tenant' };

    const newLog = {
      societyId: currentSocietyId,
      flatId: flat.id,
      flatNumber: flat.flatNumber,
      blockId: block.id,
      visitorName,
      visitorPhone,
      visitorType,
      purpose,
      vehicleNumber,
      photoURL: capturedPhoto || simulatedAvatars[photoSelected],
      numberOfVisitors,
      expectedDuration,
      status: 'PENDING' as const, // Start as pending resident approval
      residentId: targetResident.id,
      residentName: targetResident.name,
      checkedInByGuardId: currentUser.uid,
      checkedInByGuardName: currentUser.displayName,
    };

    const created = await visitorService.addVisitorLog(newLog);
    
    // Clear form
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
    setVehicleNumber('');
    setNumberOfVisitors(1);
    setCapturedPhoto(null);
    setFlatSearchText('');
    setSelectedBlockId('');
    setSelectedFloor('');
    setSelectedFlatId('');
    setSelectedResidentId('');
    
    setActiveTab('today');
    
    if (isOffline) {
      alert('🔒 Offline mode is active. Visitor entry queued locally. It will auto-sync when network returns.');
    } else {
      alert(`🔔 Approval request sent instantly to Resident ${targetResident.name}! Waiting for response...`);
    }
  };

  // Check Out Visitor
  const handleCheckOut = async (logId: string) => {
    await visitorService.updateVisitorLogStatus(logId, 'CHECKED_OUT', {
      checkOutTime: new Date().toISOString(),
      checkedOutByGuardId: currentUser.uid,
      checkedOutByGuardName: currentUser.displayName
    });
  };

  // Fast Check-In (After Approved)
  const handleCheckIn = async (logId: string) => {
    await visitorService.updateVisitorLogStatus(logId, 'CHECKED_IN', {
      checkInTime: new Date().toISOString(),
      checkedInByGuardId: currentUser.uid,
      checkedInByGuardName: currentUser.displayName
    });
  };

  // Reject Request
  const handleReject = async (logId: string) => {
    await visitorService.updateVisitorLogStatus(logId, 'REJECTED');
  };

  // Simulate Pass scan
  const handleScanPass = () => {
    if (!manualPassCode) return;
    const term = manualPassCode.trim().toLowerCase();
    const foundPass = passes.find(p => 
      p.qrCode.toLowerCase() === term ||
      p.id.toLowerCase() === term ||
      p.qrCode.toLowerCase().includes(term) ||
      p.visitorName.toLowerCase().includes(term) ||
      p.visitorPhone.includes(term)
    );
    if (foundPass) {
      if (foundPass.status !== 'ACTIVE') {
        alert(`❌ Pass is invalid. Status: ${foundPass.status}`);
        return;
      }
      setScannedPassInfo(foundPass);
    } else {
      alert('❌ No matching active pass found in current society database.');
    }
  };

  const handleApproveScannedPass = async () => {
    if (!scannedPassInfo) return;

    // Create CHECKED_IN visitor log directly since it's pre-approved
    const flat = myFlats.find(f => f.id === scannedPassInfo.flatId) || { flatNumber: scannedPassInfo.flatNumber, blockId: scannedPassInfo.blockId };
    
    const newLog = {
      societyId: currentSocietyId,
      flatId: scannedPassInfo.flatId,
      flatNumber: scannedPassInfo.flatNumber,
      blockId: scannedPassInfo.blockId,
      visitorName: scannedPassInfo.visitorName,
      visitorPhone: scannedPassInfo.visitorPhone,
      visitorType: VisitorType.GUEST,
      purpose: scannedPassInfo.purpose,
      vehicleNumber: scannedPassInfo.vehicleNumber,
      photoURL: simulatedAvatars[0],
      numberOfVisitors: scannedPassInfo.numberOfGuests,
      expectedDuration: 'Pre-Approved Entry',
      status: 'CHECKED_IN' as const,
      residentId: scannedPassInfo.residentId,
      residentName: 'Approved Resident',
      checkedInByGuardId: currentUser.uid,
      checkedInByGuardName: currentUser.displayName,
      preApprovedPassId: scannedPassInfo.id,
      checkInTime: new Date().toISOString()
    };

    await visitorService.addVisitorLog(newLog);
    await visitorService.updatePassStatus(scannedPassInfo.id, 'USED');
    
    setScannedPassInfo(null);
    setManualPassCode('');
    setActiveTab('today');
    alert('✅ Pre-approved visitor checked in successfully!');
  };

  // Trigger quick panic alarm
  const triggerAlarm = () => {
    alert('🚨 EMERGENCY ALARM TRIGGERED! High-priority alerts broadcasted instantly to all resident smartphones & society management staff.');
  };

  // Filters
  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    const matchesSearch = 
      log.visitorName.toLowerCase().includes(term) ||
      log.visitorPhone.includes(term) ||
      log.flatNumber.toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (activeTab === 'today') {
      // Show logs created today
      const todayStr = new Date().toISOString().split('T')[0];
      return log.createdAt.toString().includes(todayStr) && log.status !== 'CHECKED_OUT';
    } else if (activeTab === 'inside') {
      return log.status === 'CHECKED_IN';
    } else if (activeTab === 'history') {
      return true;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Offline sync Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-3xl text-white">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isOffline ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-green-500/15 text-green-400 border border-green-500/30'}`}>
            {isOffline ? <WifiOff className="w-5 h-5 animate-pulse" /> : <Wifi className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider">Gate Connectivity</h4>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${isOffline ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                {isOffline ? 'OFFLINE QUEUE ACTIVE' : 'ONLINE'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans mt-0.5">
              {isOffline 
                ? 'Losing internet? Guard entries are safely saved locally and will auto-sync on recovery.' 
                : 'Gate server connected directly to real-time central database.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {offlineStatusMsg && (
            <span className="text-[10px] text-green-400 font-mono animate-fade-in">{offlineStatusMsg}</span>
          )}
          <button
            onClick={toggleOffline}
            className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isOffline 
                ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            {isOffline ? 'Bring Gate Online' : 'Simulate Lost Connection'}
          </button>
        </div>
      </div>

      {/* Primary Dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Side: Guard Navigation & Actions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 lg:col-span-1">
          <div className="flex items-center gap-3 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider">Gate Command</h3>
              <p className="text-[10px] text-slate-400 font-sans">Main Gate 1 • Active</p>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-cols-2 gap-2 text-center font-mono text-[11px]">
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-[8px] uppercase tracking-wider">Inside</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {logs.filter(l => l.status === 'CHECKED_IN').length}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-slate-400 text-[8px] uppercase tracking-wider">Today Logs</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {logs.length}
              </p>
            </div>
          </div>

          {/* Actions Navigation */}
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('today')}
              className={`w-full text-left inline-flex items-center justify-between px-4 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> Today's Visitor Feed
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'today' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {logs.filter(l => l.status !== 'CHECKED_OUT').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inside')}
              className={`w-full text-left inline-flex items-center justify-between px-4 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'inside'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" /> Currently Inside
              </span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${activeTab === 'inside' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                {logs.filter(l => l.status === 'CHECKED_IN').length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('new_walkin'); setCapturedPhoto(null); }}
              className={`w-full text-left inline-flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'new_walkin'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Log Walk-In Entry
            </button>

            <button
              onClick={() => setActiveTab('preapproved')}
              className={`w-full text-left inline-flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'preapproved'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <ScanLine className="w-4 h-4" /> Scan Pre-Approved Pass
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full text-left inline-flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-2xl transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-500 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/40'
              }`}
            >
              <History className="w-4 h-4" /> All Visitor History
            </button>
          </div>

          {/* Quick Panic Actions */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-2">
            <h4 className="text-[9px] font-mono font-bold text-red-500 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> Emergency Command
            </h4>
            <button
              onClick={triggerAlarm}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:border-red-900/40 dark:text-red-400 rounded-2xl transition-all font-sans cursor-pointer"
            >
              Trigger Quick Panic Alarm
            </button>
          </div>
        </div>

        {/* Right Side: Tab Viewports */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* List views: Today, Inside, History */}
          {(activeTab === 'today' || activeTab === 'inside' || activeTab === 'history') && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white capitalize">
                    {activeTab === 'today' && "Today's Visitor Feed"}
                    {activeTab === 'inside' && "Visitors Currently Inside"}
                    {activeTab === 'history' && "Visitor Log Registry"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeTab === 'today' && "Active visitors awaiting entry approval, checked-in, or rejected today."}
                    {activeTab === 'inside' && "Real-time list of visitors currently within society grounds."}
                    {activeTab === 'history' && "Searchable database archive of all society visit records."}
                  </p>
                </div>

                {/* Live Search */}
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, phone, flat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Pre-Approved Passes Banner in Today's Feed */}
              {activeTab === 'today' && passes.filter(p => p.status === 'ACTIVE').length > 0 && (
                <div className="bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50 p-4 rounded-3xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold font-sans text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                      <ScanLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Resident Pre-Approved Passes ({passes.filter(p => p.status === 'ACTIVE').length} Active)
                    </h4>
                    <span className="text-[10px] font-mono bg-indigo-200 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                      Real-Time Sync Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {passes.filter(p => p.status === 'ACTIVE').map(pass => (
                      <div
                        key={pass.id}
                        className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2 text-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{pass.visitorName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{pass.visitorPhone} • Flat {pass.flatNumber}</p>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full uppercase">
                            {pass.qrCode}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>Date: {pass.date} ({pass.time})</span>
                          <span>Guests: {pass.numberOfGuests}</span>
                        </div>

                        <button
                          onClick={async () => {
                            setScannedPassInfo(pass);
                            const newLog = {
                              societyId: currentSocietyId,
                              flatId: pass.flatId,
                              flatNumber: pass.flatNumber,
                              blockId: pass.blockId,
                              visitorName: pass.visitorName,
                              visitorPhone: pass.visitorPhone,
                              visitorType: VisitorType.GUEST,
                              purpose: pass.purpose,
                              vehicleNumber: '',
                              photoURL: simulatedAvatars[0],
                              numberOfVisitors: pass.numberOfGuests || 1,
                              expectedDuration: 'Pre-Approved Entry',
                              status: 'CHECKED_IN' as const,
                              residentId: pass.residentId,
                              residentName: 'Approved Resident',
                              checkedInByGuardId: currentUser.uid,
                              checkedInByGuardName: currentUser.displayName,
                              preApprovedPassId: pass.id,
                              checkInTime: new Date().toISOString()
                            };
                            await visitorService.addVisitorLog(newLog);
                            await visitorService.updatePassStatus(pass.id, 'USED');
                            alert(`✅ Pre-approved entry granted for ${pass.visitorName} (Flat ${pass.flatNumber})!`);
                          }}
                          className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Grant Entry (Check-In)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Grid / List of Feed items */}
              {filteredLogs.length > 0 ? (
                <div className="space-y-3.5">
                  {filteredLogs.map((log) => {
                    const isPending = log.status === 'PENDING';
                    const isApproved = log.status === 'APPROVED';
                    const isRejected = log.status === 'REJECTED';
                    const isCheckedIn = log.status === 'CHECKED_IN';
                    const isCheckedOut = log.status === 'CHECKED_OUT';

                    return (
                      <div 
                        key={log.id} 
                        className={`p-4 border rounded-2xl font-sans flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all relative overflow-hidden ${
                          isPending 
                            ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/30' 
                            : isApproved 
                            ? 'bg-green-50/50 border-green-200 dark:bg-green-950/10 dark:border-green-900/30 animate-pulse'
                            : isRejected
                            ? 'bg-red-50/30 border-red-100 dark:bg-red-950/5 dark:border-red-900/20'
                            : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                        }`}
                      >
                        {/* Visitor Info */}
                        <div className="flex items-start gap-4">
                          <img 
                            src={log.photoURL || simulatedAvatars[0]} 
                            alt="" 
                            className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 object-cover shrink-0" 
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{log.visitorName}</h4>
                              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full uppercase">
                                {log.visitorType}
                              </span>
                              {log.vehicleNumber && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                  <Car className="w-3 h-3" /> {log.vehicleNumber}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-3">
                              <span>📞 {log.visitorPhone}</span>
                              <span>🧑‍💻 Resident: {log.residentName} (Flat {log.flatNumber})</span>
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              Purpose: <span className="font-semibold text-slate-700 dark:text-slate-300">{log.purpose}</span>
                            </p>
                          </div>
                        </div>

                        {/* Status badge & Entry/Exit Controls */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0 self-start md:self-auto">
                          
                          {/* Timestamps */}
                          <div className="text-right font-mono text-[10px] text-slate-400 space-y-0.5">
                            <p>Created: {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            {log.checkInTime && <p className="text-emerald-500">In: {new Date(log.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                            {log.checkOutTime && <p className="text-red-400">Out: {new Date(log.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                          </div>

                          {/* Status pill */}
                          <span className={`px-2.5 py-1 text-[9px] font-mono font-bold rounded-full ${
                            isPending 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' 
                              : isApproved 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : isRejected
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                              : isCheckedIn
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {log.status.replace('_', ' ')}
                          </span>

                          {/* Controls based on status */}
                          <div className="flex gap-2">
                            {isPending && (
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleReject(log.id)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/30 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                                  title="Reject Entry"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] text-slate-400 self-center animate-pulse font-mono">Resident approving...</span>
                              </div>
                            )}

                            {isApproved && (
                              <button 
                                onClick={() => handleCheckIn(log.id)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Check-In Guest
                              </button>
                            )}

                            {isCheckedIn && (
                              <button 
                                onClick={() => handleCheckOut(log.id)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                              >
                                <LogOut className="w-3.5 h-3.5 rotate-180" /> Check-Out
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl space-y-3">
                  <User className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-sans font-bold text-slate-600 dark:text-slate-400">No visitors found</p>
                    <p className="text-xs text-slate-400">Try matching other terms or log a new walk-in.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Walk-In Entry Form */}
          {activeTab === 'new_walkin' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white">Log Walk-In Visitor Entry</h3>
                <p className="text-xs text-slate-400">Enter details of the walk-in guest below. This sends an instant approval request overlay to the resident's app.</p>
              </div>

              <form onSubmit={handleWalkInSubmit} className="space-y-6 font-sans">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visitor Profile Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">Visitor Full Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Aarav Sharma"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">Mobile Number</label>
                      <input 
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">Category</label>
                        <select
                          value={visitorType}
                          onChange={(e) => setVisitorType(e.target.value as VisitorType)}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value={VisitorType.GUEST}>Guest</option>
                          <option value={VisitorType.DELIVERY}>Delivery Agent</option>
                          <option value={VisitorType.DAILY_HELP}>Daily Help / Staff</option>
                          <option value={VisitorType.CAB}>Cab / Taxi</option>
                          <option value={VisitorType.OTHER}>Other Business</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">Vehicle Number (Optional)</label>
                        <input 
                          type="text"
                          placeholder="e.g. MH-12-AB-1234"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">Total Guests</label>
                        <input 
                          type="number"
                          min={1}
                          required
                          value={numberOfVisitors}
                          onChange={(e) => setNumberOfVisitors(Number(e.target.value))}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">Expected Stay</label>
                        <input 
                          type="text"
                          placeholder="e.g. 2 hours"
                          value={expectedDuration}
                          onChange={(e) => setExpectedDuration(e.target.value)}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Destination Flat Search & Photo Capture */}
                  <div className="space-y-4">
                    {/* Tower Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">1. Select Tower</label>
                        <select
                          value={selectedBlockId}
                          onChange={(e) => {
                            setSelectedBlockId(e.target.value);
                            setSelectedFloor('');
                            setSelectedFlatId('');
                            setSelectedResidentId('');
                          }}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Choose Wing/Tower...</option>
                          {myBlocks.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Floor Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">2. Select Floor</label>
                        <select
                          disabled={!selectedBlockId}
                          value={selectedFloor}
                          onChange={(e) => {
                            setSelectedFloor(e.target.value);
                            setSelectedFlatId('');
                            setSelectedResidentId('');
                          }}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="">Choose Floor...</option>
                          {selectedBlockId && myBlocks.find(b => b.id === selectedBlockId)?.floors.map(fl => (
                            <option key={fl.floorNumber} value={fl.floorNumber}>{fl.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Flat Selection */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">3. Select Flat Unit</label>
                        <select
                          disabled={!selectedFloor}
                          value={selectedFlatId}
                          onChange={(e) => {
                            setSelectedFlatId(e.target.value);
                            setSelectedResidentId('');
                          }}
                          className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          <option value="">Choose Unit...</option>
                          {selectedFloor && myFlats.filter(f => f.blockId === selectedBlockId && String(f.floor) === String(selectedFloor)).map(f => (
                            <option key={f.id} value={f.id}>{f.flatNumber}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Resident Info Autofill */}
                    {selectedFlatId && (
                      <div className="bg-indigo-50/40 border border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/30 p-4 rounded-2xl space-y-3">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">4. Target Resident Info</label>
                        
                        {(() => {
                          const flatResidents = myResidents.filter(r => r.flatId === selectedFlatId);
                          if (flatResidents.length === 0) {
                            return (
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold italic">
                                ⚠️ No residents registered in this unit. Selecting temporary occupant.
                              </p>
                            );
                          }
                          return (
                            <div className="space-y-3">
                              <select
                                value={selectedResidentId}
                                onChange={(e) => setSelectedResidentId(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-850 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                              >
                                <option value="">Select resident...</option>
                                {flatResidents.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} ({r.residentType})</option>
                                ))}
                              </select>

                              {/* Autofilled Resident Details */}
                              {(() => {
                                const selectedRes = flatResidents.find(r => r.id === selectedResidentId);
                                if (!selectedRes) return null;
                                return (
                                  <div className="flex gap-4 items-center p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
                                    <img 
                                      src={selectedRes.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'} 
                                      alt="" 
                                      className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-800 object-cover" 
                                    />
                                    <div className="text-xs">
                                      <p className="font-bold text-slate-900 dark:text-white">{selectedRes.name}</p>
                                      <p className="text-slate-400 mt-0.5">{selectedRes.mobile} • {selectedRes.email}</p>
                                      <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold font-mono mt-0.5">{selectedRes.residentType}</p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">Purpose of Visit</label>
                      <select
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                        required
                      >
                        <option value="">Select a standard purpose...</option>
                        {purposes.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    {/* Camera Simulation Box */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 font-mono">Security Photograph Capture</label>
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                        
                        {capturedPhoto ? (
                          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md">
                            <img src={capturedPhoto} alt="" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => setCapturedPhoto(null)}
                              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors"
                              title="Retake"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isCameraActive ? (
                          <div className="space-y-3 text-center w-full">
                            <div className="w-24 h-24 rounded-full border-4 border-dashed border-indigo-400 mx-auto animate-pulse flex items-center justify-center">
                              <Camera className="w-8 h-8 text-indigo-400" />
                            </div>
                            <p className="text-[10px] text-indigo-500 font-mono">Securing live gate viewfinder...</p>
                            <button
                              type="button"
                              onClick={() => {
                                setCapturedPhoto(simulatedAvatars[photoSelected]);
                                setIsCameraActive(false);
                              }}
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" /> Capture Still
                            </button>
                          </div>
                        ) : (
                          <div className="text-center py-2 space-y-3 w-full">
                            <Camera className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                            <div>
                              <p className="text-xs text-slate-500 font-bold">Live Gate Camera</p>
                              <p className="text-[10px] text-slate-400">Click to start secure camera feed</p>
                            </div>
                            <div className="flex gap-2 justify-center">
                              <button
                                type="button"
                                onClick={() => setIsCameraActive(true)}
                                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all cursor-pointer"
                              >
                                Start Live View
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextIdx = (photoSelected + 1) % simulatedAvatars.length;
                                  setPhotoSelected(nextIdx);
                                  setCapturedPhoto(simulatedAvatars[nextIdx]);
                                }}
                                className="inline-flex items-center gap-1 text-[10px] font-mono px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer"
                              >
                                Simulate ID Photo
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button"
                    onClick={() => setActiveTab('today')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-indigo-500/25 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" /> Broadcast Approval Request
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* Scan Pre-Approved Pass */}
          {activeTab === 'preapproved' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-sans font-bold text-slate-900 dark:text-white">Verify Resident Pre-Approved Pass</h3>
                <p className="text-xs text-slate-400">Scan QR Code or enter the unique pass code manually below to instantly check-in expected guests.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Manual entry / scanning input */}
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 dark:border-indigo-900/50">
                      <ScanLine className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white font-sans">Pass Code Scanner</p>
                      <p className="text-[10px] text-slate-400">Enter code format: e.g. OG-soc_greenwood_101-RC7733</p>
                    </div>
                  </div>

                  <div className="space-y-3 font-mono">
                    <input 
                      type="text"
                      placeholder="Enter code manually..."
                      value={manualPassCode}
                      onChange={(e) => setManualPassCode(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs text-center border bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase font-bold"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleScanPass}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-colors cursor-pointer"
                      >
                        Verify Pass Code
                      </button>
                      <button
                        onClick={() => {
                          if (passes.length > 0) {
                            setManualPassCode(passes[0].qrCode);
                          } else {
                            alert('No active pre-approved passes in society database yet.');
                          }
                        }}
                        className="inline-flex items-center justify-center gap-1 text-[10px] font-mono px-3 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl cursor-pointer"
                        title="Autofill active pass for testing"
                      >
                        Auto-Select Active Pass
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scanned Pass Result Preview */}
                <div className="border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
                  {scannedPassInfo ? (
                    <div className="space-y-4 font-sans text-xs">
                      <div className="flex items-center gap-2.5 text-green-500 font-mono font-bold">
                        <CheckCircle className="w-5 h-5 animate-bounce" /> PASS VALIDATED
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Visitor Name</span>
                          <span className="font-bold text-slate-900 dark:text-white">{scannedPassInfo.visitorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Phone</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">{scannedPassInfo.visitorPhone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Target flat</span>
                          <span className="font-bold text-slate-900 dark:text-white">Flat {scannedPassInfo.flatNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Guests Allowed</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{scannedPassInfo.numberOfGuests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Scheduled Date</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200">{scannedPassInfo.date} • {scannedPassInfo.time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Purpose</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{scannedPassInfo.purpose}</span>
                        </div>
                      </div>

                      <button
                        onClick={handleApproveScannedPass}
                        className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-2xl transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" /> Grant Entry (Check-In)
                      </button>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-8">
                      <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                      <div>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Awaiting Pass Verification</p>
                        <p className="text-[10px] text-slate-400 max-w-xs">Verify a code in the left panel to inspect security permissions and check-in guests.</p>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Active Pre-Approved Passes List */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-sans text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    All Active Resident Pre-Approved Passes ({passes.filter(p => p.status === 'ACTIVE').length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated live from Firestore
                  </span>
                </div>

                {passes.filter(p => p.status === 'ACTIVE').length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {passes.filter(p => p.status === 'ACTIVE').map(p => (
                      <div 
                        key={p.id}
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl space-y-2.5 font-sans"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{p.visitorName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{p.visitorPhone} • Flat {p.flatNumber}</p>
                          </div>
                          <span className="text-[9px] font-mono font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 px-2 py-0.5 rounded-full uppercase">
                            {p.qrCode}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
                          <div>Date: <span className="font-bold text-slate-700 dark:text-slate-300">{p.date} ({p.time})</span></div>
                          <div>Purpose: <span className="text-slate-700 dark:text-slate-300">{p.purpose}</span></div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setManualPassCode(p.qrCode);
                              setScannedPassInfo(p);
                            }}
                            className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Select & Inspect
                          </button>
                          <button
                            onClick={async () => {
                              setScannedPassInfo(p);
                              const newLog = {
                                societyId: currentSocietyId,
                                flatId: p.flatId,
                                flatNumber: p.flatNumber,
                                blockId: p.blockId,
                                visitorName: p.visitorName,
                                visitorPhone: p.visitorPhone,
                                visitorType: VisitorType.GUEST,
                                purpose: p.purpose,
                                vehicleNumber: '',
                                photoURL: simulatedAvatars[0],
                                numberOfVisitors: p.numberOfGuests || 1,
                                expectedDuration: 'Pre-Approved Entry',
                                status: 'CHECKED_IN' as const,
                                residentId: p.residentId,
                                residentName: 'Approved Resident',
                                checkedInByGuardId: currentUser.uid,
                                checkedInByGuardName: currentUser.displayName,
                                preApprovedPassId: p.id,
                                checkInTime: new Date().toISOString()
                              };
                              await visitorService.addVisitorLog(newLog);
                              await visitorService.updatePassStatus(p.id, 'USED');
                              alert(`✅ Pass verified & entry granted for ${p.visitorName}!`);
                            }}
                            className="flex-1 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Check In
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs">
                    No active pre-approved guest passes found for this society yet.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
