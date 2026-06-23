/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Lead } from '../types';
import { JALALI_MONTH_NAMES, toPersianDigits } from '../jalali';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

interface ReportsProps {
  leads: Lead[];
}

const COLORS = ['#0B5F3C', '#2E7D32', '#4CAF50', '#81C784', '#A5D6A7', '#C8E6C9', '#E8F5E9'];

export default function Reports({ leads }: ReportsProps) {
  // 1. Monthly Leads Trend
  const monthlyLeadsData = useMemo(() => {
    const monthlyCounts = Array(12).fill(0);
    leads.forEach((l) => {
      if (l.date && l.date.includes('/')) {
        const parts = l.date.split('/');
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyCounts[monthIndex]++;
        }
      }
    });

    return JALALI_MONTH_NAMES.map((name, idx) => ({
      name,
      'تعداد لید': monthlyCounts[idx]
    }));
  }, [leads]);

  // 2. Lead Sources (Pie)
  const leadSourcesData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source || 'سایر';
      counts[src] = (counts[src] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  }, [leads]);

  // 3. Service Distribution (Bar)
  const serviceDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const srv = l.service || 'سایر';
      counts[srv] = (counts[srv] || 0) + 1;
    });

    return Object.entries(counts).map(([name, count]) => ({
      name,
      'تعداد متقاضی': count
    }));
  }, [leads]);

  // 4. Lead Status Funnel (Cumulative)
  // Stages: تماس اولیه -> اطلاعات ارسال شد -> مشاوره رزرو شد -> مراجعه کرد -> عمل انجام شد
  const statusFunnelData = useMemo(() => {
    const initial = leads.length;
    const infoSent = leads.filter(l => ['اطلاعات ارسال شد', 'مشاوره رزرو شد', 'مراجعه کرد', 'عمل انجام شد'].includes(l.status)).length;
    const booked = leads.filter(l => ['مشاوره رزرو شد', 'مراجعه کرد', 'عمل انجام شد'].includes(l.status)).length;
    const visited = leads.filter(l => ['مراجعه کرد', 'عمل انجام شد'].includes(l.status)).length;
    const surgery = leads.filter(l => l.status === 'عمل انجام شد').length;

    return [
      { step: 'تماس اولیه', 'لیدهای فعال': initial },
      { step: 'ارسال اطلاعات', 'لیدهای فعال': infoSent },
      { step: 'رزرو مشاوره', 'لیدهای فعال': booked },
      { step: 'مراجعه و ویزیت', 'لیدهای فعال': visited },
      { step: 'انجام جراحی', 'لیدهای فعال': surgery }
    ];
  }, [leads]);

  // 5. Revenue By Service (Bar)
  const revenueByServiceData = useMemo(() => {
    const revenueMap: Record<string, number> = {};
    leads.forEach((l) => {
      const srv = l.service || 'سایر';
      revenueMap[srv] = (revenueMap[srv] || 0) + (l.contractAmount || 0);
    });

    return Object.entries(revenueMap).map(([name, sum]) => ({
      name,
      'درآمد (میلیون تومان)': Math.round(sum / 1000000)
    }));
  }, [leads]);

  // 6. Monthly Conversion Rate (Line)
  const monthlyConversionData = useMemo(() => {
    const monthlyLeads = Array(12).fill(0);
    const monthlySurgeries = Array(12).fill(0);

    leads.forEach((l) => {
      if (l.date && l.date.includes('/')) {
        const parts = l.date.split('/');
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyLeads[monthIndex]++;
          if (l.status === 'عمل انجام شد') {
            monthlySurgeries[monthIndex]++;
          }
        }
      }
    });

    return JALALI_MONTH_NAMES.map((name, idx) => {
      const total = monthlyLeads[idx];
      const converted = monthlySurgeries[idx];
      const rate = total ? (converted / total) * 100 : 0;
      return {
        name,
        'نرخ تبدیل (%)': Math.round(rate)
      };
    });
  }, [leads]);

  // 7. Doctor Performance Comparison (Bar)
  const doctorPerformanceData = useMemo(() => {
    const docs = Array.from(new Set(leads.map(l => l.doctor).filter(Boolean)));
    return docs.map((doc) => {
      const docLeads = leads.filter(l => l.doctor === doc);
      const appointments = docLeads.filter(
        l => ['مشاوره رزرو شد', 'مراجعه کرد', 'عمل انجام شد'].includes(l.status)
      ).length;
      const surgeries = docLeads.filter(l => l.status === 'عمل انجام شد').length;
      const revenue = docLeads.reduce((acc, l) => acc + (l.contractAmount || 0), 0);

      return {
        name: doc.replace('دکتر ', ''),
        'کل لیدها': docLeads.length,
        'نوبت‌ها': appointments,
        'جراحی‌ها': surgeries,
        'درآمد (میلیون تومان)': Math.round(revenue / 1000000)
      };
    });
  }, [leads]);

  // Render tooltip with Persian numbers
  const renderTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-lg text-right font-sans text-xs">
          <p className="font-bold text-gray-800 border-b border-gray-50 pb-1.5 mb-1.5">{payload[0].payload.name || payload[0].payload.step}</p>
          {payload.map((entry: any, i: number) => (
            <p key={i} className="text-gray-600 flex justify-between gap-4 mt-1">
              <span className="font-semibold text-[#0B5F3C]">{toPersianDigits(entry.value)}</span>
              <span>{entry.name}:</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Headings */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">گزارش‌های تخصصی و تحلیل فروش</h2>
          <p className="text-xs text-gray-400 mt-1">نمودارهای آماری عملکرد کلینیک و پزشکان در سال جاری</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Leads */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 font-sans">۱. روند ماهانه جذب لید (شمسى)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyLeadsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <Tooltip content={renderTooltip} />
                <Line type="monotone" dataKey="تعداد لید" stroke="#0B5F3C" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Monthly Conversion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 font-sans">۲. روند نرخ تبدیل لید به جراحی نهایی (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyConversionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <Tooltip content={renderTooltip} />
                <Line type="monotone" dataKey="نرخ تبدیل (%)" stroke="#2E7D32" strokeWidth={2.5} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Service Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 font-sans">۳. توزیع متقاضیان بر اساس انواع خدمات زیبایی</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceDistributionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <Tooltip content={renderTooltip} />
                <Bar dataKey="تعداد متقاضی" fill="#0B5F3C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Revenue By Service */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 font-sans">۴. سرجمع درآمد واقعی بر اساس خدمات (میلیون تومان)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByServiceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <Tooltip content={renderTooltip} />
                <Bar dataKey="درآمد (میلیون تومان)" fill="#2E7D32" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Lead Status Funnel */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 font-sans">۵. قیف فروش کلینیک (مراحل فعال پرونده‌ها)</h3>
          <div className="h-64 col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusFunnelData} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <YAxis type="category" dataKey="step" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} width={100} />
                <Tooltip content={renderTooltip} />
                <Bar dataKey="لیدهای فعال" fill="#4CAF50" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lead Sources (Pie) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 font-sans">۶. سهم کانال‌های جذب بیمار (منابع آشنایی)</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadSourcesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {leadSourcesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={renderTooltip} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 7: Doctor Performance (Comparing multiple fields) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-gray-800 mb-4 font-sans">۷. ارزیابی عملکرد و مقایسه بهره‌وری پزشکان</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={doctorPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} />
                <Tooltip content={renderTooltip} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="کل لیدها" fill="#0B5F3C" radius={[3, 3, 0, 0]} />
                <Bar dataKey="نوبت‌ها" fill="#4CAF50" radius={[3, 3, 0, 0]} />
                <Bar dataKey="جراحی‌ها" fill="#81C784" radius={[3, 3, 0, 0]} />
                <Bar dataKey="درآمد (میلیون تومان)" fill="#FF9800" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
