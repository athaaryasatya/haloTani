const BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const TOKEN_KEY = 'halotani_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  constructor(message, status, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors; // { namaField: ['pesan', ...] }
  }
  /** Pesan pertama untuk satu field, atau undefined. */
  first(field) {
    return this.errors?.[field]?.[0];
  }
}

async function request(method, path, body) {
  const token = tokenStore.get();
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respons kosong / bukan JSON */
  }

  if (!res.ok) {
    // token kedaluwarsa / dicabut -> paksa keluar
    if (res.status === 401 && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event('halotani:unauthorized'));
    }
    throw new ApiError(data?.message || 'Terjadi kesalahan pada server.', res.status, data?.errors || {});
  }
  return data;
}

export const api = {
  // auth
  register: (payload) => request('POST', '/auth/register', payload),
  login: (payload) => request('POST', '/auth/login', payload),
  logout: () => request('POST', '/auth/logout'),
  me: () => request('GET', '/auth/me').then((r) => r.data),
  forgotPassword: (email) => request('POST', '/auth/forgot-password', { email }),
  resetPassword: (payload) => request('POST', '/auth/reset-password', payload),

  // profil
  updateProfil: (payload) => request('PUT', '/profil', payload).then((r) => r.data),

  // dashboard
  dashboard: () => request('GET', '/dashboard'),

  // keluhan
  listKeluhan: (status = 'semua') => request('GET', `/keluhan?status=${encodeURIComponent(status)}`).then((r) => r.data),
  getKeluhan: (id) => request('GET', `/keluhan/${id}`).then((r) => r.data),
  createKeluhan: (payload) => request('POST', '/keluhan', payload).then((r) => r.data),


  // admin: template prompt
  getTemplatePrompt: () => request('GET', '/admin/template-prompt').then((r) => r.data),
  updateTemplatePrompt: (payload) => request('PUT', '/admin/template-prompt', payload),
  testTemplatePrompt: (payload) => request('POST', '/admin/template-prompt/test', payload).then((r) => r.data),
};
