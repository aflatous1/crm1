/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead } from './types';

export const SEED_DOCTORS = [
  'دکتر کیان احمدی',
  'دکتر مریم صابری',
  'دکتر بهرام رضایی',
  'دکتر فرشته مهدوی'
];

export const SEED_LEADS: Lead[] = [
  {
    id: 'lead-1',
    date: '1405/03/01',
    patientName: 'سارا کریمی',
    phone: '09121111111',
    doctor: 'دکتر کیان احمدی',
    service: 'جراحی بینی',
    status: 'عمل انجام شد',
    source: 'اینستاگرام',
    announcedCost: 45000000,
    contractAmount: 42000000,
    nextFollowUpDate: '1405/04/10',
    notes: 'بسیار راضی از نتیجه اولیه سوهان‌کشی. برای آتل‌برداری هماهنگ شد.',
    isFollowUpCompleted: true
  },
  {
    id: 'lead-2',
    date: '1405/03/05',
    patientName: 'علی رضایی',
    phone: '09122222222',
    doctor: 'دکتر مریم صابری',
    service: 'کاشت مو',
    status: 'عمل انجام شد',
    source: 'گوگل',
    announcedCost: 30000000,
    contractAmount: 30000000,
    nextFollowUpDate: '1405/04/15',
    notes: 'خط رویش طبیعی و پر تراکم. قرص‌های تقویتی تجویز شد.',
    isFollowUpCompleted: true
  },
  {
    id: 'lead-3',
    date: '1405/03/10',
    patientName: 'مریم حسینی',
    phone: '09123333333',
    doctor: 'دکتر فرشته مهدوی',
    service: 'بلفاروپلاستی',
    status: 'مراجعه کرد',
    source: 'تبلیغات',
    announcedCost: 18000000,
    contractAmount: 18000000,
    nextFollowUpDate: '1405/04/05',
    notes: 'عمل پلک بالا انجام شد، کشیدن بخیه با موفقیت انجام شد.',
    isFollowUpCompleted: false
  },
  {
    id: 'lead-4',
    date: '1405/03/12',
    patientName: 'مهسا امینی',
    phone: '09124444444',
    doctor: 'دکتر بهرام رضایی',
    service: 'فیلر',
    status: 'مراجعه کرد',
    source: 'مجموعه',
    sourceAlias: 'معرفی' as any, // to safely fall back to LeadSource
    announcedCost: 8000000,
    contractAmount: 7500000,
    nextFollowUpDate: '1405/03/25',
    notes: 'فیلر لب زاویه دار چانه تزریق شد. برند پرفکتا.',
    isFollowUpCompleted: true
  } as any,
  {
    id: 'lead-5',
    date: '1405/03/15',
    patientName: 'رضا علیزاده',
    phone: '09125555555',
    doctor: 'دکتر کیان احمدی',
    service: 'جراحی بینی',
    status: 'مشاوره رزرو شد',
    source: 'واتساپ',
    announcedCost: 50000000,
    contractAmount: 0,
    nextFollowUpDate: '1405/04/01',
    notes: 'مشاوره حضوری رزرو شد. عکس سی‌تی‌اسکن همراه داشته باشد.',
    isFollowUpCompleted: false
  },
  {
    id: 'lead-6',
    date: '1405/03/18',
    patientName: 'زهرا موسوی',
    phone: '09126666666',
    doctor: 'دکتر فرشته مهدوی',
    service: 'لیفت صورت',
    status: 'اطلاعات ارسال شد',
    source: 'اینستاگرام',
    announcedCost: 65000000,
    contractAmount: 0,
    nextFollowUpDate: '1405/04/02',
    notes: 'کاتالوگ و نمونه‌کارهای فیس‌لیفت در واتساپ براشون ارسال شد.',
    isFollowUpCompleted: false
  },
  {
    id: 'lead-7',
    date: '1405/03/20',
    patientName: 'امیر قاسمی',
    phone: '09127777777',
    doctor: 'دکتر بهرام رضایی',
    service: 'بوتاکس',
    status: 'عمل انجام شد',
    source: 'تماس مستقیم',
    announcedCost: 3500000,
    contractAmount: 3200000,
    nextFollowUpDate: '1405/03/20', // today
    notes: 'شارژ بوتاکس دیسپورت پیشانی و دور چشم انجام شد.',
    isFollowUpCompleted: true
  },
  {
    id: 'lead-8',
    date: '1405/03/21',
    patientName: 'نیلوفر طاهری',
    phone: '09128888888',
    doctor: 'دکتر کیان احمدی',
    service: 'جراحی بینی',
    status: 'تماس اولیه',
    source: 'اینستاگرام',
    announcedCost: 45000000,
    contractAmount: 0,
    nextFollowUpDate: '1405/03/22', // yesterday (overdue)
    notes: 'سوال در مورد هزینه و زمان نقاهت داشتند. نیاز به پیگیری مجدد.',
    isFollowUpCompleted: false
  },
  {
    id: 'lead-9',
    date: '1405/03/22',
    patientName: 'فاطمه صادقی',
    phone: '09129999999',
    doctor: 'دکتر مریم صابری',
    service: 'بلفاروپلاستی',
    status: 'از دست رفته',
    source: 'واتساپ',
    announcedCost: 20000000,
    contractAmount: 0,
    nextFollowUpDate: '1405/03/23',
    notes: 'هزینه براشون بالا بود و گفتند کلینیک دیگری مراجعه می‌کنند.',
    isFollowUpCompleted: true
  },
  {
    id: 'lead-10',
    date: '1405/03/23',
    patientName: 'احسان محمدی',
    phone: '09120000000',
    doctor: 'دکتر بهرام رضایی',
    service: 'بوتاکس',
    status: 'مشاوره رزرو شد',
    source: 'گوگل',
    announcedCost: 3000000,
    contractAmount: 0,
    nextFollowUpDate: '1405/03/23', // today
    notes: 'برای مشاوره بوتاکس پیشانی هماهنگ شد.',
    isFollowUpCompleted: false
  }
];

// Seed leads mapper to match correct type properties
export const SEED_LEADS_NORMALIZED: Lead[] = SEED_LEADS.map((lead, index) => ({
  ...lead,
  source: (lead.source as any) === 'مجموعه' ? 'معرفی' : lead.source,
  assignedTo: index % 2 === 0 ? 'سیمین حسینی' : 'زهرا علوی'
}));
