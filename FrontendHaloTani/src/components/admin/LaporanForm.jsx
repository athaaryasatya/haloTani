// IMPORT
import { useState } from 'react';
import { api } from '../../lib/api.js';
import { Alert, Button, Card, Field, inputCls } from '../ui.jsx';

// DAFTAR BULAN
export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function LaporanForm({ daftar, onSaved }) {
  // STATE
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // CARI LAPORAN YANG SUDAH ADA
  const lama = daftar.find((l) => l.bulan === NAMA_BULAN[bulan - 1] && l.tahun === tahun);
  const catatan = draft ?? lama?.ringkasan?.catatan ?? '';

  // SIMPAN
  async function simpan(e) {
    e.preventDefault();
    if (lama && !window.confirm(`Laporan ${lama.bulan} ${lama.tahun} sudah ada. Perbarui rekap dan catatannya?`)) return;
    setError('');
    setBusy(true);
    try {
      const res = await api.saveLaporan({ bulan, tahun: Number(tahun), catatan });
      setDraft(null);
      await onSaved(res);
    } catch (err) {
      setError(Object.values(err.errors || {})[0]?.[0] || err.message);
    } finally {
      setBusy(false);
    }
  }

  // TAMPILAN
  return (
    <Card title="Buat / Perbarui Rekap">
      <form onSubmit={simpan}>
        <fieldset disabled={busy} className="space-y-3">
          <Field label="Bulan">
            <select className={inputCls} value={bulan} onChange={(e) => { setBulan(Number(e.target.value)); setDraft(null); }}>
              {NAMA_BULAN.map((nama, i) => (
                <option key={nama} value={i + 1}>{nama}</option>
              ))}
            </select>
          </Field>
          <Field label="Tahun">
            <input type="number" required min={2020} max={2100} className={inputCls} value={tahun} onChange={(e) => { setTahun(e.target.value); setDraft(null); }} />
          </Field>
          <Field label="Catatan evaluasi">
            <textarea rows={4} maxLength={1000} className={inputCls} value={catatan} onChange={(e) => setDraft(e.target.value)} />
          </Field>
          <Alert>{error}</Alert>
          <Button type="submit">{busy ? 'Menyimpan...' : lama ? 'Perbarui' : 'Buat Rekap'}</Button>
        </fieldset>
      </form>
    </Card>
  );
}