import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

function normalizeUser(profile) {
  if (!profile) return null;
  return {
    ...profile,
    is_admin: Boolean(profile?.is_admin),
    is_staff: Boolean(profile?.is_staff || profile?.is_admin),
    is_superuser: Boolean(profile?.is_superuser),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (api.getToken()) {
      api.getProfile()
        .then((profile) => setUser(normalizeUser(profile)))
        .catch(() => api.clearTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    const tokenData = await api.login(username, password);
    const profile = await api.getProfile();
    const normalizedUser = normalizeUser(profile);
    setUser(normalizedUser);
    return { ...tokenData, ...normalizedUser };
  };

  const register = async (data) => {
    await api.register(data);
    return login(data.username, data.password);
  };

  const logout = () => {
    api.clearTokens();
    setUser(null);
  };

  const refreshProfile = async () => {
    const profile = await api.getProfile();
    const normalizedUser = normalizeUser(profile);
    setUser(normalizedUser);
    return normalizedUser;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
