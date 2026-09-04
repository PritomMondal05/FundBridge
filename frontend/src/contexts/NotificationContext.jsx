import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { createNotificationService } from '../services/notificationService.js';

const NotificationContext = createContext(null);

function normalizeRow(row) {
  if (!row || !row.id) return null;
  return {
    ...row,
    id: row.id,
    user_id: row.user_id || row.recipient_id,
    is_read: Boolean(row.is_read),
    link_url: row.link_url || row.linkUrl || null,
    created_at: row.created_at || row.createdAt
  };
}

function mergeById(list, incoming) {
  const row = normalizeRow(incoming);
  if (!row) return list;
  const idx = list.findIndex((item) => item.id === row.id);
  if (idx >= 0) {
    const next = [...list];
    next[idx] = { ...next[idx], ...row };
    return next;
  }
  return [row, ...list].slice(0, 50);
}

function unreadOf(list) {
  return list.filter((item) => !item.is_read).length;
}

export function NotificationProvider({ userId, apiBase, onNavigate, onToast, children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState('');
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const serviceRef = useRef(createNotificationService(apiBase));
  const onToastRef = useRef(onToast);
  onToastRef.current = onToast;
  useEffect(() => {
    serviceRef.current = createNotificationService(apiBase);
  }, [apiBase]);

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const rows = await serviceRef.current.getNotifications(userId);
      setNotifications((prev) => {
        const byId = new Map(prev.map((item) => [item.id, item]));
        rows.map(normalizeRow).filter(Boolean).forEach((row) => byId.set(row.id, { ...byId.get(row.id), ...row }));
        return [...byId.values()].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 50);
      });
    } catch (err) {
      setError(err.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setIsRealtimeConnected(false);
      setLoading(false);
      return undefined;
    }

    const socket = io(apiBase);
    socket.emit('join_room', userId);
    socket.on('connect', () => setIsRealtimeConnected(true));
    socket.on('disconnect', () => setIsRealtimeConnected(false));

    const onIncoming = (payload) => {
      const row = normalizeRow(payload);
      if (!row) return;
      if (String(row.user_id) !== String(userId)) return;
      setNotifications((prev) => mergeById(prev, row));
      if (!row.is_read && onToastRef.current) onToastRef.current(`🔔 ${row.title}`, 'info');
    };

    socket.on('receive_notification', onIncoming);
    refreshNotifications();

    return () => {
      socket.off('receive_notification', onIncoming);
      socket.disconnect();
      setIsRealtimeConnected(false);
    };
  }, [apiBase, userId, refreshNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((prev) => prev.map((item) => item.id === notificationId ? { ...item, is_read: true } : item));
    try {
      await serviceRef.current.markNotificationAsRead(notificationId, userId);
    } catch (err) {
      await refreshNotifications();
      throw err;
    }
  }, [refreshNotifications, userId]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    try {
      await serviceRef.current.markAllNotificationsAsRead(userId);
    } catch (err) {
      await refreshNotifications();
      throw err;
    }
  }, [refreshNotifications, userId]);

  const deleteNotification = useCallback(async (notificationId) => {
    setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
    try {
      await serviceRef.current.deleteNotification(notificationId, userId);
    } catch (err) {
      await refreshNotifications();
      throw err;
    }
  }, [refreshNotifications, userId]);

  const unreadCount = unreadOf(notifications);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    isRealtimeConnected,
    onNavigate
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside NotificationProvider.');
  }
  return ctx;
}
