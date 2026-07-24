/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, MapPin, Truck, Phone, UserCheck, AlertTriangle, 
  Check, X, ShieldAlert, Wifi, WifiOff, Clock, Calendar, 
  BarChart3, TrendingUp, Sparkles, Filter, Download, Info, 
  QrCode, User, ShieldCheck, CheckSquare, RefreshCw, Trash2, ChevronRight, UserMinus,
  BellRing
} from 'lucide-react';
import { useAuth } from '../../services/authContext';
import { societyService } from '../../services/societyService';
import { deliveryService, DeliveryLog, ExpectedDelivery, PREDEFINED_DELIVERIES, BlacklistedDeliveryPerson } from '../../services/deliveryService';

interface DeliveryDashboardProps {
  currentUser: {
    uid: string;
    displayName: string;
    role: string;
    email: string;
    photoURL?: string;
  };
  currentSocietyId: string;
}

export const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ currentUser, currentSocietyId }) => {
  const { theme } = useAuth();
  
  // Real-time states
  const [deliveries, setDeliveries] = useState<DeliveryLog[]>([]);
  const [expectedDeliveries, setExpectedDeliveries] = useState<ExpectedDelivery[]>([]);
  const [blacklist, setBlacklist] = useState<BlacklistedDeliveryPerson[]>([]);
  const [isOffline, setIsOffline] = useState(false);

  // Load static society details for mapping
  const towers = societyService.getTowers(currentSocietyId);
  const flats = societyService.getFlats(currentSocietyId);
  const residents = societyService.getResidents(currentSocietyId);

  // Subscribe to real-time updates
  useEffect(() => {
    deliveryService.init(currentSocietyId);
    setIsOffline(deliveryService.isOffline());

    // Subscription for Deliveries
    const unsubscribeDeliveries = deliveryService.subscribeDeliveries(currentSocietyId, (data) => {
      setDeliveries(data);
    });

    // Subscription for Expected Deliveries
    const unsubscribeExpected = deliveryService.subscribeExpectedDeliveries(currentSocietyId, (data) => {
      setExpectedDeliveries(data);
    });

    // Local subscription to notify updates on other actions (e.g. blacklist)
    const unsubscribeLocal = deliveryService.subscribe(() => {
      setBlacklist(deliveryService.getBlacklist());
      setIsOffline(deliveryService.isOffline());
    });

    setBlacklist(deliveryService.getBlacklist());

    return () => {
      unsubscribeDeliveries();
      unsubscribeExpected();
      unsubscribeLocal();
    };
  }, [currentSocietyId]);

  // Audio alert simulation
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
      
      // Double beep
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.2);
      }, 180);
    } catch {
      // AudioContext deferred or not supported
    }
  };

  // Sound triggers on new pending items for Resident
  useEffect(() => {
    if (currentUser.role === 'RESIDENT') {
      const pendingCount = deliveries.filter(d => d.status === 'PENDING' && d.residentId === currentUser.uid).length;
      if (pendingCount > 0) {
        playAlertSound();
      }
    }
  }, [deliveries, currentUser.role, currentUser.uid]);

  // Handle network toggle
  const toggleNetworkMode = () => {
    const nextOffline = !isOffline;
    setIsOffline(nextOffline);
    deliveryService.setOffline(nextOffline);
  };

  // --- RENDERS BASED ON ROLE ---
  if (currentUser.role === 'SECURITY_GUARD') {
    return (
      <GuardView 
        deliveries={deliveries} 
        expectedDeliveries={expectedDeliveries}
        blacklist={blacklist}
        isOffline={isOffline}
        onToggleOffline={toggleNetworkMode}
        currentSocietyId={currentSocietyId}
        currentUser={currentUser}
        towers={towers}
        flats={flats}
        residents={residents}
      />
    );
  }

  if (currentUser.role === 'RESIDENT') {
    return (
      <ResidentView 
        deliveries={deliveries}
        expectedDeliveries={expectedDeliveries}
        blacklist={blacklist}
        currentSocietyId={currentSocietyId}
        currentUser={currentUser}
        towers={towers}
        flats={flats}
        onPlayAlert={playAlertSound}
      />
    );
  }

  // Admin View
  return (
    <AdminView 
      deliveries={deliveries}
      blacklist={blacklist}
      currentSocietyId={currentSocietyId}
      currentUser={currentUser}
      residents={residents}
    />
  );
};

// ==========================================
// 1. GUARD VIEW COMPONENT
// ==========================================
interface GuardViewProps {
  deliveries: DeliveryLog[];
  expectedDeliveries: ExpectedDelivery[];
  blacklist: BlacklistedDeliveryPerson[];
  isOffline: boolean;
  onToggleOffline: () => void;
  currentSocietyId: string;
  currentUser: any;
  towers: any[];
  flats: any[];
  residents: any[];
}

