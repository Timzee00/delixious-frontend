import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { refreshSession, setUnauthorizedHandler } from '../lib/api.js';
import { setCsrfToken } from '../lib/csrf.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    setUser(data.user);
    setProfile(data.profile);
    setCsrfToken(data.csrfToken);
    return data.profile;
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      return applySession(data);
    } catch (error) {
      // If the short-lived access cookie has disappeared but the long-lived
      // refresh cookie is still valid, recover the session without forcing the
      // user to log in again. This is especially important after browser
      // restarts and on browsers with stricter cookie handling.
      if (error.response?.status === 401 && error.response?.data?.code === 'NO_SESSION') {
        try {
          const { data } = await refreshSession();
          return applySession(data);
        } catch {
          // No usable refresh session remains.
        }
      }

      setUser(null);
      setProfile(null);
      return null;
    }
  }, [applySession]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setProfile(null);
    });

    (async () => {
      await refreshProfile();
      setLoading(false);
    })();
  }, [refreshProfile]);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    applySession(data);
    return data;
  }

  async function signup(payload) {
    const { data } = await api.post('/auth/signup', payload);
    if (data.user) {
      await refreshProfile();
    }
    return data;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore server errors; local auth state must still be cleared.
    }
    setUser(null);
    setProfile(null);
    setCsrfToken(null);
  }

  async function updateProfile(payload) {
    const { data } = await api.put('/auth/profile', payload);
    setProfile(data.profile);
    return data;
  }

  const value = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: Boolean(profile),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider.');
  return ctx;
}
