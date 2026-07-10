import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { setUnauthorizedHandler } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, email } - never the raw tokens, those stay in httpOnly cookies
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setProfile(data.profile);
      return data.profile;
    } catch {
      setUser(null);
      setProfile(null);
      return null;
    }
  }, []);

  useEffect(() => {
    // Wired to api.js's response interceptor: if a token refresh ultimately
    // fails (refresh token itself expired/revoked), this clears local state
    // so the UI reflects "logged out" immediately rather than on the next
    // manual action.
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
    return data;
  }

  async function signup(payload) {
    const { data } = await api.post('/auth/signup', payload);
    if (data.user) {
      // Cookies were set immediately (no email confirmation required) -
      // fetch the profile the same way login does.
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
