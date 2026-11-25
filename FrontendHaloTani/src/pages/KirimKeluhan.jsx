import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { MIN_KATA, hitungKata } from '../lib/format.js';
import { Alert, Button, Card, Field, inputCls } from '../components/ui.jsx';

const kosong = { jenis_tanaman: '', lokasi_lahan: '', tingkat_urgensi: 'Sedang', deskripsi: '' };

export default function KirimKeluhan() {
  const navigate = useNavigate();
  const [form, setForm] = useState(kosong);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const minKata = MIN_KATA[form.tingkat_urgensi];
  const jumlahKata = hitungKata(form.deskripsi);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setErrors({});

    if (jumlahKata < minKata) {
      setErrors({ deskripsi: [`Untuk urgensi ${form.tingkat_urgensi}, deskripsi minimal ${minKata} kata (saat ini ${jumlahKata} kata).`] });
      return;
    }

    setBusy(true);
    try {
      const keluhan = await api.createKeluhan(form);
      navigate('/riwayat', { state: { selectedId: keluhan.id } });
    } catch (err) {
      setErrors(err.errors || {});
      if (!Object.keys(err.errors || {}).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <h1 className="text-2xl font-bold">Kirim Keluhan Tanaman</h1>
      <Alert>{error}</Alert>

      <form onSubmit={submit}>
        <Card>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-5">
              <Field label="Jenis Tanaman" error={errors.jenis_tanaman?.[0]}>
                <input required className={inputCls} placeholder="Contoh: Padi, Cabai, Petai" value={form.jenis_tanaman} onChange={set('jenis_tanaman')} />
              </Field>
              <Field label="Lokasi Lahan" error={errors.lokasi_lahan?.[0]}>
                <input required className={inputCls} placeholder="Contoh: Magetan, Jawa Timur" value={form.lokasi_lahan} onChange={set('lokasi_lahan')} />
              </Field>
              <Field label="Tingkat Urgensi" error={errors.tingkat_urgensi?.[0]}>
                <div className="flex gap-2">
                  {Object.keys(MIN_KATA).map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setForm({ ...form, tingkat_urgensi: lvl })}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                        form.tingkat_urgensi === lvl
                          ? 'border-brand bg-brand text-white'
                          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Deskripsi Masalah / Gejala" error={errors.deskripsi?.[0]}>
              <textarea
                required
                rows={8}
                className={inputCls}
                placeholder="Jelaskan kondisi tanaman secara detail..."
                value={form.deskripsi}
                onChange={set('deskripsi')}
              />
              <p className={`mt-1 text-xs ${jumlahKata >= minKata ? 'text-green-600' : 'text-gray-500'}`}>
                {jumlahKata} / minimal {minKata} kata
              </p>
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" disabled={busy} onClick={() => { setForm(kosong); setErrors({}); }}>
              Batal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Menganalisis dengan AI...' : 'Kirim & Analisis dengan AI'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
