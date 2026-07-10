import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../lib/api.js';
import { useAuth } from './AuthContext.jsx';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    try {
      const { data } = await api.get('/notifications/unread-count');
      setUnreadCount(data.unread_count || 0);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider.');
  return ctx;
}
