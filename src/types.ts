/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'secretary' | 'manager' | 'teflatus';

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
  password?: string;
}

export type ServiceType = 
  | 'جراحی بینی'
  | 'بلفاروپلاستی'
  | 'لیفت صورت'
  | 'فیلر'
  | 'بوتاکس'
  | 'کاشت مو'
  | 'سایر';

export type LeadSource = string;

export type LeadStatus = 
  | 'تماس اولیه'
  | 'اطلاعات ارسال شد'
  | 'مشاوره رزرو شد'
  | 'مراجعه کرد'
  | 'عمل انجام شد'
  | 'از دست رفته';

export interface LeadChangeLog {
  id: string;
  changeDate: string;
  editorName: string;
  status: LeadStatus;
  doctor: string;
  service: ServiceType;
  announcedCost: number;
  contractAmount: number;
  nextFollowUpDate: string;
  notes: string;
}

export interface Lead {
  id: string;
  date: string;
  patientName: string;
  phone: string;
  doctor: string;
  service: ServiceType;
  source: LeadSource;
  status: LeadStatus;
  announcedCost: number;
  contractAmount: number;
  nextFollowUpDate: string;
  notes: string;
  isFollowUpCompleted?: boolean;
  assignedTo?: string;
  history?: LeadChangeLog[];
}

export interface SystemSettings {
  googleSheetUrl: string;
  isSyncEnabled: boolean;
  apiKey: string;
  accessToken: string;
  doctors: string[];
  sources?: string[];
  secretaryReportsEnabled?: boolean;
  managerReportsEnabled?: boolean;
  // ← جدید: آدرس Cloudflare Worker
  workerUrl?: string;
  isWorkerEnabled?: boolean;
}
