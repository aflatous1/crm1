/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft } from 'lucide-react';
import { g2j, j2g, jalaliDaysInMonth, JALALI_MONTH_NAMES, toPersianDigits, toEnglishDigits, getTodayJalali } from '../jalali';

interface JalaliDatePickerProps {
  value: string; // Format: "1405/03/25"
  onChange: (val: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function JalaliDatePicker({
  value,
  onChange,
  label,
  required = false,
  disabled = false
}: JalaliDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(1405);
  const [currentMonth, setCurrentMonth] = useState(3); // Khordad (3)
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value or default to today
  useEffect(() => {
    let year = 1405;
    let month = 3;
    if (value && value.includes('/')) {
      const parts = toEnglishDigits(value).split('/');
      if (parts.length === 3) {
        year = parseInt(parts[0], 10) || 1405;
        month = parseInt(parts[1], 10) || 3;
      }
    } else {
      const today = getTodayJalali();
      const parts = today.split('/');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
    }
    setCurrentYear(year);
    setCurrentMonth(month);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDaySelect = (day: number) => {
    const formatted = `${currentYear}/${currentMonth.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleShortcut = (type: 'today' | 'tomorrow' | 'nextWeek') => {
    const now = new Date();
    if (type === 'tomorrow') {
      now.setDate(now.getDate() + 1);
    } else if (type === 'nextWeek') {
      now.setDate(now.getDate() + 7);
    }
    const { jy, jm, jd } = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const val = `${jy}/${jm.toString().padStart(2, '0')}/${jd.toString().padStart(2, '0')}`;
    onChange(val);
    setIsOpen(false);
  };

  const firstGDate = j2g(currentYear, currentMonth, 1);
  const startDayOfWeek = (firstGDate.getDay() + 1) % 7;

  const daysCount = jalaliDaysInMonth(currentYear, currentMonth);
  const daysArray = Array.from({ length: daysCount }, (_, i) => i + 1);

  // Calculate day of the week for spacing (1st of Month)
  // Let's create an elegant responsive layout
  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          readOnly
          disabled={disabled}
          value={value ? toPersianDigits(value) : ''}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          placeholder="۱۴۰۵/۰۳/۰۱"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0B5F3C] focus:border-transparent cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 placeholder:text-gray-300 transition-all font-mono"
        />
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-[#0B5F3C]"
        >
          <CalendarIcon size={18} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 text-right right-0">
          {/* Shortcuts */}
          <div className="flex gap-1 mb-3 border-b border-gray-100 pb-2.5 text-xs justify-center">
            <button
              type="button"
              onClick={() => handleShortcut('today')}
              className="px-2.5 py-1 bg-gray-50 text-gray-600 hover:bg-[#0B5F3C]/10 hover:text-[#0B5F3C] rounded transition-all"
            >
              امروز
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('tomorrow')}
              className="px-2.5 py-1 bg-gray-50 text-gray-600 hover:bg-[#0B5F3C]/10 hover:text-[#0B5F3C] rounded transition-all"
            >
              فردا
            </button>
            <button
              type="button"
              onClick={() => handleShortcut('nextWeek')}
              className="px-2.5 py-1 bg-gray-50 text-gray-600 hover:bg-[#0B5F3C]/10 hover:text-[#0B5F3C] rounded transition-all"
            >
              هفته بعد
            </button>
          </div>

          {/* Month/Year selector header */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronRight size={18} className="text-gray-500" />
            </button>
            <div className="text-sm font-semibold text-gray-800 font-sans">
              {JALALI_MONTH_NAMES[currentMonth - 1]} {toPersianDigits(currentYear)}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-all"
            >
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Year select options quick navigation */}
          <div className="flex justify-between mb-2 text-xs text-gray-400 font-sans text-center grid grid-cols-7 border-b border-gray-50 pb-1">
            <span>ش</span>
            <span>ی</span>
            <span>د</span>
            <span>س</span>
            <span>چ</span>
            <span>پ</span>
            <span>ج</span>
          </div>

          <div className="grid grid-cols-7 gap-1 font-mono text-center text-sm">
            {/* Render weekday offset padding */}
            {Array.from({ length: startDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="py-1.5" />
            ))}
            {/* Render actual days */}
            {daysArray.map((day) => {
              const currentVal = `${currentYear}/${currentMonth.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
              const isSelected = value === currentVal;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={`py-1.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? 'bg-[#0B5F3C] text-white font-bold shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
