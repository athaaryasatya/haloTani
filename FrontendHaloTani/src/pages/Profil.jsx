import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';
import { Alert, Button, Card, Field, inputCls } from '../components/ui.jsx';

export default function Profil() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    nama: user.nama || '',
    email: user.email || '',
    kontak: user.kontak || '',
    alamat: user.alamat || '',
    password: '',
    password_confirmation: '',
    current_password: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const fe = (k) => errors[k]?.[0];

  async function submit(e) {
    e.preventDefault();
    setErrors({});
    setError('');
    setOk('');
    setBusy(true);
    try {
      const updated = await api.updateProfil(form);
      setUser(updated);
      setForm({ ...form, password: '', password_confirmation: '', current_password: '' });
      setOk('Profil berhasil disimpan.');
    } catch (err) {
      setErrors(err.errors || {});
      if (!Object.keys(err.errors || {}).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Profil</h1>
      <Alert>{error}</Alert>
      <Alert type="success">{ok}</Alert>

      <form onSubmit={submit}>
        <Card title="Informasi Profil">
          <p className="mb-4 text-sm text-gray-500">Perbarui informasi data diri dan kata sandi Anda.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nama lengkap" error={fe('nama')}>
              <input required maxLength={100} className={inputCls} value={form.nama} onChange={set('nama')} />
            </Field>
            <Field label="Email address" error={fe('email')}>
              <input type="email" required className={inputCls} value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Nomor kontak" error={fe('kontak')}>
              <input type="tel" maxLength={20} className={inputCls} value={form.kontak} onChange={set('kontak')} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Alamat" error={fe('alamat')}>
                <textarea rows={3} className={inputCls} value={form.alamat} onChange={set('alamat')} />
              </Field>
            </div>
            <Field label="Password baru (kosongkan jika tidak diganti)" error={fe('password')}>
              <input type="password" minLength={8} className={inputCls} value={form.password} onChange={set('password')} />
            </Field>
            <Field label="Konfirmasi password baru">
              <input type="password" className={inputCls} value={form.password_confirmation} onChange={set('password_confirmation')} />
            </Field>
            <Field label="Password saat ini (wajib jika mengganti password)" error={fe('current_password')}>
              <input type="password" className={inputCls} value={form.current_password} onChange={set('current_password')} />
            </Field>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={busy}>
              {busy ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
