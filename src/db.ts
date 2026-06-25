/**
 * افلاطوس CRM - لایه ارتباط با Cloudflare D1
 * این فایل تمام عملیات CRUD با Worker را مدیریت می‌کند
 */

import { Lead } from './types';

// تبدیل Lead به فرمت مورد نیاز API
function leadToApiPayload(lead: Lead) {
  return {
    // ما lead را در فیلد notes به‌صورت JSON کامل ذخیره می‌کنیم
    // تا هیچ اطلاعاتی از دست نرود
    customer_id_ext: lead.id,          // شناسه اصلی در React
    name: lead.patientName,
    phone: lead.phone,
    service_name: lead.service,
    doctor: lead.doctor,
    scheduled_at: new Date().toISOString(),
    status: mapStatus(lead.status),
    price: lead.announcedCost || 0,
    paid: lead.contractAmount || 0,
    notes: JSON.stringify({
      source: lead.source,
      date: lead.date,
      nextFollowUpDate: lead.nextFollowUpDate,
      isFollowUpCompleted: lead.isFollowUpCompleted,
      assignedTo: lead.assignedTo,
      history: lead.history,
      originalStatus: lead.status,
    }),
  };
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    'تماس اولیه': 'pending',
    'اطلاعات ارسال شد': 'pending',
    'مشاوره رزرو شد': 'confirmed',
    'مراجعه کرد': 'confirmed',
    'عمل انجام شد': 'done',
    'از دست رفته': 'cancelled',
  };
  return map[status] || 'pending';
}

export class AflatousDB {
  private workerUrl: string;

  constructor(workerUrl: string) {
    // حذف / انتهایی
    this.workerUrl = workerUrl.replace(/\/$/, '');
  }

  private async request(path: string, options: RequestInit = {}) {
    const res = await fetch(`${this.workerUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    });
    const data = await res.json() as { ok: boolean; error?: string; data?: unknown };
    if (!data.ok) throw new Error(data.error || `خطا: ${res.status}`);
    return data;
  }

  // ─── تست اتصال ─────────────────────────────
  async ping(): Promise<boolean> {
    try {
      const r = await this.request('/api/health') as { db: boolean };
      return r.db === true;
    } catch {
      return false;
    }
  }

  // ─── ذخیره لید جدید ────────────────────────
  async saveLead(lead: Lead, editorName: string): Promise<boolean> {
    try {
      const payload = leadToApiPayload(lead);

      // اول مشتری را ذخیره کن
      let customerId: number;
      try {
        const existing = await this.request(`/api/customers?q=${encodeURIComponent(lead.phone)}`) as { data: Array<{ id: number; phone: string }> };
        const found = existing.data?.find((c) => c.phone === lead.phone);
        if (found) {
          customerId = found.id;
          // بروزرسانی اطلاعات مشتری
          await this.request(`/api/customers/${customerId}`, {
            method: 'PATCH',
            body: JSON.stringify({ name: payload.name, notes: `لید: ${lead.id}` }),
          });
        } else {
          const created = await this.request('/api/customers', {
            method: 'POST',
            body: JSON.stringify({ name: payload.name, phone: payload.phone }),
          }) as { data: { id: number } };
          customerId = created.data.id;
        }
      } catch {
        const created = await this.request('/api/customers', {
          method: 'POST',
          body: JSON.stringify({ name: payload.name, phone: payload.phone }),
        }) as { data: { id: number } };
        customerId = created.data.id;
      }

      // نوبت / لید را ذخیره کن
      await this.request('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: customerId,
          service_name: payload.service_name,
          doctor: payload.doctor,
          scheduled_at: payload.scheduled_at,
          status: payload.status,
          price: payload.price,
          paid: payload.paid,
          notes: payload.notes,
          payment_method: 'نقد',
        }),
      });

      return true;
    } catch (e) {
      console.error('DB saveLead error:', e);
      return false;
    }
  }

  // ─── بروزرسانی لید ─────────────────────────
  async updateLead(lead: Lead, editorName: string): Promise<boolean> {
    try {
      // پیدا کردن appointment بر اساس شماره تلفن
      const customers = await this.request(`/api/customers?q=${encodeURIComponent(lead.phone)}`) as { data: Array<{ id: number; phone: string }> };
      const customer = customers.data?.find((c) => c.phone === lead.phone);
      if (!customer) {
        // اگر پیدا نشد، جدید ذخیره کن
        return this.saveLead(lead, editorName);
      }

      const appts = await this.request(`/api/appointments?customer_id=${customer.id}`) as { data: Array<{ id: number }> };
      if (appts.data && appts.data.length > 0) {
        const apptId = appts.data[0].id;
        await this.request(`/api/appointments/${apptId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            service_name: lead.service,
            doctor: lead.doctor,
            status: mapStatus(lead.status),
            price: lead.announcedCost || 0,
            paid: lead.contractAmount || 0,
            notes: JSON.stringify({
              source: lead.source,
              date: lead.date,
              nextFollowUpDate: lead.nextFollowUpDate,
              isFollowUpCompleted: lead.isFollowUpCompleted,
              assignedTo: lead.assignedTo,
              history: lead.history,
              originalStatus: lead.status,
            }),
          }),
        });
      } else {
        return this.saveLead(lead, editorName);
      }

      return true;
    } catch (e) {
      console.error('DB updateLead error:', e);
      return false;
    }
  }

  // ─── حذف لید ───────────────────────────────
  async deleteLead(leadPhone: string): Promise<boolean> {
    try {
      const customers = await this.request(`/api/customers?q=${encodeURIComponent(leadPhone)}`) as { data: Array<{ id: number; phone: string }> };
      const customer = customers.data?.find((c) => c.phone === leadPhone);
      if (!customer) return true;

      const appts = await this.request(`/api/appointments?customer_id=${customer.id}`) as { data: Array<{ id: number }> };
      for (const appt of appts.data || []) {
        await this.request(`/api/appointments/${appt.id}`, { method: 'DELETE' });
      }
      return true;
    } catch (e) {
      console.error('DB deleteLead error:', e);
      return false;
    }
  }
// ─── دریافت همه لیدها از D1 ─────────────────────
async getAllLeads(): Promise<Lead[]> {
try {
const customersRes = await this.request('/api/customers') as {
data: Array<any>;
};

```
  const leads: Lead[] = [];

  for (const customer of customersRes.data || []) {
    const apptsRes = await this.request(
      `/api/appointments?customer_id=${customer.id}`
    ) as {
      data: Array<any>;
    };

    for (const appt of apptsRes.data || []) {
      let extra: any = {};

      try {
        extra = appt.notes ? JSON.parse(appt.notes) : {};
      } catch {
        extra = {};
      }

      leads.push({
        id: extra.customer_id_ext || `d1-${appt.id}`,
        date: extra.date || '',
        patientName: customer.name || '',
        phone: customer.phone || '',
        doctor: appt.doctor || '',
        service: appt.service_name || '',
        source: extra.source || 'سایر',
        status: extra.originalStatus || appt.status || 'تماس اولیه',
        announcedCost: appt.price || 0,
        contractAmount: appt.paid || 0,
        nextFollowUpDate: extra.nextFollowUpDate || '',
        notes: '',
        isFollowUpCompleted: extra.isFollowUpCompleted || false,
        assignedTo: extra.assignedTo || '',
        history: extra.history || [],
      } as Lead);
    }
  }

  return leads;
} catch (e) {
  console.error('DB getAllLeads error:', e);
  return [];
}
```

}

