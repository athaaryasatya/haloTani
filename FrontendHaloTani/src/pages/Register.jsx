import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, AuthLink, AuthShell, Button, Field, inputCls } from '../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const [form, setForm] = useState({ nama: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setErrors({});
    setBusy(true);
    try {
      await register(form);
    } catch (err) {
      setErrors(err.errors || {});
      if (!err.errors || !Object.keys(err.errors).length) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const fe = (k) => errors[k]?.[0];

  return (
    <AuthShell
      subtitle="Daftar Akun Petani"
      footer={
        <>
          Sudah punya akun? <AuthLink to="/login">Masuk</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Field label="Nama lengkap" error={fe('nama')}>
          <input required maxLength={100} autoFocus className={inputCls} value={form.nama} onChange={set('nama')} />
        </Field>
        <Field label="Email address" error={fe('email')}>
          <input type="email" required className={inputCls} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password (min. 8 karakter)" error={fe('password')}>
          <input type="password" required minLength={8} className={inputCls} value={form.password} onChange={set('password')} />
        </Field>
        <Field label="Konfirmasi password">
          <input
            type="password"
            required
            className={inputCls}
            value={form.password_confirmation}
            onChange={set('password_confirmation')}
          />
        </Field>
        <Button type="submit" disabled={busy} className="w-full py-2.5">
          {busy ? 'Memproses...' : 'Daftar'}
        </Button>
      </form>
    </AuthShell>
  );
}
