import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { setUnauthorizedHandler } from '../lib/api.js';
import { setCsrfToken } from '../lib/csrf.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
      setCsrfToken(data.csrfToken);
      return data.profile;
    } catch {
      setUser(null);
      setProfile(null);
      return null;
    }
  }, []);

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
    setUser(data.user);
    setProfile(data.profile);
    setCsrfToken(data.csrfToken);
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
      // ignore - clear local state regardless of server response
    }
    setUser(null);
    setProfile(null);
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
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider.');
  return ctx;
    }
