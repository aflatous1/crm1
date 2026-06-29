/**
 * افلاطوس CRM - لایه ارتباط با Cloudflare D1
 * این فایل تمام عملیات CRUD با Worker را مدیریت می‌کند
 */

import { Lead, LeadStatus, ServiceType } from './types';

// ─── تبدیل وضعیت D1 → Lead ─────────────────────
function mapStatusReverse(status: string): LeadStatus {
  const map: Record<string, LeadStatus> = {
    'pending':   'تماس اولیه',
    'confirmed': 'مشاوره رزرو شد',
    'done':      'عمل انجام شد',
    'cancelled': 'از دست رفته',
    'no_show':   'از دست رفته',
  };
  return map[status] || 'تماس اولیه';
}

// ─── تبدیل وضعیت Lead → D1 ─────────────────────
function mapStatus(status: string): string {
  const map: Record<string, string> = {
    'تماس اولیه':       'pending',
    'اطلاعات ارسال شد': 'pending',
    'مشاوره رزرو شد':   'confirmed',
    'مراجعه کرد':       'confirmed',
    'عمل انجام شد':     'done',
    'از دست رفته':      'cancelled',
  };
  return map[status] || 'pending';
}

// ─── تبدیل appointment D1 → Lead ──────────────
interface D1Appointment {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  service_name?: string;
  doctor?: string;
  scheduled_at: string;
  status: string;
  price?: number;
  paid?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

function appointmentToLead(appt: D1Appointment): Lead {
  // تمام اطلاعات اضافی در فیلد notes به‌صورت JSON ذخیره شده
  let extraData: Record<string, unknown> = {};
  try {
    if (appt.notes) extraData = JSON.parse(appt.notes);
  } catch {
    // notes متن ساده است
  }

  const originalStatus = (extraData.originalStatus as LeadStatus) || mapStatusReverse(appt.status);

  return {
    id:                 extraData.leadId as string || `d1-${appt.id}`,
    date:               extraData.date as string || appt.scheduled_at.slice(0, 10),
    patientName:        appt.customer_name || 'نامشخص',
    phone:              appt.customer_phone || '',
    doctor:             appt.doctor || 'نامشخص',
    service:            (appt.service_name || 'سایر') as ServiceType,
    source:             (extraData.source as string) || 'سایر',
    status:             originalStatus,
    announcedCost:      appt.price || 0,
    contractAmount:     appt.paid || 0,
    nextFollowUpDate:   (extraData.nextFollowUpDate as string) || '',
    notes:              (extraData.plainNotes as string) || (typeof extraData.originalStatus === 'undefined' ? appt.notes || '' : ''),
    isFollowUpCompleted:(extraData.isFollowUpCompleted as boolean) || false,
    assignedTo:         (extraData.assignedTo as string) || '',
    history:            (extraData.history as Lead['history']) || [],
  };
}

export class AflatousDB {
  private workerUrl: string;

  constructor(workerUrl: string) {
    this.workerUrl = workerUrl.replace(/\/$/, '');
  }

