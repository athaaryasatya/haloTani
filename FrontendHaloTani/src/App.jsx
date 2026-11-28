import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Dashboard from './pages/Dashboard.jsx';
import KirimKeluhan from './pages/KirimKeluhan.jsx';
import RiwayatAnalisis from './pages/RiwayatAnalisis.jsx';
import Profil from './pages/Profil.jsx';
import TemplatePrompt from './pages/admin/TemplatePrompt.jsx';
import LaporanBulanan from './pages/admin/LaporanBulanan.jsx';


function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8" />
    </div>
  );
}

/** Hanya untuk yang sudah login. */
function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? children : <Navigate to="/login" replace />;
}

/** Halaman login/daftar: kalau sudah login, lempar ke beranda. */
function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to="/" replace /> : children;
}

// untuk admin saja
function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Guest><Login /></Guest>} />
      <Route path="/register" element={<Guest><Register /></Guest>} />
      <Route path="/forgot-password" element={<Guest><ForgotPassword /></Guest>} />
      <Route path="/reset-password" element={<Guest><ResetPassword /></Guest>} />

      <Route element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="keluhan/baru" element={<KirimKeluhan />} />
        <Route path="riwayat" element={<RiwayatAnalisis />} />
        <Route path="profil" element={<Profil />} />
        <Route path="admin/template-prompt" element={<AdminOnly><TemplatePrompt /></AdminOnly>} />
        <Route path="admin/laporan" element={<AdminOnly><LaporanBulanan /></AdminOnly>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
