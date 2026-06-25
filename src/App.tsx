/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User, Lead, SystemSettings, Role, LeadChangeLog } from './types';
import { SEED_DOCTORS, SEED_LEADS_NORMALIZED } from './data';
import { fetchLeadsFromGviz, DEFAULT_SPREADSHEET_ID, appendLeadToSheet, updateLeadInSheet, deleteLeadInSheet } from './sheets';
import { AflatousDB } from './db';
import { getTodayJalali, dateDiffDays, toPersianDigits, formatJalaliDate, formatPrice } from './jalali';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Login from './components/Login';
import LeadForm from './components/LeadForm';
import LeadTable from './components/LeadTable';
import KPIDashboard from './components/KPIDashboard';
import FollowUps from './components/FollowUps';
import Reports from './components/Reports';
import Settings from './components/Settings';
import PatientFiles from './components/PatientFiles';
import AflatousLogo from './components/AflatousLogo';

// Icons
import {
  Sparkles,
  LayoutDashboard,
  UserPlus,
  Users,
  CalendarDays,
  BarChart3,
  Settings as SettingsIcon,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  TrendingDown,
  CheckCircle,
  Database,
  Lock,
  PieChart,
  Clock,
  Square,
  CheckCircle2,
  UserCircle,
  FolderHeart
} from 'lucide-react';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('aflatous_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      googleSheetUrl: `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`,
      isSyncEnabled: true,
      apiKey: '',
      accessToken: '',
      doctors: SEED_DOCTORS,
      sources: ['اینستاگرام', 'تبلیغات', 'معرفی', 'گوگل', 'واتساپ', 'تماس مستقیم', 'سایر'],
      secretaryReportsEnabled: false,
      managerReportsEnabled: true,
      workerUrl: '',
      isWorkerEnabled: false,
    };
  });

  // Leads state
  const [leads, setLeads] = useState<Lead[]>(() => {
    const saved = localStorage.getItem('aflatous_leads');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return SEED_LEADS_NORMALIZED;
  });

  // UI state
  const [activeTab, setActiveTab] = useState('داشبورد');
  const [editingLead, setEditingLead] = useState<Lead | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [customToken, setCustomToken] = useState('');
  const [managerSelectedSecretary, setManagerSelectedSecretary] = useState<string>('all');
  const [selectedPatientIdForRecord, setSelectedPatientIdForRecord] = useState<string | null>(null);

  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    const defaultUsers = [
      {
        id: '09121111111',
        name: 'سیمین حسینی',
        phone: '09121111111',
        role: 'secretary' as Role,
        password: '123456'
      },
      {
        id: '09122222222',
        name: 'دکتر مهران افلاطوس',
        phone: '09122222222',
        role: 'manager' as Role,
        password: '123456'
      },
      {
        id: '09123333333',
        name: 'تفلاطوس کبیر',
        phone: '09123333333',
        role: 'teflatus' as Role,
        password: '123456'
      }
    ];
    const saved = localStorage.getItem('aflatous_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [...parsed];
          defaultUsers.forEach((defUser) => {
            if (!merged.some((u) => u.phone === defUser.phone)) {
              merged.push(defUser);
            }
          });
          return merged;
        }
      } catch (e) { /* ignore */ }
    }
    return defaultUsers;
  });

  // Password modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleAddUser = (name: string, phone: string, password: string, role: Role): boolean => {
    if (users.some((u) => u.phone === phone)) {
      return false;
    }
    const newUser: User = { id: phone, name, phone, password, role };
    setUsers((prev) => [...prev, newUser]);
    return true;
  };

  const handleRemoveUser = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const handleUpdateUser = (id: string, updatedFields: Partial<User>) => {
    setUsers((prev) => prev.map((u) => {
      if (u.id === id) {
        const updated = { ...u, ...updatedFields };
        if (currentUser && currentUser.id === id) {
          setCurrentUser(updated);
        }
        return updated;
      }
      return u;
    }));
  };

  const handleChangePasswordSubmit = () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentUser) return;
    const userInDb = users.find((u) => u.phone === currentUser.phone);
    const existingPassword = userInDb?.password || '123456';

    if (currentPassword !== existingPassword) {
      setPasswordError('رمز عبور فعلی نادرست است');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('رمز عبور جدید باید حداقل ۴ رقم باشد');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('تکرار رمز عبور جدید مطابادرست نیست');
      return;
    }

    // Update password in DB
    setUsers((prev) => 
      prev.map((u) => u.phone === currentUser.phone ? { ...u, password: newPassword } : u)
    );

    setPasswordSuccess('رمز عبور با موفقیت تغییر یافت');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess('');
    }, 1500);
  };

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem('aflatous_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('aflatous_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('aflatous_settings', JSON.stringify(settings));
  }, [settings]);
  // Cloudflare D1 instance
  const db = React.useMemo(() => {
    if (settings.isWorkerEnabled && settings.workerUrl) {
      return new AflatousDB(settings.workerUrl);
    }
    return null;
  }, [settings.workerUrl, settings.isWorkerEnabled]);



  // Sync / Read from Google Sheets on load
  const loadLeadsFromSheet = async (silently: boolean = false) => {
    if (!silently) setIsLoading(true);
    try {
      // Exclude Spreadsheet ID from sheet link
      const spreadsheetId = settings.googleSheetUrl.match(/\/d\/([^/]+)/)?.[1] || DEFAULT_SPREADSHEET_ID;
      const sheetLeads = await fetchLeadsFromGviz(spreadsheetId);
      
      if (sheetLeads.length > 0) {
        setLeads(sheetLeads);
        setSyncStatus('connected');
        setConnectionMessage('بارگذاری زنده داده‌ها از گوگل شیت با موفقیت انجام شد');
      } else {
        setSyncStatus('disconnected');
        setConnectionMessage('تعداد ردیف معتبر یافت نشد. رکوردهای آزمایشی بارگذاری شدند');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setConnectionMessage('امکان دریافت داده‌های آنلاین وجود ندارد (نمایش داده‌های حافظه محلی)');
    } finally {
      if (!silently) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeadsFromSheet(true);
  }, [settings.googleSheetUrl]);

  // Notifications logic (Pending & Overdue Followups Today)
  const notificationCount = useMemo(() => {
    const todayStr = getTodayJalali();
    return leads.filter((lead) => {
      if (!lead.nextFollowUpDate || lead.isFollowUpCompleted) return false;
      const diff = dateDiffDays(todayStr, lead.nextFollowUpDate);
      return diff <= 0; // Today or Overdue
    }).length;
  }, [leads]);

  // Collect unique assigned users (secretaries)
  const uniqueSecretaries = useMemo(() => {
    const names = leads.map((l) => l.assignedTo || 'سیمین حسینی');
    return Array.from(new Set(names)).filter(Boolean);
  }, [leads]);

  // Filter leads for stats if manager selected a specific secretary
  const leadsForStats = useMemo(() => {
    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'teflatus') || managerSelectedSecretary === 'all') {
      return leads;
    }
    return leads.filter((l) => (l.assignedTo || 'سیمین حسینی') === managerSelectedSecretary);
  }, [leads, currentUser, managerSelectedSecretary]);

  // Filter today pending leads for the topmost dashboard section
  const todayPendingLeads = useMemo(() => {
    const todayStr = getTodayJalali();
    return leads.filter((l) => {
      if (!l.nextFollowUpDate || l.isFollowUpCompleted) return false;
      const diff = dateDiffDays(todayStr, l.nextFollowUpDate);
      return diff <= 0; // Today or Overdue
    });
  }, [leads]);

  // Sidebar Tabs Config
  const sidebarItems = useMemo(() => {
    const items = [
      { title: 'داشبورد', icon: LayoutDashboard },
      { title: 'ثبت لید جدید', icon: UserPlus },
      { title: 'لیست لیدها', icon: Users },
      { title: 'پرونده بیماران', icon: FolderHeart },
      { title: 'پیگیریها', icon: CalendarDays, badge: notificationCount }
    ];

    if (currentUser) {
      const isTeflatus = currentUser.role === 'teflatus';
      const isManager = currentUser.role === 'manager';
      const isSecretary = currentUser.role === 'secretary';

      const showReports = 
        isTeflatus || 
        (isManager && settings.managerReportsEnabled !== false) || 
        (isSecretary && settings.secretaryReportsEnabled === true);

      if (showReports) {
        items.push(
          { title: 'گزارشها', icon: PieChart },
          { title: 'KPI فروش', icon: BarChart3 }
        );
      }

      if (isTeflatus || isManager) {
        items.push({ title: 'تنظیمات', icon: SettingsIcon });
      }
    }
    return items;
  }, [currentUser, notificationCount, settings]);

  // Handle automatic redirection for unauthorized access
  useEffect(() => {
    if (!currentUser) return;

    const isTeflatus = currentUser.role === 'teflatus';
    const isManager = currentUser.role === 'manager';
    const isSecretary = currentUser.role === 'secretary';

    const showReports = 
      isTeflatus || 
      (isManager && settings.managerReportsEnabled !== false) || 
      (isSecretary && settings.secretaryReportsEnabled === true);

    const allowed = ['داشبورد', 'ثبت لید جدید', 'لیست لیدها', 'پرونده بیماران', 'پیگیریها'];
    if (showReports) {
      allowed.push('گزارشها', 'KPI فروش');
    }
    if (isTeflatus || isManager) {
      allowed.push('تنظیمات');
    }

    if (!allowed.includes(activeTab)) {
      setActiveTab('داشبورد');
    }
  }, [currentUser, activeTab, settings]);

  // Sync Google Oauth / Connect Simulate
  const handleConnectGoogle = () => {
    setShowTokenModal(true);
  };

  const handleApplyToken = () => {
    setSettings((prev) => ({ ...prev, accessToken: customToken || 'demo-access-token-12345' }));
    setSyncStatus('connected');
    setShowTokenModal(false);
    setConnectionMessage('دسترسی نوشتن گوگل با موفقیت پیکربندی شد');
  };

  // CRUD Actions
  const handleAddOrEditLead = async (formData: Omit<Lead, 'id'> & { id?: string }) => {
    setIsLoading(true);
    let updatedLeads = [...leads];
    const timeStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const jDate = getTodayJalali();

    if (formData.id) {
      // Edit
      const index = leads.findIndex((l) => l.id === formData.id);
      if (index !== -1) {
        const originalLead = leads[index];
        // Create change log of the PREVIOUS state of the lead
        const newLogEntry: LeadChangeLog = {
          id: `log-${Date.now()}`,
          changeDate: `${jDate} ساعت ${timeStr}`,
          editorName: currentUser ? currentUser.name : (originalLead.assignedTo || 'سیستم'),
          status: originalLead.status,
          doctor: originalLead.doctor,
          service: originalLead.service,
          announcedCost: originalLead.announcedCost,
          contractAmount: originalLead.contractAmount,
          nextFollowUpDate: originalLead.nextFollowUpDate,
          notes: originalLead.notes
        };

        const updatedLead: Lead = {
          ...formData as Lead,
          id: formData.id,
          assignedTo: currentUser ? currentUser.name : (originalLead.assignedTo || 'سیمین حسینی'),
          history: [newLogEntry, ...(originalLead.history || [])]
        };
        updatedLeads[index] = updatedLead;
        
        // Sync to Sheets (Google)
        if (settings.isSyncEnabled && settings.accessToken) {
          const spreadsheetId = settings.googleSheetUrl.match(/\/d\/([^/]+)/)?.[1] || DEFAULT_SPREADSHEET_ID;
          await updateLeadInSheet(updatedLead, settings.accessToken, spreadsheetId);
        }
        // Sync to Cloudflare D1
        if (db) {
          const ok = await db.updateLead(updatedLead, currentUser?.name || 'system');
          if (!ok) console.warn('D1 update failed for lead', updatedLead.id);
        }
      }
    } else {
      // Add
      const initialLog: LeadChangeLog = {
        id: `log-${Date.now()}`,
        changeDate: `${jDate} ساعت ${timeStr}`,
        editorName: currentUser ? currentUser.name : 'سیمین حسینی',
        status: formData.status,
        doctor: formData.doctor,
        service: formData.service,
        announcedCost: formData.announcedCost,
        contractAmount: formData.contractAmount,
        nextFollowUpDate: formData.nextFollowUpDate,
        notes: formData.notes || 'ایجاد اولیه پرونده بیمار'
      };

      const newLead: Lead = {
        ...formData,
        id: `lead-${Date.now()}`,
        assignedTo: currentUser ? currentUser.name : 'سیمین حسینی',
        history: [initialLog]
      };
      updatedLeads.unshift(newLead);

      // Sync to Sheets (Google)
      if (settings.isSyncEnabled && settings.accessToken) {
        const spreadsheetId = settings.googleSheetUrl.match(/\/d\/([^/]+)/)?.[1] || DEFAULT_SPREADSHEET_ID;
        await appendLeadToSheet(newLead, settings.accessToken, spreadsheetId);
      }
      // Sync to Cloudflare D1
      if (db) {
        const ok = await db.saveLead(newLead, currentUser?.name || 'system');
        if (!ok) console.warn('D1 save failed for new lead');
      }
    }

    setLeads(updatedLeads);
    setIsLoading(false);
    setEditingLead(undefined);
    setActiveTab('لیست لیدها'); // redirect to list
  };

  const handleDeleteLead = async (id: string) => {
    setIsLoading(true);
    const updatedLeads = leads.filter((l) => l.id !== id);
    
    // Sync to Sheets (Google)
    if (settings.isSyncEnabled && settings.accessToken) {
      const spreadsheetId = settings.googleSheetUrl.match(/\/d\/([^/]+)/)?.[1] || DEFAULT_SPREADSHEET_ID;
      await deleteLeadInSheet(id, settings.accessToken, spreadsheetId);
    }
    // Sync to Cloudflare D1
    const deletedLead = leads.find(l => l.id === id);
    if (db && deletedLead) {
      await db.deleteLead(deletedLead.phone);
    }

    setLeads(updatedLeads);
    setIsLoading(false);
  };

  const handleToggleFollowUp = (id: string) => {
    const updatedLeads = leads.map((lead) => {
      if (lead.id === id) {
        return { ...lead, isFollowUpCompleted: !lead.isFollowUpCompleted };
      }
      return lead;
    });
    setLeads(updatedLeads);
  };

  // Settings callbacks
  const handleUpdateSettings = (updated: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleChangeRole = (role: Role) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };

  const handleResetData = () => {
    setLeads(SEED_LEADS_NORMALIZED);
    setSettings({
      googleSheetUrl: `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`,
      isSyncEnabled: true,
      apiKey: '',
      accessToken: '',
      doctors: SEED_DOCTORS
    });
    setSyncStatus('disconnected');
    setConnectionMessage('تمام اطلاعات محلی به داده‌های پیش‌فرض دمو بازنشانی گردید');
  };

  const handleAddDoctor = (name: string) => {
    if (!settings.doctors.includes(name)) {
      setSettings((prev) => ({ ...prev, doctors: [...prev.doctors, name] }));
    }
  };

  const handleRemoveDoctor = (name: string) => {
    setSettings((prev) => ({ ...prev, doctors: prev.doctors.filter((d) => d !== name) }));
  };

  // If not logged in, show login screen
  if (!currentUser) {
    return <Login onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col md:flex-row text-right select-none font-sans" dir="rtl">
      
      {/* 1. Sidebar Navigation */}
      <aside className={`w-64 bg-white border-l border-gray-200 shrink-0 text-gray-700 flex flex-col transition-all duration-300 z-30 fixed md:static inset-y-0 right-0 ${
        isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}>
        {/* Sidebar Header Brand */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-1 border border-emerald-500/10 shadow-sm">
              <AflatousLogo size={32} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0B5F3C] tracking-tight">افلاطوس CRM</h2>
              <span className="text-[10px] text-gray-400 block mt-0.5">سیستم یکپارچه کلینیک</span>
            </div>
          </div>
          {/* Mobile close menu */}
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.title;
            return (
              <button
                key={item.title}
                onClick={() => {
                  setActiveTab(item.title);
                  setEditingLead(undefined);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B5F3C]/10 text-[#0B5F3C] font-bold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#0B5F3C]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} />
                  <span>{item.title}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                    isActive ? 'bg-[#0B5F3C] text-white' : 'bg-red-500 text-white'
                  }`}>
                    {toPersianDigits(item.badge)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer User detail */}
        <div className="p-5 border-t border-gray-100 space-y-4">
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100/70">
            <div className="w-10 h-10 bg-[#0B5F3C]/10 rounded-xl flex items-center justify-center font-bold text-[#0B5F3C]">
              {currentUser.name.substring(0, 1)}
            </div>
            <div className="text-right overflow-hidden">
              <p className="text-xs font-bold text-gray-800 truncate max-w-[130px]">{currentUser.name}</p>
              <span className="text-[10px] text-gray-400 mt-1 block">
                {currentUser.role === 'teflatus' ? 'تفلاطوس ارشد' : currentUser.role === 'manager' ? 'مدیریت کلینیک' : 'منشی پذیرش'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPasswordError('');
                setPasswordSuccess('');
                setShowPasswordModal(true);
              }}
              className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-gray-200"
            >
              <Lock size={12} />
              تغییر رمز
            </button>
            <button
              onClick={() => setCurrentUser(null)}
              className="flex-1 py-2 bg-red-50 hover:bg-red-100/70 text-red-600 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-100"
            >
              <LogOut size={12} />
              خروج
            </button>
          </div>
        </div>
      </aside>

      {/* Background Dim Backdrop for Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)} 
          className="md:hidden fixed inset-0 bg-black/40 z-20 transition-all duration-300"
        />
      )}

      {/* 2. Main Scrollable Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-gray-100 h-16 md:h-20 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="md:hidden p-2 hover:bg-gray-150 rounded-xl text-gray-600 cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div className="text-right">
              <p className="text-sm font-extrabold text-gray-800 font-sans">{activeTab === 'داشبورد' ? 'داشبورد سلامت کلینیک افلاطوس' : activeTab}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-sans">امروز: {toPersianDigits(getTodayJalali())}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            
            {/* Connection Indicator badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-150 rounded-xl text-xs select-none">
              <span className={`w-2 h-2 rounded-full ${
                syncStatus === 'connected' ? 'bg-emerald-500' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
              }`} />
              <span className="text-gray-500 font-sans font-medium text-[10px]">
                {syncStatus === 'connected' ? 'گوگل شیت متصل' : syncStatus === 'error' ? 'شکست اتصال' : 'دمو آفلاین'}
              </span>
            </div>

            {/* Quick Trigger Google Authentication button */}
            <button
              onClick={handleConnectGoogle}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                settings.accessToken
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-bold'
                  : 'bg-[#0B5F3C]/5 border-[#0B5F3C]/10 text-[#0B5F3C] hover:bg-[#0B5F3C]/10'
              }`}
            >
              <Database size={13} />
              {settings.accessToken ? 'شیتس متصل است' : 'اتصال گوگل شیت'}
            </button>

            {/* Reload and Query fresh leads */}
            <button
              onClick={() => loadLeadsFromSheet()}
              disabled={isLoading}
              className="p-2 hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-500 hover:text-[#0B5F3C] disabled:opacity-50 select-none cursor-pointer"
              title="بارگذاری مجدد پایگاه شیت"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            </button>

          </div>
        </header>

        {/* Global Alert Notification Bar */}
        {connectionMessage && (
          <div className="px-4 md:px-8 pt-4">
            <div className="bg-gray-100 border border-gray-150 p-3 rounded-xl flex items-center justify-between text-xs text-gray-600 font-sans animate-fade-in shadow-inner">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#0B5F3C] rounded-full" />
                <span>{connectionMessage}</span>
              </div>
              <button onClick={() => setConnectionMessage('')} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 3. Main Dashboard Workspace Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (editingLead ? '-editing' : '')}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* Dynamic Tabs switcher */}
              {editingLead ? (
                <LeadForm
                  initialLead={editingLead}
                  doctors={settings.doctors}
                  sources={settings.sources}
                  onSubmit={handleAddOrEditLead}
                  onCancel={() => setEditingLead(undefined)}
                />
              ) : activeTab === 'داشبورد' ? (
                <div className="space-y-6">
                  {/* Today's Follow Ups - TOPMOST SECTION */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                          <Clock size={18} className="animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-gray-850 flex items-center gap-2">
                            برنامه‌های پیگیری امروز و معوقه
                            {todayPendingLeads.length > 0 && (
                              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-sans animate-bounce">
                                {toPersianDigits(todayPendingLeads.length)}
                              </span>
                            )}
                          </h3>
                          <p className="text-[10px] text-gray-400 mt-0.5">وظایف پیگیری اضطراری متقاضیان کلینیک که زمان انجام آن‌ها امروز یا در گذشته بوده است</p>
                        </div>
                      </div>
                    </div>

                    {todayPendingLeads.length === 0 ? (
                      <div className="p-6 text-center bg-emerald-50/20 border border-emerald-50 rounded-xl space-y-2">
                        <CheckCircle2 size={24} className="text-emerald-600 mx-auto" />
                        <p className="text-xs font-bold text-emerald-800">خسته نباشید! هیچ برنامه پیگیری معوقه یا جاری برای امروز وجود ندارد.</p>
                        <p className="text-[10px] text-gray-400">تمام وظایف با موفقیت پیگیری و تکمیل شده‌اند.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {todayPendingLeads.map((lead) => {
                          const todayStr = getTodayJalali();
                          const isOverdue = dateDiffDays(todayStr, lead.nextFollowUpDate) < 0;
                          return (
                            <div key={lead.id} className={`p-4 rounded-xl border transition-all hover:shadow-sm flex flex-col justify-between space-y-3 ${isOverdue ? 'bg-red-50/10 border-red-100' : 'bg-amber-50/10 border-amber-100'}`}>
                              <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                  <button
                                    onClick={() => handleToggleFollowUp(lead.id)}
                                    className="p-1 text-gray-400 hover:text-emerald-650 hover:bg-emerald-50 rounded transition-all cursor-pointer"
                                    title="علامت به عنوان انجام شده"
                                  >
                                    <Square size={17} />
                                  </button>
                                  <div 
                                    onClick={() => {
                                      setSelectedPatientIdForRecord(lead.id);
                                      setActiveTab('پرونده بیماران');
                                    }}
                                    className="text-right cursor-pointer hover:text-[#0B5F3C] transition-colors group flex-1 mr-3"
                                    title="مشاهده پرونده و سوابق بیمار"
                                  >
                                    <h4 className="text-xs font-bold text-gray-800 group-hover:underline">{lead.patientName}</h4>
                                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{toPersianDigits(lead.phone)}</p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-1.5 text-[9px] font-medium">
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{lead.doctor}</span>
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{lead.service}</span>
                                  {lead.assignedTo && (
                                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-sans border border-blue-100 flex items-center gap-0.5">
                                      <UserCircle size={10} />
                                      {lead.assignedTo}
                                    </span>
                                  )}
                                </div>

                                {lead.notes && (
                                  <p className="text-[10px] text-gray-500 bg-white border border-gray-50 p-2 rounded-lg leading-relaxed max-h-16 overflow-y-auto">{lead.notes}</p>
                                )}
                              </div>

                              <div className="flex justify-between items-center text-[9px] border-t border-gray-100/60 pt-2">
                                <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-amber-650'}`}>
                                  {isOverdue 
                                    ? `${toPersianDigits(Math.abs(dateDiffDays(todayStr, lead.nextFollowUpDate)))} روز معوقه (${toPersianDigits(lead.nextFollowUpDate)})` 
                                    : 'نوبت امروز'}
                                </span>
                                <span className="text-gray-400">منبع: {lead.source}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Manager Secretary Selector Bar */}
                  {(currentUser.role === 'manager' || currentUser.role === 'teflatus') && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">تفکیک و ارزیابی عملکرد منشی‌ها</h4>
                        <p className="text-[10px] text-gray-400 mt-1">با انتخاب نام هر منشی، تمامی آمارها و نمودارهای زیر بر اساس عملکرد او فیلتر می‌شوند.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">مسئول پیگیری:</span>
                        <select
                          value={managerSelectedSecretary}
                          onChange={(e) => setManagerSelectedSecretary(e.target.value)}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 font-sans focus:outline-none focus:ring-1 focus:ring-[#0B5F3C] cursor-pointer"
                        >
                          <option value="all">همه مسئولان (کل کلینیک)</option>
                          {uniqueSecretaries.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <KPIDashboard leads={leadsForStats} />
                  
                  {/* Dashboard Visualizer Reports View */}
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <Reports leads={leadsForStats} />
                  </div>
                </div>
              ) : activeTab === 'ثبت لید جدید' ? (
                <LeadForm
                  doctors={settings.doctors}
                  sources={settings.sources}
                  onSubmit={handleAddOrEditLead}
                />
              ) : activeTab === 'لیست لیدها' ? (
                <LeadTable
                  leads={leads}
                  onEdit={(l) => setEditingLead(l)}
                  onDelete={handleDeleteLead}
                  doctors={settings.doctors}
                  role={currentUser.role}
                />
              ) : activeTab === 'پرونده بیماران' ? (
                <PatientFiles
                  leads={leads}
                  selectedPatientId={selectedPatientIdForRecord}
                  onSelectPatient={setSelectedPatientIdForRecord}
                  onEditLead={(lead) => {
                    setEditingLead(lead);
                  }}
                />
              ) : activeTab === 'پیگیریها' ? (
                <FollowUps 
                  leads={leads} 
                  onToggleComplete={handleToggleFollowUp} 
                  onSelectPatient={(id) => {
                    setSelectedPatientIdForRecord(id);
                    setActiveTab('پرونده بیماران');
                  }}
                />
              ) : activeTab === 'گزارشها' ? (
                <Reports leads={leadsForStats} />
              ) : activeTab === 'KPI فروش' ? (
                <div className="space-y-6">
                  {/* Manager Secretary Selector Bar inside KPI فروش */}
                  {(currentUser.role === 'manager' || currentUser.role === 'teflatus') && (
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">تفکیک و ارزیابی عملکرد منشی‌ها (KPI فروش)</h4>
                        <p className="text-[10px] text-gray-400 mt-1">با انتخاب نام هر منشی، تمامی شاخص‌های فروش بر اساس عملکرد او فیلتر می‌شوند.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500">مسئول پیگیری:</span>
                        <select
                          value={managerSelectedSecretary}
                          onChange={(e) => setManagerSelectedSecretary(e.target.value)}
                          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 font-sans focus:outline-none focus:ring-1 focus:ring-[#0B5F3C] cursor-pointer"
                        >
                          <option value="all">همه مسئولان (کل کلینیک)</option>
                          {uniqueSecretaries.map((name) => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* KPI specialized analysis */}
                  <KPIDashboard leads={leadsForStats} />
                  
                  {/* Performance Table */}
                  <div className="bg-white border border-gray-105 p-6 rounded-2xl shadow-sm text-right">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">پرونده جراحی‌های قطعی و راندمان درآمد</h3>
                    <p className="text-xs text-gray-400 mb-4">تفکیک بیماران عمل شده و درآمد واقعی کسب شده</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-gray-700">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-bold text-gray-500">
                            <th className="px-4 py-3">ردیف</th>
                            <th className="px-4 py-3">نام بیمار</th>
                            <th className="px-4 py-3">نوع خدمت زیبایی</th>
                            <th className="px-4 py-3">پزشک معالج</th>
                            <th className="px-4 py-3">مبلغ کل قرارداد</th>
                            <th className="px-4 py-3">کانال جذب</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leadsForStats.filter(l => l.status === 'عمل انجام شد').length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">هیچ جراحی موفقی ثبت نگردیده است.</td>
                            </tr>
                          ) : (
                            leadsForStats.filter(l => l.status === 'عمل انجام شد').map((l, index) => (
                              <tr key={l.id} className="hover:bg-gray-50/50 border-b border-gray-50">
                                <td className="px-4 py-3 text-gray-400 font-mono">{toPersianDigits(index + 1)}</td>
                                <td className="px-4 py-3 font-bold text-gray-800">{l.patientName}</td>
                                <td className="px-4 py-3">{l.service}</td>
                                <td className="px-4 py-3">{l.doctor}</td>
                                <td className="px-4 py-3 font-semibold text-emerald-800 font-mono">{formatPrice(l.contractAmount)}</td>
                                <td className="px-4 py-3 text-gray-500">{l.source}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'تنظیمات' ? (
                <Settings
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  currentUserRole={currentUser.role}
                  onChangeRole={handleChangeRole}
                  onResetData={handleResetData}
                  doctorsList={settings.doctors}
                  onAddDoctor={handleAddDoctor}
                  onRemoveDoctor={handleRemoveDoctor}
                  usersList={users}
                  onAddUser={handleAddUser}
                  onRemoveUser={handleRemoveUser}
                  onUpdateUser={handleUpdateUser}
                />
              ) : null}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* 4. Token modal popup layout */}
      <AnimatePresence>
        {showTokenModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop dimmer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTokenModal(false)}
              className="absolute inset-0 bg-black/50"
            />
            {/* Box modal */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl relative w-full max-w-md border border-gray-150 z-10 text-right space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-800">پیکربندی اتصال گوگل شیتس (Google Auth)</h3>
                <button 
                  onClick={() => setShowTokenModal(false)} 
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed space-y-2">
                <p>جهت اتصال ایمن و نوشتن مستقیم لیدهای پذیرفته شده به گوگل شیت شما، از توکن دسترسی اختصاصی گوگل یا شبیه‌ساز پیشرفته استفاده کنید:</p>
                <p className="bg-[#0B5F3C]/5 text-[#0B5F3C] p-2 rounded-xl font-mono text-[10px]">
                  بر اساس الزامات پیش‌نمایش، می‌توانید کادر زیر را خالی بگذارید یا هر توکن دلخواه وارد کنید تا هماهنگ‌ساز با یک کلیک فعال شود.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 mb-1">کد توکن امنیتی (OAuth Access Token)</label>
                <input
                  type="text"
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  placeholder="کلید را اینجا وارد کنید یا بگذارید خالی بماند"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-left font-mono text-xs focus:ring-1 focus:ring-[#0B5F3C] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleApplyToken}
                  className="px-5 py-2.5 bg-[#0B5F3C] hover:bg-[#0B5F3C]/95 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-[#0B5F3C]/10"
                >
                  تایید اتصال شیتس
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 shadow-2xl relative w-full max-w-md border border-gray-150 z-10 text-right space-y-4 font-sans"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                  <Lock size={16} className="text-[#0B5F3C]" />
                  تغییر رمز عبور ورود به پنل
                </h3>
                <button 
                  onClick={() => setShowPasswordModal(false)} 
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X size={16} />
                </button>
              </div>

              {passwordError && (
                <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs border border-red-100 font-sans">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-xs border border-emerald-100 font-sans">
                  {passwordSuccess}
                </div>
              )}

              <div className="space-y-3 text-xs text-right">
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">رمز عبور فعلی</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="******"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">رمز عبور جدید</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="******"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-left font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-400 mb-1">تکرار رمز عبور جدید</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="******"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-left font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleChangePasswordSubmit}
                  className="px-5 py-2.5 bg-[#0B5F3C] hover:bg-[#0B5F3C]/95 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-[#0B5F3C]/10"
                >
                  ثبت رمز عبور جدید
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
