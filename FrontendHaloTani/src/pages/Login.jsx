import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, AuthLink, AuthShell, Button, Field, inputCls } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.first?.('email') || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      subtitle="Portal Khusus Petani & Pengelola"
      footer={
        <>
          Belum memiliki akun Petani? <AuthLink to="/register">Daftar sekarang</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Field label="Email address">
          <input type="email" required autoFocus className={inputCls} value={form.email} onChange={set('email')} />
        </Field>
        <Field label="Password">
          <input type="password" required className={inputCls} value={form.password} onChange={set('password')} />
        </Field>
        <div className="text-right text-sm">
          <AuthLink to="/forgot-password">Lupa kata sandi?</AuthLink>
        </div>
        <Button type="submit" disabled={busy} className="w-full py-2.5">
          {busy ? 'Memproses...' : 'Masuk ke Portal'}
        </Button>
      </form>
    </AuthShell>
  );
}
