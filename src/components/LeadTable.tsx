/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Lead, ServiceType, LeadSource, LeadStatus } from '../types';
import { formatJalaliDate, formatPrice, toPersianDigits } from '../jalali';
import { SEED_DOCTORS } from '../data';
import { 
  Search, ArrowUpDown, Edit, Trash2, Filter, 
  Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  doctors?: string[];
  role?: string; // permissions check
}

const SERVICE_OPTIONS: ServiceType[] = ['جراحی بینی', 'بلفاروپلاستی', 'لیفت صورت', 'فیلر', 'بوتاکس', 'کاشت مو', 'سایر'];
const SOURCE_OPTIONS: LeadSource[] = ['اینستاگرام', 'تبلیغات', 'معرفی', 'گوگل', 'واتساپ', 'تماس مستقیم', 'سایر'];
const STATUS_OPTIONS: LeadStatus[] = ['تماس اولیه', 'اطلاعات ارسال شد', 'مشاوره رزرو شد', 'مراجعه کرد', 'عمل انجام شد', 'از دست رفته'];

export default function LeadTable({
  leads,
  onEdit,
  onDelete,
  doctors = SEED_DOCTORS,
  role
}: LeadTableProps) {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedAssignedTo, setSelectedAssignedTo] = useState('');

  // Collect unique assigned users
  const uniqueAssignedUsers = useMemo(() => {
    const names = leads.map((l) => l.assignedTo || 'سیمین حسینی');
    return Array.from(new Set(names)).filter(Boolean);
  }, [leads]);
  
  // Sort states
  const [sortField, setSortField] = useState<keyof Lead>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter visibility
  const [showFilters, setShowFilters] = useState(false);

  // Sorting helper
  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDoctor('');
    setSelectedService('');
    setSelectedSource('');
    setSelectedStatus('');
    setSelectedYear('');
    setSelectedMonth('');
    setSelectedAssignedTo('');
    setCurrentPage(1);
  };

  // Handle Filtering & Searching
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search matches
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        lead.patientName.toLowerCase().includes(searchLower) ||
        lead.phone.includes(searchLower) ||
        (lead.notes && lead.notes.toLowerCase().includes(searchLower));

      // Dropdown matches
      const matchesDoctor = !selectedDoctor || lead.doctor === selectedDoctor;
      const matchesService = !selectedService || lead.service === selectedService;
      const matchesSource = !selectedSource || lead.source === selectedSource;
      const matchesStatus = !selectedStatus || lead.status === selectedStatus;
      const matchesAssignedTo = !selectedAssignedTo || (lead.assignedTo || 'سیمین حسینی') === selectedAssignedTo;

      // Shamsi Date mapping (Format: "1405/03/25")
      let matchesYear = true;
      let matchesMonth = true;
      if (lead.date && lead.date.includes('/')) {
        const parts = lead.date.split('/');
        if (selectedYear) {
          matchesYear = parts[0] === selectedYear;
        }
        if (selectedMonth) {
          // Compare as zero-padded month index
          matchesMonth = parseInt(parts[1], 10) === parseInt(selectedMonth, 10);
        }
      } else {
        if (selectedYear || selectedMonth) {
          matchesYear = false;
          matchesMonth = false;
        }
      }

      return matchesSearch && matchesDoctor && matchesService && matchesSource && matchesStatus && matchesYear && matchesMonth && matchesAssignedTo;
    });
  }, [leads, searchTerm, selectedDoctor, selectedService, selectedSource, selectedStatus, selectedYear, selectedMonth, selectedAssignedTo]);

  // Handle Sorting
  const sortedLeads = useMemo(() => {
    const list = [...filteredLeads];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      
      const strA = valA.toString().toLowerCase();
      const strB = valB.toString().toLowerCase();
      
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredLeads, sortField, sortDirection]);

  // Pagination bounds
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return sortedLeads.slice(startIdx, startIdx + itemsPerPage);
  }, [sortedLeads, currentPage]);

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Status Badge styling helper
  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'عمل انجام شد':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'مراجعه کرد':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'مشاوره رزرو شد':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'اطلاعات ارسال شد':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'تماس اولیه':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'از دست رفته':
        return 'bg-red-50 text-red-600 border-red-200';
      default:
        return 'bg-gray-150 text-gray-600 border-gray-200';
    }
  };

  // Excel Export (Perfect Persian CSV with BOM)
  const exportToExcel = () => {
    const headers = ['تاریخ', 'نام بیمار', 'شماره تماس', 'پزشک', 'نوع خدمت', 'وضعیت', 'منبع آشنایی', 'هزینه اعلامی', 'مبلغ قرارداد', 'تاریخ پیگیری', 'یادداشت'];
    const rows = filteredLeads.map((lead) => [
      lead.date,
      lead.patientName,
      lead.phone,
      lead.doctor,
      lead.service,
      lead.status,
      lead.source,
      lead.announcedCost,
      lead.contractAmount,
      lead.nextFollowUpDate,
      lead.notes
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export via elegant landscape printable window
  const exportToPDF = () => {
    const printWindow = window.open('', '', 'height=600,width=900');
    if (!printWindow) return;

    printWindow.document.write(`
      <html lang="fa" dir="rtl">
        <head>
          <title>گزارش لیدها - افلاطوس</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; padding: 24px; color: #333; direction: rtl; }
            h1 { text-align: center; color: #0B5F3C; font-size: 20px; }
            p { text-align: center; color: #666; font-size: 11px; margin-top: -5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background-color: #0B5F3C; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>گزارش پرونده لیدهای کلینیک زیبایی افلاطوس</h1>
          <p>تاریخ خروجی: ${toPersianDigits(new Date().toLocaleDateString('fa-IR'))}</p>
          <table>
            <thead>
              <tr>
                <th>تاریخ تماس</th>
                <th>نام بیمار</th>
                <th>تلفن</th>
                <th>پزشک</th>
                <th>خدمت</th>
                <th>وضعیت</th>
                <th>منبع</th>
                <th>هزینه (تومان)</th>
                <th>قرارداد (تومان)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLeads.map(lead => `
                <tr>
                  <td>${toPersianDigits(lead.date)}</td>
                  <td>${lead.patientName}</td>
                  <td>${toPersianDigits(lead.phone)}</td>
                  <td>${lead.doctor}</td>
                  <td>${lead.service}</td>
                  <td>${lead.status}</td>
                  <td>${lead.source}</td>
                  <td>${toPersianDigits(lead.announcedCost?.toLocaleString())}</td>
                  <td>${toPersianDigits(lead.contractAmount?.toLocaleString())}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden text-right" dir="rtl">
      {/* Table Action Controls Panel */}
      <div className="p-4 md:p-6 border-b border-gray-50 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="flex flex-col md:flex-row flex-1 gap-3 items-stretch md:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="جستجو در نام بیمار، تلفن یا یادداشت..."
              className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent transition-all"
            />
            <Search size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Quick Month Filter */}
          <div className="w-full md:w-36 shrink-0">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] cursor-pointer text-gray-700"
            >
              <option value="">همه ماه‌ها</option>
              {['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'].map((monthName, idx) => (
                <option key={idx + 1} value={(idx + 1).toString()}>
                  {monthName}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Service Filter */}
          <div className="w-full md:w-40 shrink-0">
            <select
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] cursor-pointer text-gray-700"
            >
              <option value="">همه خدمات</option>
              {SERVICE_OPTIONS.map((srv) => (
                <option key={srv} value={srv}>
                  {srv}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Collapse/Expand Filter Row */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showFilters || selectedDoctor || selectedService || selectedSource || selectedStatus || selectedYear || selectedMonth
                ? 'bg-[#0B5F3C]/5 font-bold border-[#0B5F3C] text-[#0B5F3C]'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter size={15} />
            فیلترها
            {(selectedDoctor || selectedService || selectedSource || selectedStatus || selectedYear || selectedMonth) && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Export Options dropdown */}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 transition-all rounded-xl text-xs font-semibold cursor-pointer"
            title="دانلود اکسل"
          >
            <FileSpreadsheet size={15} />
            خروجی Excel
          </button>

          <button
            onClick={exportToPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 transition-all rounded-xl text-xs font-semibold cursor-pointer"
            title="دانلود فایل PDF چاپی"
          >
            <FileText size={15} />
            خروجی PDF / چاپ
          </button>
        </div>
      </div>

      {/* Conditionally Expanded Filters Section */}
      {(showFilters || selectedDoctor || selectedService || selectedSource || selectedStatus || selectedYear || selectedMonth || selectedAssignedTo) && (
        <div className="p-4 bg-gray-50/70 border-b border-gray-50 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {/* Year */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">سال تماس (شمسى)</label>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
            >
              <option value="">همه سال‌ها</option>
              <option value="1405">۱۴۰۵</option>
              <option value="1404">۱۴۰۴</option>
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">ماه تماس (شمسى)</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
            >
              <option value="">همه ماه‌ها</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m.toString()}>
                  {m.toString().padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">پزشک</label>
            <select
              value={selectedDoctor}
              onChange={(e) => {
                setSelectedDoctor(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
            >
              <option value="">همه پزشکان</option>
              {doctors.map((doc) => (
                <option key={doc} value={doc}>
                  {doc}
                </option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">نوع خدمت</label>
            <select
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
            >
              <option value="">همه خدمات</option>
              {SERVICE_OPTIONS.map((srv) => (
                <option key={srv} value={srv}>
                  {srv}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">منبع آشنایی</label>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
            >
              <option value="">همه منابع</option>
              {SOURCE_OPTIONS.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">وضعیت لید</label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
            >
              <option value="">همه وضعیت‌ها</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned To (مسئول پیگیری) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1">مسئول پیگیری</label>
            <select
              value={selectedAssignedTo}
              onChange={(e) => {
                setSelectedAssignedTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-sans"
            >
              <option value="">همه مسئولان</option>
              {uniqueAssignedUsers.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs rounded-lg transition-all flex items-center justify-center gap-1 font-bold cursor-pointer"
            >
              <X size={13} />
              پاک‌سازی
            </button>
          </div>
        </div>
      )}

      {/* Main Table View */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-right border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-xs font-bold text-gray-500 uppercase tracking-wider">
              {/* Table Column headers with Sorting toggles */}
              <th onClick={() => handleSort('date')} className="px-5 py-4 cursor-pointer hover:bg-gray-100 select-none">
                <div className="flex items-center gap-1 select-none">
                  تاریخ
                  <ArrowUpDown size={11} className="text-gray-400" />
                </div>
              </th>
              <th onClick={() => handleSort('patientName')} className="px-5 py-4 cursor-pointer hover:bg-gray-100 select-none">
                <div className="flex items-center gap-1 select-none">
                  نام بیمار
                  <ArrowUpDown size={11} className="text-gray-400" />
                </div>
              </th>
              <th className="px-5 py-4">شماره تماس</th>
              <th onClick={() => handleSort('doctor')} className="px-5 py-4 cursor-pointer hover:bg-gray-100 select-none">
                <div className="flex items-center gap-1 select-none">
                  پزشک
                  <ArrowUpDown size={11} className="text-gray-400" />
                </div>
              </th>
              <th className="px-5 py-4">نوع خدمت</th>
              <th className="px-5 py-4">وضعیت</th>
              <th className="px-5 py-4">منبع</th>
              <th onClick={() => handleSort('contractAmount')} className="px-5 py-4 cursor-pointer hover:bg-gray-100 select-none">
                <div className="flex items-center gap-1 select-none">
                  مبلغ قرارداد
                  <ArrowUpDown size={11} className="text-gray-400" />
                </div>
              </th>
              <th onClick={() => handleSort('assignedTo')} className="px-5 py-4 cursor-pointer hover:bg-gray-100 select-none">
                <div className="flex items-center gap-1 select-none">
                  مسئول پیگیری
                  <ArrowUpDown size={11} className="text-gray-400" />
                </div>
              </th>
              <th className="px-5 py-4">پیگیری بعدی</th>
              <th className="px-5 py-4">یادداشت</th>
              <th className="px-5 py-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-5 py-12 text-center text-gray-400 font-sans">
                  هیچ لیدی منطبق بر فیلترهای بالا یافت نشد.
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50/60 transition-all">
                  <td className="px-5 py-3.5 font-mono text-gray-500 whitespace-nowrap">
                    {toPersianDigits(lead.date)}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                    {lead.patientName}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-gray-600 whitespace-nowrap">
                    {toPersianDigits(lead.phone)}
                  </td>
                  <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                    {lead.doctor}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-1 bg-gray-55 border border-gray-100 text-gray-600 rounded-md">
                      {lead.service}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getStatusBadge(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                    {lead.source}
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-gray-800 whitespace-nowrap">
                    {lead.contractAmount > 0 ? (
                      formatPrice(lead.contractAmount)
                    ) : lead.announcedCost > 0 ? (
                      <span className="text-gray-400 line-through decoration-red-200" title="هزینه اعلام شده">
                        {formatPrice(lead.announcedCost)}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 font-medium whitespace-nowrap">
                    {lead.assignedTo || 'سیمین حسینی'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-rose-600 font-semibold whitespace-nowrap">
                    {lead.nextFollowUpDate ? toPersianDigits(lead.nextFollowUpDate) : '-'}
                  </td>
                  <td className="px-5 py-3.5 max-w-xs truncate text-gray-400" title={lead.notes}>
                    {lead.notes || '-'}
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEdit(lead)}
                        className="p-1.5 text-gray-500 hover:text-[#0B5F3C] hover:bg-[#0B5F3C]/5 rounded-lg transition-all cursor-pointer"
                        title="ویرایش لید"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`آیا از حذف اطلاعات لید «\u200F${lead.patientName}» اطمینان دارید؟`)) {
                            onDelete(lead.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="حذف لید"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 md:p-5 border-t border-gray-50 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 font-sans">
        <div>
          تعداد کل لیدها: <span className="font-bold text-gray-800">{toPersianDigits(filteredLeads.length)}</span> فقره
          (نمایش صفحه {toPersianDigits(currentPage)} از {toPersianDigits(totalPages)})
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => changePage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:hover:bg-white hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
          >
            <ChevronRight size={15} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - currentPage) <= 2 || p === 1 || p === totalPages)
            .map((p, idx, arr) => {
              const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
              return (
                <React.Fragment key={p}>
                  {showEllipsis && <span className="px-1">...</span>}
                  <button
                    onClick={() => changePage(p)}
                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                      currentPage === p
                        ? 'bg-[#0B5F3C] border-[#0B5F3C] text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {toPersianDigits(p)}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => changePage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 bg-white border border-gray-200 text-gray-600 disabled:opacity-40 disabled:hover:bg-white hover:bg-gray-50 rounded-lg transition-all cursor-pointer"
          >
            <ChevronLeft size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
