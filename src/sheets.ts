/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lead } from './types';

export const DEFAULT_SPREADSHEET_ID = '15xqIfHw6pKCkhtC2YsXAGcdClVCeY0XPClMwENlIuk0';

// Fetch Google Sheet data using Google Visualization API (no API key required for viewing)
export async function fetchLeadsFromGviz(spreadsheetId: string = DEFAULT_SPREADSHEET_ID): Promise<Lead[]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('سیستم قادر به برقراری ارتباط با گوگل شیت نیست');
  }
  const text = await res.text();
  
  // Parse response which is wrapped in google.visualization.Query.setResponse()
  const startIdx = text.indexOf('(') + 1;
  const endIdx = text.lastIndexOf(')');
  const jsonStr = text.substring(startIdx, endIdx);
  const data = JSON.parse(jsonStr);
  
  if (data.status === 'error') {
    throw new Error(data.errors?.[0]?.detailed_message || 'خطا در دریافت جدول');
  }

  const table = data.table;
  if (!table || !table.rows) return [];

  const leads: Lead[] = [];
  
  // Skip the first row if it is containing titles/headers
  table.rows.forEach((row: any, index: number) => {
    const cells = row.c || [];
    const getVal = (idx: number): string => {
      if (!cells[idx] || cells[idx].v === undefined || cells[idx].v === null) return '';
      // Format dates and text properly
      if (cells[idx].f) return cells[idx].f.toString();
      return cells[idx].v.toString();
    };

    const getNum = (idx: number): number => {
      if (!cells[idx] || cells[idx].v === undefined || cells[idx].v === null) return 0;
      const val = parseFloat(cells[idx].v.toString().replace(/[^0-9.-]/g, ''));
      return isNaN(val) ? 0 : val;
    };

    const patientName = getVal(1);
    // Filter headers or empty lines
    if (!patientName || patientName === 'نام بیمار' || patientName === 'Patient Name') {
      return;
    }

    leads.push({
      id: getVal(11) || `row-${index + 1}`,
      date: getVal(0),
      patientName: patientName,
      phone: getVal(2),
      doctor: getVal(3) || 'نامشخص',
      service: (getVal(4) || 'سایر') as any,
      status: (getVal(5) || 'تماس اولیه') as any,
      source: (getVal(6) || 'سایر') as any,
      announcedCost: getNum(7),
      contractAmount: getNum(8),
      nextFollowUpDate: getVal(9),
      notes: getVal(10),
      isFollowUpCompleted: getVal(5) === 'عمل انجام شد' || getVal(5) === 'از دست رفته',
      assignedTo: getVal(12) || 'سیمین حسینی'
    });
  });

  return leads;
}

// REST Sync calls for Google Sheets API (When OAuth Access Token is specified)
export async function appendLeadToSheet(
  lead: Lead,
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<boolean> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:M:append?valueInputOption=USER_ENTERED`;
    
    const row = [
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
      lead.notes,
      lead.id,
      lead.assignedTo || ''
    ];

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    });

    if (!res.ok) {
      const errRes = await res.json().catch(() => ({}));
      console.error('Sheets API Error:', errRes);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error appending lead to sheets:', error);
    return false;
  }
}

export async function findLeadRowIndex(
  leadId: string,
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<number | null> {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/L:L`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    const rows = data.values || [];
    for (let i = 0; i < rows.length; i++) {
      if (rows[i][0] === leadId) {
        return i + 1; // 1-indexed row number
      }
    }
    return null;
  } catch (error) {
    console.error('Error finding lead row index:', error);
    return null;
  }
}

export async function updateLeadInSheet(
  lead: Lead,
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<boolean> {
  try {
    const rowIndex = await findLeadRowIndex(lead.id, accessToken, spreadsheetId);
    if (!rowIndex) {
      // If not found, append it instead
      return appendLeadToSheet(lead, accessToken, spreadsheetId);
    }

    const range = `A${rowIndex}:M${rowIndex}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    
    const row = [
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
      lead.notes,
      lead.id,
      lead.assignedTo || ''
    ];

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [row]
      })
    });

    return res.ok;
  } catch (error) {
    console.error('Error updating lead in sheets:', error);
    return false;
  }
}

export async function deleteLeadInSheet(
  leadId: string,
  accessToken: string,
  spreadsheetId: string = DEFAULT_SPREADSHEET_ID
): Promise<boolean> {
  try {
    const rowIndex = await findLeadRowIndex(leadId, accessToken, spreadsheetId);
    if (!rowIndex) return false;

    // To prevent shifting indices and breaking row counts, we clear row values and set status to "حذف شده" or clear it
    const range = `A${rowIndex}:L${rowIndex}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return res.ok;
  } catch (error) {
    console.error('Error deleting lead from sheets:', error);
    return false;
  }
}
