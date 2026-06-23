/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Role, SystemSettings, User } from '../types';
import { SEED_DOCTORS } from '../data';
import { DEFAULT_SPREADSHEET_ID } from '../sheets';
import { 
  Database, UserCheck, Plus, Trash, RotateCcw, 
  CheckCircle, Globe, Sparkles 
} from 'lucide-react';

interface SettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (s: Partial<SystemSettings>) => void;
  currentUserRole: Role;
  onChangeRole: (role: Role) => void;
  onResetData: () => void;
  doctorsList: string[];
  onAddDoctor: (name: string) => void;
  onRemoveDoctor: (name: string) => void;
  usersList: User[];
  onAddUser: (name: string, phone: string, password: string, role: Role) => boolean;
  onRemoveUser: (id: string) => void;
  onUpdateUser: (id: string, updatedFields: Partial<User>) => void;
}

export default function Settings({
  settings,
  onUpdateSettings,
  currentUserRole,
  onChangeRole,
  onResetData,
  doctorsList,
  onAddDoctor,
  onRemoveDoctor,
  usersList,
  onAddUser,
  onRemoveUser,
  onUpdateUser
}: SettingsProps) {
  const [newDoctor, setNewDoctor] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [spreadsheetIdInp, setSpreadsheetIdInp] = useState(DEFAULT_SPREADSHEET_ID);

  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('secretary');

  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // Teflatus source editing state
  const [newSource, setNewSource] = useState('');

  // User inline editing states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const [editingRole, setEditingRole] = useState<Role>('secretary');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (newUserName.trim() && newUserPhone.trim() && newUserPassword.trim()) {
      const success = onAddUser(newUserName.trim(), newUserPhone.trim(), newUserPassword.trim(), newUserRole);
      if (success) {
        setUserSuccess('کاربر جدید با موفقیت اضافه شد');
        setNewUserName('');
        setNewUserPhone('');
        setNewUserPassword('');
        setTimeout(() => setUserSuccess(''), 4000);
      } else {
        setUserError('کاربری با این شماره همراه قبلاً در سیستم ثبت شده است');
        setTimeout(() => setUserError(''), 5000);
      }
    }
  };

  const handleStartEditUser = (usr: User) => {
    setEditingUserId(usr.id);
    setEditingName(usr.name);
    setEditingPhone(usr.phone);
    setEditingPassword(usr.password || '');
    setEditingRole(usr.role);
  };

  const handleSaveUserEdit = (id: string) => {
    if (editingName.trim() && editingPhone.trim()) {
      onUpdateUser(id, {
        name: editingName.trim(),
        phone: editingPhone.trim(),
        password: editingPassword.trim(),
        role: editingRole
      });
      setEditingUserId(null);
    }
  };
  
  const handleSaveSheets = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      googleSheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetIdInp}/edit`
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDoctor.trim()) {
      onAddDoctor(newDoctor.trim());
      setNewDoctor('');
    }
  };

  // Teflatus Lead Source additions/deletions
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSource.trim()) {
      const currentSources = settings.sources || ['اینستاگرام', 'تبلیغات', 'معرفی', 'گوگل', 'واتساپ', 'تماس مستقیم', 'سایر'];
      if (!currentSources.includes(newSource.trim())) {
        onUpdateSettings({
          sources: [...currentSources, newSource.trim()]
        });
      }
      setNewSource('');
    }
  };

  const handleRemoveSource = (src: string) => {
    const currentSources = settings.sources || ['اینستاگرام', 'تبلیغات', 'معرفی', 'گوگل', 'واتساپ', 'تماس مستقیم', 'سایر'];
    onUpdateSettings({
      sources: currentSources.filter((s) => s !== src)
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h2 className="text-lg font-bold text-gray-800">تنظیمات و دسترسی‌های سیستم افلاطوس</h2>
        <p className="text-xs text-gray-400 mt-1">مدیریت هماهنگی گوگل شیتس، نقش‌های سیستم، اعضای هیئت پزشکان و دسترسی‌های کلینیک</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Supreme Teflatus Command Panel */}
        {currentUserRole === 'teflatus' && (
          <div className="bg-gradient-to-br from-[#0B5F3C]/5 to-emerald-50 border border-[#0B5F3C]/20 rounded-2xl p-6 shadow-sm space-y-6 col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 pb-3 border-b border-[#0B5F3C]/15">
              <div className="p-2 bg-[#0B5F3C] text-white rounded-lg shadow-sm">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0B5F3C] font-sans">پنل فرماندهی تفلاطوس (سطح دسترسی ریشه)</h3>
                <p className="text-[10px] text-emerald-700 mt-0.5">این بخش به صورت اختصاصی فقط برای نقش اصلی «تفلاطوس» قابل رویت، ویرایش و اعمال تغییرات است.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lead Sources Control */}
              <div className="bg-white border border-[#0B5F3C]/10 rounded-xl p-4 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-gray-850">ویرایش گزینه‌های طریقه آشنایی (منابع لید)</h4>
                <p className="text-[10px] text-gray-450 leading-relaxed">هر لید زیبایی منبعی دارد که منشی آن را انتخاب می‌کند. از این بخش می‌توانید گزینه‌ها را کم یا زیاد کنید:</p>

                <form onSubmit={handleAddSource} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="مثال: پیامک تبلیغاتی"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#0B5F3C] focus:border-[#0B5F3C] text-right"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-[#0B5F3C] hover:bg-[#0B5F3C]/90 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                  >
                    <Plus size={14} />
                    افزودن
                  </button>
                </form>

                <div className="border border-gray-100 rounded-xl max-h-40 overflow-y-auto divide-y divide-gray-50 text-xs">
                  {(settings.sources || ['اینستاگرام', 'تبلیغات', 'معرفی', 'گوگل', 'واتساپ', 'تماس مستقیم', 'سایر']).map((src) => (
                    <div key={src} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                      <span className="font-semibold text-gray-800">{src}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSource(src)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                        title="حذف طریقه آشنایی"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reports Access Controls */}
              <div className="bg-white border border-[#0B5F3C]/10 rounded-xl p-4 space-y-4 shadow-sm">
                <h4 className="text-xs font-bold text-gray-850">مدیریت دسترسی به نمودارها و گزارش‌ها</h4>
                <p className="text-[10px] text-gray-450 leading-relaxed">با فعال یا غیرفعال کردن سوئیچ‌های زیر، امکان یا قطع دسترسی به زبانه «گزارشها» و «KPI فروش» را برای سایر نقش‌ها تنظیم کنید:</p>

                <div className="space-y-3">
                  {/* Secretary Switch */}
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-800">دسترسی منشی کلینیک</p>
                      <p className="text-[10px] text-gray-400">امکان مشاهده نمودارها و KPI فروش توسط منشی</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.secretaryReportsEnabled === true}
                        onChange={(e) => onUpdateSettings({ secretaryReportsEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-250 rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B5F3C]"></div>
                    </label>
                  </div>

                  {/* Manager Switch */}
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-800">دسترسی مدیر کلینیک</p>
                      <p className="text-[10px] text-gray-400">امکان مشاهده نمودارها و KPI فروش توسط مدیر</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.managerReportsEnabled !== false}
                        onChange={(e) => onUpdateSettings({ managerReportsEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-250 rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B5F3C]"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-[#0B5F3C]/5 border border-[#0B5F3C]/10 rounded-xl p-3 text-[10px] leading-relaxed text-[#0B5F3C]">
                  نکته: به عنوان تفلاطوس، شما همواره به تمامی اطلاعات، گزارش‌ها و کل تنظیمات دسترسی کامل و بی‌قید و شرط دارید و تغییرات بالا صرفاً روی کاربران عادی منشی و مدیر اعمال می‌شود.
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Google Sheets Sync panel */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
            <div className="p-2 bg-[#0B5F3C]/5 text-[#0B5F3C] rounded-lg">
              <Database size={18} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 font-sans">همگام‌سازی دوطرفه با گوگل شیتس (Google Sheets)</h3>
          </div>

          <form onSubmit={handleSaveSheets} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-650 mb-1">شناسه سند گوگل شیت (Spreadsheet ID)</label>
              <input
                type="text"
                value={spreadsheetIdInp}
                onChange={(e) => setSpreadsheetIdInp(e.target.value)}
                placeholder={DEFAULT_SPREADSHEET_ID}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left font-mono text-xs focus:ring-1 focus:ring-[#0B5F3C] outline-none"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">شناسه طولانی وسط آدرس شیتس شما (بین d/ و /edit)</span>
            </div>

            <div className="flex justify-between items-center bg-gray-55 p-3 rounded-xl border border-gray-100">
              <div className="text-right">
                <p className="text-xs font-bold text-gray-800">فعال‌سازی جریان زنده ورودی</p>
                <p className="text-[10px] text-gray-400 mt-0.5">ثبت در شیت به محض کلیک دکمه ثبت</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.isSyncEnabled}
                  onChange={(e) => onUpdateSettings({ isSyncEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-250 rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0B5F3C]"></div>
              </label>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0B5F3C] hover:bg-[#0B5F3C]/90 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#0B5F3C]/10 transition-all"
              >
                ذخیره پیکربندی
              </button>
              {isSaved && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 font-sans">
                  <CheckCircle size={14} />
                  با موفقیت ذخیره شد
                </span>
              )}
            </div>
          </form>

          {/* Connection quick manual */}
          <div className="bg-[#0B5F3C]/5 border border-[#0B5F3C]/15 rounded-xl p-4 text-xs space-y-2 text-[#0B5F3C] leading-relaxed font-sans">
            <p>۱. سند شیتس خود را باز کرده و آن را در حالت اشتراک‌گذاری عمومی قرار دهید.</p>
            <p>۲. برای ثبت تغییرات، از صفحه ورود گوگل بالا سمت چپ استفاده کنید تا دسترسی نوشتن برای کلینیک برقرار شود.</p>
          </div>
        </div>

        {/* System Roles Configuration */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
            <div className="p-2 bg-[#0B5F3C]/5 text-[#0B5F3C] rounded-lg">
              <UserCheck size={18} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 font-sans">تغییر شبیه‌سازی نقش فعال (دسترسی‌های امنیتی)</h3>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            در این بخش می‌توانید نقش فعال خود را به سرعت تغییر داده و کارکرد سیستم را تحت هر یک از دسترسی‌ها بررسی کنید:
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { role: 'secretary' as Role, label: 'منشی کلینیک' },
              { role: 'manager' as Role, label: 'مدیر کلینیک' },
              { role: 'teflatus' as Role, label: 'تفلاطوس ارشد' }
            ].map((r) => (
              <button
                key={r.role}
                onClick={() => onChangeRole(r.role)}
                className={`py-3 px-1 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                  currentUserRole === r.role
                    ? 'bg-[#0B5F3C] border-[#0B5F3C] text-white shadow-md'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Doctors registration table inside clinic */}
          <div className="border-t border-gray-50 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-gray-650">ثبت پزشکان فعال در کلینیک افلاطوس</h4>
            
            <form onSubmit={handleAddDocSubmit} className="flex gap-2">
              <input
                type="text"
                required
                value={newDoctor}
                onChange={(e) => setNewDoctor(e.target.value)}
                placeholder="مثال: دکتر سمیرا عباسی"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-[#0B5F3C] hover:bg-[#0B5F3C]/90 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus size={14} />
                افزودن
              </button>
            </form>

            <div className="border border-gray-100 rounded-xl max-h-36 overflow-y-auto divide-y divide-gray-50 text-xs">
              {doctorsList.map((doc) => (
                <div key={doc} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                  <span className="font-semibold text-gray-800">{doc}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveDoctor(doc)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                    title="حذف پزشک"
                  >
                    <Trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User & Role Management Section (For Managers & Teflatus) */}
        {(currentUserRole === 'manager' || currentUserRole === 'teflatus') && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 pb-3 border-b border-gray-50">
              <div className="p-2 bg-[#0B5F3C]/5 text-[#0B5F3C] rounded-lg">
                <UserCheck size={18} />
              </div>
              <h3 className="text-sm font-bold text-gray-800 font-sans">ایجاد، حذف و ویرایش کاربران و نقش‌ها</h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              شما دسترسی مدیریت پرسنل کلینیک را دارید. می‌توانید کاربران جدید بسازید، رمز عبور و اطلاعات آن‌ها را ویرایش کنید یا نقش آن‌ها را تغییر دهید:
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100/50">
              <p className="text-xs font-bold text-gray-700">افزودن کاربر جدید</p>
              
              {userError && (
                <div className="bg-red-50 text-red-600 border border-red-100 px-3 py-1.5 rounded-lg text-[11px]">
                  {userError}
                </div>
              )}
              
              {userSuccess && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1.5 rounded-lg text-[11px]">
                  {userSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-right">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">نام و نام خانوادگی</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="مثال: مریم کریمی"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">شماره همراه (نام کاربری)</label>
                  <input
                    type="tel"
                    required
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="مثال: 09123334444"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">رمز عبور ورود</label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="******"
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-left text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1">نقش کاربری</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as Role)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs cursor-pointer text-gray-700"
                  >
                    <option value="secretary">منشی پذیرش</option>
                    <option value="manager">مدیر کلینیک</option>
                    {currentUserRole === 'teflatus' && (
                      <option value="teflatus">تفلاطوس (دسترسی ارشد)</option>
                    )}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0B5F3C] hover:bg-[#0B5F3C]/90 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus size={14} />
                  ثبت کاربر جدید
                </button>
              </div>
            </form>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-700">لیست کاربران فعال سیستم و ویرایش دسترسی‌ها</p>
              <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 bg-white text-xs overflow-hidden">
                {usersList.map((usr) => (
                  <div key={usr.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-gray-50/50">
                    {editingUserId === usr.id ? (
                      <div className="w-full space-y-3 p-3 bg-emerald-50/20 rounded-xl border border-emerald-100 text-right">
                        <p className="text-xs font-bold text-[#0B5F3C]">ویرایش مشخصات کاربر</p>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-[10px] text-gray-450 mb-0.5">نام و نام خانوادگی</label>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-450 mb-0.5">شماره همراه (نام کاربری)</label>
                            <input
                              type="tel"
                              value={editingPhone}
                              onChange={(e) => setEditingPhone(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-left font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-450 mb-0.5">رمز ورود</label>
                            <input
                              type="text"
                              value={editingPassword}
                              onChange={(e) => setEditingPassword(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-left font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-450 mb-0.5">نقش کاربری</label>
                            <select
                              value={editingRole}
                              onChange={(e) => setEditingRole(e.target.value as Role)}
                              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs cursor-pointer text-gray-700"
                            >
                              <option value="secretary">منشی پذیرش</option>
                              <option value="manager">مدیر کلینیک</option>
                              {(currentUserRole === 'teflatus' || usr.role === 'teflatus') && (
                                <option value="teflatus">تفلاطوس (دسترسی ارشد)</option>
                              )}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setEditingUserId(null)}
                            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-[11px] cursor-pointer"
                          >
                            انصراف
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveUserEdit(usr.id)}
                            className="px-4 py-1.5 bg-[#0B5F3C] hover:bg-[#0B5F3C]/90 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                          >
                            ذخیره تغییرات
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-bold text-gray-800">{usr.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md mr-2 ${
                            usr.role === 'teflatus' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : usr.role === 'manager' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                                : 'bg-gray-100 text-gray-600'
                          }`}>
                            {usr.role === 'teflatus' ? 'تفلاطوس ارشد' : usr.role === 'manager' ? 'مدیر کلینیک' : 'منشی پذیرش'}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1 font-mono font-bold">نام کاربری: {usr.phone} | رمز ورود: {usr.password || '******'}</p>
                        </div>
                        
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => handleStartEditUser(usr)}
                            className="px-2.5 py-1 text-xs text-[#0B5F3C] bg-[#0B5F3C]/5 hover:bg-[#0B5F3C]/10 border border-[#0B5F3C]/10 rounded-lg transition-all cursor-pointer"
                          >
                            ویرایش اطلاعات
                          </button>
                          {/* Don't allow deleting base manager / teflatus default users to prevent lockouts */}
                          {usr.phone !== '09122222222' && usr.phone !== '09123333333' ? (
                            <button
                              type="button"
                              onClick={() => onRemoveUser(usr.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-all cursor-pointer"
                              title="حذف کاربر"
                            >
                              <Trash size={14} />
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 font-bold px-1.5 bg-gray-50 border border-gray-100 rounded-md">پیش‌فرض سیستم</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Dangerous/Advanced Zone */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-red-650 flex items-center gap-2 border-b border-gray-50 pb-3">
          <RotateCcw size={17} />
          مدیریت پایگاه داده محلی (پشتیبان‌گیری و بازنشانی دمو)
        </h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-sans">
          <p className="text-gray-400 leading-relaxed max-w-xl">
            در صورتی که جریان ورودی با مشکل مواجه است یا می‌خواهید داده‌های تمرینی جدید را اعمال کنید، با فشردن دکمه زیر می‌توانید تمامی رکوردهای محلی را بازنشانی و تمیز کنید.
          </p>
          <button
            onClick={() => {
              if (window.confirm('آیا از بازنشانی داده‌های موقت لید به پرونده‌های فرضی پیش‌فرض اطمینان دارید؟ تمامی تغییرات ثبت‌نشده پاک می‌شوند.')) {
                onResetData();
              }
            }}
            className="px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 transition-all font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-red-200 shadow-sm"
          >
            <RotateCcw size={14} />
            بازشروع کامل دمو (Reset Data)
          </button>
        </div>
      </div>
    </div>
  );
}
