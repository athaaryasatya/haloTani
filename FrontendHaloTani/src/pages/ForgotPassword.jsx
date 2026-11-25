import { useState } from 'react';
import { api } from '../lib/api.js';
import { Alert, AuthLink, AuthShell, Button, Field, inputCls } from '../components/ui.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const res = await api.forgotPassword(email);
      setMsg(res.message);
    } catch (err) {
      setError(err.first?.('email') || err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      subtitle="Lupa Kata Sandi"
      footer={<AuthLink to="/login">Kembali ke halaman masuk</AuthLink>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Alert>{error}</Alert>
        <Alert type="success">{msg}</Alert>
        <Field label="Email address">
          <input type="email" required autoFocus className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Button type="submit" disabled={busy} className="w-full py-2.5">
          {busy ? 'Mengirim...' : 'Kirim tautan reset'}
        </Button>
      </form>
    </AuthShell>
  );
}
