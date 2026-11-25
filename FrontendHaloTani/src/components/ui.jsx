import { Link } from 'react-router-dom';

export function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-gray-100';

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-brand text-white hover:bg-brand-dark disabled:opacity-60',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60',
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white shadow-sm ${className}`}>
      {title && <h2 className="border-b border-gray-100 px-5 py-3.5 text-base font-semibold">{title}</h2>}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Alert({ type = 'error', children }) {
  if (!children) return null;
  const cls = type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800';
  return <div className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</div>;
}

export function Spinner({ className = '' }) {
  return <div className={`h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent ${className}`} />;
}

export function StatusBadge({ status }) {
  const selesai = status === 'selesai';
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold capitalize ${
        selesai ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
      }`}
    >
      {status}
    </span>
  );
}

export function UrgensiBadge({ urgensi }) {
  const map = { tinggi: 'bg-red-100 text-red-700', sedang: 'bg-amber-100 text-amber-700', rendah: 'bg-sky-100 text-sky-700' };
  const cls = map[(urgensi || '').toLowerCase()] || 'bg-gray-100 text-gray-600';
  return <span className={`rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>{urgensi || '-'}</span>;
}

/** Kerangka halaman login / daftar / lupa sandi. */
export function AuthShell({ subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white">
            <HomeIcon className="h-6 w-6" />
          </div>
          <p className="text-lg font-bold text-gray-900">{subtitle}</p>
          <p className="mt-2 text-sm text-gray-600">© 2026 Agritech Assistant • Politeknik Negeri Madiun</p>
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
      </div>
    </div>
  );
}

export const AuthLink = ({ to, children }) => (
  <Link to={to} className="font-bold text-gray-800 transition hover:text-green-600">
    {children}
  </Link>
);

/* ---- Ikon (heroicons outline) ---- */
const Icon = ({ d, className = 'h-5 w-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
export const HomeIcon = (p) => (
  <Icon {...p} d="m2.25 12 8.954-8.955a1.126 1.126 0 0 1 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
);
export const DocPlusIcon = (p) => (
  <Icon {...p} d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
);
export const ClockIcon = (p) => <Icon {...p} d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />;
export const UserIcon = (p) => (
  <Icon {...p} d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
);
export const LogoutIcon = (p) => (
  <Icon {...p} d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
);
export const MenuIcon = (p) => <Icon {...p} d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />;
