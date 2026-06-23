/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Lead, ServiceType, LeadSource, LeadStatus } from '../types';
import { SEED_DOCTORS } from '../data';
import { getTodayJalali } from '../jalali';
import { UserMinus, Send, Clock, Sparkles } from 'lucide-react';
import JalaliDatePicker from './JalaliDatePicker';

interface LeadFormProps {
  initialLead?: Lead; // if editing
  onSubmit: (lead: Omit<Lead, 'id'> & { id?: string }) => void;
  onCancel?: () => void;
  doctors?: string[];
  sources?: string[];
}

const SERVICE_OPTIONS: ServiceType[] = [
  'جراحی بینی',
  'بلفاروپلاستی',
  'لیفت صورت',
  'فیلر',
  'بوتاکس',
  'کاشت مو',
  'سایر'
];

const SOURCE_OPTIONS: LeadSource[] = [
  'اینستاگرام',
  'تبلیغات',
  'معرفی',
  'گوگل',
  'واتساپ',
  'تماس مستقیم',
  'سایر'
];

const STATUS_OPTIONS: LeadStatus[] = [
  'تماس اولیه',
  'اطلاعات ارسال شد',
  'مشاوره رزرو شد',
  'مراجعه کرد',
  'عمل انجام شد',
  'از دست رفته'
];

export default function LeadForm({
  initialLead,
  onSubmit,
  onCancel,
  doctors = SEED_DOCTORS,
  sources = SOURCE_OPTIONS
}: LeadFormProps) {
  const [date, setDate] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [doctor, setDoctor] = useState('');
  const [service, setService] = useState<ServiceType>('جراحی بینی');
  const [source, setSource] = useState<LeadSource>(sources[0] || 'اینستاگرام');
  const [status, setStatus] = useState<LeadStatus>('تماس اولیه');
  const [announcedCost, setAnnouncedCost] = useState<number>(0);
  const [contractAmount, setContractAmount] = useState<number>(0);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialLead) {
      setDate(initialLead.date);
      setPatientName(initialLead.patientName);
      setPhone(initialLead.phone);
      setDoctor(initialLead.doctor);
      setService(initialLead.service);
      setSource(initialLead.source);
      setStatus(initialLead.status);
      setAnnouncedCost(initialLead.announcedCost || 0);
      setContractAmount(initialLead.contractAmount || 0);
      setNextFollowUpDate(initialLead.nextFollowUpDate);
      setNotes(initialLead.notes || '');
    } else {
      const today = getTodayJalali();
      setDate(today);
      setNextFollowUpDate(today);
      if (doctors.length > 0) {
        setDoctor(doctors[0]);
      }
      if (sources.length > 0) {
        setSource(sources[0]);
      }
    }
  }, [initialLead, doctors, sources]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('نام بیمار الزامی است');
      return;
    }
    if (!phone.trim()) {
      setError('شماره تماس الزامی است');
      return;
    }
    if (!doctor) {
      setError('پزشک الزامی است');
      return;
    }

    onSubmit({
      id: initialLead?.id,
      date,
      patientName: patientName.trim(),
      phone: phone.trim(),
      doctor,
      service,
      source,
      status,
      announcedCost: Number(announcedCost) || 0,
      contractAmount: Number(contractAmount) || 0,
      nextFollowUpDate,
      notes: notes.trim()
    });
    
    // Clear unless editing
    if (!initialLead) {
      setPatientName('');
      setPhone('');
      setNotes('');
      setAnnouncedCost(0);
      setContractAmount(0);
    }
    setError('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-right bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm" dir="rtl">
      <div className="flex justify-between items-center pb-4 border-b border-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            {initialLead ? 'ویرایش جزئیات لید' : 'ثبت لید جدید بیمار'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {initialLead?.assignedTo 
              ? `مسئول پیگیری فعلی: ${initialLead.assignedTo} (پس از ذخیره به نام شما به‌روزرسانی می‌شود)` 
              : 'تکمیل اطلاعات پرونده برای همگام‌سازی لحظه‌ای'}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 rounded-lg transition-all"
          >
            انصراف
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date of contact */}
        <JalaliDatePicker
          label="تاریخ تماس (شمسی)"
          value={date}
          onChange={setDate}
          required
        />

        {/* Patient Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            نام بیمار <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="مثال: زهرا مرادی"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent placeholder:text-gray-300 transition-all text-sm"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            شماره تماس <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="مثال: 09121234567"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent placeholder:text-gray-300 transition-all font-mono text-sm"
          />
        </div>

        {/* Doctor select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            پزشک متخصص <span className="text-red-500">*</span>
          </label>
          <select
            value={doctor}
            onChange={(e) => setDoctor(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent transition-all text-sm cursor-pointer"
          >
            <option value="">انتخاب پزشک...</option>
            {doctors.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </select>
        </div>

        {/* Type of service */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            نوع خدمت زیبایی
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 mt-1">
            {SERVICE_OPTIONS.map((srv) => (
              <button
                key={srv}
                type="button"
                onClick={() => setService(srv)}
                className={`py-2 px-1 text-xs rounded-lg border text-center transition-all ${
                  service === srv
                    ? 'bg-[#0B5F3C]/10 border-[#0B5F3C] text-[#0B5F3C] font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {srv}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            منبع آشنایی با کلینیک
          </label>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-1.5 mt-1">
            {sources.map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => setSource(src)}
                className={`py-2 px-1 text-xs rounded-lg border text-center transition-all ${
                  source === src
                    ? 'bg-[#0B5F3C]/10 border-[#0B5F3C] text-[#0B5F3C] font-semibold'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>

        {/* Lead Status */}
        <div className="md:col-span-2 border-t border-gray-50 pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            وضعیت لید بیمار
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-1">
            {STATUS_OPTIONS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`py-2 text-xs rounded-lg border text-center font-medium transition-all ${
                  status === st
                    ? 'bg-[#0B5F3C] border-[#0B5F3C] text-white shadow-sm'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Announced Cost */}
        <div className="border-t border-gray-50 pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            هزینه اعلام شده (تومان)
          </label>
          <input
            type="number"
            value={announcedCost || ''}
            onChange={(e) => setAnnouncedCost(parseFloat(e.target.value) || 0)}
            placeholder="مثال: ۴۵۰۰۰۰۰۰"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent transition-all font-mono text-sm"
          />
        </div>

        {/* Contract Amount */}
        <div className="border-t border-gray-50 pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            مبلغ قرارداد (تومان)
          </label>
          <input
            type="number"
            value={contractAmount || ''}
            onChange={(e) => setContractAmount(parseFloat(e.target.value) || 0)}
            placeholder="مثال: ۴۲۰۰۰۰۰۰"
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent transition-all font-mono text-sm"
          />
        </div>

        {/* Next Follow Up Date */}
        <JalaliDatePicker
          label="تاریخ پیگیری بعدی (شمسی)"
          value={nextFollowUpDate}
          onChange={setNextFollowUpDate}
          required
        />

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            یادداشت / گزارش وضعیت بیمار
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="جزئیات تعاملات قبلی، شرایط فیزیکی بیمار، انتظارات یا دلایل تاخیر..."
            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent placeholder:text-gray-300 transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
        <button
          type="submit"
          className="px-6 py-3 bg-[#0B5F3C] hover:bg-[#0B5F3C]/90 text-white rounded-xl text-sm font-bold shadow-md shadow-[#0B5F3C]/10 transition-all cursor-pointer flex items-center gap-2"
        >
          ثبت اطلاعات
        </button>
      </div>
    </form>
  );
}
