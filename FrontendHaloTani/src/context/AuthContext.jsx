import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  // Saat halaman dibuka: kalau ada token tersimpan, ambil data petani.
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  // Dipicu api.js saat server menjawab 401.
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('halotani:unauthorized', onUnauthorized);
    return () => window.removeEventListener('halotani:unauthorized', onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, petani } = await api.login({ email, password });
    tokenStore.set(token);
    setUser(petani);
  }, []);

  const register = useCallback(async (payload) => {
    const { token, petani } = await api.register(payload);
    tokenStore.set(token);
    setUser(petani);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* token sudah tidak valid -> tetap keluar */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
