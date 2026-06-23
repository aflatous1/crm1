/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { toPersianDigits, formatJalaliDate, formatPrice } from '../jalali';
import { 
  Search, 
  User, 
  Phone, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  FolderHeart, 
  History, 
  Stethoscope, 
  FileText, 
  DollarSign,
  UserCheck,
  CheckCircle,
  TrendingUp,
  SlidersHorizontal,
  ChevronLeft,
  X,
  FileEdit
} from 'lucide-react';

interface PatientFilesProps {
  leads: Lead[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string | null) => void;
  onEditLead: (lead: Lead) => void;
}

export default function PatientFiles({ leads, selectedPatientId, onSelectPatient, onEditLead }: PatientFilesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Find the currently selected lead
  const selectedLead = useMemo(() => {
    if (!selectedPatientId) return null;
    return leads.find(l => l.id === selectedPatientId) || null;
  }, [leads, selectedPatientId]);

  // Clean filters when switching or closing
  const handleBackToList = () => {
    onSelectPatient(null);
  };

  // Group or filter patients (leads)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = 
        lead.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm);
      
      const matchesStatus = 
        selectedStatus === 'all' || 
        lead.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, selectedStatus]);

  // Status Badge Colors Helper
  const getStatusBadgeClass = (status: LeadStatus) => {
    switch (status) {
      case 'تماس اولیه':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'اطلاعات ارسال شد':
        return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'مشاوره رزرو شد':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'مراجعه کرد':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'عمل انجام شد':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'از دست رفته':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FolderHeart size={20} className="text-[#0B5F3C]" />
            سامانه مدیریت پرونده بیماران
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            مشاهده، ردیابی کل وقایع درمانی و پرونده‌های مستقل بیمارستانی مراجعین
          </p>
        </div>
        {selectedLead && (
          <button
            onClick={handleBackToList}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer transition-all self-start"
          >
            <ArrowLeft size={14} />
            بازگشت به لیست پرونده‌ها
          </button>
        )}
      </div>

      {!selectedLead ? (
        /* LIST VIEW */
        <div className="space-y-6">
          {/* SEARCH & FILTERS */}
          <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="جستجوی پرونده با نام بیمار یا شماره تماس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 bg-gray-50/50 border border-gray-200 rounded-xl text-xs font-sans text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0B5F3C] focus:bg-white transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">وضعیت:</span>
              <button
                onClick={() => setSelectedStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${selectedStatus === 'all' ? 'bg-[#0B5F3C] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                همه ({leads.length})
              </button>
              {(['تماس اولیه', 'اطلاعات ارسال شد', 'مشاوره رزرو شد', 'مراجعه کرد', 'عمل انجام شد', 'از دست رفته'] as LeadStatus[]).map((status) => {
                const count = leads.filter(l => l.status === status).length;
                return (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer border transition-all ${selectedStatus === status ? 'bg-[#0B5F3C] border-[#0B5F3C] text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {status} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* GRID OF PATIENTS */}
          {filteredLeads.length === 0 ? (
            <div className="p-16 text-center bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3">
              <FileText size={36} className="text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-500">هیچ پرونده بیماری یافت نشد</p>
              <p className="text-[11px] text-gray-400">اطلاعاتی متناسب با جستجو یا فیلترهای انتخابی شما در پایگاه داده کلینیک ثبت نشده است.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLeads.map((lead) => {
                const editsCount = lead.history?.length || 0;
                return (
                  <div 
                    key={lead.id} 
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Top Row: Name and Status */}
                    <div className="flex justify-between items-start">
                      <span className={`px-2.5 py-1 border rounded-lg text-[10px] font-bold ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                      <div className="text-right">
                        <h4 className="text-sm font-bold text-gray-800">{lead.patientName}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{toPersianDigits(lead.phone)}</p>
                      </div>
                    </div>

                    {/* Mid Details */}
                    <div className="grid grid-cols-2 gap-3 bg-gray-50/50 p-3 rounded-xl text-[10px] font-semibold text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope size={12} className="text-gray-400" />
                        <span>پزشک: <strong className="text-gray-700">{lead.doctor}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileText size={12} className="text-gray-400" />
                        <span>خدمت: <strong className="text-gray-700">{lead.service}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserCheck size={12} className="text-gray-400" />
                        <span>مسئول: <strong className="text-gray-700">{lead.assignedTo || 'سیمین حسینی'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <History size={12} className="text-gray-400" />
                        <span>تغییرات: <strong className="text-[#0B5F3C] font-mono">{toPersianDigits(editsCount)} نسخه</strong></span>
                      </div>
                    </div>

                    {/* Bottom row and Action button */}
                    <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                      <span className="text-[9px] text-gray-400">تاریخ ثبت اولیه: {toPersianDigits(lead.date)}</span>
                      <button
                        onClick={() => onSelectPatient(lead.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#0B5F3C] hover:text-[#08482E] transition-colors cursor-pointer"
                      >
                        مشاهده پرونده و سوابق
                        <ChevronLeft size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* DETAILED PATIENT FILE VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: STATIC METADATA CARD */}
          <div className="space-y-5 lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-5">
              {/* User Avatar Header */}
              <div className="text-center pb-5 border-b border-gray-50 space-y-3">
                <div className="w-16 h-16 bg-[#0B5F3C]/10 border border-[#0B5F3C]/20 rounded-full flex items-center justify-center text-[#0B5F3C] mx-auto">
                  <User size={30} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">{selectedLead.patientName}</h3>
                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 font-mono mt-1">
                    <Phone size={12} />
                    <span>{toPersianDigits(selectedLead.phone)}</span>
                  </div>
                </div>
                <div className="inline-block">
                  <span className={`px-3 py-1.5 border rounded-lg text-xs font-bold ${getStatusBadgeClass(selectedLead.status)}`}>
                    وضعیت فعلی: {selectedLead.status}
                  </span>
                </div>
              </div>

              {/* Main Metadata Details */}
              <div className="space-y-4 text-xs">
                <h4 className="font-bold text-gray-800 text-xs border-r-2 border-[#0B5F3C] pr-2">مشخصات کلینیکی و بازاریابی</h4>
                
                <div className="space-y-3 font-semibold text-gray-600">
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-450">پزشک معالج:</span>
                    <span className="text-gray-800 font-bold">{selectedLead.doctor}</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-450">نوع خدمت درخواستی:</span>
                    <span className="text-gray-800 font-bold">{selectedLead.service}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-450">کانال جذب (منبع):</span>
                    <span className="text-gray-800 font-bold">{selectedLead.source}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-450">مسئول پرونده (آخرین ویرایشگر):</span>
                    <span className="text-blue-750 font-bold">{selectedLead.assignedTo || 'سیمین حسینی'}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-450">هزینه اعلام شده:</span>
                    <span className="text-rose-600 font-bold font-sans">{formatPrice(selectedLead.announcedCost)}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-450">مبلغ قرارداد نهایی:</span>
                    <span className="text-emerald-700 font-bold font-sans">{formatPrice(selectedLead.contractAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl">
                    <span className="text-gray-450">نوبت پیگیری بعدی:</span>
                    <span className="text-amber-700 font-bold font-mono">{selectedLead.nextFollowUpDate ? toPersianDigits(selectedLead.nextFollowUpDate) : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Edit Action Button */}
              <button
                onClick={() => onEditLead(selectedLead)}
                className="w-full py-2.5 bg-[#0B5F3C] hover:bg-[#08482E] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <FileEdit size={14} />
                ویرایش مشخصات و پیگیری لید
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: TIMELINE OF EDITS (THE AUDIT TRAIL / FILE VERSION HISTORY) */}
          <div className="space-y-5 lg:col-span-2">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                    <History size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">تاریخچه نسخه‌ها و روند درمانی پرونده</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">آرشیو تمام رویدادها، تغییرات وضعیت‌ها و یادداشت‌های ثبت‌شده برای بیمار</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  کل نسخه‌ها: {toPersianDigits((selectedLead.history?.length || 0) + 1)} نسخه
                </span>
              </div>

              {/* TIMELINE LIST */}
              <div className="relative border-r border-gray-150 pr-4 mr-2 space-y-6">
                
                {/* 1. CURRENT VERSION (MOST RECENT/ACTIVE STATE) */}
                <div className="relative">
                  {/* Timeline Dot Indicator */}
                  <div className="absolute top-1.5 -right-6.5 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center shadow-sm" />
                  
                  <div className="space-y-2 bg-emerald-50/10 border border-emerald-100/70 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-800">نسخه فعلی و نهایی پرونده</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-md">فعال</span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                        <Clock size={11} />
                        <span>آخرین به‌روزرسانی در سیستم</span>
                      </div>
                    </div>

                    {/* Snapshot values */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-50 text-[10px] font-semibold text-gray-600">
                      <div>وضعیت درمان: <strong className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 rounded">{selectedLead.status}</strong></div>
                      <div>پزشک: <strong className="text-gray-700">{selectedLead.doctor}</strong></div>
                      <div>مسئول پیگیری: <strong className="text-blue-750">{selectedLead.assignedTo || 'سیمین حسینی'}</strong></div>
                      <div>پیگیری بعدی: <strong className="text-amber-700 font-mono">{selectedLead.nextFollowUpDate ? toPersianDigits(selectedLead.nextFollowUpDate) : '-'}</strong></div>
                    </div>

                    {/* Note */}
                    <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-emerald-50/50 leading-relaxed text-gray-700">
                      <div className="text-[9px] font-bold text-gray-400 mb-1">یادداشت پزشک یا منشی در نسخه فعلی:</div>
                      {selectedLead.notes || 'بدون یادداشت'}
                    </div>
                  </div>
                </div>

                {/* 2. PREVIOUS VERSIONS (CHRONOLOGICAL EDIT LOGS) */}
                {(!selectedLead.history || selectedLead.history.length === 0) ? (
                  <div className="relative">
                    {/* Fallback starting dot */}
                    <div className="absolute top-1.5 -right-6.5 w-4 h-4 rounded-full bg-gray-300 border-4 border-white" />
                    <p className="text-[10px] text-gray-400 italic pr-1">هیچ نسخه قدیمی‌تری ثبت نشده است. این پرونده در نسخه فعلی پایه‌گذاری شده است.</p>
                  </div>
                ) : (
                  selectedLead.history.map((log, index) => (
                    <div key={log.id} className="relative">
                      {/* Timeline Dot Indicator */}
                      <div className="absolute top-1.5 -right-6.5 w-4 h-4 rounded-full bg-blue-400 border-4 border-white flex items-center justify-center shadow-sm" />
                      
                      <div className="space-y-2 bg-gray-50 border border-gray-150 rounded-xl p-4 hover:border-gray-300 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-gray-700">نسخه تغییریافته توسط:</span>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{log.editorName}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <Clock size={11} />
                            <span>{toPersianDigits(log.changeDate)}</span>
                          </div>
                        </div>

                        {/* Snapshot values */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-[10px] font-semibold text-gray-600">
                          <div>وضعیت: <strong className="text-gray-700 bg-gray-100 border border-gray-200 px-1 rounded">{log.status}</strong></div>
                          <div>پزشک: <strong className="text-gray-700">{log.doctor}</strong></div>
                          <div>خدمت: <strong className="text-gray-700">{log.service}</strong></div>
                          <div>پیگیری: <strong className="text-amber-700 font-mono">{log.nextFollowUpDate ? toPersianDigits(log.nextFollowUpDate) : '-'}</strong></div>
                        </div>

                        {/* Price changes */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-gray-500 bg-white/50 p-2 rounded-lg">
                          <div>هزینه اعلام‌شده: <strong className="text-rose-600 font-sans">{formatPrice(log.announcedCost)}</strong></div>
                          <div>مبلغ نهایی قرارداد: <strong className="text-emerald-700 font-sans">{formatPrice(log.contractAmount)}</strong></div>
                        </div>

                        {/* Note */}
                        {log.notes && (
                          <div className="mt-2 text-xs bg-white p-2.5 rounded-lg border border-gray-100 leading-relaxed text-gray-600">
                            <div className="text-[9px] font-bold text-gray-400 mb-1">یادداشت ثبت شده در این نسخه:</div>
                            {log.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