  private async request<T = unknown>(path: string, options: RequestInit = {}): Promise<T & { ok: boolean; error?: string }> {
    const res = await fetch(`${this.workerUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
    const data = await res.json() as T & { ok: boolean; error?: string };
    if (!data.ok) throw new Error(data.error || `خطا: ${res.status}`);
    return data;
  }

  // ─── تست اتصال ─────────────────────────────────
  async ping(): Promise<boolean> {
    try {
      const r = await this.request<{ db: boolean }>('/api/health');
      return r.db === true;
    } catch {
      return false;
    }
  }

  // ─── دریافت همه لیدها از D1 ────────────────────
  async getAllLeads(): Promise<Lead[]> {
    try {
      // دریافت همه نوبت‌ها با اطلاعات مشتری (صفحه‌بندی تا ۵۰۰ رکورد)
      const result = await this.request<{ data: D1Appointment[]; total: number }>(
        '/api/appointments?limit=500'
      );

      if (!result.data || result.data.length === 0) return [];

      // تبدیل هر appointment به Lead
      const leads = result.data.map(appointmentToLead);

      // حذف تکراری‌ها بر اساس phone (آخرین رکورد هر شماره)
      const seen = new Map<string, Lead>();
      for (const lead of leads) {
        if (lead.phone) {
          seen.set(lead.phone, lead);
        } else {
          seen.set(lead.id, lead);
        }
      }

      return Array.from(seen.values());
    } catch (e) {
      console.error('DB getAllLeads error:', e);
      return [];
    }
  }

  // ─── ذخیره لید جدید ────────────────────────────
  async saveLead(lead: Lead, editorName: string): Promise<boolean> {
    try {
      // پیدا کردن یا ساخت مشتری
      let customerId: number;
      try {
        const existing = await this.request<{ data: Array<{ id: number; phone: string }> }>(
          `/api/customers?q=${encodeURIComponent(lead.phone)}`
        );
        const found = existing.data?.find((c) => c.phone === lead.phone);
        if (found) {
          customerId = found.id;
          await this.request(`/api/customers/${customerId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: lead.patientName }),
          });
        } else {
          const created = await this.request<{ data: { id: number } }>('/api/customers', {
            method: 'POST',
            body: JSON.stringify({ name: lead.patientName, phone: lead.phone }),
          });
          customerId = created.data.id;
        }
      } catch {
        const created = await this.request<{ data: { id: number } }>('/api/customers', {
          method: 'POST',
          body: JSON.stringify({ name: lead.patientName, phone: lead.phone }),
        });
        customerId = created.data.id;
      }

      // ذخیره appointment با تمام اطلاعات lead در notes
      await this.request('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          customer_id:    customerId,
          service_name:   lead.service,
          doctor:         lead.doctor,
          scheduled_at:   new Date().toISOString(),
          status:         mapStatus(lead.status),
          price:          lead.announcedCost || 0,
          paid:           lead.contractAmount || 0,
          payment_method: 'نقد',
          notes: JSON.stringify({
            leadId:             lead.id,
            source:             lead.source,
            date:               lead.date,
            nextFollowUpDate:   lead.nextFollowUpDate,
            isFollowUpCompleted:lead.isFollowUpCompleted,
            assignedTo:         lead.assignedTo,
            history:            lead.history,
            originalStatus:     lead.status,
            plainNotes:         lead.notes,
            editorName,
          }),
        }),
      });

      return true;
    } catch (e) {
      console.error('DB saveLead error:', e);
      return false;
    }
  }

  // ─── بروزرسانی لید ─────────────────────────────
  async updateLead(lead: Lead, editorName: string): Promise<boolean> {
    try {
      // پیدا کردن مشتری
      const customers = await this.request<{ data: Array<{ id: number; phone: string }> }>(
        `/api/customers?q=${encodeURIComponent(lead.phone)}`
      );
      const customer = customers.data?.find((c) => c.phone === lead.phone);
      if (!customer) return this.saveLead(lead, editorName);

      // پیدا کردن آخرین appointment این مشتری
      const appts = await this.request<{ data: Array<{ id: number }> }>(
        `/api/appointments?customer_id=${customer.id}&limit=1`
      );

      if (appts.data && appts.data.length > 0) {
        const apptId = appts.data[0].id;
        await this.request(`/api/appointments/${apptId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            service_name:   lead.service,
            doctor:         lead.doctor,
            status:         mapStatus(lead.status),
            price:          lead.announcedCost || 0,
            paid:           lead.contractAmount || 0,
            notes: JSON.stringify({
              leadId:             lead.id,
              source:             lead.source,
              date:               lead.date,
              nextFollowUpDate:   lead.nextFollowUpDate,
              isFollowUpCompleted:lead.isFollowUpCompleted,
              assignedTo:         lead.assignedTo,
              history:            lead.history,
              originalStatus:     lead.status,
              plainNotes:         lead.notes,
              editorName,
            }),
          }),
        });
        return true;
      } else {
        return this.saveLead(lead, editorName);
      }
    } catch (e) {
      console.error('DB updateLead error:', e);
      return false;
    }
  }

  // ─── حذف لید ───────────────────────────────────
  async deleteLead(leadPhone: string): Promise<boolean> {
    try {
      const customers = await this.request<{ data: Array<{ id: number; phone: string }> }>(
        `/api/customers?q=${encodeURIComponent(leadPhone)}`
      );
      const customer = customers.data?.find((c) => c.phone === leadPhone);
      if (!customer) return true;

      const appts = await this.request<{ data: Array<{ id: number }> }>(
        `/api/appointments?customer_id=${customer.id}&limit=100`
      );
      for (const appt of appts.data || []) {
        await this.request(`/api/appointments/${appt.id}`, { method: 'DELETE' });
      }
      return true;
    } catch (e) {
      console.error('DB deleteLead error:', e);
      return false;
    }
  }
}
