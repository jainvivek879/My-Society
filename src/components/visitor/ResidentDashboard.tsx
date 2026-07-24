/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Gokuldham CHS - Resident Mobile Application (Phase 5)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Plus, MapPin, Truck, Phone, UserCheck, AlertTriangle, 
  Check, X, ShieldAlert, Clock, Calendar, Info, QrCode, User, 
  ShieldCheck, Trash2, ChevronRight, UserMinus, UserPlus, BellRing, Settings, 
  Home, Users, Power, Wifi, Signal, Battery, ArrowLeft, PlusCircle, 
  Volume2, VolumeX, Share2, Copy, Shield, Sparkles, Languages, CheckSquare, Edit3,
  AlertCircle, Receipt, Bell, FileText, CheckCircle2, DollarSign, CreditCard
} from 'lucide-react';
import { useAuth } from '../../services/authContext';
import { visitorService } from '../../services/visitorService';
import { deliveryService, DeliveryLog, ExpectedDelivery } from '../../services/deliveryService';
import { societyService } from '../../services/societyService';
import { complaintService, Complaint } from '../../services/complaintService';
import { maintenanceService, MaintenanceRecord } from '../../services/maintenanceService';
import { noticeService, Notice } from '../../services/noticeService';
import { VisitorLog, PreApprovedPass, UserProfile, VisitorType } from '../../types';

interface ResidentDashboardProps {
  currentUser: UserProfile;
  currentSocietyId: string;
  activeTab?: string;
}

// Browser Audio Synthesizer for high-fidelity notifications and SOS
const playSound = (type: 'chime' | 'sos' | 'click' | 'success') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (type === 'click') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } else if (type === 'success') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'chime') {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5
      
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      
      osc1.start();
      osc2.start(audioCtx.currentTime + 0.2);
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'sos') {
      // Loop a siren
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(1100, audioCtx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(700, audioCtx.currentTime + 0.4);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.45);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    }
  } catch (err) {
    console.warn('Audio synthesis not supported or interaction deferred:', err);
  }
};

