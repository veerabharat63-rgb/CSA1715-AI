/**
 * API service layer for CropGuard AI
 * Handles communication with FastAPI backend with localStorage fallback
 */

const API_URLS = ['', 'http://localhost:8000'];

let activeApiBase = null;

export async function detectApiBase() {
  for (const base of API_URLS) {
    try {
      const res = await fetch(`${base}/api/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        activeApiBase = base;
        return base;
      }
    } catch {
      continue;
    }
  }
  activeApiBase = null;
  return null;
}

export function isBackendAvailable() {
  return activeApiBase !== null;
}

export function getApiBase() {
  return activeApiBase || '';
}

// Diagnose an image via backend
export async function diagnoseImage(file) {
  if (!activeApiBase && activeApiBase !== '') {
    throw new Error('Backend not available');
  }
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${activeApiBase}/api/diagnose`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Save mission to backend
export async function saveMission(mission) {
  if (!activeApiBase && activeApiBase !== '') return false;
  try {
    const res = await fetch(`${activeApiBase}/api/missions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mission),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Get mission history from backend
export async function getMissions(limit = 100) {
  if (!activeApiBase && activeApiBase !== '') return [];
  try {
    const res = await fetch(`${activeApiBase}/api/missions?limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// Get diagnosis history from backend
export async function getDiagnoses(limit = 50) {
  if (!activeApiBase && activeApiBase !== '') return [];
  try {
    const res = await fetch(`${activeApiBase}/api/diagnoses?limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// localStorage helpers
export function saveDiagnosisToLocal(diagnosis) {
  try {
    const existing = JSON.parse(localStorage.getItem('cropguard_diagnoses') || '[]');
    existing.push({ ...diagnosis, id: Date.now(), timestamp: new Date().toISOString() });
    // Keep last 200
    if (existing.length > 200) existing.splice(0, existing.length - 200);
    localStorage.setItem('cropguard_diagnoses', JSON.stringify(existing));
  } catch {
    // quota exceeded
  }
}

export function saveMissionToLocal(mission) {
  try {
    const existing = JSON.parse(localStorage.getItem('cropguard_missions') || '[]');
    existing.push({ ...mission, id: Date.now(), timestamp: new Date().toISOString() });
    if (existing.length > 500) existing.splice(0, existing.length - 500);
    localStorage.setItem('cropguard_missions', JSON.stringify(existing));
  } catch {
    // quota exceeded
  }
}

export function getDiagnosesFromLocal() {
  try {
    return JSON.parse(localStorage.getItem('cropguard_diagnoses') || '[]');
  } catch {
    return [];
  }
}

export function getMissionsFromLocal() {
  try {
    return JSON.parse(localStorage.getItem('cropguard_missions') || '[]');
  } catch {
    return [];
  }
}

export function clearLocalHistory() {
  localStorage.removeItem('cropguard_diagnoses');
  localStorage.removeItem('cropguard_missions');
}

export function exportToCSV(data, filename = 'cropguard_export.csv') {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val ?? '';
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(data, filename = 'cropguard_export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
