/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as jalaali from 'jalaali-js';

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export function g2j(gy: number, gm: number, gd: number): JalaliDate {
  const { jy, jm, jd } = jalaali.toJalaali(gy, gm, gd);
  return { jy, jm, jd };
}

export function j2g(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

export function getTodayJalali(): string {
  const now = new Date();
  const { jy, jm, jd } = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${jy}/${jm.toString().padStart(2, '0')}/${jd.toString().padStart(2, '0')}`;
}

export function toPersianDigits(num: string | number): string {
  if (num === undefined || num === null) return '';
  const id = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.toString().replace(/[0-9]/g, (w) => id[+w]);
}

export function toEnglishDigits(num: string): string {
  if (!num) return '';
  return num
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
}

export function formatJalaliDate(jalaliStr: string, formatStyle: 'short' | 'long' = 'long'): string {
  if (!jalaliStr || !jalaliStr.includes('/')) return jalaliStr;
  const cleanStr = toEnglishDigits(jalaliStr);
  const parts = cleanStr.split('/');
  if (parts.length !== 3) return jalaliStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12) return jalaliStr;

  if (formatStyle === 'short') {
    return toPersianDigits(`${y}/${m.toString().padStart(2, '0')}/${d.toString().padStart(2, '0')}`);
  }

  const monthName = JALALI_MONTH_NAMES[m - 1];
  return toPersianDigits(`${d} ${monthName} ${y}`);
}

export function parseJalali(jalaliStr: string): JalaliDate | null {
  if (!jalaliStr || !jalaliStr.includes('/')) return null;
  const cleanStr = toEnglishDigits(jalaliStr);
  const parts = cleanStr.split('/');
  if (parts.length !== 3) return null;
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
  return { jy, jm, jd };
}

export function formatPrice(amount: number): string {
  if (amount === undefined || amount === null) return '۰';
  const formatter = new Intl.NumberFormat('fa-IR', {
    style: 'decimal',
    maximumFractionDigits: 0
  });
  return toPersianDigits(formatter.format(amount)) + ' تومان';
}

export function jalaliDaysInMonth(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm);
}

export function isJalaliLeap(jy: number): boolean {
  return jalaali.isLeapJalaaliYear(jy);
}

export function dateDiffDays(jalali1: string, jalali2: string): number {
  const d1 = parseJalali(jalali1);
  const d2 = parseJalali(jalali2);
  if (!d1 || !d2) return 0;
  const g1 = j2g(d1.jy, d1.jm, d1.jd);
  const g2 = j2g(d2.jy, d2.jm, d2.jd);
  const diffTime = g2.getTime() - g1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