// Multilingual Dictionary
const translations: any = {
  en: {
    dashboardTitle: "Resident Mobile Hub",
    home: "Home",
    visitors: "Visitors",
    deliveries: "Deliveries",
    emergency: "Emergency",
    settings: "Settings",
    searchPlaceholder: "Search guests, deliveries, family, cars...",
    upcomingVisitors: "Upcoming Visitors",
    expectedDeliveries: "Expected Deliveries",
    recentVisitors: "Recent Visitors",
    recentDeliveries: "Recent Deliveries",
    quickActions: "Quick Actions",
    societyAnnouncements: "Society Announcements",
    emergencyContacts: "Emergency Contacts",
    todaysActivity: "Today's Activity",
    profile: "My Profile",
    familyMembers: "Family Members",
    vehicles: "Vehicles",
    flatInfo: "Residence Info",
    sosButton: "SOS PANIC",
    tapToTrigger: "Tap & Hold to trigger SOS alert",
    holdCountdown: "Activating in {n}s",
    notifications: "In-App Alerts",
    language: "App Language",
    theme: "Display Theme",
    offlineSupport: "Offline Cache Simulation",
    activeOffline: "OFFLINE MODE ACTIVE",
    allowDirectEntry: "Auto-Approve Cab Entries",
    maskNumber: "Mask Phone at Main Gate",
    preApproveBtn: "Pre-Approve Guest",
    addExpectedBtn: "Schedule Parcel",
    triggerSosBtn: "Trigger SOS Alert",
    addFamilyBtn: "Add Family Member",
    addVehicleBtn: "Register Vehicle",
    pendingApproval: "Urgent Gate Approvals",
    approve: "Approve",
    reject: "Reject",
    leaveAtGate: "Leave at Gate",
    leaveAtReception: "Leave at Desk",
    history: "History Logs",
    addMember: "Add Family Member",
    editMember: "Edit Family Member",
    addVehicle: "Register Vehicle",
    editVehicle: "Edit Vehicle",
    parkingDetails: "Parking Details",
    callSecurity: "Call Guard Gate",
    callOffice: "Call Management Office",
    police: "Police Control Room",
    ambulance: "Trauma Care Ambulance",
    fire: "Fire Emergency Station",
    otpVerif: "Requires Gate Entry OTP",
    activePasses: "Active Pre-Approved Passes",
    noUpcoming: "No pre-approved guest passes",
    noDeliveries: "No scheduled deliveries for today",
    noRecentVis: "No guest check-ins recorded",
    noRecentDel: "No deliveries received today",
    deviceFrame: "Mockup Silhouette",
    soundState: "Audio Sounds",
    carrierSim: "OmniSignal",
    copypass: "Copy Pass Details",
    shared: "Pass details copied to clipboard!",
    status: "Status"
  },
  hi: {
    dashboardTitle: "रेसिडेंट मोबाइल हब",
    home: "होम",
    visitors: "विज़िटर्स",
    deliveries: "डिलिवरी",
    emergency: "आपातकालीन",
    settings: "सेटिंग्स",
    searchPlaceholder: "खोजें: मेहमान, पार्सल, परिवार, कार...",
    upcomingVisitors: "आगामी मेहमान",
    expectedDeliveries: "अपेक्षित डिलिवरीज",
    recentVisitors: "हाल के विज़िटर्स",
    recentDeliveries: "हाल की डिलिवरीज",
    quickActions: "त्वरित कार्रवाई",
    societyAnnouncements: "सोसाइटी घोषणाएं",
    emergencyContacts: "आपातकालीन संपर्क",
    todaysActivity: "आज की गतिविधि",
    profile: "मेरी प्रोफ़ाइल",
    familyMembers: "परिवार के सदस्य",
    vehicles: "पंजीकृत वाहन",
    flatInfo: "निवास की जानकारी",
    sosButton: "एसओएस पैनिक",
    tapToTrigger: "एसओएस अलर्ट के लिए दबाए रखें",
    holdCountdown: "{n} सेकंड में सक्रिय...",
    notifications: "इन-ऐप अलर्ट",
    language: "ऐप की भाषा",
    theme: "थीम सेटिंग",
    offlineSupport: "ऑफ़लाइन कैश सिमुलेशन",
    activeOffline: "ऑफ़लाइन मोड सक्रिय",
    allowDirectEntry: "कैब प्रविष्टियों को ऑटो-मंजूर करें",
    maskNumber: "मुख्य गेट पर फोन छिपाएं",
    preApproveBtn: "मेहमान का पास बनाएं",
    addExpectedBtn: "पार्सल शेड्यूल करें",
    triggerSosBtn: "एसओएस अलर्ट भेजें",
    addFamilyBtn: "सदस्य जोड़ें",
    addVehicleBtn: "वाहन पंजीकृत करें",
    pendingApproval: "गेट पर लंबित विज़िटर्स",
    approve: "मंजूर करें",
    reject: "अस्वीकार",
    leaveAtGate: "गेट पर छोड़ें",
    leaveAtReception: "रिसेप्शन पर छोड़ें",
    history: "इतिहास लॉग",
    addMember: "परिवार का सदस्य जोड़ें",
    editMember: "विवरण संपादित करें",
    addVehicle: "वाहन पंजीकृत करें",
    editVehicle: "वाहन संपादित करें",
    parkingDetails: "पार्किंग स्लॉट",
    callSecurity: "सुरक्षा गार्ड रूम",
    callOffice: "सोसाइटी प्रबंधक कार्यालय",
    police: "पुलिस नियंत्रण कक्ष",
    ambulance: "आपातकालीन एम्बुलेंस",
    fire: "दमकल केंद्र स्टेशन",
    otpVerif: "प्रवेश के लिए ओटीपी चाहिए",
    activePasses: "सक्रिय प्री-अप्रूव्ड पास",
    noUpcoming: "कोई सक्रिय गेस्ट पास नहीं है",
    noDeliveries: "आज के लिए कोई निर्धारित पार्सल नहीं",
    noRecentVis: "कोई गेस्ट चेक-इन रिकॉर्ड नहीं",
    noRecentDel: "आज कोई पार्सल प्राप्त नहीं हुआ",
    deviceFrame: "सिम्युलेटर फ्रेम",
    soundState: "ऑडियो आवाजें",
    carrierSim: "जियो-सिग्नल",
    copypass: "पास जानकारी कॉपी करें",
    shared: "पास विवरण क्लिपबोर्ड पर कॉपी हो गया!",
    status: "स्थिति"
  },
  es: {
    dashboardTitle: "Portal Residente",
    home: "Inicio",
    visitors: "Visitas",
    deliveries: "Entregas",
    emergency: "S.O.S.",
    settings: "Ajustes",
    searchPlaceholder: "Buscar invitados, entregas, autos...",
    upcomingVisitors: "Próximos Visitantes",
    expectedDeliveries: "Entregas Esperadas",
    recentVisitors: "Visitas Recientes",
    recentDeliveries: "Entregas Recientes",
    quickActions: "Acciones Rápidas",
    societyAnnouncements: "Anuncios del Edificio",
    emergencyContacts: "Contactos de Emergencia",
    todaysActivity: "Actividad de Hoy",
    profile: "Mi Perfil",
    familyMembers: "Mi Familia",
    vehicles: "Mis Vehículos",
    flatInfo: "Datos de Residencia",
    sosButton: "S.O.S. PÁNICO",
    tapToTrigger: "Mantener presionado para activar SOS",
    holdCountdown: "Activando en {n}s",
    notifications: "Alertas Recientes",
    language: "Idioma del Portal",
    theme: "Tema Visual",
    offlineSupport: "Modo Fuera de Línea",
    activeOffline: "MODO FUERA DE LÍNEA",
    allowDirectEntry: "Auto-Aprobar Taxis",
    maskNumber: "Ocultar Número en Portería",
    preApproveBtn: "Pre-Aprobar Invitado",
    addExpectedBtn: "Esperar Entrega",
    triggerSosBtn: "Activar Alarma SOS",
    addFamilyBtn: "Añadir Familiar",
    addVehicleBtn: "Registrar Vehículo",
    pendingApproval: "Aprobaciones Pendientes",
    approve: "Aprobar",
    reject: "Rechazar",
    leaveAtGate: "Dejar en Puerta",
    leaveAtReception: "Dejar en Lobby",
    history: "Historial de Accesos",
    addMember: "Añadir Familiar",
    editMember: "Editar Familiar",
    addVehicle: "Registrar Vehículo",
    editVehicle: "Editar Vehículo",
    parkingDetails: "Cajón de Estacionamiento",
    callSecurity: "Llamar a Portería",
    callOffice: "Oficina de Administración",
    police: "Estación de Policía",
    ambulance: "Urgencias Médicas",
    fire: "Estación de Bomberos",
    otpVerif: "Requiere OTP de Entrada",
    activePasses: "Pases Activos",
    noUpcoming: "Sin pases programados activos",
    noDeliveries: "Sin paquetes programados hoy",
    noRecentVis: "Sin visitas registradas hoy",
    noRecentDel: "Sin entregas recibidas hoy",
    deviceFrame: "Silueta de Móvil",
    soundState: "Sonidos de App",
    carrierSim: "OmniSignal",
    copypass: "Copiar Datos de Pase",
    shared: "¡Copiado al portapapeles!",
    status: "Estado"
  }
};

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({ currentUser, currentSocietyId, activeTab: propActiveTab }) => {
  const { currentSociety } = useAuth();
  // Global States
  const [deviceFrame, setDeviceFrame] = useState<'iphone' | 'android' | 'tablet' | 'full'>('iphone');
  const [appTheme, setAppTheme] = useState<'light' | 'dark'>('light');
  const [appLang, setAppLang] = useState<'en' | 'hi' | 'es'>('en');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'home' | 'visitors' | 'deliveries' | 'emergency' | 'settings' | 'complaints' | 'bills' | 'notices'>('home');

  useEffect(() => {
    if (propActiveTab) {
      if (propActiveTab === 'resident_home') setActiveTab('home');
      else if (propActiveTab === 'resident_invites') setActiveTab('visitors');
      else if (propActiveTab === 'resident_deliveries') setActiveTab('deliveries');
      else if (propActiveTab === 'resident_complaints') setActiveTab('complaints');
      else if (propActiveTab === 'resident_bills') setActiveTab('bills');
      else if (propActiveTab === 'resident_notices') setActiveTab('notices');
    }
  }, [propActiveTab]);

  // Real-Time Subscribed Lists
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [preApprovedPasses, setPreApprovedPasses] = useState<PreApprovedPass[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [expectedDeliveries, setExpectedDeliveries] = useState<ExpectedDelivery[]>([]);

  // Complaints, Maintenance, and Society Notices
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  // Forms and Modals
  const [showFileComplaintModal, setShowFileComplaintModal] = useState(false);
  const [cmpTitle, setCmpTitle] = useState('');
  const [cmpCategory, setCmpCategory] = useState<Complaint['category']>('PLUMBING');
  const [cmpPriority, setCmpPriority] = useState<Complaint['priority']>('MEDIUM');
  const [cmpDesc, setCmpDesc] = useState('');

  const [payingBill, setPayingBill] = useState<MaintenanceRecord | null>(null);
  const [payMethod, setPayMethod] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [noticeFilter, setNoticeFilter] = useState<string>('ALL');

  useEffect(() => {
    const unsubComp = complaintService.subscribeComplaints(currentSocietyId, (data) => {
      if (data.length === 0) {
        setComplaints([
          {
            id: 'cmp_001',
            societyId: currentSocietyId,
            flatId: 'flat_b504',
            flatNumber: 'B-504',
            residentId: currentUser.uid,
            residentName: currentUser.displayName || 'Resident',
            title: 'Water Seepage in Master Bathroom',
            description: 'Water leaking from upper flat wall tile joint. Need plumber inspection.',
            category: 'PLUMBING',
            priority: 'HIGH',
            status: 'IN_PROGRESS',
            assignedToName: 'Ramesh Plumber',
            createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 'cmp_002',
            societyId: currentSocietyId,
            flatId: 'flat_b504',
            flatNumber: 'B-504',
            residentId: currentUser.uid,
            residentName: currentUser.displayName || 'Resident',
            title: 'Corridor Tube Light Flickering',
            description: '5th Floor Wing B corridor LED fixture needs replacement.',
            category: 'ELECTRICAL',
            priority: 'LOW',
            status: 'OPEN',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      } else {
        setComplaints(data);
      }
    });

    const unsubMaint = maintenanceService.subscribeMaintenanceRecords(currentSocietyId, (data) => {
      if (data.length === 0) {
        setMaintenanceRecords([
          {
            id: 'maint_001',
            societyId: currentSocietyId,
            flatId: 'flat_b504',
            flatNumber: 'B-504',
            residentName: currentUser.displayName || 'Resident',
            amount: 4500,
            dueDate: '2026-07-31',
            month: 'July',
            year: 2026,
            status: 'UNPAID',
            createdAt: new Date().toISOString()
          },
          {
            id: 'maint_002',
            societyId: currentSocietyId,
            flatId: 'flat_b504',
            flatNumber: 'B-504',
            residentName: currentUser.displayName || 'Resident',
            amount: 4500,
            dueDate: '2026-06-30',
            month: 'June',
            year: 2026,
            status: 'PAID',
            paidAt: '2026-06-25T14:20:00.000Z',
            paymentMode: 'UPI',
            transactionId: 'UPI-9820319208',
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
          }
        ]);
      } else {
        setMaintenanceRecords(data);
      }
    });

    const unsubNotices = noticeService.subscribeNotices(currentSocietyId, (data) => {
      if (data.length === 0) {
        setNotices([
          {
            id: 'not_001',
            societyId: currentSocietyId,
            title: 'Annual General Body Meeting (AGM) 2026',
            content: 'The 15th Annual General Body Meeting of Gokuldham Society will be held on Sunday at 10:00 AM at the Clubhouse Auditorium. All flat owners are requested to attend.',
            category: 'MEETING',
            createdBy: 'sec_001',
            creatorName: 'Society Managing Committee',
            targetRoles: ['RESIDENT'],
            isPinned: true,
            createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 3 * 86400000).toISOString()
          },
          {
            id: 'not_002',
            societyId: currentSocietyId,
            title: 'Monsoon Water Tank Hygiene & Cleaning',
            content: 'Overhead water tanks will undergo deep chemical cleaning on Thursday. Water supply will remain offline between 2:00 PM - 5:00 PM. Please store sufficient water.',
            category: 'MAINTENANCE',
            createdBy: 'sec_001',
            creatorName: 'Estate Manager',
            targetRoles: ['RESIDENT'],
            isPinned: false,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
      } else {
        setNotices(data);
      }
    });

    return () => {
      unsubComp();
      unsubMaint();
      unsubNotices();
    };
  }, [currentSocietyId, currentUser.uid, currentUser.displayName]);

  // Persistent Family & Vehicles (Stored in localStorage, isolated by user uid)
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // UI Flow overlays/Modals inside the smartphone view
  const [showNotificationTray, setShowNotificationTray] = useState(false);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [activePushNotification, setActivePushNotification] = useState<{title: string, body: string} | null>(null);
  
  // Create / Edit Modals inside Smartphone view
  const [openModalType, setOpenModalType] = useState<
    'pre_approve' | 'schedule_delivery' | 'add_family' | 'edit_family' | 'add_vehicle' | 'edit_vehicle' | 'none'
  >('none');
  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);

  // Form states inside Smartphone
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRelation, setFormRelation] = useState('Spouse');
  const [formAvatar, setFormAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');
  
  const [formVehicleNum, setFormVehicleNum] = useState('');
  const [formVehicleType, setFormVehicleType] = useState('FOUR_WHEELER');
  const [formParking, setFormParking] = useState('');
  const [formVehicleBrand, setFormVehicleBrand] = useState('');

  const [formVisitorName, setFormVisitorName] = useState('');
  const [formVisitorPhone, setFormVisitorPhone] = useState('');
  const [formVisitorType, setFormVisitorType] = useState(VisitorType.GUEST);
  const [formVisitorPurpose, setFormVisitorPurpose] = useState('');
  const [formVisitorDate, setFormVisitorDate] = useState(new Date().toISOString().split('T')[0]);
  const [formVisitorTime, setFormVisitorTime] = useState('18:00');
  const [formVisitorGuests, setFormVisitorGuests] = useState(1);
  const [formVisitorOtp, setFormVisitorOtp] = useState(false);

  const [formDelCompany, setFormDelCompany] = useState('Amazon');
  const [formDelDate, setFormDelDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDelTime, setFormDelTime] = useState('14:00');
  const [formDelTracking, setFormDelTracking] = useState('');

  // Digital pass popup / view
  const [generatedPass, setGeneratedPass] = useState<PreApprovedPass | null>(null);

  // SOS state
  const [sosActive, setSosActive] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const [activeDialerCall, setActiveDialerCall] = useState<{name: string, number: string} | null>(null);

  // Notifications Array
  const [inAppNotifications, setInAppNotifications] = useState<any[]>([
    { id: '1', title: 'Welcome to OmniGate Mobile', body: 'Manage security, visitors, and deliveries on the go!', time: '10:00 AM', read: false },
    { id: '2', title: 'Maintenance Notice', body: 'Water supply offline on Thursday between 2 PM - 5 PM for tank hygiene.', time: 'Yesterday', read: true }
  ]);

  // Audio trigger abstraction
  const playAppSound = (type: 'chime' | 'sos' | 'click' | 'success') => {
    if (soundsEnabled) playSound(type);
  };

  // References for comparison to trigger live sliding Push Notifications
  const prevPendingVisitorsRef = useRef<string[]>([]);
  const prevPendingDeliveriesRef = useRef<string[]>([]);

  // Localisation helper
  const t = (key: string) => {
    return translations[appLang]?.[key] || translations['en']?.[key] || key;
  };

  // Default fallback records for zero-state or loading state
  const defaultFallbackFlat = {
    id: 'flat_gw_b_504',
    societyId: currentSocietyId || 'soc_greenwood_101',
    blockId: 'blk_gw_b',
    flatNumber: 'B-504',
    floor: 5,
    ownerName: currentUser.displayName || 'Resident',
    status: 'occupied',
    createdAt: new Date().toISOString()
  };

  const defaultFallbackBlock = {
    id: 'blk_gw_b',
    societyId: currentSocietyId || 'soc_greenwood_101',
    name: 'Block B',
    code: 'B',
    totalFloors: 10,
    status: 'ACTIVE',
    floors: [],
    createdAt: new Date().toISOString()
  };

  // Fetch resident record for flat context
  const residents = societyService.getResidents(currentSocietyId);
  const residentRecord = residents.find(r => r.id === currentUser.uid || r.email === currentUser.email) || residents[0];
  const flats = societyService.getFlats(currentSocietyId);
  const flatRecord = flats.find(f => f.id === residentRecord?.flatId) || flats[0] || defaultFallbackFlat;
  const towers = societyService.getTowers(currentSocietyId);
  const blockRecord = towers.find(b => b.id === flatRecord?.blockId) || towers[0] || defaultFallbackBlock;

  // Load family and vehicle persistence
  useEffect(() => {
    const keyFam = `omnigate_family_v5_${currentUser.uid}`;
    const keyVeh = `omnigate_vehicles_v5_${currentUser.uid}`;
    
    // Set default family
    if (!localStorage.getItem(keyFam)) {
      const initialFam = [
        { id: 'fam_1', name: 'Anjali Mehta', relationship: 'Spouse', phone: '+91 98334 11223', photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
        { id: 'fam_2', name: 'Bhavna Mehta', relationship: 'Parent', phone: '+91 98334 44556', photoURL: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150' }
      ];
      localStorage.setItem(keyFam, JSON.stringify(initialFam));
    }
    
    // Set default vehicles
    if (!localStorage.getItem(keyVeh)) {
      const initialVeh = [
        { id: 'veh_1', brand: 'Honda City (Grey)', vehicleType: 'FOUR_WHEELER', vehicleNumber: 'MH-02-EE-1122', parkingSlot: 'Slot B-504, Underground P1' }
      ];
      localStorage.setItem(keyVeh, JSON.stringify(initialVeh));
    }

    setFamilyMembers(JSON.parse(localStorage.getItem(keyFam) || '[]'));
    setVehicles(JSON.parse(localStorage.getItem(keyVeh) || '[]'));
  }, [currentUser.uid]);

  // Live Firebase/Local Service subscriptions
  useEffect(() => {
    visitorService.init();
    deliveryService.init(currentSocietyId);

    const targetFlatId = flatRecord.id;

    // Subscribe Visitor logs
    const unsubVisitors = visitorService.subscribe(() => {
      const allLogs = visitorService.getVisitorLogs(currentSocietyId);
      // Filter only for this resident's flat
      const myLogs = allLogs.filter(log => log.flatId === targetFlatId);
      setVisitorLogs(myLogs);

      const allPasses = visitorService.getPreApprovedPasses(currentSocietyId);
      const myPasses = allPasses.filter(p => p.flatId === targetFlatId);
      setPreApprovedPasses(myPasses);
    });

    // Subscribe Delivery logs
    const unsubDeliveries = deliveryService.subscribeDeliveries(currentSocietyId, (deliveries) => {
      const myDels = deliveries.filter(d => d.flatId === targetFlatId);
      setDeliveryLogs(myDels);
    });

    // Subscribe Expected Deliveries
    const unsubExpected = deliveryService.subscribeExpectedDeliveries(currentSocietyId, (expected) => {
      const myExp = expected.filter(e => e.flatId === targetFlatId);
      setExpectedDeliveries(myExp);
    });

    // Force initial read
    const initialLogs = visitorService.getVisitorLogs(currentSocietyId).filter(log => log.flatId === targetFlatId);
    setVisitorLogs(initialLogs);
    setPreApprovedPasses(visitorService.getPreApprovedPasses(currentSocietyId).filter(p => p.flatId === targetFlatId));

    return () => {
      unsubVisitors();
      unsubDeliveries();
      unsubExpected();
    };
  }, [currentSocietyId, flatRecord.id]);

  // Handle Real-Time Push Notification Alerts
  useEffect(() => {
    const pendingVisitors = visitorLogs.filter(l => l.status === 'PENDING');
    const pendingDeliveries = deliveryLogs.filter(l => l.status === 'PENDING');

    // Detect new pending visitors
    const currentVisIds = pendingVisitors.map(v => v.id);
    const newVisitors = currentVisIds.filter(id => !prevPendingVisitorsRef.current.includes(id));
    
    if (newVisitors.length > 0) {
      const freshVis = pendingVisitors.find(v => v.id === newVisitors[0]);
      if (freshVis) {
        triggerPushAlert(
          `👤 Guest Request: ${freshVis.visitorName}`,
          `Standing at ${blockRecord.name} main gate. Please approve or deny entry.`
        );
      }
    }
    prevPendingVisitorsRef.current = currentVisIds;

    // Detect new pending deliveries
    const currentDelIds = pendingDeliveries.map(d => d.id);
    const newDeliveries = currentDelIds.filter(id => !prevPendingDeliveriesRef.current.includes(id));

    if (newDeliveries.length > 0) {
      const freshDel = pendingDeliveries.find(d => d.id === newDeliveries[0]);
      if (freshDel) {
        triggerPushAlert(
          `📦 Parcel Arrival: ${freshDel.companyName}`,
          `Delivery agent ${freshDel.deliveryPersonName} requested entry. Approve or Leave at Gate.`
        );
      }
    }
    prevPendingDeliveriesRef.current = currentDelIds;

  }, [visitorLogs, deliveryLogs, blockRecord.name]);

  const triggerPushAlert = (title: string, body: string) => {
    playAppSound('chime');
    setActivePushNotification({ title, body });
    // Add to notification array
    setInAppNotifications(prev => [
      { id: Date.now().toString(), title, body, time: 'Just Now', read: false },
      ...prev
    ]);
    setTimeout(() => {
      setActivePushNotification(null);
    }, 5500);
  };

  // Synchronize Offline queue
  const toggleOfflineMode = async () => {
    playAppSound('click');
    const newOffline = !isOffline;
    setIsOffline(newOffline);
    
    visitorService.setOffline(newOffline);
    deliveryService.setOffline(newOffline);

    if (!newOffline) {
      // Syncing
      triggerPushAlert("Syncing Data...", "Connecting with Firestore database nodes...");
      await new Promise(resolve => setTimeout(resolve, 1200));
      const syncedVisitors = await visitorService.syncOfflineQueue();
      await deliveryService.syncOfflineQueue();
      
      triggerPushAlert(
        "Cloud Synced Successfully", 
        `All cached changes written to Firestore database. Security rules verified.`
      );
    }
  };

  // Core Actions
  const handleApproveVisitor = async (id: string) => {
    playAppSound('success');
    await visitorService.updateVisitorLogStatus(id, 'APPROVED');
    // Simulate push dismiss
    setActivePushNotification(null);
  };

  const handleRejectVisitor = async (id: string) => {
    playAppSound('click');
    await visitorService.updateVisitorLogStatus(id, 'REJECTED');
    setActivePushNotification(null);
  };

  const handleUpdateDelivery = async (id: string, status: DeliveryLog['status']) => {
    playAppSound('success');
    await deliveryService.updateDeliveryStatus(currentSocietyId, id, status);
    setActivePushNotification(null);
  };

  // Form Submissions
  const handlePreApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVisitorName || !formVisitorPhone || !formVisitorPurpose) return;

    playAppSound('success');
    const newPass = await visitorService.addPreApprovedPass({
      societyId: currentSocietyId,
      flatId: flatRecord.id,
      flatNumber: flatRecord.flatNumber,
      blockId: blockRecord.id,
      residentId: currentUser.uid,
      visitorName: formVisitorName,
      visitorPhone: formVisitorPhone,
      purpose: formVisitorPurpose,
      date: formVisitorDate,
      time: formVisitorTime,
      numberOfGuests: formVisitorGuests,
    });

    setGeneratedPass(newPass);
    setOpenModalType('none');
    
    // Reset forms
    setFormVisitorName('');
    setFormVisitorPhone('');
    setFormVisitorPurpose('');
    setFormVisitorGuests(1);
  };

  const handleScheduleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDelCompany) return;

    playAppSound('success');
    await deliveryService.addExpectedDelivery(currentSocietyId, {
      societyId: currentSocietyId,
      flatId: flatRecord.id,
      flatNumber: flatRecord.flatNumber,
      blockId: blockRecord.id,
      blockName: blockRecord.name,
      residentId: currentUser.uid,
      residentName: currentUser.displayName,
      companyName: formDelCompany,
      expectedDate: formDelDate,
      expectedTime: formDelTime,
      trackingNumber: formDelTracking || undefined,
      status: 'EXPECTED'
    });

    setOpenModalType('none');
    setFormDelTracking('');
    triggerPushAlert("Parcel Expected", `Your Swiggy/Amazon delivery is scheduled at the main gate.`);
  };

  const handleFileComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpTitle.trim()) return;

    playAppSound('success');
    const newComp = await complaintService.addComplaint({
      societyId: currentSocietyId,
      flatId: flatRecord.id || 'flat_b504',
      flatNumber: flatRecord.flatNumber || 'B-504',
      residentId: currentUser.uid,
      residentName: currentUser.displayName || 'Resident',
      title: cmpTitle,
      category: cmpCategory,
      priority: cmpPriority,
      description: cmpDesc
    });

    setComplaints(prev => [newComp, ...prev]);
    setShowFileComplaintModal(false);
    setCmpTitle('');
    setCmpDesc('');
    triggerPushAlert("Complaint Filed", `Your complaint #${newComp.id.slice(-4)} has been logged.`);
  };

  const handlePayBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    playAppSound('success');
    const txnId = 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    await maintenanceService.markAsPaid(payingBill.id, payMethod, txnId);

    setMaintenanceRecords(prev => prev.map(m => m.id === payingBill.id ? {
      ...m,
      status: 'PAID',
      paidAt: new Date().toISOString(),
      paymentMode: payMethod,
      transactionId: txnId
    } : m));

    setPayingBill(null);
    triggerPushAlert("Payment Received", `Bill for ${payingBill.month} ${payingBill.year} marked as PAID. Receipt #${txnId}`);
  };

  // CRUD Family
  const handleAddFamilySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone) return;

    playAppSound('success');
    const keyFam = `omnigate_family_v5_${currentUser.uid}`;
    const newMember = {
      id: 'fam_' + Date.now(),
      name: formName,
      relationship: formRelation,
      phone: formPhone,
      photoURL: formAvatar
    };

    const updated = [...familyMembers, newMember];
    localStorage.setItem(keyFam, JSON.stringify(updated));
    setFamilyMembers(updated);
    setOpenModalType('none');
    
    setFormName('');
    setFormPhone('');
  };

  const handleDeleteFamily = (id: string) => {
    playAppSound('click');
    const keyFam = `omnigate_family_v5_${currentUser.uid}`;
    const updated = familyMembers.filter(item => item.id !== id);
    localStorage.setItem(keyFam, JSON.stringify(updated));
    setFamilyMembers(updated);
  };

  // CRUD Vehicles
  const handleAddVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formVehicleNum || !formVehicleBrand) return;

    playAppSound('success');
    const keyVeh = `omnigate_vehicles_v5_${currentUser.uid}`;
    const newVeh = {
      id: 'veh_' + Date.now(),
      brand: formVehicleBrand,
      vehicleType: formVehicleType,
      vehicleNumber: formVehicleNum,
      parkingSlot: formParking || `Slot B-${flatRecord.flatNumber}`
    };

    const updated = [...vehicles, newVeh];
    localStorage.setItem(keyVeh, JSON.stringify(updated));
    setVehicles(updated);
    setOpenModalType('none');

    setFormVehicleNum('');
    setFormVehicleBrand('');
    setFormParking('');
  };

  const handleDeleteVehicle = (id: string) => {
    playAppSound('click');
    const keyVeh = `omnigate_vehicles_v5_${currentUser.uid}`;
    const updated = vehicles.filter(item => item.id !== id);
    localStorage.setItem(keyVeh, JSON.stringify(updated));
    setVehicles(updated);
  };

  // SOS long press or countdown logic
  const startSosTimer = () => {
    playAppSound('click');
    setSosCountdown(3);
  };

  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown === 0) {
      setSosActive(true);
      setSosCountdown(null);
      // Play siren loop
      playAppSound('sos');
      triggerPushAlert("🚨 SOS PANIC SIGNAL SENDING", `Broadcasted to Security Gate, Ambulance, and ${currentSociety?.name || 'Society'} Admin.`);
      return;
    }

    const interval = setTimeout(() => {
      setSosCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(interval);
  }, [sosCountdown]);

  const cancelSosTimer = () => {
    setSosCountdown(null);
  };

  // Global Search filter
  const getFilteredItems = () => {
    if (!activeSearchQuery) return { visitors: [], deliveries: [], family: [], cars: [] };
    const query = activeSearchQuery.toLowerCase();

    return {
      visitors: visitorLogs.filter(v => v.visitorName.toLowerCase().includes(query) || v.visitorPhone.includes(query)),
      deliveries: deliveryLogs.filter(d => d.companyName.toLowerCase().includes(query) || d.deliveryPersonName.toLowerCase().includes(query)),
      family: familyMembers.filter(f => f.name.toLowerCase().includes(query)),
      cars: vehicles.filter(c => c.brand.toLowerCase().includes(query) || c.vehicleNumber.toLowerCase().includes(query))
    };
  };

  const filteredData = getFilteredItems();

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      
      {/* LEFT: SIMULATOR WORKBENCH CONTROLS PANEL */}
      <div className="xl:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 h-fit shrink-0">
        <div>
          <span className="font-mono text-[9px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold">
            WORKBENCH
          </span>
          <h2 className="text-base font-sans font-bold text-slate-900 dark:text-white mt-2">
            Resident App Controls
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate offline queues, change responsive frame models, toggles audio cues, and localized translation dictionaries.
          </p>
        </div>

        {/* Device Frame selection */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
            {t('deviceFrame')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { playAppSound('click'); setDeviceFrame('iphone'); }}
              className={`px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                deviceFrame === 'iphone'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              📱 iPhone 15
            </button>
            <button
              onClick={() => { playAppSound('click'); setDeviceFrame('android'); }}
              className={`px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                deviceFrame === 'android'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🤖 Pixel 8
            </button>
            <button
              onClick={() => { playAppSound('click'); setDeviceFrame('tablet'); }}
              className={`px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                deviceFrame === 'tablet'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              平板 iPad
            </button>
            <button
              onClick={() => { playAppSound('click'); setDeviceFrame('full'); }}
              className={`px-3 py-2 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                deviceFrame === 'full'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              🖥️ Fullscreen
            </button>
          </div>
        </div>

        {/* Network & Audio Simulator Switches */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Network Connection</p>
              <p className="text-[10px] text-slate-400">Toggle Firestore offline mode</p>
            </div>
            <button
              onClick={toggleOfflineMode}
              className={`w-12 h-6 rounded-full p-1 transition-all ${
                isOffline ? 'bg-red-500' : 'bg-emerald-500'
              }`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-all ${
                isOffline ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('soundState')}</p>
              <p className="text-[10px] text-slate-400">App chimes & SOS sirens</p>
            </div>
            <button
              onClick={() => setSoundsEnabled(!soundsEnabled)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-400 transition-colors"
            >
              {soundsEnabled ? <Volume2 className="w-4 h-4 text-indigo-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Live Active Gate Alerts Panel */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
            Active Gate Queue
          </p>
          
          {(visitorLogs.filter(v => v.status === 'PENDING').length === 0 && deliveryLogs.filter(d => d.status === 'PENDING').length === 0) ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-400 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-center">
              No walk-ins waiting at {currentSociety?.name || 'society'} gate right now.
            </div>
          ) : (
            <div className="space-y-2">
              {visitorLogs.filter(v => v.status === 'PENDING').map(vis => (
                <div key={vis.id} className="p-3 bg-amber-50 dark:bg-amber-950/15 border border-amber-200/50 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">Guest: {vis.visitorName}</span>
                    <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold font-mono">Gate</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleRejectVisitor(vis.id)}
                      className="flex-1 py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[10px] rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleApproveVisitor(vis.id)}
                      className="flex-1 py-1 bg-green-600 hover:bg-green-500 text-white font-bold text-[10px] rounded-lg transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              ))}

              {deliveryLogs.filter(d => d.status === 'PENDING').map(del => (
                <div key={del.id} className="p-3 bg-amber-50 dark:bg-amber-950/15 border border-amber-200/50 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-white">Parcel: {del.companyName}</span>
                    <span className="bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold font-mono">Gate</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleUpdateDelivery(del.id, 'REJECTED')}
                      className="py-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-[9px] rounded-lg transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleUpdateDelivery(del.id, 'APPROVED')}
                      className="py-1 bg-green-600 hover:bg-green-500 text-white font-bold text-[9px] rounded-lg transition-colors"
                    >
                      Allow
                    </button>
                    <button
                      onClick={() => handleUpdateDelivery(del.id, 'LEAVE_AT_GATE')}
                      className="col-span-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-[9px] rounded-lg transition-colors"
                    >
                      Leave at Gate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: SMARTPHONE & RESPONSIVE CANVAS AREA */}
      <div className="flex-grow flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 transition-colors min-h-[750px] relative overflow-hidden">
        
        {/* Device frame Wrapper */}
        <div className={`transition-all duration-500 flex flex-col items-center ${
          deviceFrame === 'iphone'
            ? 'w-[390px] h-[780px] bg-slate-950 dark:bg-slate-900 p-3 rounded-[52px] border-[6px] border-slate-800 shadow-2xl relative'
            : deviceFrame === 'android'
            ? 'w-[380px] h-[780px] bg-slate-950 p-2.5 rounded-[40px] border-[5px] border-slate-800 shadow-2xl relative'
            : deviceFrame === 'tablet'
            ? 'w-[680px] h-[920px] bg-slate-950 p-4 rounded-[32px] border-[10px] border-slate-800 shadow-2xl relative'
            : 'w-full h-full min-h-[680px] rounded-2xl bg-slate-50 dark:bg-slate-900 p-0 shadow-none'
        }`}>
          
          {/* Device Hardware elements */}
          {deviceFrame === 'iphone' && (
            <>
              {/* Dynamic Island Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-50 flex items-center justify-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-full"></div>
                <div className="w-1.5 h-1.5 bg-indigo-950 rounded-full"></div>
              </div>
              {/* Power button */}
              <div className="absolute right-[-9px] top-32 w-[3px] h-14 bg-slate-700 rounded-l"></div>
              {/* Volume buttons */}
              <div className="absolute left-[-9px] top-28 w-[3px] h-8 bg-slate-700 rounded-r"></div>
              <div className="absolute left-[-9px] top-40 w-[3px] h-12 bg-slate-700 rounded-r"></div>
              <div className="absolute left-[-9px] top-56 w-[3px] h-12 bg-slate-700 rounded-r"></div>
            </>
          )}

          {deviceFrame === 'android' && (
            <>
              {/* Center punch-hole camera */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full z-50"></div>
              {/* Power button */}
              <div className="absolute right-[-8px] top-36 w-[3px] h-10 bg-slate-700 rounded-l"></div>
              {/* Volume rocker */}
              <div className="absolute right-[-8px] top-52 w-[3px] h-16 bg-slate-700 rounded-l"></div>
            </>
          )}

          {/* INTERNAL MOBILE APPLICATION VIEW */}
          <div className={`w-full h-full flex flex-col overflow-hidden relative transition-colors ${
            appTheme === 'dark' ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
          } ${
            deviceFrame === 'iphone' ? 'rounded-[40px]' : deviceFrame === 'android' ? 'rounded-[32px]' : 'rounded-2xl'
          }`}>
            
            {/* IN-APP STATUS BAR */}
            {deviceFrame !== 'full' && (
              <div className={`px-6 pt-3 pb-1.5 flex justify-between items-center text-[10px] font-sans font-bold z-40 select-none ${
                appTheme === 'dark' ? 'bg-slate-950/80 text-white/90' : 'bg-slate-50/80 text-slate-800/90'
              }`}>
                {/* Simulated Time */}
                <span>10:00 AM</span>
                
                {/* Dynamic island spacer (iphone only) */}
                {deviceFrame === 'iphone' && <div className="w-24"></div>}
                
                {/* Carrier & Icons */}
                <div className="flex items-center gap-1">
                  <span>{t('carrierSim')}</span>
                  {isOffline ? <span className="text-red-500 font-bold font-mono">OFFLINE</span> : <Wifi className="w-3 h-3 text-emerald-500" />}
                  <Signal className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5 rotate-90 text-indigo-500" />
                </div>
              </div>
            )}

            {/* APP REAL-TIME OFFLINE BAR */}
            {isOffline && (
              <div className="bg-red-500 text-white font-mono text-[9px] font-bold py-1 text-center select-none animate-pulse z-40 flex items-center justify-center gap-1 shadow-sm">
                <AlertTriangle className="w-3 h-3" /> {t('activeOffline')}
              </div>
            )}

            {/* REAL-TIME SLIDING PUSH NOTIFICATION ALERT */}
            <AnimatePresence>
              {activePushNotification && (
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  onClick={() => { playAppSound('click'); setShowNotificationTray(true); setActivePushNotification(null); }}
                  className="absolute top-12 left-3 right-3 bg-white/95 dark:bg-slate-900/95 border border-indigo-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl z-50 cursor-pointer backdrop-blur-md"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <BellRing className="w-4 h-4 animate-swing" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-950 dark:text-white truncate">
                        {activePushNotification.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                        {activePushNotification.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* APP TOP BAR */}
            <header className={`px-4 py-3 flex justify-between items-center border-b z-30 ${
              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xs font-bold font-sans tracking-wide">
                    {t('dashboardTitle')}
                  </h1>
                  <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider">
                    {blockRecord.name} • {flatRecord.flatNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Sync badge */}
                <div className={`p-1 rounded-full ${isOffline ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-red-500' : 'bg-emerald-500 animate-ping'}`}></div>
                </div>

                {/* Notifications Bell */}
                <button
                  onClick={() => { playAppSound('click'); setShowNotificationTray(!showNotificationTray); }}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative transition-colors"
                >
                  <BellRing className="w-4 h-4" />
                  {inAppNotifications.some(n => !n.read) && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                  )}
                </button>
              </div>
            </header>

            {/* MAIN APP SCROLLABLE AREA */}
            <div className={`flex-grow overflow-y-auto ${appTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'}`}>
              
              {/* Dynamic search bar results layer (if query typed) */}
              {activeSearchQuery ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
                      Search Results for "{activeSearchQuery}"
                    </p>
                    <button
                      onClick={() => { playAppSound('click'); setActiveSearchQuery(''); }}
                      className="text-[10px] font-bold text-indigo-500"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Visitors */}
                  {filteredData.visitors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">{t('visitors')}</p>
                      {filteredData.visitors.map(log => (
                        <div key={log.id} className="p-3 bg-white dark:bg-slate-900 border rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold">{log.visitorName}</p>
                            <p className="text-[9px] text-slate-400">📞 {log.visitorPhone} • {log.purpose}</p>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 uppercase font-bold">
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Deliveries */}
                  {filteredData.deliveries.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">{t('deliveries')}</p>
                      {filteredData.deliveries.map(log => (
                        <div key={log.id} className="p-3 bg-white dark:bg-slate-900 border rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="text-xs font-bold">{log.companyName}</p>
                            <p className="text-[9px] text-slate-400">{log.deliveryPersonName} • {log.deliveryPersonPhone}</p>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 uppercase font-bold">
                            {log.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Family */}
                  {filteredData.family.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">{t('familyMembers')}</p>
                      {filteredData.family.map(fam => (
                        <div key={fam.id} className="p-3 bg-white dark:bg-slate-900 border rounded-2xl flex items-center gap-3">
                          <img src={fam.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-xs font-bold">{fam.name}</p>
                            <p className="text-[9px] text-slate-400">{fam.relationship} • {fam.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Vehicles */}
                  {filteredData.cars.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase font-mono">{t('vehicles')}</p>
                      {filteredData.cars.map(veh => (
                        <div key={veh.id} className="p-3 bg-white dark:bg-slate-900 border rounded-2xl">
                          <p className="text-xs font-bold">{veh.brand}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{veh.vehicleNumber} • {veh.parkingSlot}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {Object.values(filteredData).every(arr => arr.length === 0) && (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      No matching records found. Try "Anjali" or "Amazon".
                    </div>
                  )}

                </div>
              ) : (
                <>
                  {/* TAB 1: HOME DASHBOARD */}
                  {activeTab === 'home' && (
                    <div className="p-4 space-y-5">
                      
                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder={t('searchPlaceholder')}
                          value={activeSearchQuery}
                          onChange={(e) => setActiveSearchQuery(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2 text-xs rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 border ${
                            appTheme === 'dark'
                              ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500'
                              : 'bg-white border-slate-150 text-slate-900 placeholder-slate-400'
                          }`}
                        />
                      </div>

                      {/* URGENT PENDING GATE ACTION CARD */}
                      {(visitorLogs.some(v => v.status === 'PENDING') || deliveryLogs.some(d => d.status === 'PENDING')) && (
                        <div className="bg-amber-500 text-white p-4 rounded-3xl space-y-3 shadow-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 animate-spin" />
                            <p className="text-[10px] uppercase font-mono tracking-wider font-bold">
                              {t('pendingApproval')}
                            </p>
                          </div>

                          <div className="space-y-2">
                            {/* Pending Visitors */}
                            {visitorLogs.filter(v => v.status === 'PENDING').map(vis => (
                              <div key={vis.id} className="bg-white/10 p-3 rounded-2xl flex flex-col gap-2">
                                <div className="flex gap-2 text-xs">
                                  <img src={vis.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                  <div className="min-w-0">
                                    <p className="font-bold truncate">{vis.visitorName}</p>
                                    <p className="text-[10px] opacity-80">Guest • Purpose: {vis.purpose}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleRejectVisitor(vis.id)}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-xl transition-colors cursor-pointer"
                                  >
                                    {t('reject')}
                                  </button>
                                  <button
                                    onClick={() => handleApproveVisitor(vis.id)}
                                    className="px-3 py-1 bg-white text-indigo-950 font-bold text-[10px] rounded-xl shadow-sm transition-colors cursor-pointer"
                                  >
                                    {t('approve')}
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Pending Deliveries */}
                            {deliveryLogs.filter(d => d.status === 'PENDING').map(del => (
                              <div key={del.id} className="bg-white/10 p-3 rounded-2xl flex flex-col gap-2">
                                <div className="flex gap-2 text-xs">
                                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white shrink-0">
                                    <Truck className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold truncate">{del.companyName}</p>
                                    <p className="text-[10px] opacity-80">Agent: {del.deliveryPersonName}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-1 text-[10px]">
                                  <button
                                    onClick={() => handleUpdateDelivery(del.id, 'REJECTED')}
                                    className="py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleUpdateDelivery(del.id, 'APPROVED')}
                                    className="py-1 bg-white text-indigo-900 font-bold rounded-xl text-center"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateDelivery(del.id, 'LEAVE_AT_GATE')}
                                    className="py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-center"
                                  >
                                    Gate
                                  </button>
                                  <button
                                    onClick={() => handleUpdateDelivery(del.id, 'LEAVE_AT_RECEPTION')}
                                    className="py-1 bg-indigo-800 hover:bg-indigo-700 text-white font-bold rounded-xl text-center"
                                  >
                                    Desk
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* QUICK ACTIONS ROW */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('quickActions')}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => { playAppSound('click'); setOpenModalType('pre_approve'); }}
                            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              appTheme === 'dark' ? 'bg-slate-900 hover:bg-slate-850' : 'bg-white hover:bg-slate-100'
                            } border border-slate-150 dark:border-slate-800`}
                          >
                            <QrCode className="w-4 h-4 text-indigo-600" />
                            <span className="text-[9px] font-bold tracking-tight text-center leading-none">Guest Pass</span>
                          </button>

                          <button
                            onClick={() => { playAppSound('click'); setOpenModalType('schedule_delivery'); }}
                            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              appTheme === 'dark' ? 'bg-slate-900 hover:bg-slate-850' : 'bg-white hover:bg-slate-100'
                            } border border-slate-150 dark:border-slate-800`}
                          >
                            <Truck className="w-4 h-4 text-emerald-600" />
                            <span className="text-[9px] font-bold tracking-tight text-center leading-none">Expected</span>
                          </button>

                          <button
                            onClick={() => { playAppSound('click'); setActiveTab('complaints'); }}
                            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              appTheme === 'dark' ? 'bg-slate-900 hover:bg-slate-850' : 'bg-white hover:bg-slate-100'
                            } border border-slate-150 dark:border-slate-800`}
                          >
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                            <span className="text-[9px] font-bold tracking-tight text-center leading-none">Complaints</span>
                          </button>

                          <button
                            onClick={() => { playAppSound('click'); setActiveTab('bills'); }}
                            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              appTheme === 'dark' ? 'bg-slate-900 hover:bg-slate-850' : 'bg-white hover:bg-slate-100'
                            } border border-slate-150 dark:border-slate-800`}
                          >
                            <Receipt className="w-4 h-4 text-emerald-500" />
                            <span className="text-[9px] font-bold tracking-tight text-center leading-none">Maintenance</span>
                          </button>

                          <button
                            onClick={() => { playAppSound('click'); setActiveTab('notices'); }}
                            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              appTheme === 'dark' ? 'bg-slate-900 hover:bg-slate-850' : 'bg-white hover:bg-slate-100'
                            } border border-slate-150 dark:border-slate-800`}
                          >
                            <Bell className="w-4 h-4 text-indigo-500" />
                            <span className="text-[9px] font-bold tracking-tight text-center leading-none">Notices</span>
                          </button>

                          <button
                            onClick={() => { playAppSound('click'); setOpenModalType('add_family'); }}
                            className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                              appTheme === 'dark' ? 'bg-slate-900 hover:bg-slate-850' : 'bg-white hover:bg-slate-100'
                            } border border-slate-150 dark:border-slate-800`}
                          >
                            <PlusCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-[9px] font-bold tracking-tight text-center leading-none">Add Family</span>
                          </button>
                        </div>
                      </div>

                      {/* UPCOMING / PRE-APPROVED PASSES */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                            {t('upcomingVisitors')}
                          </p>
                          <span className="text-[9px] text-indigo-500 font-bold font-mono">
                            {preApprovedPasses.length} Active
                          </span>
                        </div>

                        {preApprovedPasses.length === 0 ? (
                          <div className={`p-4 rounded-2xl text-center text-slate-400 text-[11px] border border-dashed ${
                            appTheme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                          }`}>
                            {t('noUpcoming')}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {preApprovedPasses.map(pass => (
                              <div
                                key={pass.id}
                                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                                  appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600">
                                    <QrCode className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold">{pass.visitorName}</p>
                                    <p className="text-[10px] text-slate-400">Date: {pass.date} • Code: {pass.qrCode}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => { playAppSound('click'); setGeneratedPass(pass); }}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-[10px] rounded-xl transition-colors"
                                >
                                  View QR
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* EXPECTED DELIVERIES */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('expectedDeliveries')}
                        </p>
                        {expectedDeliveries.length === 0 ? (
                          <div className={`p-4 rounded-2xl text-center text-slate-400 text-[11px] border border-dashed ${
                            appTheme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
                          }`}>
                            {t('noDeliveries')}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {expectedDeliveries.map(del => (
                              <div
                                key={del.id}
                                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                                  appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600">
                                    <Truck className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold">{del.companyName}</p>
                                    <p className="text-[10px] text-slate-400">Time: {del.expectedTime} • Status: {del.status}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    playAppSound('click');
                                    await deliveryService.deleteExpectedDelivery(currentSocietyId, del.id);
                                    triggerPushAlert("Deleted Schedule", "Expected parcel deleted from society registry.");
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* SOCIETY ANNOUNCEMENTS */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('societyAnnouncements')}
                        </p>
                        <div className={`p-4 rounded-3xl space-y-3 border ${
                          appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                        }`}>
                          <div className="flex gap-2">
                            <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <div className="text-[11px]">
                              <p className="font-bold">Water Maintenance scheduled</p>
                              <p className="text-slate-400 mt-0.5">Water supply offline on Thursday between 2 PM - 5 PM for tank hygiene.</p>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-[11px]">
                              <p className="font-bold">Ganesh Utsav Planning Meeting</p>
                              <p className="text-slate-400 mt-0.5">Society committee meeting tonight at 8 PM in the club house.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* RECENT HISTORIC LOGS SIMULATION */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('recentVisitors')}
                        </p>
                        {visitorLogs.filter(v => v.status !== 'PENDING').slice(0, 2).length === 0 ? (
                          <div className="p-3 text-center text-slate-400 text-[10px]">
                            {t('noRecentVis')}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {visitorLogs.filter(v => v.status !== 'PENDING').slice(0, 2).map(v => (
                              <div key={v.id} className="p-2.5 bg-slate-100/50 dark:bg-slate-900 rounded-xl flex items-center justify-between text-[11px]">
                                <div>
                                  <p className="font-bold">{v.visitorName}</p>
                                  <p className="text-[10px] text-slate-400">{v.visitorType} • {new Date(v.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                  v.status === 'APPROVED' || v.status === 'CHECKED_IN' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {v.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* TAB 2: VISITORS DIRECTORY */}
                  {activeTab === 'visitors' && (
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-sm font-sans font-bold">{t('visitors')}</h2>
                        <button
                          onClick={() => { playAppSound('click'); setOpenModalType('pre_approve'); }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold inline-flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Pre-Approve
                        </button>
                      </div>

                      {/* Tabs inside Visitors */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('activePasses')}
                        </p>
                        
                        {preApprovedPasses.map(pass => (
                          <div
                            key={pass.id}
                            className={`p-3 rounded-2xl border ${
                              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            } space-y-2.5`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{pass.visitorName}</p>
                                <p className="text-[10px] text-slate-400">📞 {pass.visitorPhone} • Pass: {pass.qrCode}</p>
                              </div>
                              <span className="text-[9px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase">
                                {pass.status}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-850 text-[10px]">
                              <span className="text-slate-400">Valid on {pass.date} at {pass.time}</span>
                              <button
                                onClick={() => { playAppSound('click'); setGeneratedPass(pass); }}
                                className="text-indigo-600 dark:text-indigo-400 font-bold"
                              >
                                Display QR
                              </button>
                            </div>
                          </div>
                        ))}

                        {preApprovedPasses.length === 0 && (
                          <p className="text-slate-400 text-xs py-4 text-center">No active pre-approved guest passes.</p>
                        )}
                      </div>

                      {/* Visitor History */}
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('history')}
                        </p>
                        <div className="space-y-2">
                          {visitorLogs.map(log => (
                            <div
                              key={log.id}
                              className={`p-3 rounded-2xl border ${
                                appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                              } flex justify-between items-center`}
                            >
                              <div>
                                <p className="text-xs font-bold">{log.visitorName}</p>
                                <p className="text-[9px] text-slate-400">📞 {log.visitorPhone} • {log.purpose}</p>
                                <p className="text-[8px] text-slate-500 font-mono mt-0.5">Entry: {new Date(log.createdAt).toLocaleDateString()}</p>
                              </div>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                                log.status === 'APPROVED' || log.status === 'CHECKED_IN'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
                                  : log.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 3: DELIVERIES DIRECTORY */}
                  {activeTab === 'deliveries' && (
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-sm font-sans font-bold">{t('deliveries')}</h2>
                        <button
                          onClick={() => { playAppSound('click'); setOpenModalType('schedule_delivery'); }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold inline-flex items-center gap-1 shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" /> Schedule Parcel
                        </button>
                      </div>

                      {/* Expected deliveries */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('expectedDeliveries')}
                        </p>
                        {expectedDeliveries.map(del => (
                          <div
                            key={del.id}
                            className={`p-3 rounded-2xl border ${
                              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            } flex justify-between items-center`}
                          >
                            <div>
                              <p className="text-xs font-bold">{del.companyName}</p>
                              <p className="text-[10px] text-slate-400">Tracking: {del.trackingNumber || 'N/A'}</p>
                              <p className="text-[9px] text-indigo-500">Scheduled: {del.expectedDate} {del.expectedTime}</p>
                            </div>
                            <button
                              onClick={async () => {
                                playAppSound('click');
                                await deliveryService.deleteExpectedDelivery(currentSocietyId, del.id);
                                triggerPushAlert("Parcel Cancelled", "Expected parcel deleted.");
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 rounded-xl"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        {expectedDeliveries.length === 0 && (
                          <p className="text-slate-400 text-xs py-4 text-center">No expected deliveries scheduled.</p>
                        )}
                      </div>

                      {/* Delivery History */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('history')}
                        </p>
                        <div className="space-y-2">
                          {deliveryLogs.map(log => (
                            <div
                              key={log.id}
                              className={`p-3 rounded-2xl border ${
                                appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                              } flex justify-between items-center`}
                            >
                              <div>
                                <p className="text-xs font-bold">{log.companyName}</p>
                                <p className="text-[9px] text-slate-400">{log.deliveryPersonName} • {log.deliveryPersonPhone}</p>
                                <p className="text-[8px] text-slate-500 mt-0.5">Time: {new Date(log.createdAt).toLocaleTimeString()}</p>
                              </div>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full uppercase ${
                                log.status === 'APPROVED' || log.status === 'CHECKED_IN'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950/40'
                                  : log.status === 'LEAVE_AT_GATE'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {log.status.replace('_', ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 4: SOS / EMERGENCY */}
                  {activeTab === 'emergency' && (
                    <div className="p-4 space-y-6 flex flex-col items-center">
                      
                      {/* Emergency Header */}
                      <div className="text-center">
                        <h2 className="text-sm font-sans font-bold text-red-600 dark:text-red-400 tracking-wider">
                          {t('sosButton')}
                        </h2>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                          Triggers immediate panic signals to security guards and committee office intercom.
                        </p>
                      </div>

                      {/* PULSING SOS TRIGGER BUTTON */}
                      <div className="relative my-4 flex items-center justify-center">
                        <AnimatePresence>
                          {sosCountdown !== null && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1.2, opacity: 0.3 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              className="absolute inset-0 bg-red-600 rounded-full animate-ping"
                            ></motion.div>
                          )}
                        </AnimatePresence>

                        <button
                          onMouseDown={startSosTimer}
                          onMouseUp={cancelSosTimer}
                          onTouchStart={startSosTimer}
                          onTouchEnd={cancelSosTimer}
                          className={`w-36 h-36 rounded-full flex flex-col items-center justify-center select-none cursor-pointer transition-all ${
                            sosActive 
                              ? 'bg-red-600 text-white animate-pulse border-4 border-white' 
                              : 'bg-red-500 hover:bg-red-600 text-white shadow-lg border-4 border-red-200 dark:border-red-950'
                          }`}
                        >
                          <ShieldAlert className="w-12 h-12 mb-1 animate-bounce" />
                          <span className="text-xs font-black tracking-widest">
                            {sosCountdown !== null ? t('holdCountdown').replace('{n}', String(sosCountdown)) : t('sosButton')}
                          </span>
                        </button>
                      </div>

                      <p className="text-[10px] text-center font-bold text-slate-400">
                        {sosActive ? "🚨 SOS Broadcast Active! Tap reset below to clear." : t('tapToTrigger')}
                      </p>

                      {sosActive && (
                        <button
                          onClick={() => { playAppSound('click'); setSosActive(false); }}
                          className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                        >
                          Reset Alarm
                        </button>
                      )}

                      {/* EMERGENCY SPEED DIALS */}
                      <div className="w-full space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          {t('emergencyContacts')}
                        </p>

                        <div className="space-y-1.5 text-xs">
                          <button
                            onClick={() => { playAppSound('click'); setActiveDialerCall({name: t('callSecurity'), number: '+91 22 2685 0101'}); }}
                            className={`w-full p-3 rounded-2xl border flex items-center justify-between font-bold transition-all ${
                              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            }`}
                          >
                            <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-indigo-500" /> {t('callSecurity')}</span>
                            <span className="text-[10px] text-slate-400 font-mono">+91 22 2685 0101</span>
                          </button>

                          <button
                            onClick={() => { playAppSound('click'); setActiveDialerCall({name: t('callOffice'), number: '+91 22 2685 0199'}); }}
                            className={`w-full p-3 rounded-2xl border flex items-center justify-between font-bold transition-all ${
                              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            }`}
                          >
                            <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-500" /> {t('callOffice')}</span>
                            <span className="text-[10px] text-slate-400 font-mono">+91 22 2685 0199</span>
                          </button>

                          <button
                            onClick={() => { playAppSound('click'); setActiveDialerCall({name: t('police'), number: '100'}); }}
                            className={`w-full p-3 rounded-2xl border flex items-center justify-between font-bold transition-all ${
                              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            }`}
                          >
                            <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-red-500" /> {t('police')}</span>
                            <span className="text-[10px] text-slate-400 font-mono">100</span>
                          </button>

                          <button
                            onClick={() => { playAppSound('click'); setActiveDialerCall({name: t('ambulance'), number: '102'}); }}
                            className={`w-full p-3 rounded-2xl border flex items-center justify-between font-bold transition-all ${
                              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            }`}
                          >
                            <span className="flex items-center gap-2"><PlusCircle className="w-4 h-4 text-blue-500" /> {t('ambulance')}</span>
                            <span className="text-[10px] text-slate-400 font-mono">102</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 5: PROFILE & SETTINGS */}
                  {activeTab === 'settings' && (
                    <div className="p-4 space-y-5">
                      
                      {/* User Profile Header */}
                      <div className="flex items-center gap-4 p-4 rounded-3xl bg-indigo-600 text-white relative overflow-hidden">
                        <img src={currentUser.photoURL} alt="" className="w-14 h-14 rounded-full border-2 border-white/50 object-cover" />
                        <div>
                          <p className="text-sm font-bold">{currentUser.displayName}</p>
                          <p className="text-[10px] opacity-90 font-mono">Flat {flatRecord.flatNumber} • {blockRecord.name}</p>
                          <p className="text-[9px] uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-md font-bold mt-1 inline-block">
                            PRIMARY RESIDENT
                          </p>
                        </div>
                      </div>

                      {/* RESIDENT DATA: FAMILY MEMBERS */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                            {t('familyMembers')}
                          </p>
                          <button
                            onClick={() => { playAppSound('click'); setOpenModalType('add_family'); }}
                            className="text-[10px] text-indigo-500 font-bold"
                          >
                            + Add New
                          </button>
                        </div>

                        <div className="space-y-2">
                          {familyMembers.map(item => (
                            <div
                              key={item.id}
                              className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                                appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <img src={item.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                                <div>
                                  <p className="text-xs font-bold">{item.name}</p>
                                  <p className="text-[10px] text-slate-400">{item.relationship} • {item.phone}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteFamily(item.id)}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* RESIDENT DATA: REGISTERED VEHICLES */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                            {t('vehicles')}
                          </p>
                          <button
                            onClick={() => { playAppSound('click'); setOpenModalType('add_vehicle'); }}
                            className="text-[10px] text-indigo-500 font-bold"
                          >
                            + Register
                          </button>
                        </div>

                        <div className="space-y-2">
                          {vehicles.map(item => (
                            <div
                              key={item.id}
                              className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                                appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                              }`}
                            >
                              <div>
                                <p className="text-xs font-bold">{item.brand}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-500">{item.vehicleNumber}</p>
                                <p className="text-[9px] text-slate-400 mt-0.5">{item.parkingSlot}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteVehicle(item.id)}
                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* SYSTEM PREFERENCES */}
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          Preferences & Settings
                        </p>

                        <div className={`p-4 rounded-3xl space-y-4 border ${
                          appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                        }`}>
                          
                          {/* Language Switch */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold flex items-center gap-2"><Languages className="w-4 h-4 text-indigo-500" /> {t('language')}</span>
                            <select
                              value={appLang}
                              onChange={(e) => { playAppSound('click'); setAppLang(e.target.value as any); }}
                              className="px-2 py-1 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
                            >
                              <option value="en">English</option>
                              <option value="hi">हिंदी (Hindi)</option>
                              <option value="es">Español</option>
                            </select>
                          </div>

                          {/* App theme Switch */}
                          <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-850">
                            <span className="font-bold">{t('theme')}</span>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                              <button
                                onClick={() => { playAppSound('click'); setAppTheme('light'); }}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg ${appTheme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                              >
                                Light
                              </button>
                              <button
                                onClick={() => { playAppSound('click'); setAppTheme('dark'); }}
                                className={`px-2 py-1 text-[10px] font-bold rounded-lg ${appTheme === 'dark' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-400'}`}
                              >
                                Dark
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 6: MY HELPDESK COMPLAINTS */}
                  {activeTab === 'complaints' && (
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-500" /> My Helpdesk Complaints
                          </h3>
                          <p className="text-[10px] text-slate-400">Track resolution status or log a new issue</p>
                        </div>
                        <button
                          onClick={() => { playAppSound('click'); setShowFileComplaintModal(true); }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> File Ticket
                        </button>
                      </div>

                      {/* Complaint Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className={`p-2.5 rounded-2xl border text-center ${appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                          <p className="text-xs font-bold text-amber-500">{complaints.filter(c => c.status === 'OPEN').length}</p>
                          <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Open</p>
                        </div>
                        <div className={`p-2.5 rounded-2xl border text-center ${appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                          <p className="text-xs font-bold text-blue-500">{complaints.filter(c => c.status === 'IN_PROGRESS').length}</p>
                          <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">In Progress</p>
                        </div>
                        <div className={`p-2.5 rounded-2xl border text-center ${appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'}`}>
                          <p className="text-xs font-bold text-emerald-500">{complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length}</p>
                          <p className="text-[9px] text-slate-400 font-mono font-bold uppercase">Resolved</p>
                        </div>
                      </div>

                      {/* Complaints List */}
                      <div className="space-y-3">
                        {complaints.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs">
                            No complaints logged yet. Everything running smoothly!
                          </div>
                        ) : (
                          complaints.map(item => (
                            <div
                              key={item.id}
                              className={`p-3.5 rounded-2xl border space-y-2 ${
                                appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-mono font-bold text-slate-400">
                                    Ticket #{item.id.slice(-6).toUpperCase()} • {item.category}
                                  </span>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                                    {item.title}
                                  </h4>
                                </div>
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                                  item.status === 'OPEN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' :
                                  item.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' :
                                  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                }`}>
                                  {item.status.replace('_', ' ')}
                                </span>
                              </div>

                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {item.description}
                              </p>

                              {item.assignedToName && (
                                <div className="text-[10px] bg-slate-50 dark:bg-slate-950 p-2 rounded-xl flex items-center justify-between font-mono text-slate-600 dark:text-slate-300">
                                  <span>Assigned Tech: <strong>{item.assignedToName}</strong></span>
                                  <span className="text-emerald-500 font-bold">In Resolution</span>
                                </div>
                              )}

                              <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-1">
                                <span>Priority: <strong className={item.priority === 'HIGH' || item.priority === 'URGENT' ? 'text-red-500' : 'text-slate-500'}>{item.priority}</strong></span>
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 7: MY MAINTENANCE & BILLS */}
                  {activeTab === 'bills' && (
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-emerald-500" /> Maintenance & Dues
                        </h3>
                        <p className="text-[10px] text-slate-400">Monthly society maintenance statements and receipts</p>
                      </div>

                      {/* Outstanding Dues Banner */}
                      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-3xl space-y-2 border border-slate-800 shadow-md">
                        <p className="text-[10px] font-mono uppercase font-bold text-indigo-300">Total Outstanding Amount</p>
                        <div className="flex justify-between items-baseline">
                          <p className="text-2xl font-bold font-mono text-emerald-400">
                            ₹ {maintenanceRecords.filter(m => m.status === 'UNPAID' || m.status === 'OVERDUE').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                          </p>
                          <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full">
                            Flat {flatRecord.flatNumber}
                          </span>
                        </div>
                      </div>

                      {/* Maintenance Records List */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                          Statement History
                        </p>

                        {maintenanceRecords.map(item => (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-2xl border space-y-3 ${
                              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {item.month} {item.year} Maintenance
                                </h4>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Due Date: {item.dueDate}
                                </p>
                              </div>
                              <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                                item.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 animate-pulse'
                              }`}>
                                {item.status}
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                                ₹ {item.amount.toLocaleString()}
                              </p>

                              {item.status === 'PAID' ? (
                                <div className="text-[9px] font-mono text-slate-400 text-right">
                                  <p className="text-emerald-500 font-bold flex items-center gap-1 justify-end">
                                    <CheckCircle2 className="w-3 h-3" /> Paid via {item.paymentMode || 'UPI'}
                                  </p>
                                  <p>{item.transactionId}</p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { playAppSound('click'); setPayingBill(item); }}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1 cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Pay Now
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 8: SOCIETY NOTICES */}
                  {activeTab === 'notices' && (
                    <div className="p-4 space-y-4">
                      <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                          <Bell className="w-4 h-4 text-indigo-500" /> Society Circulars & Notices
                        </h3>
                        <p className="text-[10px] text-slate-400">Official management announcements and circulars</p>
                      </div>

                      {/* Notices Feed */}
                      <div className="space-y-3">
                        {notices.map(item => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-3xl border space-y-2 relative overflow-hidden ${
                              item.isPinned
                                ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900/50'
                                : appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                            }`}
                          >
                            {item.isPinned && (
                              <span className="text-[8px] font-mono font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase absolute top-3 right-3">
                                Pinned Notice
                              </span>
                            )}

                            <span className="text-[9px] font-mono font-bold text-indigo-500 uppercase">
                              {item.category}
                            </span>

                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                              {item.title}
                            </h4>

                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {item.content}
                            </p>

                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800/50">
                              <span>By: {item.creatorName}</span>
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* IN-APP BOTTOM NAVIGATION BAR */}
            <nav className={`px-4 py-2 border-t flex justify-around select-none z-30 ${
              appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
            }`}>
              <button
                onClick={() => { playAppSound('click'); setActiveTab('home'); setActiveSearchQuery(''); }}
                className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'home' ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[9px] font-bold">{t('home')}</span>
              </button>

              <button
                onClick={() => { playAppSound('click'); setActiveTab('visitors'); setActiveSearchQuery(''); }}
                className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'visitors' ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <Users className="w-5 h-5" />
                <span className="text-[9px] font-bold">{t('visitors')}</span>
              </button>

              <button
                onClick={() => { playAppSound('click'); setActiveTab('deliveries'); setActiveSearchQuery(''); }}
                className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'deliveries' ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <Truck className="w-5 h-5" />
                <span className="text-[9px] font-bold">{t('deliveries')}</span>
              </button>

              <button
                onClick={() => { playAppSound('click'); setActiveTab('emergency'); setActiveSearchQuery(''); }}
                className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'emergency' ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
                <span className="text-[9px] font-bold text-red-500">{t('emergency')}</span>
              </button>

              <button
                onClick={() => { playAppSound('click'); setActiveTab('settings'); setActiveSearchQuery(''); }}
                className={`flex flex-col items-center gap-1 cursor-pointer ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <User className="w-5 h-5" />
                <span className="text-[9px] font-bold">{t('profile')}</span>
              </button>
            </nav>

            {/* iOS Home Indicator Bar */}
            {deviceFrame === 'iphone' && (
              <div className="py-2 flex justify-center bg-white dark:bg-slate-900">
                <div className="w-32 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
              </div>
            )}

            {/* MOCK CALLING DIALER MODAL OVERLAY */}
            <AnimatePresence>
              {activeDialerCall && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/95 z-50 flex flex-col justify-between p-8 text-center text-white font-sans select-none"
                >
                  <div className="space-y-2 mt-16">
                    <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto flex items-center justify-center text-indigo-400">
                      <Phone className="w-8 h-8 animate-wiggle" />
                    </div>
                    <p className="text-sm font-mono text-slate-400 uppercase tracking-widest pt-2">CALL SIMULATION</p>
                    <h3 className="text-xl font-bold">{activeDialerCall.name}</h3>
                    <p className="text-xs text-slate-400">{activeDialerCall.number}</p>
                  </div>

                  <div className="text-sm font-mono text-emerald-500 animate-pulse">
                    [ Active Call Connected via Society Intercom Line ]
                  </div>

                  <button
                    onClick={() => { playAppSound('click'); setActiveDialerCall(null); }}
                    className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full mx-auto mb-12 flex items-center justify-center shadow-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* IN-APP ALERTS TRAY DRAWERS */}
            <AnimatePresence>
              {showNotificationTray && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'tween' }}
                  className={`absolute inset-0 z-40 flex flex-col ${
                    appTheme === 'dark' ? 'bg-slate-950' : 'bg-slate-50'
                  }`}
                >
                  <header className={`p-4 flex items-center justify-between border-b ${
                    appTheme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-150'
                  }`}>
                    <button
                      onClick={() => { playAppSound('click'); setShowNotificationTray(false); }}
                      className="inline-flex items-center gap-1 text-xs font-bold"
                    >
                      <ArrowLeft className="w-4 h-4" /> {t('home')}
                    </button>
                    <h3 className="text-xs font-bold font-mono uppercase tracking-widest">{t('notifications')}</h3>
                    <button
                      onClick={() => {
                        playAppSound('click');
                        setInAppNotifications([]);
                      }}
                      className="text-[10px] text-red-500 font-bold"
                    >
                      Clear All
                    </button>
                  </header>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {inAppNotifications.map(item => (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                          appTheme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-150'
                        }`}
                      >
                        <div className="flex justify-between items-start font-bold">
                          <span>{item.title}</span>
                          <span className="text-[9px] text-slate-400 font-normal">{item.time}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">{item.body}</p>
                      </div>
                    ))}

                    {inAppNotifications.length === 0 && (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        No recent push updates received.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* GENERATED PASS QR CODE SUCCESS DIALOG */}
            <AnimatePresence>
              {generatedPass && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl w-full max-w-sm text-center space-y-5 text-slate-900 dark:text-white">
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono font-bold tracking-widest text-indigo-500 uppercase">DIGITIZED PASS TICKET</p>
                      <h3 className="text-base font-bold font-sans">Visitor Pre-Approved!</h3>
                    </div>

                    {/* QR Code Graphic Representation */}
                    <div className="w-44 h-44 bg-white p-3 rounded-2xl mx-auto border-4 border-slate-100 flex flex-col justify-between items-center relative overflow-hidden shadow-inner">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-500 animate-scan"></div>
                      
                      {/* Styled QR pattern blocks */}
                      <div className="grid grid-cols-5 gap-1.5 w-full h-full opacity-90 p-2">
                        <div className="border-[4px] border-black rounded-sm"></div>
                        <div className="bg-black rounded-sm"></div>
                        <div className="bg-black/30 rounded-sm"></div>
                        <div className="bg-black rounded-sm"></div>
                        <div className="border-[4px] border-black rounded-sm"></div>
                        
                        <div className="bg-black rounded-sm"></div>
                        <div className="bg-black/20 rounded-sm"></div>
                        <div className="bg-black rounded-sm"></div>
                        <div className="bg-black/45 rounded-sm"></div>
                        <div className="bg-black rounded-sm"></div>

                        <div className="bg-black/40 rounded-sm"></div>
                        <div className="border-[2px] border-black rounded-sm"></div>
                        <div className="bg-black rounded-sm"></div>
                        <div className="bg-black/50 rounded-sm"></div>
                        <div className="bg-black/10 rounded-sm"></div>

                        <div className="bg-black rounded-sm"></div>
                        <div className="bg-black/80 rounded-sm"></div>
                        <div className="bg-black rounded-sm"></div>
                        <div className="bg-black rounded-sm"></div>
                        <div className="bg-black/30 rounded-sm"></div>

                        <div className="border-[4px] border-black rounded-sm"></div>
                        <div className="bg-black/20 rounded-sm"></div>
                        <div className="bg-black rounded-sm"></div>
                        <div className="bg-black/70 rounded-sm"></div>
                        <div className="border-[4px] border-black rounded-sm"></div>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <p className="font-bold text-base">{generatedPass.visitorName}</p>
                      <p className="text-slate-400">Phone: {generatedPass.visitorPhone}</p>
                      <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-sm font-bold tracking-wider">
                        {generatedPass.qrCode}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400">
                      Valid on {generatedPass.date} • {generatedPass.time} • 1 Guest
                    </p>

                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          playAppSound('success');
                          navigator.clipboard.writeText(`${currentSociety?.name || 'Society'} Gate Pass: ${generatedPass.visitorName} Code: ${generatedPass.qrCode} on ${generatedPass.date}`);
                          triggerPushAlert("Pass Copied", "Text share format copied to clipboard!");
                        }}
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 text-indigo-600 text-xs font-bold rounded-xl inline-flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> {t('copypass')}
                      </button>
                      <button
                        onClick={() => { playAppSound('click'); setGeneratedPass(null); }}
                        className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FORM CREATOR SHEETS / MODALS */}
            <AnimatePresence>
              {openModalType !== 'none' && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25 }}
                  className={`absolute bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t p-6 space-y-4 max-h-[85%] overflow-y-auto ${
                    appTheme === 'dark' ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-150'
                  }`}
                >
                  {/* Handle Sheet drag bar */}
                  <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2"></div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-xs font-black font-mono uppercase tracking-widest text-slate-400">
                      {openModalType === 'pre_approve' ? t('preApproveBtn') : openModalType === 'schedule_delivery' ? t('addExpectedBtn') : openModalType === 'add_family' ? t('addMember') : t('addVehicle')}
                    </h3>
                    <button
                      onClick={() => { playAppSound('click'); setOpenModalType('none'); }}
                      className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* FORM 1: PRE-APPROVE GUEST */}
                  {openModalType === 'pre_approve' && (
                    <form onSubmit={handlePreApproveSubmit} className="space-y-3.5 text-xs text-left">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Guest Name</label>
                        <input
                          type="text"
                          required
                          value={formVisitorName}
                          onChange={(e) => setFormVisitorName(e.target.value)}
                          placeholder="e.g., Sundar Lal"
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Guest Phone</label>
                        <input
                          type="text"
                          required
                          value={formVisitorPhone}
                          onChange={(e) => setFormVisitorPhone(e.target.value)}
                          placeholder="e.g., +91 99881 22334"
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Purpose of Visit</label>
                        <input
                          type="text"
                          required
                          value={formVisitorPurpose}
                          onChange={(e) => setFormVisitorPurpose(e.target.value)}
                          placeholder="e.g., Dinner, Meeting, Maintenance"
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Date</label>
                          <input
                            type="date"
                            value={formVisitorDate}
                            onChange={(e) => setFormVisitorDate(e.target.value)}
                            className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Time</label>
                          <input
                            type="time"
                            value={formVisitorTime}
                            onChange={(e) => setFormVisitorTime(e.target.value)}
                            className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg mt-4 cursor-pointer"
                      >
                        Generate Pass QR
                      </button>
                    </form>
                  )}

                  {/* FORM 2: EXPECTED DELIVERY */}
                  {openModalType === 'schedule_delivery' && (
                    <form onSubmit={handleScheduleDeliverySubmit} className="space-y-3.5 text-xs text-left">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Company / Service</label>
                        <select
                          value={formDelCompany}
                          onChange={(e) => setFormDelCompany(e.target.value)}
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        >
                          <option value="Amazon">Amazon</option>
                          <option value="Swiggy">Swiggy Instamart</option>
                          <option value="Zomato">Zomato</option>
                          <option value="Blinkit">Blinkit</option>
                          <option value="Zepto">Zepto</option>
                          <option value="Flipkart">Flipkart</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Expected Date</label>
                          <input
                            type="date"
                            value={formDelDate}
                            onChange={(e) => setFormDelDate(e.target.value)}
                            className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Expected Time</label>
                          <input
                            type="time"
                            value={formDelTime}
                            onChange={(e) => setFormDelTime(e.target.value)}
                            className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Tracking / order ID (Optional)</label>
                        <input
                          type="text"
                          value={formDelTracking}
                          onChange={(e) => setFormDelTracking(e.target.value)}
                          placeholder="e.g., AMZ-988319-X"
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg mt-4 cursor-pointer"
                      >
                        Schedule Gate Entry
                      </button>
                    </form>
                  )}

                  {/* FORM 3: ADD FAMILY MEMBER */}
                  {openModalType === 'add_family' && (
                    <form onSubmit={handleAddFamilySubmit} className="space-y-3.5 text-xs text-left">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Full Name</label>
                        <input
                          type="text"
                          required
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g., Babita Iyer"
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Relationship</label>
                          <select
                            value={formRelation}
                            onChange={(e) => setFormRelation(e.target.value)}
                            className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                          >
                            <option value="Spouse">Spouse</option>
                            <option value="Child">Child</option>
                            <option value="Parent">Parent</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Other">Other Helper</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Avatar Preset</label>
                          <select
                            value={formAvatar}
                            onChange={(e) => setFormAvatar(e.target.value)}
                            className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                          >
                            <option value="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150">Business Woman</option>
                            <option value="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150">Executive Man</option>
                            <option value="https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=150">Elderly Mother</option>
                            <option value="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150">Daughter / Kid</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Contact Phone</label>
                        <input
                          type="text"
                          required
                          value={formPhone}
                          onChange={(e) => setFormPhone(e.target.value)}
                          placeholder="e.g., +91 99110 88221"
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-4 cursor-pointer"
                      >
                        Save Family Record
                      </button>
                    </form>
                  )}

                  {/* FORM 4: ADD VEHICLE */}
                  {openModalType === 'add_vehicle' && (
                    <form onSubmit={handleAddVehicleSubmit} className="space-y-3.5 text-xs text-left">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Vehicle Brand & Model</label>
                        <input
                          type="text"
                          required
                          value={formVehicleBrand}
                          onChange={(e) => setFormVehicleBrand(e.target.value)}
                          placeholder="e.g., grey Honda City, black Activa"
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Vehicle Type</label>
                          <select
                            value={formVehicleType}
                            onChange={(e) => setFormVehicleType(e.target.value)}
                            className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                          >
                            <option value="FOUR_WHEELER">Car (4 Wheeler)</option>
                            <option value="TWO_WHEELER">Scooter / Bike</option>
                            <option value="OTHER">Bicycle / Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Assigned Spot</label>
                          <input
                            type="text"
                            value={formParking}
                            onChange={(e) => setFormParking(e.target.value)}
                            placeholder="e.g., Slot P2 #504"
                            className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">License Plate Number</label>
                        <input
                          type="text"
                          required
                          value={formVehicleNum}
                          onChange={(e) => setFormVehicleNum(e.target.value)}
                          placeholder="e.g., MH-02-CD-5678"
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800 text-slate-900 dark:text-white uppercase font-mono font-bold"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-4 cursor-pointer"
                      >
                        Register Vehicle Licence
                      </button>
                    </form>
                  )}

                </motion.div>
              )}
            </AnimatePresence>

            {/* COMPLAINT MODAL */}
            <AnimatePresence>
              {showFileComplaintModal && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25 }}
                  className={`absolute bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t p-6 space-y-4 max-h-[85%] overflow-y-auto ${
                    appTheme === 'dark' ? 'bg-slate-900 border-slate-850 text-white' : 'bg-white border-slate-150 text-slate-900'
                  }`}
                >
                  <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2"></div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-xs font-black font-mono uppercase tracking-widest text-slate-400">
                      File Helpdesk Ticket
                    </h3>
                    <button
                      onClick={() => { playAppSound('click'); setShowFileComplaintModal(false); }}
                      className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleFileComplaintSubmit} className="space-y-3.5 text-xs text-left">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Title / Subject</label>
                      <input
                        type="text"
                        required
                        value={cmpTitle}
                        onChange={(e) => setCmpTitle(e.target.value)}
                        placeholder="e.g., Leaking pipe in balcony"
                        className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Category</label>
                        <select
                          value={cmpCategory}
                          onChange={(e) => setCmpCategory(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        >
                          <option value="PLUMBING">Plumbing</option>
                          <option value="ELECTRICAL">Electrical</option>
                          <option value="CLEANLINESS">Cleanliness</option>
                          <option value="SECURITY">Security</option>
                          <option value="PARKING">Parking</option>
                          <option value="NOISE">Noise</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Priority</label>
                        <select
                          value={cmpPriority}
                          onChange={(e) => setCmpPriority(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-mono">Description</label>
                      <textarea
                        rows={3}
                        value={cmpDesc}
                        onChange={(e) => setCmpDesc(e.target.value)}
                        placeholder="Provide details about the issue..."
                        className="w-full p-2.5 rounded-xl border dark:bg-slate-950 dark:border-slate-800 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl mt-2 cursor-pointer"
                    >
                      Submit Complaint Ticket
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PAY BILL MODAL */}
            <AnimatePresence>
              {payingBill && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25 }}
                  className={`absolute bottom-0 left-0 right-0 z-50 rounded-t-[32px] border-t p-6 space-y-4 max-h-[85%] overflow-y-auto ${
                    appTheme === 'dark' ? 'bg-slate-900 border-slate-850 text-white' : 'bg-white border-slate-150 text-slate-900'
                  }`}
                >
                  <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2"></div>
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-850">
                    <h3 className="text-xs font-black font-mono uppercase tracking-widest text-slate-400">
                      Pay Society Maintenance
                    </h3>
                    <button
                      onClick={() => { playAppSound('click'); setPayingBill(null); }}
                      className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl space-y-2 border text-center">
                    <p className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                      Bill Statement: {payingBill.month} {payingBill.year}
                    </p>
                    <p className="text-3xl font-black font-mono text-emerald-500">
                      ₹ {payingBill.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Due Date: {payingBill.dueDate}
                    </p>
                  </div>

                  <form onSubmit={handlePayBillSubmit} className="space-y-3.5 text-xs text-left">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 font-mono">Select Payment Mode</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPayMethod('UPI')}
                          className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            payMethod === 'UPI'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <QrCode className="w-4 h-4" /> UPI Apps
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayMethod('CARD')}
                          className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            payMethod === 'CARD'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" /> Debit / Credit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayMethod('NET_BANKING')}
                          className={`p-3 rounded-2xl border text-center font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                            payMethod === 'NET_BANKING'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <ShieldCheck className="w-4 h-4" /> NetBanking
                        </button>
                      </div>
                    </div>

                    {payMethod === 'UPI' && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 text-center space-y-2">
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold">
                          Scan & Pay via GPay / PhonePe / Paytm / BHIM UPI
                        </p>
                        <div className="w-28 h-28 bg-white p-2 rounded-2xl mx-auto shadow-sm flex items-center justify-center">
                          <QrCode className="w-24 h-24 text-slate-900" />
                        </div>
                        <p className="text-[9px] font-mono text-slate-400">
                          UPI ID: gokuldham.society@okaxis
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg mt-2 cursor-pointer text-xs"
                    >
                      Confirm ₹ {payingBill.amount.toLocaleString()} Payment
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </div>

    </div>
  );
};
