import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Alert, AuthLink, AuthShell, Button, Field, inputCls } from '../components/ui.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', password_confirmation: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const token = params.get('token') || '';
  const email = params.get('email') || '';

  async function submit(e) {
    e.preventDefault();
    setError('');
    setErrors({});
    setBusy(true);
    try {
      await api.resetPassword({ token, email, ...form });
      navigate('/login', { replace: true });
    } catch (err) {
      setErrors(err.errors || {});
      setError(err.first?.('email') || (!Object.keys(err.errors || {}).length ? err.message : ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell subtitle="Atur Kata Sandi Baru" footer={<AuthLink to="/login">Kembali ke halaman masuk</AuthLink>}>
      {!token || !email ? (
        <Alert>Tautan reset tidak lengkap. Minta tautan baru lewat halaman "Lupa kata sandi".</Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Alert>{error}</Alert>
          <p className="text-sm text-gray-600">
            Akun: <b>{email}</b>
          </p>
          <Field label="Password baru (min. 8 karakter)" error={errors.password?.[0]}>
            <input
              type="password"
              required
              minLength={8}
              autoFocus
              className={inputCls}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Konfirmasi password baru">
            <input
              type="password"
              required
              className={inputCls}
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            />
          </Field>
          <Button type="submit" disabled={busy} className="w-full py-2.5">
            {busy ? 'Menyimpan...' : 'Simpan kata sandi'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