const GuardView: React.FC<GuardViewProps> = ({
  deliveries, expectedDeliveries, blacklist, isOffline, onToggleOffline, 
  currentSocietyId, currentUser, towers, flats, residents
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'expected' | 'offline'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Delivery Form State
  const [formStep, setFormStep] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedTowerId, setSelectedTowerId] = useState('');
  const [selectedFlatId, setSelectedFlatId] = useState('');
  
  const [deliveryPersonName, setDeliveryPersonName] = useState('');
  const [deliveryPersonPhone, setDeliveryPersonPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [purpose, setPurpose] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  
  // Quick pre-set photos for guard verification
  const dummyPhotos = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150&q=80'
  ];

  // Map selected flat/tower
  const activeFlatsInTower = flats.filter(f => f.blockId === selectedTowerId);
  const selectedFlatObj = flats.find(f => f.id === selectedFlatId);
  const targetResident = selectedFlatObj 
    ? residents.find(r => r.flatId === selectedFlatId) 
    : null;

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !selectedFlatId || !deliveryPersonName || !deliveryPersonPhone) {
      alert('Please fill out all mandatory fields.');
      return;
    }

    // Check blacklist
    if (deliveryService.isBlacklisted(deliveryPersonPhone)) {
      alert(`⚠️ CANNOT PROCEED: Delivery person (${deliveryPersonName}, ${deliveryPersonPhone}) is BLACKLISTED for security reasons.`);
      return;
    }

    const towerObj = towers.find(t => t.id === selectedTowerId);
    
    const newLogPayload: Omit<DeliveryLog, 'id' | 'createdAt' | 'updatedAt' | 'offlineSyncStatus'> = {
      societyId: currentSocietyId,
      flatId: selectedFlatId,
      flatNumber: selectedFlatObj?.flatNumber || 'N/A',
      blockId: selectedTowerId,
      blockName: towerObj?.name || 'N/A',
      companyName: selectedCompany,
      deliveryPersonName,
      deliveryPersonPhone,
      vehicleNumber: vehicleNumber || undefined,
      trackingNumber: trackingNumber || undefined,
      purpose: purpose || undefined,
      photoURL: photoURL || dummyPhotos[Math.floor(Math.random() * dummyPhotos.length)],
      status: 'PENDING',
      residentId: targetResident?.id || 'res_001',
      residentName: targetResident?.name || 'Resident',
      residentPhone: targetResident?.mobile,
      checkedInByGuardId: currentUser.uid,
      checkedInByGuardName: currentUser.displayName,
      entryTime: new Date().toISOString()
    };

    await deliveryService.addDeliveryLog(currentSocietyId, newLogPayload);
    
    // Reset Form
    setSelectedCompany('');
    setSelectedTowerId('');
    setSelectedFlatId('');
    setDeliveryPersonName('');
    setDeliveryPersonPhone('');
    setVehicleNumber('');
    setTrackingNumber('');
    setPurpose('');
    setPhotoURL('');
    setFormStep(1);
    setShowAddModal(false);
  };

  // Quick Action triggers
  const handleApproveOnBehalf = async (id: string) => {
    await deliveryService.updateDeliveryStatus(currentSocietyId, id, 'APPROVED');
  };

  const handleRejectOnBehalf = async (id: string) => {
    await deliveryService.updateDeliveryStatus(currentSocietyId, id, 'REJECTED');
  };

  const handleCheckIn = async (id: string) => {
    await deliveryService.updateDeliveryStatus(currentSocietyId, id, 'CHECKED_IN', {
      checkedInByGuardId: currentUser.uid,
      checkedInByGuardName: currentUser.displayName,
      entryTime: new Date().toISOString()
    });
  };

  const handleCheckOut = async (id: string, entryTimeStr?: string) => {
    const exitTime = new Date().toISOString();
    let duration = 0;
    if (entryTimeStr) {
      duration = Math.round((new Date(exitTime).getTime() - new Date(entryTimeStr).getTime()) / 60000);
    }
    await deliveryService.updateDeliveryStatus(currentSocietyId, id, 'CHECKED_OUT', {
      checkedOutByGuardId: currentUser.uid,
      checkedOutByGuardName: currentUser.displayName,
      exitTime,
      duration: duration > 0 ? duration : 5
    });
  };

  const processExpectedDelivery = async (expected: ExpectedDelivery) => {
    const doubleCheckBlacklist = deliveryService.isBlacklisted('+91 99999 88888'); // Mock check
    
    const newLogPayload: Omit<DeliveryLog, 'id' | 'createdAt' | 'updatedAt' | 'offlineSyncStatus'> = {
      societyId: currentSocietyId,
      flatId: expected.flatId,
      flatNumber: expected.flatNumber,
      blockId: expected.blockId,
      blockName: expected.blockName,
      companyName: expected.companyName,
      deliveryPersonName: 'Pre-Approved Carrier',
      deliveryPersonPhone: '+91 XXXXX XXXXX',
      trackingNumber: expected.trackingNumber,
      status: 'CHECKED_IN',
      photoURL: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&h=150&q=80',
      residentId: expected.residentId,
      residentName: expected.residentName,
      checkedInByGuardId: currentUser.uid,
      checkedInByGuardName: currentUser.displayName,
      entryTime: new Date().toISOString()
    };

    // Add log
    await deliveryService.addDeliveryLog(currentSocietyId, newLogPayload);
    // Remove expected pass
    await deliveryService.deleteExpectedDelivery(currentSocietyId, expected.id);
    alert(`✅ Expected delivery for Flat ${expected.flatNumber} checked-in instantly!`);
  };

  // Search filter matching
  const filteredDeliveries = deliveries.filter(item => {
    const matchesQuery = 
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deliveryPersonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deliveryPersonPhone.includes(searchQuery) ||
      item.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.trackingNumber && item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesQuery;
  });

  const filteredExpected = expectedDeliveries.filter(item => {
    const matchesQuery = 
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.trackingNumber && item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesQuery;
  });

  const queuedCount = deliveries.filter(d => d.offlineSyncStatus === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Upper Status/Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-2xl">
            <Truck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-sans">Delivery Gate Control</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Secure entry verification for Society Main Gate</p>
          </div>
        </div>

        {/* Offline Toggle Indicator */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleOffline}
            className={`flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl font-bold font-sans text-xs transition-all cursor-pointer ${
              isOffline 
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800' 
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-4 h-4 animate-pulse" />
                <span>Offline Gate Caching (Active)</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4" />
                <span>Gate Connected (Cloud Synced)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl font-bold font-sans text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-950/30 p-3 rounded-2xl border border-slate-150 dark:border-slate-900">
        {/* Navigation sub-tabs */}
        <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60 rounded-xl">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'all' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            Active Deliveries ({deliveries.filter(d => d.status !== 'CHECKED_OUT').length})
          </button>
          <button
            onClick={() => setActiveSubTab('expected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'expected' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            Pre-Approved Passes ({expectedDeliveries.length})
          </button>
          {queuedCount > 0 && (
            <button
              onClick={() => setActiveSubTab('offline')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white shadow-sm relative animate-pulse cursor-pointer"
            >
              Offline Cache ({queuedCount})
            </button>
          )}
        </div>

        {/* Global Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, flat, mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white font-sans"
          />
        </div>
      </div>

      {/* Grid Content Renders */}
      {activeSubTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeliveries.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
              <Truck className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-350" />
              <p className="text-sm font-sans font-medium">No matching deliveries found</p>
              <p className="text-xs">Create a new entry or adjust your search filters.</p>
            </div>
          ) : (
            filteredDeliveries.map((item) => {
              const isBlacklisted = blacklist.some(b => b.phone === item.deliveryPersonPhone);
              return (
                <div 
                  key={item.id} 
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm transition-all ${
                    isBlacklisted ? 'border-rose-300 dark:border-rose-950/60 bg-rose-50/20 dark:bg-rose-950/10' : 'border-slate-100 dark:border-slate-800/80'
                  }`}
                >
                  {/* Card Header: Icon, Company and Status */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center font-sans font-bold text-sm text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0 border border-indigo-100/50 dark:border-indigo-900/30">
                        {item.companyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate font-sans">{item.companyName}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Flat {item.flatNumber}</p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex flex-col items-end gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono ${
                        item.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                        item.status === 'APPROVED' || item.status === 'ALLOW_DIRECT_ENTRY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' :
                        item.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                        item.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' :
                        item.status === 'LEAVE_AT_GATE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400' :
                        item.status === 'LEAVE_AT_RECEPTION' ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400' :
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                      {item.offlineSyncStatus === 'PENDING' && (
                        <span className="text-[9px] font-bold text-amber-500 flex items-center gap-0.5">
                          <WifiOff className="w-2.5 h-2.5" /> Offline Queued
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Courier Detail Rows */}
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs border-y border-slate-100 dark:border-slate-800/80 py-4 font-sans text-slate-600 dark:text-slate-350">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-mono">Carrier Person</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.deliveryPersonName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-mono">Resident</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{item.residentName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-mono">Mobile Number</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{item.deliveryPersonPhone}</span>
                    </div>
                    {item.trackingNumber && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-mono">Tracking No.</span>
                        <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{item.trackingNumber}</span>
                      </div>
                    )}
                    {item.entryTime && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-mono">Check-In Time</span>
                        <span className="font-mono">{new Date(item.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(item.entryTime).toLocaleDateString()})</span>
                      </div>
                    )}
                    {item.exitTime && (
                      <>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-mono">Check-Out Time</span>
                          <span className="font-mono">{new Date(item.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide block font-mono">Stay Duration</span>
                          <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.duration} min</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex gap-2 shrink-0 pt-1">
                    {/* Guard Override Actions if Resident hasn't acted yet */}
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApproveOnBehalf(item.id)}
                          className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer font-sans"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectOnBehalf(item.id)}
                          className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer font-sans"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* Check In Action */}
                    {(item.status === 'APPROVED' || item.status === 'ALLOW_DIRECT_ENTRY') && (
                      <button
                        onClick={() => handleCheckIn(item.id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Check-In Entry</span>
                      </button>
                    )}

                    {/* Check Out Action */}
                    {(item.status === 'CHECKED_IN' || item.status === 'LEAVE_AT_GATE' || item.status === 'LEAVE_AT_RECEPTION') && (
                      <button
                        onClick={() => handleCheckOut(item.id, item.entryTime)}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-650 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 font-sans"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Check-Out Carrier</span>
                      </button>
                    )}

                    {item.status === 'CHECKED_OUT' && (
                      <div className="w-full text-center py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-950/40 rounded-xl font-sans">
                        ✓ Delivery Processed Successfully
                      </div>
                    )}

                    {item.status === 'REJECTED' && (
                      <div className="w-full text-center py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-950/20 rounded-xl font-sans">
                        ✕ Access Refused by Resident
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeSubTab === 'expected' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpected.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
              <QrCode className="w-12 h-12 mx-auto stroke-1 mb-3 text-slate-350" />
              <p className="text-sm font-sans font-medium">No expected deliveries listed today</p>
              <p className="text-xs">Residents create passes in advance for faster gate access.</p>
            </div>
          ) : (
            filteredExpected.map((expected) => (
              <div key={expected.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 flex flex-col justify-between space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                      <QrCode className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans">{expected.companyName}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Flat {expected.flatNumber} • {expected.blockName}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 text-[10px] font-bold font-mono tracking-wide">
                    PRE-APPROVED
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-350 font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resident Host:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{expected.residentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected Date:</span>
                    <span className="font-bold">{expected.expectedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected Window:</span>
                    <span className="font-bold font-mono">{expected.expectedTime}</span>
                  </div>
                  {expected.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tracking Number:</span>
                      <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{expected.trackingNumber}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => processExpectedDelivery(expected)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer font-sans"
                >
                  Confirm Arrival & Check-In
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- ADD NEW ENTRY MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">New Delivery Entry Pass</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            {/* Stepper Progress */}
            <div className="flex justify-between items-center text-xs font-bold font-sans">
              <span className={`px-2.5 py-1.5 rounded-lg ${formStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                1. Company
              </span>
              <div className="h-0.5 bg-slate-200 dark:bg-slate-800 flex-1 mx-3" />
              <span className={`px-2.5 py-1.5 rounded-lg ${formStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                2. Address
              </span>
              <div className="h-0.5 bg-slate-200 dark:bg-slate-800 flex-1 mx-3" />
              <span className={`px-2.5 py-1.5 rounded-lg ${formStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                3. Carrier Details
              </span>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-6">
              {/* Step 1: Select Company */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block font-sans">Select Delivery Company</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {PREDEFINED_DELIVERIES.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setSelectedCompany(c); setFormStep(2); }}
                        className={`p-3.5 rounded-2xl border text-xs font-sans font-bold flex flex-col items-center justify-center text-center gap-2 transition-all cursor-pointer ${
                          selectedCompany === c 
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-500 dark:text-indigo-400' 
                            : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-7 h-7 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-xs font-extrabold">
                          {c.charAt(0)}
                        </div>
                        <span className="truncate w-full text-[10px]">{c}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Unit/Flat */}
              {formStep === 2 && (
                <div className="space-y-4 font-sans">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Select Wing/Tower</label>
                      <select
                        value={selectedTowerId}
                        onChange={(e) => { setSelectedTowerId(e.target.value); setSelectedFlatId(''); }}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        required
                      >
                        <option value="">-- Choose Tower --</option>
                        {towers.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Select Flat Number</label>
                      <select
                        value={selectedFlatId}
                        onChange={(e) => setSelectedFlatId(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        required
                        disabled={!selectedTowerId}
                      >
                        <option value="">-- Choose Flat --</option>
                        {activeFlatsInTower.map(f => (
                          <option key={f.id} value={f.id}>{f.flatNumber}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {targetResident && (
                    <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl space-y-2 border border-slate-100 dark:border-slate-900/40">
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wide">Target Resident Details</div>
                      <div className="flex items-center gap-3">
                        <img src={targetResident.photoURL} alt="" className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{targetResident.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">{targetResident.mobile}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="button"
                      onClick={() => setFormStep(1)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(3)}
                      disabled={!selectedFlatId}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Carrier Details */}
              {formStep === 3 && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-400">Carrier Person Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh"
                        value={deliveryPersonName}
                        onChange={(e) => setDeliveryPersonName(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-400">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98200 12345"
                        value={deliveryPersonPhone}
                        onChange={(e) => setDeliveryPersonPhone(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-400">Vehicle Number (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. MH-02-AB-1234"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-slate-400">Tracking Number (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. AMZ8920199"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-400">Delivery Photo (Gate Camera Simulator)</label>
                    <div className="border border-dashed border-slate-200 dark:border-slate-850 p-4.5 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                      {photoURL ? (
                        <div className="relative">
                          <img src={photoURL} alt="" className="w-20 h-20 rounded-full border object-cover" />
                          <button
                            type="button"
                            onClick={() => setPhotoURL('')}
                            className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Truck className="w-8 h-8 text-indigo-400 stroke-1" />
                          <div>
                            <p className="font-bold text-slate-700 dark:text-slate-300">Click to Simulate Gate Photo Capture</p>
                            <p className="text-[10px] text-slate-400">Automatically loads a realistic mockup delivery profile image</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPhotoURL(dummyPhotos[Math.floor(Math.random() * dummyPhotos.length)])}
                            className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg cursor-pointer hover:bg-indigo-100/50"
                          >
                            Capture Gate Photo
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Submit Entry Pass
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. RESIDENT VIEW COMPONENT
// ==========================================
interface ResidentViewProps {
  deliveries: DeliveryLog[];
  expectedDeliveries: ExpectedDelivery[];
  blacklist: BlacklistedDeliveryPerson[];
  currentSocietyId: string;
  currentUser: any;
  towers: any[];
  flats: any[];
  onPlayAlert: () => void;
}

const ResidentView: React.FC<ResidentViewProps> = ({
  deliveries, expectedDeliveries, blacklist, currentSocietyId, currentUser, towers, flats, onPlayAlert
}) => {
  const [showAddExpectedModal, setShowAddExpectedModal] = useState(false);
  const [expectedCompany, setExpectedCompany] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [expectedTime, setExpectedTime] = useState('');
  const [expectedTracking, setExpectedTracking] = useState('');
  
  // Find Resident's assigned flat/tower
  // Note: We use Gokuldham mock Resident Taarak Mehta who resides in Flat B-504
  const residentFlat = flats.find(f => f.id === 'flat_gw_b_504') || flats[0];
  const residentTower = residentFlat ? towers.find(t => t.id === residentFlat.blockId) : null;

  // Filter deliveries belonging only to this flat
  const myDeliveries = deliveries.filter(d => d.flatId === residentFlat?.id);
  const myPendingApprovals = myDeliveries.filter(d => d.status === 'PENDING');
  const myExpected = expectedDeliveries.filter(d => d.flatId === residentFlat?.id);

  const handleAction = async (id: string, nextStatus: DeliveryLog['status']) => {
    await deliveryService.updateDeliveryStatus(currentSocietyId, id, nextStatus);
  };

  const handleAddExpected = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expectedCompany || !expectedDate || !expectedTime) {
      alert('Please fill out mandatory fields.');
      return;
    }

    const qrStr = 'EXP-GW-' + expectedCompany.substring(0,4).toUpperCase() + '-' + Math.floor(10000 + Math.random() * 90000);

    const payload: Omit<ExpectedDelivery, 'id' | 'createdAt'> = {
      societyId: currentSocietyId,
      flatId: residentFlat?.id || 'flat_gw_b_504',
      flatNumber: residentFlat?.flatNumber || 'B-504',
      blockId: residentFlat?.blockId || 'blk_gw_b',
      blockName: residentTower?.name || 'B Wing (Orchid)',
      residentId: currentUser.uid,
      residentName: currentUser.displayName.replace(' (Resident)', ''),
      companyName: expectedCompany,
      trackingNumber: expectedTracking || undefined,
      expectedDate,
      expectedTime,
      qrCode: qrStr,
      status: 'EXPECTED'
    };

    await deliveryService.addExpectedDelivery(currentSocietyId, payload);
    
    // Reset Form
    setExpectedCompany('');
    setExpectedDate('');
    setExpectedTime('');
    setExpectedTracking('');
    setShowAddExpectedModal(false);
  };

  const handleCancelExpected = async (id: string) => {
    if (confirm('Cancel this expected pre-approved delivery?')) {
      await deliveryService.deleteExpectedDelivery(currentSocietyId, id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sound Indicator alert */}
      <AnimatePresence>
        {myPendingApprovals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-500/10 border border-amber-200/50 dark:border-amber-950/40 p-5 rounded-3xl flex flex-col sm:flex-row gap-4 items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 font-sans">Active Gate Approval Alerts</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Carrier is waiting at Society Main Gate. Please respond instantly.</p>
              </div>
            </div>
            <button
              onClick={() => onPlayAlert()}
              className="px-4 py-1.5 bg-amber-500 text-white hover:bg-amber-600 rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center gap-1.5"
            >
              <BellRing className="w-3.5 h-3.5 animate-bounce" /> Test Alert Bell
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Profile Info / Quick pre-approval */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <img src={currentUser.photoURL} alt="" className="w-14 h-14 rounded-2xl border object-cover" />
              <div>
                <h2 className="text-lg font-bold text-slate-950 dark:text-white font-sans">{currentUser.displayName.replace(' (Resident)', '')}</h2>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold font-mono">Resident • Flat {residentFlat?.flatNumber || 'B-504'}</p>
                <p className="text-[11px] text-slate-500 font-sans">{residentTower?.name || 'B Wing'}</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between text-xs text-slate-600 dark:text-slate-400">
            <div className="flex gap-2.5">
              <span>Total Entries: <strong>{myDeliveries.length}</strong></span>
              <span>•</span>
              <span>Pending approvals: <strong>{myPendingApprovals.length}</strong></span>
            </div>
            <button
              onClick={() => setShowAddExpectedModal(true)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer font-sans"
            >
              <Plus className="w-3.5 h-3.5" /> Pre-approve Delivery
            </button>
          </div>
        </div>

        {/* Expected/Upcoming summary card */}
        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-2">
            <QrCode className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Expected Deliveries</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-sans">List upcoming deliveries so carriers can enter instantly without gate approvals.</p>
          <button
            onClick={() => setShowAddExpectedModal(true)}
            className="w-full py-2.5 bg-slate-950 text-white dark:bg-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 rounded-xl text-xs font-bold font-sans cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expected Delivery</span>
          </button>
        </div>
      </div>

      {/* Approvals section */}
      {myPendingApprovals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Pending Approval Requests</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myPendingApprovals.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 flex flex-col shadow-md">
                <div className="flex gap-4">
                  <img src={item.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover border border-slate-200" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-bold text-slate-900 dark:text-white text-base">{item.companyName}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide uppercase bg-amber-100 text-amber-700">
                        Gate Waiting
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans mt-0.5">{item.deliveryPersonName}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.deliveryPersonPhone}</p>
                  </div>
                </div>

                {/* Grid response buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-bold font-sans">
                  <button
                    onClick={() => handleAction(item.id, 'APPROVED')}
                    className="py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" /> Approve Entry
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'REJECTED')}
                    className="py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X className="w-4 h-4" /> Reject Entry
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'LEAVE_AT_GATE')}
                    className="py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                  >
                    Leave at Gate
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'LEAVE_AT_RECEPTION')}
                    className="py-2 border border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
                  >
                    Leave at Reception
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'ALLOW_DIRECT_ENTRY')}
                    className="col-span-2 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-150/40 dark:border-indigo-900/40 cursor-pointer"
                  >
                    Allow Direct Entry
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expected Deliveries list manager */}
      {myExpected.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">My Upcoming Expected Passes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myExpected.map((item) => (
              <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans">{item.companyName}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Pass: {item.qrCode}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelExpected(item.id)}
                    className="p-1 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-slate-400 hover:text-rose-500"
                    title="Cancel Pass"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-2xl font-sans">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Date</span>
                    <span className="font-bold">{item.expectedDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Expected Window</span>
                    <span className="font-bold font-mono">{item.expectedTime}</span>
                  </div>
                  {item.trackingNumber && (
                    <div className="col-span-2 mt-1">
                      <span className="text-[10px] text-slate-400 block font-mono">Tracking Code</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{item.trackingNumber}</span>
                    </div>
                  )}
                </div>

                {/* Generated Pass visual receipt */}
                <div className="border border-indigo-100 dark:border-indigo-950 bg-indigo-50/20 dark:bg-indigo-950/10 p-3.5 rounded-2xl flex items-center gap-3">
                  <div className="bg-white p-1 rounded-lg border border-indigo-100 shrink-0">
                    <div className="w-10 h-10 bg-slate-950 flex items-center justify-center text-white text-[10px] font-extrabold font-mono">QR</div>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans leading-snug">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Carrier Pass Active</p>
                    <p>Share with delivery agent to enable seamless gate arrival scan.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History log */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">My Delivery History Log</h3>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-400 font-mono border-b border-slate-200 dark:border-slate-850">
                  <th className="p-4 uppercase tracking-wider font-bold">Company</th>
                  <th className="p-4 uppercase tracking-wider font-bold">Delivery Person</th>
                  <th className="p-4 uppercase tracking-wider font-bold">Check-In</th>
                  <th className="p-4 uppercase tracking-wider font-bold">Check-Out</th>
                  <th className="p-4 uppercase tracking-wider font-bold">Duration</th>
                  <th className="p-4 uppercase tracking-wider font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                {myDeliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400">
                      No deliveries recorded for Flat {residentFlat?.flatNumber}.
                    </td>
                  </tr>
                ) : (
                  myDeliveries.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{item.companyName}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-bold">{item.deliveryPersonName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.deliveryPersonPhone}</p>
                        </div>
                      </td>
                      <td className="p-4 font-mono">
                        {item.entryTime ? new Date(item.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                      </td>
                      <td className="p-4 font-mono">
                        {item.exitTime ? new Date(item.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                      </td>
                      <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {item.duration ? `${item.duration} min` : item.status === 'CHECKED_IN' ? 'In Society' : '--'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                          item.status === 'APPROVED' || item.status === 'ALLOW_DIRECT_ENTRY' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          item.status === 'REJECTED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' :
                          item.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 animate-pulse' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- ADD EXPECTED MODAL --- */}
      {showAddExpectedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowAddExpectedModal(false)} />
          
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl z-10">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">Pre-approve Upcoming Delivery</h3>
              <button onClick={() => setShowAddExpectedModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddExpected} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400">Delivery Company</label>
                <select
                  value={expectedCompany}
                  onChange={(e) => setExpectedCompany(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Select Company --</option>
                  {PREDEFINED_DELIVERIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Expected Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Expected Window (Time)</label>
                  <input
                    type="time"
                    value={expectedTime}
                    onChange={(e) => setExpectedTime(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400">Tracking Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. FMPP1293818"
                  value={expectedTracking}
                  onChange={(e) => setExpectedTracking(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-xs font-bold mt-4 cursor-pointer"
              >
                Issue Pre-approved Gate Pass
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 3. ADMIN VIEW COMPONENT
// ==========================================
interface AdminViewProps {
  deliveries: DeliveryLog[];
  blacklist: BlacklistedDeliveryPerson[];
  currentSocietyId: string;
  currentUser: any;
  residents: any[];
}

const AdminView: React.FC<AdminViewProps> = ({
  deliveries, blacklist, currentSocietyId, currentUser, residents
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'blacklist' | 'analytics'>('logs');
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  
  // Blacklist Creation form state
  const [showAddBlacklistModal, setShowAddBlacklistModal] = useState(false);
  const [blacklistName, setBlacklistName] = useState('');
  const [blacklistPhone, setBlacklistPhone] = useState('');
  const [blacklistCompany, setBlacklistCompany] = useState('');
  const [blacklistReason, setBlacklistReason] = useState('');

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blacklistName || !blacklistPhone || !blacklistCompany || !blacklistReason) {
      alert('Please fill out all fields.');
      return;
    }

    const newItem: BlacklistedDeliveryPerson = {
      name: blacklistName,
      phone: blacklistPhone,
      company: blacklistCompany,
      reason: blacklistReason,
      blacklistedBy: currentUser.displayName.replace(' (Society Admin)', ''),
      createdAt: new Date().toISOString()
    };

    deliveryService.addToBlacklist(newItem);
    
    // Reset Form
    setBlacklistName('');
    setBlacklistPhone('');
    setBlacklistCompany('');
    setBlacklistReason('');
    setShowAddBlacklistModal(false);
    alert(`🚨 Delivery Person ${blacklistName} is now BLACKLISTED in this society!`);
  };

  const handleRemoveBlacklist = (phone: string) => {
    if (confirm('Are you sure you want to restore access and remove this person from the blacklist?')) {
      deliveryService.removeFromBlacklist(phone);
    }
  };

  // Quick Action: blacklist straight from active delivery card
  const handleQuickBlacklist = (log: DeliveryLog) => {
    const reason = prompt(`Enter reason for blacklisting ${log.deliveryPersonName} (${log.companyName}):`);
    if (reason === null) return; // cancelled
    if (!reason.trim()) {
      alert('Reason is mandatory to blacklist a carrier.');
      return;
    }

    const newItem: BlacklistedDeliveryPerson = {
      name: log.deliveryPersonName,
      phone: log.deliveryPersonPhone,
      company: log.companyName,
      reason,
      blacklistedBy: currentUser.displayName.replace(' (Society Admin)', ''),
      createdAt: new Date().toISOString()
    };

    deliveryService.addToBlacklist(newItem);
    alert(`🚨 ${log.deliveryPersonName} has been blacklisted successfully!`);
  };

  // Filter logs logic
  const filteredLogs = deliveries.filter(item => {
    const matchesCompany = companyFilter === 'ALL' || item.companyName === companyFilter;
    
    const matchesSearch = 
      item.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deliveryPersonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deliveryPersonPhone.includes(searchQuery) ||
      item.flatNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.residentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.trackingNumber && item.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCompany && matchesSearch;
  });

  // Export mock report helper
  const handleExportCSV = () => {
    const headers = 'ID,Company,Carrier Name,Phone,Flat,Resident,Status,CheckIn,CheckOut\n';
    const rows = filteredLogs.map(l => (
      `"${l.id}","${l.companyName}","${l.deliveryPersonName}","${l.deliveryPersonPhone}","${l.flatNumber}","${l.residentName}","${l.status}","${l.entryTime || ''}","${l.exitTime || ''}"`
    )).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `omnigate_delivery_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute stats/analytics for Recharts custom graphics
  const computeCompanyShare = () => {
    const counts: { [key: string]: number } = {};
    deliveries.forEach(d => {
      counts[d.companyName] = (counts[d.companyName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const computeHourlyPeak = () => {
    const hourlyDistribution = Array(24).fill(0);
    deliveries.forEach(d => {
      if (d.entryTime) {
        const hour = new Date(d.entryTime).getHours();
        hourlyDistribution[hour]++;
      }
    });
    return hourlyDistribution.map((count, hour) => ({
      hour: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`,
      count
    })).filter(item => item.count > 0 || ['10 AM', '1 PM', '4 PM', '7 PM', '9 PM'].includes(item.hour));
  };

  const hourlyPeaks = computeHourlyPeak();
  const companyShares = computeCompanyShare();
  const totalDeliveriesCount = deliveries.length;
  const activeCurrentlyInSociety = deliveries.filter(d => d.status === 'CHECKED_IN').length;
  const averageCompletionDuration = Math.round(
    deliveries.filter(d => d.duration).reduce((acc, curr) => acc + (curr.duration || 0), 0) / 
    (deliveries.filter(d => d.duration).length || 1)
  ) || 24;

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-2xl">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-sans">Delivery Controller</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Society Admin delivery metrics, blacklists, and historical tracking</p>
          </div>
        </div>

        {/* Console view tabs */}
        <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-950/40 rounded-2xl border border-slate-200/50 dark:border-slate-850">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
              activeTab === 'logs' 
                ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Gate Logs
          </button>
          <button
            onClick={() => setActiveTab('blacklist')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
              activeTab === 'blacklist' 
                ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Blacklist Control ({blacklist.length})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer font-sans ${
              activeTab === 'analytics' 
                ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            Analytics Suite
          </button>
        </div>
      </div>

      {/* TAB 1: ALL GATE LOGS */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Filters & Export row */}
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 dark:bg-slate-950/30 p-3.5 rounded-2xl border border-slate-150 dark:border-slate-900">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search carrier, flat, tracking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-900 dark:text-white font-sans"
                />
              </div>

              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-700 dark:text-slate-350 font-sans"
              >
                <option value="ALL">All Companies</option>
                {PREDEFINED_DELIVERIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportCSV}
              className="w-full md:w-auto px-4.5 py-2 bg-indigo-650 hover:bg-indigo-750 dark:bg-indigo-600 dark:hover:bg-indigo-650 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer font-sans"
            >
              <Download className="w-4 h-4" /> Export Gate Logs (.CSV)
            </button>
          </div>

          {/* Grid of details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLogs.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400">
                <Truck className="w-12 h-12 mx-auto stroke-1 mb-2" />
                <p className="font-sans text-sm font-medium">No deliveries found matching filters</p>
              </div>
            ) : (
              filteredLogs.map((item) => {
                const isBlacklisted = blacklist.some(b => b.phone === item.deliveryPersonPhone);
                return (
                  <div key={item.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl flex flex-col justify-between space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <img src={item.photoURL} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white font-sans">{item.companyName}</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Flat {item.flatNumber} • Resident {item.residentName}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                        item.status === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl space-y-2 text-xs text-slate-600 dark:text-slate-350 font-sans">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Carrier Partner:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.deliveryPersonName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contact Phone:</span>
                        <span className="font-bold font-mono">{item.deliveryPersonPhone}</span>
                      </div>
                      {item.vehicleNumber && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Vehicle:</span>
                          <span className="font-mono">{item.vehicleNumber}</span>
                        </div>
                      )}
                      {item.entryTime && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Arrived:</span>
                          <span className="font-mono">{new Date(item.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(item.entryTime).toLocaleDateString()})</span>
                        </div>
                      )}
                    </div>

                    {!isBlacklisted ? (
                      <button
                        onClick={() => handleQuickBlacklist(item)}
                        className="w-full py-2 border border-rose-200 hover:bg-rose-50 dark:border-rose-950/40 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Blacklist Partner
                      </button>
                    ) : (
                      <div className="w-full text-center py-2 bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-100 dark:border-rose-950/35 rounded-xl text-xs font-sans">
                        🚨 Already Blacklisted
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BLACKLIST MANAGER */}
      {activeTab === 'blacklist' && (
        <div className="space-y-6 font-sans">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-sans">Restricted Delivery Persons</h3>
              <p className="text-xs text-slate-500">Security guards are automatically alerted if blacklisted numbers attempt entry.</p>
            </div>
            <button
              onClick={() => setShowAddBlacklistModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" /> Restrict Delivery Person
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blacklist.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-slate-900 border rounded-3xl">
                <ShieldCheck className="w-12 h-12 mx-auto stroke-1 mb-2 text-indigo-400" />
                <p className="text-sm font-medium">No banned personnel listed</p>
                <p className="text-xs">All active carrier agents are allowed standard gate entry verification.</p>
              </div>
            ) : (
              blacklist.map((item) => (
                <div key={item.phone} className="bg-white dark:bg-slate-900 border border-rose-150 dark:border-rose-950/60 p-5 rounded-3xl flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center font-bold text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-5.5 h-5.5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Carrier: {item.company}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-bold font-mono">
                      BANNED
                    </span>
                  </div>

                  <div className="bg-rose-50/20 dark:bg-rose-950/10 border border-rose-100/30 dark:border-rose-950/25 p-3.5 rounded-2xl space-y-2 text-xs">
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      <strong>Reason:</strong> {item.reason}
                    </p>
                    <div className="text-[10px] text-slate-400 border-t border-rose-100/30 pt-2 flex justify-between">
                      <span>Reported by: {item.blacklistedBy}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveBlacklist(item.phone)}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-150 dark:border-slate-700 cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" /> Restore Access Permit
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RICH ANALYTICS SUITE */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 font-sans">
          {/* Summary stats widgets (Banned "hero metric block" is avoided, we use standard clean cards instead) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Logged Deliveries</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-sans">{totalDeliveriesCount}</p>
                <p className="text-[10px] text-slate-500">Recorded within current database</p>
              </div>
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                <Truck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Currently In Society</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-sans">{activeCurrentlyInSociety}</p>
                <p className="text-[10px] text-slate-500">Active checked-in status</p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-3xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Avg Completion Time</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white font-sans">{averageCompletionDuration} min</p>
                <p className="text-[10px] text-slate-500">Check-in to check-out mean duration</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Peak Hours distribution custom render */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Peak Arrival Hours</h4>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">
                  HOURLY DENSITY
                </span>
              </div>
              
              <div className="h-64 flex items-end justify-between gap-1 pt-6 font-mono text-[9px] text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                {hourlyPeaks.map((item, idx) => {
                  const maxCount = Math.max(...hourlyPeaks.map(p => p.count), 1);
                  const barHeight = (item.count / maxCount) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{item.count}</div>
                      <div 
                        style={{ height: `${barHeight}%` }} 
                        className="w-full bg-indigo-550 dark:bg-indigo-500 rounded-t-md hover:bg-indigo-650 transition-all cursor-pointer relative group min-h-[4px]"
                      >
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-slate-950 text-white text-[9px] rounded px-1.5 py-1 hidden group-hover:block whitespace-nowrap z-20">
                          {item.count} arrivals at {item.hour}
                        </div>
                      </div>
                      <div className="text-[8px] transform -rotate-45 origin-top mt-1">{item.hour.split(' ')[0]}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 2: Company-wise distribution shares */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Company-wise Arrivals</h4>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">
                  PARTNER SHARE
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4 h-60">
                {/* Visual Circle Meter */}
                <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="56" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" fill="transparent" />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="56" 
                      className="stroke-indigo-600 dark:stroke-indigo-400" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray="351.8" 
                      strokeDashoffset="80" 
                    />
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="56" 
                      className="stroke-emerald-500" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray="351.8" 
                      strokeDashoffset="240" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{totalDeliveriesCount}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Logs</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="flex-1 space-y-2.5 w-full">
                  {companyShares.slice(0, 5).map((item, index) => {
                    const percent = Math.round((item.value / totalDeliveriesCount) * 100) || 0;
                    const colors = ['bg-indigo-550', 'bg-emerald-550', 'bg-amber-550', 'bg-rose-550', 'bg-purple-550'];
                    return (
                      <div key={item.name} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                            {item.name}
                          </span>
                          <span className="font-bold font-mono">{percent}% ({item.value})</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div style={{ width: `${percent}%` }} className={`h-full ${colors[index % colors.length]}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD TO BLACKLIST MODAL --- */}
      {showAddBlacklistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setShowAddBlacklistModal(false)} />
          
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl z-10">
            <div className="flex justify-between items-center pb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">Blacklist Carrier Agent</h3>
              <button onClick={() => setShowAddBlacklistModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddBlacklist} className="space-y-4 font-sans text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400">Carrier Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mohit Sharma"
                  value={blacklistName}
                  onChange={(e) => setBlacklistName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Mobile Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 99999 88888"
                    value={blacklistPhone}
                    onChange={(e) => setBlacklistPhone(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400">Delivery Company</label>
                  <select
                    value={blacklistCompany}
                    onChange={(e) => setBlacklistCompany(e.target.value)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Select Company --</option>
                    {PREDEFINED_DELIVERIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400">Reason for Ban</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Indulged in misconduct and verbal abuse with gate security officers."
                  value={blacklistReason}
                  onChange={(e) => setBlacklistReason(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold mt-4 cursor-pointer"
              >
                Restrict Access Instantly
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
