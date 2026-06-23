/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Lead } from '../types';
import { toPersianDigits, formatPrice } from '../jalali';
import { 
  Users, CalendarCheck, FileCheck, CheckCircle2, 
  TrendingUp, Activity, UserMinus, ShieldAlert, Coins, HelpCircle 
} from 'lucide-react';

interface KPIDashboardProps {
  leads: Lead[];
}

export default function KPIDashboard({ leads }: KPIDashboardProps) {
  // Counts & Calculations
  const totalLeads = leads.length;
  
  const appointmentsCount = leads.filter(
    (l) => l.status === 'مشاوره رزرو شد' || l.status === 'مراجعه کرد' || l.status === 'عمل انجام شد'
  ).length;

  const visitsCount = leads.filter(
    (l) => l.status === 'مراجعه کرد' || l.status === 'عمل انجام شد'
  ).length;

  const surgeriesCount = leads.filter((l) => l.status === 'عمل انجام شد').length;
  const lostCount = leads.filter((l) => l.status === 'از دست رفته').length;

  const totalRevenue = leads.reduce((acc, l) => acc + (l.contractAmount || 0), 0);

  // Completed follow-ups
  const totalFollowUps = leads.filter((l) => l.nextFollowUpDate).length;
  const completedFollowUps = leads.filter((l) => l.isFollowUpCompleted).length;

  // KPIs
  const consultationRate = totalLeads ? (appointmentsCount / totalLeads) * 100 : 0;
  const visitRate = totalLeads ? (visitsCount / totalLeads) * 100 : 0;
  const surgeryRate = totalLeads ? (surgeriesCount / totalLeads) * 100 : 0;
  const conversionRate = totalLeads ? (surgeriesCount / totalLeads) * 100 : 0; // Surgery rate
  const avgRevenuePerLead = totalLeads ? totalRevenue / totalLeads : 0;
  const followUpRate = totalFollowUps ? (completedFollowUps / totalFollowUps) * 100 : 0;

  const cards = [
    {
      title: 'کل لیدها (متقاضیان)',
      value: toPersianDigits(totalLeads),
      subtitle: 'کل پرونده‌های ثبت شده در سیستم',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'مشاوره‌های رزرو شده',
      value: toPersianDigits(appointmentsCount),
      subtitle: `نرخ نوبت‌دهی: ${toPersianDigits(consultationRate.toFixed(1))}%`,
      icon: CalendarCheck,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      title: 'مراجعات حضوری (ویزیت)',
      value: toPersianDigits(visitsCount),
      subtitle: `نرخ ویزیت لیدها: ${toPersianDigits(visitRate.toFixed(1))}%`,
      icon: CheckCircle2,
      color: 'text-sky-600 bg-sky-50 border-sky-100',
    },
    {
      title: 'جراحی‌های انجام شده',
      value: toPersianDigits(surgeriesCount),
      subtitle: `نرخ جراحی درمان: ${toPersianDigits(surgeryRate.toFixed(1))}%`,
      icon: FileCheck,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'لیدهای از دست رفته',
      value: toPersianDigits(lostCount),
      subtitle: 'متقاضیانی که انصراف دادند',
      icon: UserMinus,
      color: 'text-red-600 bg-red-50 border-red-100',
    },
    {
      title: 'کل درآمد فروش کلینیک',
      value: formatPrice(totalRevenue),
      subtitle: 'سرجمع مبالغ قراردادهای نهایی',
      icon: Coins,
      color: 'text-amber-700 bg-amber-50 border-amber-100',
    },
    {
      title: 'میانگین سهم هر لید (ARPL)',
      value: formatPrice(Math.round(avgRevenuePerLead)),
      subtitle: 'میزان بازدهی مالی به ازای هر متقاضی',
      icon: TrendingUp,
      color: 'text-violet-600 bg-violet-50 border-violet-100',
    },
    {
      title: 'نرخ تکمیل پیگیری‌ها',
      value: `${toPersianDigits(followUpRate.toFixed(1))}%`,
      subtitle: `${toPersianDigits(completedFollowUps)} از ${toPersianDigits(totalFollowUps)} وظیفه پیگیری`,
      icon: Activity,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right" dir="rtl">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm flex items-center justify-between transition-all hover:translate-y-[-2px] hover:shadow-md"
          >
            <div className="space-y-1.5 flex-1 min-w-0 ml-4">
              <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider font-sans">
                {card.title}
              </span>
              <span className="text-xl font-extrabold text-gray-900 block font-sans truncate">
                {card.value}
              </span>
              <span className="text-[10px] text-gray-400 block font-sans font-medium">
                {card.subtitle}
              </span>
            </div>
            
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${card.color}`}>
              <Icon size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
