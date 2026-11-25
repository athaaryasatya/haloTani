import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ClockIcon, DocPlusIcon, HomeIcon, LogoutIcon, MenuIcon, UserIcon } from './ui.jsx';

const menu = [
  { to: '/', label: 'Beranda', icon: HomeIcon, end: true },
  { to: '/keluhan/baru', label: 'Kirim Keluhan', icon: DocPlusIcon },
  { to: '/riwayat', label: 'Riwayat Analisis', icon: ClockIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Bar atas (mobile) */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <button onClick={() => setOpen(true)} aria-label="Buka menu">
          <MenuIcon className="h-6 w-6" />
        </button>
        <span className="font-bold">Agritech</span>
      </header>

      {open && <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white">
            <HomeIcon className="h-5 w-5" />
          </span>
          <span className="text-[1.05rem] font-bold">Agritech</span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {menu.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition ${
                  isActive ? 'bg-brand-soft font-semibold text-brand' : 'font-medium text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-2 p-3">
          <Link
            to="/profil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 hover:bg-gray-100"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-green-200 bg-brand-soft text-brand">
              <UserIcon className="h-[1.1rem] w-[1.1rem]" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[0.8rem] font-semibold">{user?.nama}</span>
              <span className="block text-xs text-gray-500">Petani</span>
            </span>
          </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            <LogoutIcon className="h-5 w-5" />
            Keluar Akun
          </button>
        </div>
      </aside>

      <main className="px-4 py-6 md:ml-60 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
