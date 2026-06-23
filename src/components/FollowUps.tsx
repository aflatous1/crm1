/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Lead } from '../types';
import { getTodayJalali, dateDiffDays, toPersianDigits, formatJalaliDate } from '../jalali';
import { Clock, Calendar, CheckSquare, Square, AlertTriangle, CheckCircle2, UserCircle, FolderOpen } from 'lucide-react';

interface FollowUpsProps {
  leads: Lead[];
  onToggleComplete: (id: string) => void;
  onSelectPatient?: (id: string) => void;
}

export default function FollowUps({ leads, onToggleComplete, onSelectPatient }: FollowUpsProps) {
  const todayStr = getTodayJalali();

  // Filter out completed and organize pending
  const sortedAndClassified = useMemo(() => {
    const today: Lead[] = [];
    const overdue: Lead[] = [];
    const upcoming: Lead[] = [];
    const completed: Lead[] = [];

    leads.forEach((lead) => {
      if (!lead.nextFollowUpDate) return;
      
      if (lead.isFollowUpCompleted) {
        completed.push(lead);
        return;
      }

      const diff = dateDiffDays(todayStr, lead.nextFollowUpDate);
      if (diff === 0) {
        today.push(lead);
      } else if (diff < 0) {
        overdue.push(lead);
      } else {
        upcoming.push(lead);
      }
    });

    return { today, overdue, upcoming, completed };
  }, [leads, todayStr]);

  const { today, overdue, upcoming, completed } = sortedAndClassified;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h2 className="text-lg font-bold text-gray-800">وضعیت و یادآوری پیگیری بیماران</h2>
        <p className="text-xs text-gray-400 mt-1">تکالیف پیگیری تعریف شده بر اساس تاریخ تماس لیدها</p>
      </div>

      {/* Overdue/Today Alert banners */}
      {(overdue.length > 0 || today.length > 0) && (
        <div className="space-y-2">
          {overdue.length > 0 && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold leading-relaxed">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                <span>شما تعداد <strong className="font-extrabold">{toPersianDigits(overdue.length)}</strong> پرونده پیگیری معوقه (گذشته) دارید! لطفا سریعا اقدام کنید.</span>
              </div>
            </div>
          )}

          {today.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold leading-relaxed">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600 animate-bounce" />
                <span>تعداد <strong className="font-extrabold">{toPersianDigits(today.length)}</strong> بیمار برای پیگیری امروز نوبت دارند.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Overdue Box Column */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <h3 className="text-xs font-bold text-red-650 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              پیگیری‌های معوقه ({toPersianDigits(overdue.length)})
            </h3>
          </div>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {overdue.length === 0 ? (
              <p className="text-[11px] text-gray-450 text-center py-6 font-sans">هیچ ددلاین معوقه‌ای وجود ندارد</p>
            ) : (
              overdue.map((lead) => (
                <div key={lead.id} className="p-3 bg-red-50/20 border border-red-100 rounded-xl space-y-2 hover:border-red-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <button
                      onClick={() => onToggleComplete(lead.id)}
                      className="text-gray-400 hover:text-[#0B5F3C] cursor-pointer"
                    >
                      <Square size={16} />
                    </button>
                    <div 
                      onClick={() => onSelectPatient?.(lead.id)}
                      className="text-right cursor-pointer group flex-1 mr-3"
                      title="مشاهده پرونده و تاریخچه"
                    >
                      <p className="text-xs font-bold text-gray-800 group-hover:text-[#0B5F3C] group-hover:underline flex items-center justify-end gap-1">
                        {lead.patientName}
                        <FolderOpen size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-[10px] text-gray-455 font-mono mt-0.5">{toPersianDigits(lead.phone)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-red-600 font-medium">
                    <span>{lead.doctor}</span>
                    <span>{toPersianDigits(Math.abs(dateDiffDays(todayStr, lead.nextFollowUpDate)))} روز تاخیر ({toPersianDigits(lead.nextFollowUpDate)})</span>
                  </div>
                  {lead.notes && (
                    <p className="text-[10px] text-gray-400 bg-white/70 p-2 rounded-lg leading-relaxed">{lead.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today Box Column */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <h3 className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-500 rounded-full" />
              امـروز ({toPersianDigits(today.length)})
            </h3>
          </div>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {today.length === 0 ? (
              <p className="text-[11px] text-gray-450 text-center py-6 font-sans">امروز هیچ برنامه پیگیری ندارید</p>
            ) : (
              today.map((lead) => (
                <div key={lead.id} className="p-3 bg-amber-50/20 border border-amber-100 rounded-xl space-y-2 hover:border-amber-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <button
                      onClick={() => onToggleComplete(lead.id)}
                      className="text-gray-400 hover:text-[#0B5F3C] cursor-pointer"
                    >
                      <Square size={16} />
                    </button>
                    <div 
                      onClick={() => onSelectPatient?.(lead.id)}
                      className="text-right cursor-pointer group flex-1 mr-3"
                      title="مشاهده پرونده و تاریخچه"
                    >
                      <p className="text-xs font-bold text-gray-800 group-hover:text-[#0B5F3C] group-hover:underline flex items-center justify-end gap-1">
                        {lead.patientName}
                        <FolderOpen size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-[10px] text-gray-455 font-mono mt-0.5">{toPersianDigits(lead.phone)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-amber-700 font-medium">
                    <span>{lead.doctor}</span>
                    <span className="flex items-center gap-1 bg-amber-100/50 px-1.5 py-0.5 rounded">همین امروز</span>
                  </div>
                  {lead.notes && (
                    <p className="text-[10px] text-gray-400 bg-white/70 p-2 rounded-lg leading-relaxed">{lead.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Box Column */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-50 pb-2">
            <h3 className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-400 rounded-full" />
              برنامه‌ریزی آتی ({toPersianDigits(upcoming.length)})
            </h3>
          </div>
          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
            {upcoming.length === 0 ? (
              <p className="text-[11px] text-gray-450 text-center py-6 font-sans">هیچ برنامه پیگیری ثبت نشده است</p>
            ) : (
              upcoming.map((lead) => (
                <div key={lead.id} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-2 hover:border-gray-200 transition-colors">
                  <div className="flex justify-between items-start">
                    <button
                      onClick={() => onToggleComplete(lead.id)}
                      className="text-gray-400 hover:text-[#0B5F3C] cursor-pointer"
                    >
                      <Square size={16} />
                    </button>
                    <div 
                      onClick={() => onSelectPatient?.(lead.id)}
                      className="text-right cursor-pointer group flex-1 mr-3"
                      title="مشاهده پرونده و تاریخچه"
                    >
                      <p className="text-xs font-bold text-gray-800 group-hover:text-[#0B5F3C] group-hover:underline flex items-center justify-end gap-1">
                        {lead.patientName}
                        <FolderOpen size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-[10px] text-gray-455 font-mono mt-0.5">{toPersianDigits(lead.phone)}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium">
                    <span>{lead.doctor}</span>
                    <span>{toPersianDigits(dateDiffDays(todayStr, lead.nextFollowUpDate))} روز مانده ({toPersianDigits(lead.nextFollowUpDate)})</span>
                  </div>
                  {lead.notes && (
                    <p className="text-[10px] text-gray-400 bg-white/70 p-2 rounded-lg leading-relaxed">{lead.notes}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Completed Follow Ups (Bottom panel) */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[#0B5F3C] flex items-center gap-1.5 border-b border-gray-50 pb-2">
          <CheckCircle2 size={16} className="text-[#0B5F3C]" />
          پیگیری‌های انجام‌شده امـروز و کلینیک ({toPersianDigits(completed.length)})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1 pt-1">
          {completed.length === 0 ? (
            <p className="text-[10px] text-gray-400 col-span-4 text-center py-4">پرونده‌ای هنوز تیک تکمیل نخورده است</p>
          ) : (
            completed.map((lead) => (
              <div key={lead.id} className="p-3 border border-gray-100 bg-[#0B5F3C]/5 rounded-xl flex items-center justify-between text-right hover:border-emerald-200 transition-colors">
                <div 
                  onClick={() => onSelectPatient?.(lead.id)}
                  className="space-y-1 flex-1 cursor-pointer group"
                  title="مشاهده پرونده و تاریخچه"
                >
                  <p className="text-xs font-bold text-gray-450 line-through decoration-gray-400 group-hover:text-[#0B5F3C]">{lead.patientName}</p>
                  <p className="text-[9px] text-gray-400 font-mono">{toPersianDigits(lead.phone)}</p>
                </div>
                <button
                  onClick={() => onToggleComplete(lead.id)}
                  className="text-[#0B5F3C] hover:text-gray-400 cursor-pointer mr-2"
                >
                  <CheckSquare size={17} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
