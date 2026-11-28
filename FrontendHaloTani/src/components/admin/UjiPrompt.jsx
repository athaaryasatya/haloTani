import { useState } from 'react';
import Markdown from 'react-markdown';
import { api } from '../../lib/api.js';
import { Alert, Button, Card, Field, inputCls } from '../ui.jsx';

const awal = { jenis_tanaman: '', lokasi_lahan: '', tingkat_urgensi: 'Sedang', deskripsi: '' };

export default function UjiPrompt({ template }) {
  const [form, setForm] = useState(awal);
  const [hasil, setHasil] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function uji(e) {
    e.preventDefault();
    setError('');
    setHasil(null);
    setBusy(true);
    try {
      setHasil(await api.testTemplatePrompt({ ...form, isi_template: template }));
    } catch (err) {
      setError(Object.values(err.errors || {})[0]?.[0] || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Uji Kirim Prompt ke AI">
      <form onSubmit={uji} className="space-y-3">
        <Field label="Jenis tanaman">
          <input required maxLength={100} className={inputCls} value={form.jenis_tanaman} onChange={set('jenis_tanaman')} />
        </Field>
        <Field label="Lokasi lahan">
          <input required maxLength={150} className={inputCls} value={form.lokasi_lahan} onChange={set('lokasi_lahan')} />
        </Field>
        <Field label="Tingkat urgensi">
          <select className={inputCls} value={form.tingkat_urgensi} onChange={set('tingkat_urgensi')}>
            <option>Rendah</option>
            <option>Sedang</option>
            <option>Tinggi</option>
          </select>
        </Field>
        <Field label="Keluhan">
          <textarea required rows={4} maxLength={3000} className={inputCls} value={form.deskripsi} onChange={set('deskripsi')} />
        </Field>
        <Alert>{error}</Alert>
        <Button type="submit" disabled={busy || !template.trim()}>
          {busy ? 'Menunggu AI...' : 'Uji Kirim'}
        </Button>
      </form>

      {hasil && (
        <div className="mt-5 space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Prompt terkirim</h3>
            <p className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-sm">{hasil.prompt_terkirim}</p>
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">Jawaban server</h3>
            <div className="ai-content">
              <Markdown>{hasil.hasil_analisis}</Markdown>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}