/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { societyService, Society, TowerBlock, Flat, Resident, FamilyMember, ResidentVehicle } from '../../services/societyService';
import { userService } from '../../services/userService';
import { complaintService, Complaint } from '../../services/complaintService';
import { noticeService, Notice } from '../../services/noticeService';
import { maintenanceService, MaintenanceRecord } from '../../services/maintenanceService';
import { UserRole, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Users, Home, Search, Plus, Edit2, Trash2, Shield, Phone, 
  MapPin, Mail, Landmark, PhoneCall, AlertCircle, CheckCircle, X, 
  UserPlus, Car, ArrowLeft, Eye, ShieldAlert, BadgeInfo, Check, UserCheck,
  Receipt, Bell, ShieldCheck, Clock, FileText, Wrench
} from 'lucide-react';

interface SocietyAdminDashboardProps {
  currentUser: {
    uid: string;
    displayName: string;
    role: string;
    email: string;
  };
  currentSocietyId: string;
  onSocietyChange?: (id: string) => void;
  activeTab?: string;
}

export const SocietyAdminDashboard: React.FC<SocietyAdminDashboardProps> = ({ 
  currentUser, 
  currentSocietyId,
  onSocietyChange,
  activeTab: propActiveTab 
}) => {
  // Navigation tabs
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const [activeTab, setActiveTab] = useState<'stats' | 'societies' | 'towers' | 'flats' | 'residents' | 'guards' | 'staff' | 'shifts' | 'complaints' | 'notices' | 'maintenance' | 'search'>(
    isSuperAdmin ? 'societies' : 'stats'
  );

  // Sync prop activeTab with internal activeTab
  useEffect(() => {
    if (propActiveTab) {
      if (propActiveTab === 'society_dashboard') setActiveTab('stats');
      else if (propActiveTab === 'society_residents') setActiveTab('residents');
      else if (propActiveTab === 'society_guards') setActiveTab('guards');
      else if (propActiveTab === 'society_staff') setActiveTab('staff');
      else if (propActiveTab === 'society_shifts') setActiveTab('shifts');
      else if (propActiveTab === 'society_complaints') setActiveTab('complaints');
      else if (propActiveTab === 'society_notices') setActiveTab('notices');
      else if (propActiveTab === 'society_maintenance') setActiveTab('maintenance');
      else if (propActiveTab === 'super_admin_societies') setActiveTab('societies');
    }
  }, [propActiveTab]);

  // Real-time Lists for Security Guards, Staff, Complaints, Notices, Maintenance
  const [guardsList, setGuardsList] = useState<UserProfile[]>([]);
  const [staffList, setStaffList] = useState<UserProfile[]>([]);
  const [complaintsList, setComplaintsList] = useState<Complaint[]>([]);
  const [noticesList, setNoticesList] = useState<Notice[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<MaintenanceRecord[]>([]);

  // Guard Form Modal State
  const [guardModalOpen, setGuardModalOpen] = useState(false);
  const [guardName, setGuardName] = useState('');
  const [guardMobile, setGuardMobile] = useState('');
  const [guardEmail, setGuardEmail] = useState('');
  const [guardShift, setGuardShift] = useState('Day Shift (08:00 AM - 08:00 PM)');

  // Staff Form Modal State
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Maintenance Electrician');
  const [staffMobile, setStaffMobile] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffShift, setStaffShift] = useState('General Shift (09:00 AM - 06:00 PM)');
  const [staffNotes, setStaffNotes] = useState('');

  // Society Admin Add User Modal State
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.RESIDENT);

  // Shift Master Registry State
  interface ShiftMasterItem {
    id: string;
    name: string;
    category: 'GUARDS' | 'STAFF' | 'COMMON';
    startTime: string;
    endTime: string;
    duration: string;
    graceMinutes: number;
    description: string;
  }

  const [shiftMasters, setShiftMasters] = useState<ShiftMasterItem[]>([
    {
      id: 'sm_1',
      name: 'Day Shift (08:00 AM - 08:00 PM)',
      category: 'GUARDS',
      startTime: '08:00 AM',
      endTime: '08:00 PM',
      duration: '12 Hours',
      graceMinutes: 15,
      description: 'Primary gatekeeper day shift for main gate entry, visitor verification, & delivery scanning.',
    },
    {
      id: 'sm_2',
      name: 'Night Shift (08:00 PM - 08:00 AM)',
      category: 'GUARDS',
      startTime: '08:00 PM',
      endTime: '08:00 AM',
      duration: '12 Hours',
      graceMinutes: 15,
      description: 'Night patrol, gate lockdown, perimeter surveillance, & emergency dispatch.',
    },
    {
      id: 'sm_3',
      name: 'General Shift (09:00 AM - 06:00 PM)',
      category: 'STAFF',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      duration: '9 Hours',
      graceMinutes: 30,
      description: 'Standard office hours for electricians, plumbers, facility managers, & admin personnel.',
    },
    {
      id: 'sm_4',
      name: 'Morning Shift (07:00 AM - 03:00 PM)',
      category: 'STAFF',
      startTime: '07:00 AM',
      endTime: '03:00 PM',
      duration: '8 Hours',
      graceMinutes: 15,
      description: 'Early morning housekeeping, waste collection, & elevator check.',
    },
    {
      id: 'sm_5',
      name: 'Evening Shift (02:00 PM - 10:00 PM)',
      category: 'STAFF',
      startTime: '02:00 PM',
      endTime: '10:00 PM',
      duration: '8 Hours',
      graceMinutes: 15,
      description: 'Late afternoon facility maintenance, clubhouse monitoring, & lighting checks.',
    },
    {
      id: 'sm_6',
      name: 'Emergency 24x7 On-Call',
      category: 'COMMON',
      startTime: '12:00 AM',
      endTime: '11:59 PM',
      duration: '24 Hours',
      graceMinutes: 0,
      description: 'Rotational on-call duty for emergency plumbing, electrical, and elevator breakdown.',
    },
  ]);

  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftCategory, setNewShiftCategory] = useState<'GUARDS' | 'STAFF' | 'COMMON'>('GUARDS');
  const [newShiftStart, setNewShiftStart] = useState('09:00 AM');
  const [newShiftEnd, setNewShiftEnd] = useState('05:00 PM');
  const [newShiftGrace, setNewShiftGrace] = useState(15);
  const [newShiftDesc, setNewShiftDesc] = useState('');
  const [editingPersonnel, setEditingPersonnel] = useState<{ uid: string; name: string; role: string; currentShift: string } | null>(null);

  // Notice Form Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<'GENERAL' | 'MAINTENANCE' | 'EVENT' | 'EMERGENCY' | 'MEETING'>('GENERAL');

  // Maintenance Bill Form Modal State
  const [maintModalOpen, setMaintModalOpen] = useState(false);
  const [maintFlatId, setMaintFlatId] = useState('');
  const [maintAmount, setMaintAmount] = useState(2500);
  const [maintMonth, setMaintMonth] = useState('July');

  // Core records state
  const [societies, setSocieties] = useState<Society[]>([]);
  const [towers, setTowers] = useState<TowerBlock[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  
  // Feedback alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Dropdown selection state for filtering
  const [filterTowerId, setFilterTowerId] = useState('');
  const [filterFloor, setFilterFloor] = useState('');

  // Global Search Query
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    residents: Resident[];
    flats: Flat[];
    vehicles: { vehicle: ResidentVehicle; residentName: string; flatNumber: string }[];
    towers: TowerBlock[];
  }>({ residents: [], flats: [], vehicles: [], towers: [] });

  // Add/Edit Modals / Forms Active state
  const [activeModal, setActiveModal] = useState<'society' | 'tower' | 'flat' | 'resident' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  // Form states: Society
  const [socName, setSocName] = useState('');
  const [socLogo, setSocLogo] = useState('');
  const [socRegNum, setSocRegNum] = useState('');
  const [socAddress, setSocAddress] = useState('');
  const [socCity, setSocCity] = useState('');
  const [socState, setSocState] = useState('');
  const [socCountry, setSocCountry] = useState('India');
  const [socPin, setSocPin] = useState('');
  const [socContact, setSocContact] = useState('');
  const [socEmail, setSocEmail] = useState('');
  const [socStatus, setSocStatus] = useState<'Active' | 'Inactive' | 'Suspended'>('Active');
  const [socEmergency, setSocEmergency] = useState<{ name: string; phone: string }[]>([
    { name: 'Security Gate', phone: '' },
    { name: 'Maintenance Office', phone: '' }
  ]);

  // Form states: Tower
  const [towName, setTowName] = useState('');
  const [towFloors, setTowFloors] = useState(4);
  const [towStatus, setTowStatus] = useState<'Active' | 'Under Maintenance'>('Active');

  // Form states: Flat
  const [flatNumber, setFlatNumber] = useState('');
  const [flatTowerId, setFlatTowerId] = useState('');
  const [flatFloor, setFlatFloor] = useState(1);
  const [flatOwnerName, setFlatOwnerName] = useState('');
  const [flatTenantName, setFlatTenantName] = useState('');
  const [flatStatus, setFlatStatus] = useState<'Occupied' | 'Vacant' | 'Under Renovation' | 'Locked'>('Vacant');
  const [flatArea, setFlatArea] = useState(1200);
  const [flatParking, setFlatParking] = useState('');

  // Form states: Resident Profile
  const [resName, setResName] = useState('');
  const [resPhoto, setResPhoto] = useState('');
  const [resMobile, setResMobile] = useState('');
  const [resEmail, setResEmail] = useState('');
  const [resType, setResType] = useState<'Owner' | 'Tenant'>('Owner');
  const [resFlatId, setResFlatId] = useState('');
  const [resMoveIn, setResMoveIn] = useState(new Date().toISOString().split('T')[0]);
  const [resMoveOut, setResMoveOut] = useState('');
  const [resEmergencyContact, setResEmergencyContact] = useState('');
  const [resOccupation, setResOccupation] = useState('');
  const [resDob, setResDob] = useState('');
  const [resGender, setResGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [resStatus, setResStatus] = useState<'Active' | 'Pending' | 'Inactive'>('Active');
  
  // Nested lists for Resident Form
  const [resFamily, setResFamily] = useState<FamilyMember[]>([]);
  const [resVehicles, setResVehicles] = useState<ResidentVehicle[]>([]);

  // Family and Vehicle temporary inputs
  const [tempFamName, setTempFamName] = useState('');
  const [tempFamRel, setTempFamRel] = useState('');
  const [tempFamPhone, setTempFamPhone] = useState('');

  const [tempVehType, setTempVehType] = useState<'2-Wheeler' | '4-Wheeler'>('4-Wheeler');
  const [tempVehBrand, setTempVehBrand] = useState('');
  const [tempVehNum, setTempVehNum] = useState('');
  const [tempVehSlot, setTempVehSlot] = useState('');

  // Fetch / Sync core data
  useEffect(() => {
    const loadAllData = () => {
      setSocieties(societyService.getSocieties());
      setTowers(societyService.getTowers(currentSocietyId));
      setFlats(societyService.getFlats(currentSocietyId));
      setResidents(societyService.getResidents(currentSocietyId));
    };

    loadAllData();
    // Live update listeners
    const unsubscribeSocieties = societyService.subscribe(loadAllData);
    const unsubUsers = userService.subscribeUsersBySociety(currentSocietyId, (users) => {
      setGuardsList(users.filter(u => u.role === UserRole.SECURITY_GUARD));
      setStaffList(users.filter(u => u.role === UserRole.STAFF));
    });
    const unsubComplaints = complaintService.subscribeComplaints(currentSocietyId, setComplaintsList);
    const unsubNotices = noticeService.subscribeNotices(currentSocietyId, setNoticesList);
    const unsubMaint = maintenanceService.subscribeMaintenanceRecords(currentSocietyId, setMaintenanceList);

    return () => {
      unsubscribeSocieties();
      unsubUsers();
      unsubComplaints();
      unsubNotices();
      unsubMaint();
    };
  }, [currentSocietyId]);

  // Trigger search on query update
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ residents: [], flats: [], vehicles: [], towers: [] });
      return;
    }
    const results = societyService.globalSearch(currentSocietyId, searchQuery);
    setSearchResults(results);
  }, [searchQuery, currentSocietyId]);

  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(''), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Switch Active Society (Super Admin function)
  const handleSelectSociety = (id: string) => {
    if (onSocietyChange) {
      onSocietyChange(id);
      triggerToast(`Switched active society dashboard context successfully.`);
    }
  };

  // Delete Handlers
  const handleDeleteSociety = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this society? All towers, flats, and residents will be lost.')) {
      societyService.deleteSociety(id);
      triggerToast('Society deleted successfully!');
    }
  };

  const handleDeleteTower = (id: string) => {
    if (window.confirm('Are you sure you want to delete this Tower block?')) {
      societyService.deleteTower(currentSocietyId, id);
      triggerToast('Tower deleted successfully!');
    }
  };

  const handleDeleteFlat = (id: string) => {
    if (window.confirm('Are you sure you want to delete this flat?')) {
      societyService.deleteFlat(id, currentSocietyId);
      triggerToast('Flat deleted successfully!');
    }
  };

  const handleDeleteResident = (id: string) => {
    if (window.confirm('Are you sure you want to delete this resident profile?')) {
      societyService.deleteResident(id, currentSocietyId);
      triggerToast('Resident profile removed.');
    }
  };

  // Submit Handlers
  const handleSocietySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socName || !socRegNum || !socCity) {
      triggerToast('Please fill out essential society credentials.', true);
      return;
    }

    const socData = {
      name: socName,
      logo: socLogo || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=150&h=150&q=80',
      registrationNumber: socRegNum,
      address: socAddress,
      city: socCity,
      state: socState,
      country: socCountry,
      zipCode: socPin,
      contactPhone: socContact,
      contactEmail: socEmail,
      emergencyContacts: socEmergency.filter(c => c.name && c.phone),
      status: (socStatus.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'PENDING') || 'ACTIVE',
      totalBlocks: 0,
      totalFlats: 0,
      subscriptionPlan: 'free' as const
    };

    if (editId) {
      societyService.updateSociety(editId, socData);
      triggerToast('Society updated successfully!');
    } else {
      societyService.addSociety(socData);
      triggerToast('New Society provisioned successfully!');
    }

    resetSocietyForm();
  };

  const handleTowerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!towName) {
      triggerToast('Tower designation name is required.', true);
      return;
    }

    // Check unique tower name
    const existing = towers.find(t => t.name.toLowerCase() === towName.toLowerCase() && t.id !== editId);
    if (existing) {
      triggerToast(`Tower Block "${towName}" already exists in this society.`, true);
      return;
    }

    const statusVal = towStatus === 'Active' ? 'ACTIVE' : 'INACTIVE';

    if (editId) {
      const currentTower = towers.find(t => t.id === editId);
      if (currentTower) {
        societyService.updateTower(currentSocietyId, editId, {
          name: towName,
          status: statusVal
        });
        triggerToast('Tower configuration updated.');
      }
    } else {
      societyService.addTower(currentSocietyId, {
        name: towName,
        code: towName.split(' ')[0] || 'T',
        totalFloors: towFloors,
        status: statusVal
      });
      triggerToast('Tower block and floors registered successfully!');
    }

    resetTowerForm();
  };

  const handleFlatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flatNumber || !flatTowerId || !flatFloor) {
      triggerToast('Please map Tower, Floor, and Flat Number.', true);
      return;
    }

    try {
      const mappedStatus = flatStatus === 'Occupied'
        ? 'occupied' as const
        : flatStatus === 'Vacant'
          ? 'vacant' as const
          : 'under_maintenance' as const;

      const flatData = {
        flatNumber,
        blockId: flatTowerId,
        floor: Number(flatFloor),
        ownerName: flatOwnerName || undefined,
        tenantName: flatTenantName || undefined,
        status: mappedStatus,
        area: Number(flatArea),
        parkingSlot: flatParking || undefined
      };

      const res = await (editId
        ? societyService.updateFlat(editId, flatData)
        : societyService.addFlat(currentSocietyId, flatData));

      if (!res.success) {
        triggerToast(res.error || 'Failed to save flat details.', true);
        return;
      }

      triggerToast(editId ? 'Flat specifications updated.' : 'Flat registered successfully in Tower.');
      resetFlatForm();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  const handleResidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName || !resMobile || !resFlatId) {
      triggerToast('Resident name, mobile number, and flat Unit are required.', true);
      return;
    }

    try {
      const residentData = {
        name: resName,
        photoURL: resPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
        mobile: resMobile,
        email: resEmail,
        residentType: resType.toUpperCase() as 'OWNER' | 'TENANT',
        flatId: resFlatId,
        moveInDate: resMoveIn,
        moveOutDate: resMoveOut || undefined,
        emergencyContact: resEmergencyContact || '',
        occupation: resOccupation || undefined,
        dob: resDob || undefined,
        gender: resGender,
        status: (resStatus.toUpperCase() as 'ACTIVE' | 'INACTIVE') || 'ACTIVE',
        familyMembers: resFamily,
        vehicles: resVehicles
      };

      const res = await (editId
        ? societyService.updateResident(editId, residentData)
        : societyService.addResident(currentSocietyId, residentData));

      if (!res.success) {
        triggerToast(res.error || 'Failed to register resident.', true);
        return;
      }

      // Sync user profile into Firestore users collection for login authorization
      const cleanMobile = resMobile.replace(/\s/g, '');
      const cleanEmail = resEmail.trim() || `res.${cleanMobile.replace(/\D/g, '')}@society.internal`;
      const userUid = 'usr_res_' + (cleanMobile ? cleanMobile.replace(/\D/g, '') : Math.random().toString(36).substring(2, 9));

      await userService.createUserProfile({
        uid: userUid,
        displayName: resName,
        email: cleanEmail,
        phoneNumber: cleanMobile,
        photoURL: resPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
        role: UserRole.RESIDENT,
        societyId: currentSocietyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: resStatus === 'Active',
      });

      triggerToast(editId ? `Resident profile "${resName}" updated and synced.` : `Resident "${resName}" registered and login profile synced successfully!`);
      resetResidentForm();
    } catch (err: any) {
      triggerToast(err.message, true);
    }
  };

  // Guard Submit Handler
  const handleGuardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardName || !guardMobile) {
      triggerToast('Guard full name and mobile phone number are required.', true);
      return;
    }

    try {
      const cleanPhone = guardMobile.replace(/\s/g, '');
      const cleanEmail = guardEmail.trim() || `guard.${cleanPhone.replace(/\D/g, '')}@society.internal`;
      const userUid = 'usr_guard_' + cleanPhone.replace(/\D/g, '');

      await userService.createUserProfile({
        uid: userUid,
        displayName: guardName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        role: UserRole.SECURITY_GUARD,
        societyId: currentSocietyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      });

      triggerToast(`Security Guard "${guardName}" registered! Authorized for mobile login: ${cleanPhone}`);
      setGuardModalOpen(false);
      setGuardName('');
      setGuardMobile('');
      setGuardEmail('');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to add security guard.', true);
    }
  };

  // Staff Submit Handler
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffMobile) {
      triggerToast('Staff member full name and mobile phone number are required.', true);
      return;
    }

    try {
      const cleanPhone = staffMobile.replace(/\s/g, '');
      const cleanEmail = staffEmail.trim() || `staff.${cleanPhone.replace(/\D/g, '')}@society.internal`;
      const userUid = 'usr_staff_' + cleanPhone.replace(/\D/g, '');

      await userService.createUserProfile({
        uid: userUid,
        displayName: `${staffName} (${staffRole})`,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        photoURL: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=150&h=150&q=80',
        role: UserRole.STAFF,
        societyId: currentSocietyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      });

      triggerToast(`Staff Member "${staffName}" (${staffRole}) registered! Authorized for mobile login: ${cleanPhone}`);
      setStaffModalOpen(false);
      setStaffName('');
      setStaffMobile('');
      setStaffEmail('');
      setStaffRole('Maintenance Electrician');
      setStaffShift('General Shift (09:00 AM - 06:00 PM)');
      setStaffNotes('');
    } catch (err: any) {
      triggerToast(err.message || 'Failed to add staff member.', true);
    }
  };

  // Add User Handler (Society Admin scoped)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      triggerToast('Full name and email address are required.', true);
      return;
    }

    try {
      const cleanEmail = newUserEmail.trim().toLowerCase();
      const userUid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

      await userService.createUserProfile({
        uid: userUid,
        displayName: newUserName,
        email: cleanEmail,
        phoneNumber: newUserPhone || '',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
        role: newUserRole,
        societyId: currentSocietyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        password: newUserPassword || 'password123',
      });

      triggerToast(`New ${newUserRole.replace('_', ' ')} "${newUserName}" registered to society successfully!`);
      setAddUserModalOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserPhone('');
      setNewUserRole(UserRole.RESIDENT);
    } catch (err: any) {
      triggerToast(err.message || 'Failed to create user profile.', true);
    }
  };

  // Toggle user active status
  const handleToggleUserStatus = async (uid: string, newActiveState: boolean) => {
    try {
      await userService.updateUserProfile(uid, { isActive: newActiveState });
      triggerToast(`User account status updated to ${newActiveState ? 'ACTIVE' : 'INACTIVE'}.`);
    } catch (err: any) {
      triggerToast('Failed to update status.', true);
    }
  };

  // Delete Guard user
  const handleDeleteGuardUser = async (uid: string) => {
    if (window.confirm('Are you sure you want to revoke this Security Guard access?')) {
      await userService.deleteUserProfile(uid);
      triggerToast('Security Guard access revoked.');
    }
  };

  // Notice Submit Handler
  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) {
      triggerToast('Notice title and content are required.', true);
      return;
    }

    try {
      await noticeService.addNotice({
        societyId: currentSocietyId,
        title: noticeTitle,
        content: noticeContent,
        category: noticeCategory,
        createdBy: currentUser.uid,
        creatorName: currentUser.displayName || 'Society Admin',
        targetRoles: ['RESIDENT', 'SECURITY_GUARD', 'STAFF'],
        isPinned: false
      });

      triggerToast('New announcement posted to society notice board!');
      setNoticeModalOpen(false);
      setNoticeTitle('');
      setNoticeContent('');
    } catch (err: any) {
      triggerToast('Failed to post notice.', true);
    }
  };

  // Maintenance Submit Handler
  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintFlatId || !maintAmount) {
      triggerToast('Please select a Flat Unit and specify bill amount.', true);
      return;
    }

    const flat = flats.find(f => f.id === maintFlatId);
    const flatNum = flat ? flat.flatNumber : 'Unit';

    try {
      await maintenanceService.addMaintenanceRecord({
        societyId: currentSocietyId,
        flatId: maintFlatId,
        flatNumber: flatNum,
        residentName: flat?.ownerName || flat?.tenantName || 'Resident',
        amount: Number(maintAmount),
        dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        month: maintMonth,
        year: 2026
      });

      triggerToast(`Maintenance bill of ₹${maintAmount} generated for Flat ${flatNum}!`);
      setMaintModalOpen(false);
    } catch (err: any) {
      triggerToast('Failed to generate maintenance bill.', true);
    }
  };

  // Temporary item helpers for Resident Form
  const addFamilyMember = () => {
    if (!tempFamName || !tempFamRel) {
      triggerToast('Please provide family member name and relationship.', true);
      return;
    }
    const newMember: FamilyMember = {
      id: 'fam_' + Math.random().toString(36).substr(2, 9),
      name: tempFamName,
      relationship: tempFamRel,
      mobile: tempFamPhone || '',
      email: '',
      emergencyContact: ''
    };
    setResFamily([...resFamily, newMember]);
    setTempFamName('');
    setTempFamRel('');
    setTempFamPhone('');
  };

  const removeFamilyMember = (index: number) => {
    setResFamily(resFamily.filter((_, idx) => idx !== index));
  };

  const addVehicle = () => {
    if (!tempVehNum) {
      triggerToast('Vehicle registration plate number is required.', true);
      return;
    }

    // Direct check for vehicle uniqueness
    const cleanNum = tempVehNum.toLowerCase().replace(/\s/g, '');
    const isDuplicate = residents.some(r => 
      (editId ? r.id !== editId : true) && 
      r.vehicles.some(v => v.vehicleNumber.toLowerCase().replace(/\s/g, '') === cleanNum)
    );
    if (isDuplicate) {
      triggerToast(`Vehicle number ${tempVehNum} is already registered in this society.`, true);
      return;
    }

    const typeVal = tempVehType === '2-Wheeler' ? 'TWO_WHEELER' as const : 'FOUR_WHEELER' as const;

    const newVeh: ResidentVehicle = {
      id: 'veh_' + Math.random().toString(36).substr(2, 9),
      type: typeVal,
      brand: tempVehBrand || 'General',
      color: 'N/A',
      vehicleNumber: tempVehNum.toUpperCase(),
      parkingSlot: tempVehSlot || undefined,
      stickerNumber: ''
    };

    setResVehicles([...resVehicles, newVeh]);
    setTempVehBrand('');
    setTempVehNum('');
    setTempVehSlot('');
  };

  const removeVehicle = (index: number) => {
    setResVehicles(resVehicles.filter((_, idx) => idx !== index));
  };

  // Reset Helpers
  const resetSocietyForm = () => {
    setEditId(null);
    setSocName('');
    setSocLogo('');
    setSocRegNum('');
    setSocAddress('');
    setSocCity('');
    setSocState('');
    setSocPin('');
    setSocContact('');
    setSocEmail('');
    setSocStatus('Active');
    setSocEmergency([
      { name: 'Security Gate', phone: '' },
      { name: 'Maintenance Office', phone: '' }
    ]);
    setActiveModal(null);
  };

  const resetTowerForm = () => {
    setEditId(null);
    setTowName('');
    setTowFloors(4);
    setTowStatus('Active');
    setActiveModal(null);
  };

  const resetFlatForm = () => {
    setEditId(null);
    setFlatNumber('');
    setFlatTowerId('');
    setFlatFloor(1);
    setFlatOwnerName('');
    setFlatTenantName('');
    setFlatStatus('Vacant');
    setFlatArea(1200);
    setFlatParking('');
    setActiveModal(null);
  };

  const resetResidentForm = () => {
    setEditId(null);
    setResName('');
    setResPhoto('');
    setResMobile('');
    setResEmail('');
    setResType('Owner');
    setResFlatId('');
    setResMoveIn(new Date().toISOString().split('T')[0]);
    setResMoveOut('');
    setResEmergencyContact('');
    setResOccupation('');
    setResDob('');
    setResGender('Male');
    setResStatus('Active');
    setResFamily([]);
    setResVehicles([]);
    setActiveModal(null);
  };

  // Launch Edit Modals
  const openEditSociety = (soc: Society) => {
    setEditId(soc.id);
    setSocName(soc.name);
    setSocLogo(soc.logo || '');
    setSocRegNum(soc.registrationNumber || '');
    setSocAddress(soc.address);
    setSocCity(soc.city);
    setSocState(soc.state);
    setSocPin(soc.zipCode);
    setSocContact(soc.contactPhone);
    setSocEmail(soc.contactEmail);
    setSocStatus(soc.status === 'ACTIVE' ? 'Active' : soc.status === 'INACTIVE' ? 'Inactive' : 'Suspended');
    setSocEmergency((soc.emergencyContacts && soc.emergencyContacts.length > 0) ? soc.emergencyContacts : [
      { name: 'Security Gate', phone: '' },
      { name: 'Maintenance Office', phone: '' }
    ]);
    setActiveModal('society');
  };

  const openEditTower = (tow: TowerBlock) => {
    setEditId(tow.id);
    setTowName(tow.name);
    setTowFloors(tow.totalFloors);
    setTowStatus(tow.status === 'ACTIVE' ? 'Active' : 'Under Maintenance');
    setActiveModal('tower');
  };

  const openEditFlat = (f: Flat) => {
    setEditId(f.id);
    setFlatNumber(f.flatNumber);
    setFlatTowerId(f.blockId);
    setFlatFloor(f.floor);
    setFlatOwnerName(f.ownerName || '');
    setFlatTenantName(f.tenantName || '');
    setFlatStatus(f.status === 'occupied' ? 'Occupied' : f.status === 'vacant' ? 'Vacant' : 'Under Renovation');
    setFlatArea(f.area || 1200);
    setFlatParking(f.parkingSlot || '');
    setActiveModal('flat');
  };

  const openEditResident = (r: Resident) => {
    setEditId(r.id);
    setResName(r.name);
    setResPhoto(r.photoURL || '');
    setResMobile(r.mobile);
    setResEmail(r.email);
    setResType(r.residentType === 'OWNER' ? 'Owner' : 'Tenant');
    setResFlatId(r.flatId);
    setResMoveIn(r.moveInDate || '');
    setResMoveOut(r.moveOutDate || '');
    setResEmergencyContact(r.emergencyContact || '');
    setResOccupation(r.occupation || '');
    setResDob(r.dob || '');
    setResGender(r.gender === 'Male' || r.gender === 'Female' || r.gender === 'Other' ? r.gender : 'Male');
    setResStatus(r.status === 'ACTIVE' ? 'Active' : 'Inactive');
    setResFamily(r.familyMembers || []);
    setResVehicles(r.vehicles || []);
    setActiveModal('resident');
  };

  // Helper selectors for Floor & Flat Cascades in search filter
  const selectedTowerObject = towers.find(t => t.id === filterTowerId);
  const filteredFlats = flats.filter(f => {
    if (filterTowerId && f.blockId !== filterTowerId) return false;
    if (filterFloor && String(f.floor) !== filterFloor) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Dynamic Alerts / Toast Feedbacks */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold text-xs rounded-2xl shadow-xl"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-red-600 text-white font-semibold text-xs rounded-2xl shadow-xl"
          >
            <AlertCircle className="w-4 h-4 animate-bounce" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Society Context Switching Switcher */}
      {isSuperAdmin && (
        <div className="bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-indigo-500" />
            <div>
              <p className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Super Admin Context</p>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">Active Society: {societies.find(s => s.id === currentSocietyId)?.name || 'None'}</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-mono">Switch Database Context:</label>
            <select
              value={currentSocietyId}
              onChange={(e) => handleSelectSociety(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-slate-700 dark:text-white"
            >
              {societies.map(soc => (
                <option key={soc.id} value={soc.id}>{soc.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Primary Category Switcher / Tabs Menu */}
      <div className="border-b border-slate-100 dark:border-slate-850 flex flex-wrap gap-2 pb-1.5 overflow-x-auto">
        {!isSuperAdmin && (
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'stats' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            📊 Analytics
          </button>
        )}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('societies')}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
              activeTab === 'societies' 
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            🌐 Societies Master
          </button>
        )}
        <button
          onClick={() => setActiveTab('towers')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'towers' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          🏢 Towers & Wings
        </button>
        <button
          onClick={() => setActiveTab('flats')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'flats' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          🚪 Units & Flats
        </button>
        <button
          onClick={() => setActiveTab('residents')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'residents' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          👥 Residents
        </button>
        <button
          onClick={() => setActiveTab('guards')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'guards' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          👮 Security Guards
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'staff' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          🛠️ Staff & Services
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'shifts' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          ⏰ Duty Shifts
        </button>
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'complaints' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          🎫 Helpdesk
        </button>
        <button
          onClick={() => setActiveTab('notices')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'notices' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          📢 Notice Board
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'maintenance' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          🧾 Maintenance
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer ${
            activeTab === 'search' 
              ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' 
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          🔍 Global Search
        </button>

        <button
          onClick={() => setAddUserModalOpen(true)}
          className="ml-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0 font-mono uppercase"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add User
        </button>
      </div>

      {/* Tab Area: 📊 STATS / ANALYTICS */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Towers</p>
                <h4 className="text-xl font-sans font-extrabold text-slate-900 dark:text-white">{towers.length}</h4>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                <Home className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Total Units</p>
                <h4 className="text-xl font-sans font-extrabold text-slate-900 dark:text-white">{flats.length}</h4>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Residents</p>
                <h4 className="text-xl font-sans font-extrabold text-slate-900 dark:text-white">{residents.length}</h4>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Registered Vehicles</p>
                <h4 className="text-xl font-sans font-extrabold text-slate-900 dark:text-white">
                  {residents.reduce((sum, res) => sum + (res.vehicles?.length || 0), 0)}
                </h4>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Occupancy Chart Representation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Unit Occupancy Ratio</h4>
                <p className="text-[11px] text-slate-400">Occupancy and vacants analysis</p>
              </div>

              {(() => {
                const total = flats.length || 1;
                const occupied = flats.filter(f => f.status === 'Occupied').length;
                const vacant = flats.filter(f => f.status === 'Vacant').length;
                const renovation = flats.filter(f => f.status === 'Under Renovation').length;
                const locked = flats.filter(f => f.status === 'Locked').length;

                const occupiedPct = Math.round((occupied / total) * 100);
                const vacantPct = Math.round((vacant / total) * 100);
                const renoPct = Math.round((renovation / total) * 100);
                const lockedPct = Math.round((locked / total) * 100);

                return (
                  <div className="space-y-4">
                    <div className="h-6 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                      <div style={{ width: `${occupiedPct}%` }} className="h-full bg-indigo-500" title={`Occupied: ${occupiedPct}%`} />
                      <div style={{ width: `${vacantPct}%` }} className="h-full bg-slate-300 dark:bg-slate-700" title={`Vacant: ${vacantPct}%`} />
                      <div style={{ width: `${renoPct}%` }} className="h-full bg-amber-500" title={`Renovating: ${renoPct}%`} />
                      <div style={{ width: `${lockedPct}%` }} className="h-full bg-rose-500" title={`Locked: ${lockedPct}%`} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-indigo-500 rounded-md" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{occupied}</p>
                          <p className="text-[10px] text-slate-400">Occupied ({occupiedPct}%)</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-slate-300 dark:bg-slate-700 rounded-md" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{vacant}</p>
                          <p className="text-[10px] text-slate-400">Vacant ({vacantPct}%)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-amber-500 rounded-md" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{renovation}</p>
                          <p className="text-[10px] text-slate-400">Renovating ({renoPct}%)</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 bg-rose-500 rounded-md" />
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">{locked}</p>
                          <p className="text-[10px] text-slate-400">Locked ({lockedPct}%)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Emergency Directory Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Emergency Contact Directory</h4>
                  <p className="text-[11px] text-slate-400">Society administrative & safety hotline numbers</p>
                </div>
                <PhoneCall className="w-4 h-4 text-red-500 animate-pulse" />
              </div>

              {(() => {
                const activeSoc = societies.find(s => s.id === currentSocietyId);
                const list = activeSoc?.emergencyContacts || [];
                if (list.length === 0) {
                  return <p className="text-xs text-slate-400 italic">No emergency contacts listed for this society.</p>;
                }
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {list.map((c, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-white">{c.name}</p>
                          <p className="font-mono text-[10px] text-red-600 dark:text-red-400 mt-0.5">{c.phone}</p>
                        </div>
                        <a href={`tel:${c.phone}`} className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 rounded-full transition-colors">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Tab Area: 🌐 SOCIETIES MASTER (Super Admin Only) */}
      {activeTab === 'societies' && isSuperAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Registered Societies Master</h3>
              <p className="text-xs text-slate-400">Create, monitor and configure global societies records</p>
            </div>
            
            <button
              onClick={() => { resetSocietyForm(); setActiveModal('society'); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Provision New Society
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {societies.map(soc => (
              <div 
                key={soc.id}
                className={`bg-white dark:bg-slate-900 border rounded-3xl p-6 transition-all space-y-4 ${
                  soc.id === currentSocietyId 
                    ? 'ring-2 ring-indigo-500 border-transparent shadow-xl' 
                    : 'border-slate-200 dark:border-slate-800 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4 items-center">
                    <img 
                      src={soc.logo} 
                      alt="" 
                      className="w-16 h-16 rounded-2xl border border-slate-100 dark:border-slate-800 object-cover bg-slate-50" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-sans font-extrabold text-slate-900 dark:text-white">{soc.name}</h4>
                        <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded-full uppercase ${
                          soc.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {soc.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Reg: {soc.registrationNumber}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {soc.city}, {soc.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleSelectSociety(soc.id)}
                      className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors cursor-pointer"
                      title="Activate Work Context"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => openEditSociety(soc)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-white rounded-xl transition-colors cursor-pointer"
                      title="Edit Specifications"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSociety(soc.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer"
                      title="Deprecate Society"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-850 text-xs">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Central Email</span>
                    <span className="text-slate-700 dark:text-slate-300 truncate block font-sans">{soc.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Office Hotline</span>
                    <span className="text-slate-700 dark:text-slate-300 block font-mono">{soc.contactNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Area: 🏢 TOWERS & WINGS CONFIG */}
      {activeTab === 'towers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Towers & Wings Catalog</h3>
              <p className="text-xs text-slate-400">Configure tower blocks and automatically provision floors</p>
            </div>
            
            <button
              onClick={() => { resetTowerForm(); setActiveModal('tower'); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Provision New Tower
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {towers.map(tow => (
              <div key={tow.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Tower {tow.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">{tow.floors.length} Floors Configured</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditTower(tow)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteTower(tow.id)}
                      className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-slate-400 block">Floors Map</span>
                  <div className="flex flex-wrap gap-1.5">
                    {tow.floors.map(fl => (
                      <span key={fl.floorNumber} className="px-2.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl text-[9px] font-mono text-slate-600 dark:text-slate-400">
                        {fl.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-100 dark:border-slate-850">
                  <span className="text-slate-400">Tower Status</span>
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase ${
                    tow.status === 'Active' 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    {tow.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Area: 🚪 UNITS & FLATS */}
      {activeTab === 'flats' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Resident Units Catalog</h3>
              <p className="text-xs text-slate-400">Verify unit occupancy, area size, and allocated parking structures</p>
            </div>

            <button
              onClick={() => { resetFlatForm(); setActiveModal('flat'); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg cursor-pointer transition-colors sm:self-start"
            >
              <Plus className="w-4 h-4" /> Register Flat Unit
            </button>
          </div>

          {/* Cascading Filter Header bar */}
          <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-3xl flex flex-wrap gap-4 items-center">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
              <BadgeInfo className="w-4 h-4" /> Filters:
            </span>
            
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-mono text-slate-500">Tower:</label>
              <select
                value={filterTowerId}
                onChange={(e) => { setFilterTowerId(e.target.value); setFilterFloor(''); }}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl"
              >
                <option value="">All Towers...</option>
                {towers.map(t => (
                  <option key={t.id} value={t.id}>Tower {t.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[11px] font-mono text-slate-500">Floor:</label>
              <select
                disabled={!filterTowerId}
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl disabled:opacity-50"
              >
                <option value="">All Floors...</option>
                {selectedTowerObject?.floors.map(fl => (
                  <option key={fl.floorNumber} value={fl.floorNumber}>{fl.name}</option>
                ))}
              </select>
            </div>

            {(filterTowerId || filterFloor) && (
              <button 
                onClick={() => { setFilterTowerId(''); setFilterFloor(''); }}
                className="px-2.5 py-1 text-[10px] font-bold font-mono uppercase bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-white rounded-lg hover:opacity-80 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 font-mono text-slate-500">
                    <th className="py-3 px-6">Flat Number</th>
                    <th className="py-3 px-4">Tower Location</th>
                    <th className="py-3 px-4">Floor Level</th>
                    <th className="py-3 px-4">Occupant Status</th>
                    <th className="py-3 px-4">Owner Name</th>
                    <th className="py-3 px-4">Tenant Name</th>
                    <th className="py-3 px-4">Parking Slots</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredFlats.map(f => {
                    const tow = towers.find(t => t.id === f.blockId);
                    return (
                      <tr key={f.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/20 text-slate-700 dark:text-slate-300 transition-colors">
                        <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white font-mono">{f.flatNumber}</td>
                        <td className="py-3.5 px-4">Tower {tow?.name || 'N/A'}</td>
                        <td className="py-3.5 px-4 font-mono">Floor {f.floor}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-full uppercase ${
                            f.status === 'Occupied' 
                              ? 'bg-indigo-50 text-indigo-600' 
                              : f.status === 'Vacant'
                              ? 'bg-slate-100 text-slate-500'
                              : f.status === 'Under Renovation'
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 truncate max-w-[120px]">{f.ownerName || <span className="text-slate-300 font-mono italic">unassigned</span>}</td>
                        <td className="py-3.5 px-4 truncate max-w-[120px]">{f.tenantName || <span className="text-slate-300 font-mono italic">—</span>}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px]">{f.parkingSlotNumber || 'Unassigned'}</td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button 
                              onClick={() => openEditFlat(f)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-indigo-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteFlat(f.id)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredFlats.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 font-bold font-sans">
                        No flats match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Area: 👥 RESIDENTS */}
      {activeTab === 'residents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Residents Directory</h3>
              <p className="text-xs text-slate-400">Configure core resident directories, family members, and vehicle licenses</p>
            </div>

            <button
              onClick={() => { resetResidentForm(); setActiveModal('resident'); }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Resident Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {residents.map(res => {
              const flat = flats.find(f => f.id === res.flatId);
              const block = towers.find(t => t.id === flat?.blockId);
              return (
                <div key={res.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                    <button 
                      onClick={() => openEditResident(res)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-500 hover:text-indigo-600 rounded-xl"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteResident(res.id)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-500 hover:text-red-600 rounded-xl"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-4 items-center">
                    <img 
                      src={res.photoURL} 
                      alt="" 
                      className="w-16 h-16 rounded-full border border-slate-200 dark:border-slate-800 object-cover bg-slate-100" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-sans font-extrabold text-slate-900 dark:text-white">{res.name}</h4>
                        <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded-full uppercase ${
                          res.residentType === 'Owner' 
                            ? 'bg-indigo-50 text-indigo-600' 
                            : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {res.residentType}
                        </span>
                      </div>
                      
                      {flat ? (
                        <p className="text-[10px] text-green-600 font-mono uppercase font-bold mt-1">
                          Unit {flat.flatNumber} (Tower {block?.name || '—'})
                        </p>
                      ) : (
                        <p className="text-[10px] text-amber-600 font-mono uppercase italic mt-1">
                          No Unit Assigned
                        </p>
                      )}
                      
                      <p className="text-xs text-slate-400 mt-1 font-mono">{res.mobile}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3 text-xs">
                    {/* Family and Vehicles counts */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                        <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-slate-400">Family Members</span>
                        <p className="font-bold text-slate-800 dark:text-white mt-0.5 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-500" /> {res.familyMembers?.length || 0} Listed
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-850">
                        <span className="text-[9px] uppercase font-bold font-mono tracking-wider text-slate-400">Vehicles</span>
                        <p className="font-bold text-slate-800 dark:text-white mt-0.5 flex items-center gap-1.5">
                          <Car className="w-3.5 h-3.5 text-rose-500" /> {res.vehicles?.length || 0} Licenses
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 text-[11px] text-slate-500 font-sans">
                      <p>Occupation: <span className="font-semibold text-slate-700 dark:text-slate-300">{res.occupation || 'Not Specified'}</span></p>
                      <p>Joined Date: <span className="font-mono">{new Date(res.moveInDate).toLocaleDateString()}</span></p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Area: 🔍 INTELLIGENT GLOBAL SEARCH */}
      {activeTab === 'search' && (
        <div className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Intelligent Unified Search Engine</h3>
            <p className="text-xs text-slate-400">Type Name, Flat Number, Tower Designation, or Vehicle Registration Plate Number to locate database records instantly.</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="Query e.g. Taarak, B-504, MH-12..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {searchQuery.trim() ? (
            <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-850">
              
              {/* Resident matches */}
              {searchResults.residents.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-indigo-600 flex items-center gap-1.5">
                    <Users className="w-4 h-4" /> Matching Residents ({searchResults.residents.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.residents.map(res => (
                      <div key={res.id} className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-2xl flex items-center gap-3">
                        <img src={res.photoURL} alt="" className="w-10 h-10 rounded-full object-cover" />
                        <div className="text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">{res.name}</p>
                          <p className="text-slate-400">{res.mobile} • {res.residentType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flat matches */}
              {searchResults.flats.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-emerald-600 flex items-center gap-1.5">
                    <Home className="w-4 h-4" /> Matching Units ({searchResults.flats.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.flats.map(f => (
                      <div key={f.id} className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-2xl text-xs">
                        <p className="font-bold text-slate-900 dark:text-white font-mono">Unit {f.flatNumber}</p>
                        <p className="text-slate-400 font-sans mt-0.5">Status: <span className="font-bold text-slate-600 dark:text-slate-300">{f.status}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vehicle matches */}
              {searchResults.vehicles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase text-rose-600 flex items-center gap-1.5">
                    <Car className="w-4 h-4" /> Matching Vehicles ({searchResults.vehicles.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.vehicles.map((v, i) => (
                      <div key={i} className="p-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-2xl text-xs">
                        <p className="font-bold text-slate-950 dark:text-white font-mono">{v.vehicle.vehicleNumber}</p>
                        <p className="text-slate-400 mt-0.5">{v.vehicle.brand} ({v.vehicle.type})</p>
                        <p className="text-[10px] text-indigo-600 mt-1 font-sans">Owner: {v.residentName} (Unit {v.flatNumber})</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.residents.length === 0 && searchResults.flats.length === 0 && searchResults.vehicles.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6 font-bold">No exact matches found for your search term.</p>
              )}

            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>Search results will stream in real-time as you type.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Area: 👮 GUARDS & SECURITY */}
      {activeTab === 'guards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Security Personnel & Gatekeeper Roster
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Provision security guard accounts, manage duty shifts, and issue gate authentication credentials.
              </p>
            </div>
            <button
              onClick={() => {
                setGuardName('');
                setGuardMobile('');
                setGuardEmail('');
                setGuardShift('Day Shift (08:00 AM - 08:00 PM)');
                setGuardModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Add Security Guard
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guardsList.map(guard => (
                <div key={guard.uid} className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold text-sm">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{guard.displayName}</h4>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                          {guard.isActive !== false ? 'GATE ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-sans text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-bold">{guard.phoneNumber || 'No Mobile'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{guard.email}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleUserStatus(guard.uid, !guard.isActive)}
                      className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                        guard.isActive !== false 
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}
                    >
                      {guard.isActive !== false ? 'Deactivate' : 'Activate Account'}
                    </button>
                    <button
                      onClick={() => handleDeleteGuardUser(guard.uid)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Revoke Guard Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {guardsList.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 font-sans text-xs">
                  No security guard accounts provisioned yet for this society. Click "Add Security Guard" to register gatekeepers.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Area: 🛠️ STAFF & MAINTENANCE TEAM */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Staff & Maintenance Service Personnel
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Provision staff accounts, assign operational roles (Electricians, Plumbers, Facility Managers, Housekeeping, etc.), and issue mobile login credentials.
              </p>
            </div>
            <button
              onClick={() => {
                setStaffName('');
                setStaffMobile('');
                setStaffEmail('');
                setStaffRole('Maintenance Electrician');
                setStaffShift('General Shift (09:00 AM - 06:00 PM)');
                setStaffNotes('');
                setStaffModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Add Staff Member
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffList.map(staff => (
                <div key={staff.uid} className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold text-sm">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{staff.displayName}</h4>
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                          {staff.isActive !== false ? 'ACTIVE STAFF' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-sans text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono font-bold">{staff.phoneNumber || 'No Mobile'}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{staff.email}</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleUserStatus(staff.uid, !staff.isActive)}
                      className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-colors cursor-pointer ${
                        staff.isActive !== false 
                          ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400'
                      }`}
                    >
                      {staff.isActive !== false ? 'Deactivate' : 'Activate Account'}
                    </button>
                    <button
                      onClick={() => handleDeleteGuardUser(staff.uid)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer"
                      title="Revoke Staff Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {staffList.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 font-sans text-xs">
                  No staff accounts provisioned yet for this society. Click "Add Staff Member" to register technicians, plumbers, electricians, or managers.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Area: ⏰ MASTER OF DUTY SHIFTS & ROSTER */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Master of Duty Shifts & Staff Roster
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure society shift masters, define timing windows & grace periods, and oversee security guard & service staff duty rosters.
              </p>
            </div>
            <button
              onClick={() => {
                setNewShiftName('');
                setNewShiftCategory('GUARDS');
                setNewShiftStart('09:00 AM');
                setNewShiftEnd('05:00 PM');
                setNewShiftGrace(15);
                setNewShiftDesc('');
                setShiftModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Create Shift Master
            </button>
          </div>

          {/* Master Shift Cards Grid */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Configured Master Shift Timings ({shiftMasters.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shiftMasters.map((sm) => {
                const assignedGuards = guardsList.filter(g => g.shift && g.shift.toLowerCase().includes(sm.name.split(' ')[0].toLowerCase()));
                const assignedStaff = staffList.filter(s => s.shift && s.shift.toLowerCase().includes(sm.name.split(' ')[0].toLowerCase()));
                const totalAssigned = sm.category === 'GUARDS' ? assignedGuards.length : sm.category === 'STAFF' ? assignedStaff.length : (assignedGuards.length + assignedStaff.length);

                return (
                  <div key={sm.id} className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          sm.category === 'GUARDS' 
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                            : sm.category === 'STAFF'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        }`}>
                          {sm.category}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          ⏱️ {sm.duration}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {sm.name}
                      </h4>
                      
                      <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex justify-between text-slate-700 dark:text-slate-300 font-bold">
                          <span>Timing:</span>
                          <span className="text-indigo-600 dark:text-indigo-400">{sm.startTime} - {sm.endTime}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Grace Window:</span>
                          <span>{sm.graceMinutes} mins</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {sm.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 font-semibold">
                        👥 <span className="font-bold text-slate-900 dark:text-white">{totalAssigned}</span> Personnel
                      </span>
                      <button
                        onClick={() => {
                          setShiftMasters(prev => prev.filter(item => item.id !== sm.id));
                          setSuccessMsg(`Deleted Shift Master "${sm.name}"`);
                        }}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove Shift Master"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Duty Roster Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" /> Current Personnel Duty Shift Roster
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Assigned duty shifts for security guards and staff members in this society.</p>
              </div>
              <span className="text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">
                {guardsList.length + staffList.length} Personnel Registered
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                    <th className="py-3 px-4">Name & Designation</th>
                    <th className="py-3 px-4">Role Category</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Assigned Duty Shift</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300 divide-y divide-slate-50 dark:divide-slate-800">
                  {/* Security Guards */}
                  {guardsList.map((guard) => (
                    <tr key={guard.uid} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div>
                          <div>{guard.displayName}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal">Gate Security Guard</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[10px]">
                        <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded">
                          SECURITY GUARD
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{guard.phoneNumber || guard.email}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        {guard.shift || 'Day Shift (08:00 AM - 08:00 PM)'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setEditingPersonnel({
                            uid: guard.uid,
                            name: guard.displayName,
                            role: 'Security Guard',
                            currentShift: guard.shift || 'Day Shift (08:00 AM - 08:00 PM)'
                          })}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Change Shift
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Staff Members */}
                  {staffList.map((staff) => (
                    <tr key={staff.uid} className="hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <div>{staff.displayName}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal">{staff.designation || 'Service Personnel'}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[10px]">
                        <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded">
                          SOCIETY STAFF
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{staff.phoneNumber || staff.email}</td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-600 dark:text-amber-400">
                        {staff.shift || 'General Shift (09:00 AM - 06:00 PM)'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setEditingPersonnel({
                            uid: staff.uid,
                            name: staff.displayName,
                            role: staff.designation || 'Staff',
                            currentShift: staff.shift || 'General Shift (09:00 AM - 06:00 PM)'
                          })}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/50 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Change Shift
                        </button>
                      </td>
                    </tr>
                  ))}

                  {guardsList.length === 0 && staffList.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-mono">
                        No registered security guards or service staff found to display duty roster.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Area: 🎫 HELPDESK COMPLAINTS */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Society Helpdesk & Complaints Registry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Review resident maintenance tickets, assign service staff, and update resolution status.
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200/50">
              {complaintsList.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length} Active Tickets
            </span>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaintsList.map(cmp => (
                <div key={cmp.id} className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {cmp.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{cmp.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cmp.description}</p>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      cmp.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      cmp.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                      'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      {cmp.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <span>Flat {cmp.flatNumber} • {cmp.residentName}</span>
                    <span className="font-mono">{new Date(cmp.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {cmp.status === 'OPEN' && (
                      <button
                        onClick={() => complaintService.updateComplaintStatus(cmp.id, 'IN_PROGRESS', currentUser.displayName)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Mark In Progress
                      </button>
                    )}
                    {cmp.status !== 'RESOLVED' && (
                      <button
                        onClick={() => complaintService.updateComplaintStatus(cmp.id, 'RESOLVED')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Resolve Complaint
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {complaintsList.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-sans">
                  No complaints logged for this society yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Area: 📢 NOTICE BOARD */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> Society Notice Board & Announcements
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Broadcast official announcements, meeting alerts, and maintenance notices to residents and security staff.
              </p>
            </div>
            <button
              onClick={() => {
                setNoticeTitle('');
                setNoticeContent('');
                setNoticeCategory('GENERAL');
                setNoticeModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Post Announcement
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {noticesList.map(not => (
                <div key={not.id} className="p-5 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 rounded-2xl space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      {not.category}
                    </span>
                    <button
                      onClick={() => noticeService.deleteNotice(not.id)}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{not.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">{not.content}</p>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>By {not.creatorName}</span>
                    <span>{new Date(not.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}

              {noticesList.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-sans">
                  No announcements posted on the notice board yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Area: 🧾 MAINTENANCE BILLS */}
      {activeTab === 'maintenance' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Society Maintenance Dues & Receipts
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Issue monthly maintenance bills to flat units, track payment status, and verify transactions.
              </p>
            </div>
            <button
              onClick={() => {
                setMaintFlatId('');
                setMaintAmount(2500);
                setMaintMonth('July');
                setMaintModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Issue Maintenance Bill
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] font-mono">
                    <th className="py-3 px-4">Flat Unit</th>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">Billing Period</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {maintenanceList.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">{rec.flatNumber}</td>
                      <td className="py-3.5 px-4 font-semibold">{rec.residentName}</td>
                      <td className="py-3.5 px-4">{rec.month} {rec.year}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">₹{rec.amount}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">{rec.dueDate}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                          rec.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {rec.status !== 'PAID' && (
                          <button
                            onClick={() => maintenanceService.markAsPaid(rec.id, 'UPI')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          onClick={() => maintenanceService.deleteMaintenanceRecord(rec.id)}
                          className="text-slate-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {maintenanceList.length === 0 && (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-sans">
                  No maintenance records issued for this society yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ALL DRAWER / DIALOG / MODAL FORM OVERLAYS (MD3 Elegant Style) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
            
            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative space-y-6"
            >
              <button 
                onClick={() => { 
                  if (activeModal === 'society') resetSocietyForm();
                  if (activeModal === 'tower') resetTowerForm();
                  if (activeModal === 'flat') resetFlatForm();
                  if (activeModal === 'resident') resetResidentForm();
                }}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              {/* 1. SOCIETY FORM OVERLAY */}
              {activeModal === 'society' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-sans font-extrabold text-slate-900 dark:text-white">
                      {editId ? 'Modify Society Specifications' : 'Provision New Society Credentials'}
                    </h3>
                    <p className="text-xs text-slate-400">Define administrative properties for the new society entity</p>
                  </div>

                  <form onSubmit={handleSocietySubmit} className="space-y-4 font-sans text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Society Name</label>
                        <input 
                          type="text" required placeholder="e.g. Gokuldham CHS" value={socName} onChange={(e) => setSocName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Registration Number</label>
                        <input 
                          type="text" required placeholder="e.g. MH-MUM-123" value={socRegNum} onChange={(e) => setSocRegNum(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">City</label>
                        <input 
                          type="text" required placeholder="e.g. Mumbai" value={socCity} onChange={(e) => setSocCity(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">State</label>
                        <input 
                          type="text" required placeholder="e.g. Maharashtra" value={socState} onChange={(e) => setSocState(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">PIN Code</label>
                        <input 
                          type="text" required placeholder="400063" value={socPin} onChange={(e) => setSocPin(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Address</label>
                      <input 
                        type="text" required placeholder="e.g. Film City Road, Goregaon East" value={socAddress} onChange={(e) => setSocAddress(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Office Contact Number</label>
                        <input 
                          type="tel" required placeholder="+91 22 234567" value={socContact} onChange={(e) => setSocContact(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Office Email Address</label>
                        <input 
                          type="email" required placeholder="office@gokuldham.com" value={socEmail} onChange={(e) => setSocEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Logo URL (Optional)</label>
                        <input 
                          type="text" placeholder="https://..." value={socLogo} onChange={(e) => setSocLogo(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Society Status</label>
                        <select
                          value={socStatus} onChange={(e) => setSocStatus(e.target.value as any)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Suspended">Suspended</option>
                        </select>
                      </div>
                    </div>

                    {/* Emergency Contacts Management */}
                    <div className="bg-red-50/20 border border-red-100 dark:bg-red-950/10 dark:border-red-900/20 p-4 rounded-2xl space-y-3">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase font-mono">Emergency Helplines</span>
                      {socEmergency.map((item, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" required placeholder="Hotline Label e.g. Police" value={item.name}
                            onChange={(e) => {
                              const updated = [...socEmergency];
                              updated[index].name = e.target.value;
                              setSocEmergency(updated);
                            }}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                          <input 
                            type="tel" required placeholder="Number e.g. 100" value={item.phone}
                            onChange={(e) => {
                              const updated = [...socEmergency];
                              updated[index].phone = e.target.value;
                              setSocEmergency(updated);
                            }}
                            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors"
                    >
                      {editId ? 'Confirm Updates' : 'Provision Society Records'}
                    </button>
                  </form>
                </div>
              )}

              {/* 2. TOWER FORM OVERLAY */}
              {activeModal === 'tower' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-sans font-extrabold text-slate-900 dark:text-white">
                      {editId ? 'Modify Tower Wings' : 'Provision New Tower Block'}
                    </h3>
                    <p className="text-xs text-slate-400">Configure tower details and generate individual floor coordinates</p>
                  </div>

                  <form onSubmit={handleTowerSubmit} className="space-y-4 font-sans text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Tower Name / Designation</label>
                      <input 
                        type="text" required placeholder="e.g. Tower A, Block B" value={towName} onChange={(e) => setTowName(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                      />
                    </div>

                    {!editId && (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Total Floors (Auto-Generates Floors list)</label>
                        <input 
                          type="number" min={1} max={50} required value={towFloors} onChange={(e) => setTowFloors(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Floors from Ground Floor up to level {towFloors} will be generated automatically.</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Status</label>
                      <select
                        value={towStatus} onChange={(e) => setTowStatus(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                      >
                        <option value="Active">Active</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors"
                    >
                      {editId ? 'Update Tower block' : 'Provision Tower Structure'}
                    </button>
                  </form>
                </div>
              )}

              {/* 3. FLAT FORM OVERLAY */}
              {activeModal === 'flat' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-sans font-extrabold text-slate-900 dark:text-white">
                      {editId ? 'Edit Flat Configuration' : 'Map and Register Flat Unit'}
                    </h3>
                    <p className="text-xs text-slate-400">Configure core specification for individual flat units in registered towers</p>
                  </div>

                  <form onSubmit={handleFlatSubmit} className="space-y-4 font-sans text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Tower Location</label>
                        <select
                          value={flatTowerId} 
                          onChange={(e) => {
                            setFlatTowerId(e.target.value);
                            setFlatFloor(1);
                          }}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          required
                        >
                          <option value="">Select tower...</option>
                          {towers.map(tow => (
                            <option key={tow.id} value={tow.id}>Tower {tow.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Floor Level</label>
                        <select
                          value={flatFloor} onChange={(e) => setFlatFloor(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          required
                          disabled={!flatTowerId}
                        >
                          {flatTowerId && towers.find(t => t.id === flatTowerId)?.floors.map(fl => (
                            <option key={fl.floorNumber} value={fl.floorNumber}>{fl.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Flat/Unit Number</label>
                        <input 
                          type="text" required placeholder="e.g. A-101, 504" value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Registered Owner Name (Optional)</label>
                        <input 
                          type="text" placeholder="e.g. Champaklal Gada" value={flatOwnerName} onChange={(e) => setFlatOwnerName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Registered Tenant Name (Optional)</label>
                        <input 
                          type="text" placeholder="e.g. Jethalal Gada" value={flatTenantName} onChange={(e) => setFlatTenantName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Unit Status</label>
                        <select
                          value={flatStatus} onChange={(e) => setFlatStatus(e.target.value as any)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        >
                          <option value="Occupied">Occupied</option>
                          <option value="Vacant">Vacant</option>
                          <option value="Under Renovation">Under Renovation</option>
                          <option value="Locked">Locked</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Unit Area (SQFT)</label>
                        <input 
                          type="number" value={flatArea} onChange={(e) => setFlatArea(Number(e.target.value))}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Parking Slot (Optional)</label>
                        <input 
                          type="text" placeholder="e.g. P-12" value={flatParking} onChange={(e) => setFlatParking(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors"
                    >
                      {editId ? 'Confirm specifications' : 'Register Unit Records'}
                    </button>
                  </form>
                </div>
              )}

              {/* 4. RESIDENT FORM OVERLAY */}
              {activeModal === 'resident' && (
                <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                  <div>
                    <h3 className="text-base font-sans font-extrabold text-slate-900 dark:text-white">
                      {editId ? 'Edit Resident Profile' : 'Add Resident Profile'}
                    </h3>
                    <p className="text-xs text-slate-400">Provision resident accounts, assign flat units, and declare nested members/vehicles</p>
                  </div>

                  <form onSubmit={handleResidentSubmit} className="space-y-6 font-sans text-xs">
                    
                    <div className="space-y-3">
                      <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">1. Personal Profile Specs</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Full Name</label>
                          <input 
                            type="text" required placeholder="e.g. Babita Iyer" value={resName} onChange={(e) => setResName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Mobile Number (Must be unique)</label>
                          <input 
                            type="tel" required placeholder="+91 98223 45678" value={resMobile} onChange={(e) => setResMobile(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Email Address</label>
                          <input 
                            type="email" placeholder="babita@iyer.com" value={resEmail} onChange={(e) => setResEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Occupation</label>
                          <input 
                            type="text" placeholder="Scientist / Business..." value={resOccupation} onChange={(e) => setResOccupation(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Gender</label>
                          <select
                            value={resGender} onChange={(e) => setResGender(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Birth Date (Optional)</label>
                          <input 
                            type="date" value={resDob} onChange={(e) => setResDob(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Status</label>
                          <select
                            value={resStatus} onChange={(e) => setResStatus(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          >
                            <option value="Active">Active</option>
                            <option value="Pending">Pending Approval</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Profile Photo URL (Optional)</label>
                          <input 
                            type="text" placeholder="https://..." value={resPhoto} onChange={(e) => setResPhoto(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Emergency Contact (Optional)</label>
                          <input 
                            type="text" placeholder="Relative Name / Contact Number" value={resEmergencyContact} onChange={(e) => setResEmergencyContact(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="block text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">2. Residential Mapping & Occupation</span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Assigned Flat Unit</label>
                          <select
                            value={resFlatId} onChange={(e) => setResFlatId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                            required
                          >
                            <option value="">Choose Unit...</option>
                            {flats.map(f => {
                              const tow = towers.find(t => t.id === f.blockId);
                              return (
                                <option key={f.id} value={f.id}>Flat {f.flatNumber} (Tower {tow?.name || '—'})</option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Resident Type</label>
                          <select
                            value={resType} onChange={(e) => setResType(e.target.value as any)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                          >
                            <option value="Owner">Owner</option>
                            <option value="Tenant">Tenant</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Move In Date</label>
                          <input 
                            type="date" required value={resMoveIn} onChange={(e) => setResMoveIn(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Move Out Date (Optional)</label>
                          <input 
                            type="date" value={resMoveOut} onChange={(e) => setResMoveOut(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Manage Nested Family Members */}
                    <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-4 bg-slate-50 dark:bg-slate-950">
                      <span className="block text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">3. Family Members ({resFamily.length})</span>
                      
                      {resFamily.length > 0 && (
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                          {resFamily.map((mem, idx) => (
                            <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white">{mem.name}</p>
                                <p className="text-slate-400 text-[10px]">{mem.relationship} • {mem.contactNumber || 'No Phone'}</p>
                              </div>
                              <button 
                                type="button" onClick={() => removeFamilyMember(idx)}
                                className="p-1 hover:bg-red-50 text-red-600 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 items-end bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3 rounded-xl">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Full Name</label>
                          <input 
                            type="text" placeholder="Name" value={tempFamName} onChange={(e) => setTempFamName(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Relation</label>
                          <input 
                            type="text" placeholder="e.g. Spouse" value={tempFamRel} onChange={(e) => setTempFamRel(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Contact</label>
                            <input 
                              type="tel" placeholder="Mobile" value={tempFamPhone} onChange={(e) => setTempFamPhone(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                            />
                          </div>
                          <button
                            type="button" onClick={addFamilyMember}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Manage Nested Vehicles */}
                    <div className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-4 bg-slate-50 dark:bg-slate-950">
                      <span className="block text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">4. Registered Vehicles ({resVehicles.length})</span>
                      
                      {resVehicles.length > 0 && (
                        <div className="space-y-2 max-h-36 overflow-y-auto">
                          {resVehicles.map((v, idx) => (
                            <div key={idx} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <p className="font-bold text-slate-800 dark:text-white font-mono">{v.vehicleNumber}</p>
                                <p className="text-slate-400 text-[10px]">{v.brandModel} ({v.type}) • Slot: {v.parkingSlot || 'Unassigned'}</p>
                              </div>
                              <button 
                                type="button" onClick={() => removeVehicle(idx)}
                                className="p-1 hover:bg-red-50 text-red-600 rounded-md"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-4 gap-2 items-end bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-3 rounded-xl">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Type</label>
                          <select
                            value={tempVehType} onChange={(e) => setTempVehType(e.target.value as any)}
                            className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          >
                            <option value="2-Wheeler">2-Wheeler</option>
                            <option value="4-Wheeler">4-Wheeler</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Brand/Model</label>
                          <input 
                            type="text" placeholder="e.g. Honda City" value={tempVehBrand} onChange={(e) => setTempVehBrand(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Plate Number</label>
                          <input 
                            type="text" placeholder="e.g. MH12AB1234" value={tempVehNum} onChange={(e) => setTempVehNum(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono uppercase"
                          />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[9px] uppercase font-bold text-slate-400 mb-1">Slot</label>
                            <input 
                              type="text" placeholder="P-5" value={tempVehSlot} onChange={(e) => setTempVehSlot(e.target.value)}
                              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                            />
                          </div>
                          <button
                            type="button" onClick={addVehicle}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors"
                    >
                      {editId ? 'Apply Profile Updates' : 'Sync and Register Resident'}
                    </button>
                  </form>
                </div>
              )}

            </motion.div>
          </div>
        )}

        {/* 5. GUARD CREATION MODAL OVERLAY */}
        {guardModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setGuardModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Provision Security Guard
              </h3>
              <p className="text-xs text-slate-400">Create gatekeeper account and authorize mobile login access.</p>

              <form onSubmit={handleGuardSubmit} className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Guard Full Name</label>
                  <input 
                    type="text" required placeholder="e.g. Ramesh Kumar" value={guardName} onChange={(e) => setGuardName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Mobile Number (Login ID)</label>
                  <input 
                    type="tel" required placeholder="+91 9876543210" value={guardMobile} onChange={(e) => setGuardMobile(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Email Address (Optional)</label>
                  <input 
                    type="email" placeholder="guard@society.internal" value={guardEmail} onChange={(e) => setGuardEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Duty Shift</label>
                  <select 
                    value={guardShift} onChange={(e) => setGuardShift(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  >
                    <option value="Day Shift (08:00 AM - 08:00 PM)">Day Shift (08:00 AM - 08:00 PM)</option>
                    <option value="Night Shift (08:00 PM - 08:00 AM)">Night Shift (08:00 PM - 08:00 AM)</option>
                    <option value="24 Hours Rotation">24 Hours Rotation</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors mt-2"
                >
                  Provision Guard Account
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* STAFF REGISTRATION MODAL OVERLAY */}
        {staffModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setStaffModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-indigo-600" /> Provision Staff Account
              </h3>
              <p className="text-xs text-slate-400">Add maintenance or administrative staff, assign their service role & authorize mobile login access.</p>

              <form onSubmit={handleStaffSubmit} className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Full Name</label>
                  <input 
                    type="text" required placeholder="e.g. Ramesh Kumar" value={staffName} onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Service Role / Designation</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  >
                    <option value="Maintenance Electrician">⚡ Maintenance Electrician</option>
                    <option value="Plumber & Sanitation">🚰 Plumber & Sanitation</option>
                    <option value="Facility Manager">🏢 Facility Manager</option>
                    <option value="Housekeeping Supervisor">🧹 Housekeeping Supervisor</option>
                    <option value="Gardener & Landscaper">🌱 Gardener & Landscaper</option>
                    <option value="Lift & Elevator Technician">🛗 Lift & Elevator Technician</option>
                    <option value="Carpenter & Civil Maintenance">🔨 Carpenter & Civil Maintenance</option>
                    <option value="Society Accountant">📊 Society Accountant</option>
                    <option value="Office Administrator">💼 Office Administrator</option>
                    <option value="General Service Staff">🛠️ General Service Staff</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Mobile Number (OTP Login)</label>
                    <input 
                      type="tel" required placeholder="+91 9812345678" value={staffMobile} onChange={(e) => setStaffMobile(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Email Address (Optional)</label>
                    <input 
                      type="email" placeholder="staff@society.org" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Duty Shift / Working Hours</label>
                  <select 
                    value={staffShift} onChange={(e) => setStaffShift(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  >
                    <option value="General Shift (09:00 AM - 06:00 PM)">General Shift (09:00 AM - 06:00 PM)</option>
                    <option value="Morning Shift (07:00 AM - 03:00 PM)">Morning Shift (07:00 AM - 03:00 PM)</option>
                    <option value="Evening Shift (02:00 PM - 10:00 PM)">Evening Shift (02:00 PM - 10:00 PM)</option>
                    <option value="Night Shift (10:00 PM - 06:00 AM)">Night Shift (10:00 PM - 06:00 AM)</option>
                    <option value="On-Call / Emergency 24x7">On-Call / Emergency 24x7</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors mt-2"
                >
                  Register Staff & Authorize Mobile Login
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* 6. NOTICE MODAL OVERLAY */}
        {noticeModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setNoticeModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" /> Post Society Announcement
              </h3>
              <p className="text-xs text-slate-400">Broadcast notice to all residents and security staff.</p>

              <form onSubmit={handleNoticeSubmit} className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Announcement Title</label>
                  <input 
                    type="text" required placeholder="e.g. Water Tank Cleaning Schedule" value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Category</label>
                  <select 
                    value={noticeCategory} onChange={(e) => setNoticeCategory(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  >
                    <option value="GENERAL">General Notice</option>
                    <option value="MAINTENANCE">Maintenance Alert</option>
                    <option value="EVENT">Society Event</option>
                    <option value="EMERGENCY">Emergency Notice</option>
                    <option value="MEETING">GBM / Society Meeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Content Body</label>
                  <textarea 
                    rows={4} required placeholder="Detail the announcement specifications, time, and instructions..." value={noticeContent} onChange={(e) => setNoticeContent(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors mt-2"
                >
                  Broadcast Notice
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* 7. MAINTENANCE BILL MODAL OVERLAY */}
        {maintModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setMaintModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" /> Issue Maintenance Bill
              </h3>
              <p className="text-xs text-slate-400">Generate monthly dues record for selected flat unit.</p>

              <form onSubmit={handleMaintenanceSubmit} className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Flat Unit</label>
                  <select 
                    required value={maintFlatId} onChange={(e) => setMaintFlatId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  >
                    <option value="">Select Flat Unit...</option>
                    {flats.map(f => (
                      <option key={f.id} value={f.id}>Flat {f.flatNumber} ({f.ownerName || f.tenantName || 'Occupant'})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Billing Month</label>
                    <select 
                      value={maintMonth} onChange={(e) => setMaintMonth(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Bill Amount (₹)</label>
                    <input 
                      type="number" required value={maintAmount} onChange={(e) => setMaintAmount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors mt-2"
                >
                  Generate & Send Bill
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* 8. SHIFT MASTER CREATION MODAL OVERLAY */}
        {shiftModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setShiftModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" /> Create Master Duty Shift
              </h3>
              <p className="text-xs text-slate-400">Configure new duty shift name, category, timings, and grace window.</p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newShiftName) return;
                const newSm: ShiftMasterItem = {
                  id: `sm_custom_${Date.now()}`,
                  name: `${newShiftName} (${newShiftStart} - ${newShiftEnd})`,
                  category: newShiftCategory,
                  startTime: newShiftStart,
                  endTime: newShiftEnd,
                  duration: 'Custom Duration',
                  graceMinutes: newShiftGrace,
                  description: newShiftDesc || 'Custom master duty shift configured by administrator.',
                };
                setShiftMasters(prev => [newSm, ...prev]);
                setShiftModalOpen(false);
                setSuccessMsg(`Created new Master Duty Shift "${newSm.name}"`);
              }} className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Shift Title / Name</label>
                  <input 
                    type="text" required placeholder="e.g. Dawn Gate Patrol Shift" value={newShiftName} onChange={(e) => setNewShiftName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Target Category</label>
                    <select 
                      value={newShiftCategory} onChange={(e) => setNewShiftCategory(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                    >
                      <option value="GUARDS">Security Guards</option>
                      <option value="STAFF">Service Staff</option>
                      <option value="COMMON">Common / All Roles</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Grace Period (Mins)</label>
                    <input 
                      type="number" required value={newShiftGrace} onChange={(e) => setNewShiftGrace(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Start Time</label>
                    <input 
                      type="text" required placeholder="e.g. 06:00 AM" value={newShiftStart} onChange={(e) => setNewShiftStart(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">End Time</label>
                    <input 
                      type="text" required placeholder="e.g. 02:00 PM" value={newShiftEnd} onChange={(e) => setNewShiftEnd(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Description & Guidance</label>
                  <textarea 
                    rows={3} placeholder="Provide shift instructions, gate duty boundaries, or break rules..." value={newShiftDesc} onChange={(e) => setNewShiftDesc(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-sans"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors mt-2"
                >
                  Save Shift Master
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* 9. REASSIGN PERSONNEL SHIFT MODAL OVERLAY */}
        {editingPersonnel && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setEditingPersonnel(null)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" /> Reassign Duty Shift
              </h3>
              <p className="text-xs text-slate-400">Change assigned master duty shift for <span className="font-bold text-slate-900 dark:text-white">{editingPersonnel.name}</span> ({editingPersonnel.role}).</p>

              <div className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Select Duty Shift Master</label>
                  <select 
                    value={editingPersonnel.currentShift}
                    onChange={(e) => setEditingPersonnel(prev => prev ? { ...prev, currentShift: e.target.value } : null)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold"
                  >
                    {shiftMasters.map(sm => (
                      <option key={sm.id} value={sm.name}>{sm.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (!editingPersonnel) return;
                    setGuardsList(prev => prev.map(g => g.uid === editingPersonnel.uid ? { ...g, shift: editingPersonnel.currentShift } : g));
                    setStaffList(prev => prev.map(s => s.uid === editingPersonnel.uid ? { ...s, shift: editingPersonnel.currentShift } : s));
                    setSuccessMsg(`Reassigned ${editingPersonnel.name} to ${editingPersonnel.currentShift}`);
                    setEditingPersonnel(null);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors mt-2"
                >
                  Update Assigned Duty Shift
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* 10. SOCIETY ADMIN ADD USER MODAL OVERLAY */}
        {addUserModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 flex justify-center items-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-4"
            >
              <button 
                onClick={() => setAddUserModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-sans">
                <UserPlus className="w-5 h-5 text-indigo-600" /> Add User to Society
              </h3>
              <p className="text-xs text-slate-400">
                Register a new user profile scoped directly to this society ({societies.find(s => s.id === currentSocietyId)?.name || currentSocietyId}).
              </p>

              <form onSubmit={handleAddUser} className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Full Name *</label>
                  <input 
                    type="text" required placeholder="e.g. Rahul Sharma" value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Email Address *</label>
                    <input 
                      type="email" required placeholder="rahul@example.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Mobile Number</label>
                    <input 
                      type="tel" placeholder="+91 9876543210" value={newUserPhone} onChange={(e) => setNewUserPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Assigned Role</label>
                    <select 
                      value={newUserRole} onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
                    >
                      <option value={UserRole.RESIDENT}>Resident</option>
                      <option value={UserRole.SECURITY_GUARD}>Security Guard</option>
                      <option value={UserRole.STAFF}>Service Staff</option>
                      <option value={UserRole.SOCIETY_ADMIN}>Secondary Society Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Account Password</label>
                    <input 
                      type="password" placeholder="Defaults to password123" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:bg-slate-950 dark:border-slate-800 rounded-xl font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Society Scope:</span> User will be automatically assigned to society ID <span className="font-mono font-bold">{currentSocietyId}</span>.
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md cursor-pointer transition-colors mt-2"
                >
                  Create & Register User
                </button>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
};
