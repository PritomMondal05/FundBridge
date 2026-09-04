import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackNotifications,
  createAndDispatchNotification,
  persistS3NotificationStore
} from '../utils/storeUtils.js';

export const notificationModel = {
  async getByUser(userId) {
    const uid = String(userId || '');
    if (!uid) return [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && Array.isArray(data)) return data;
      } catch (e) {}
    }
    return fallbackNotifications.filter((n) => String(n.user_id) === uid).slice(0, 50);
  },

  async markAsRead(id, actorId) {
    const sid = String(id || '');
    const notif = fallbackNotifications.find((n) => n.id === sid);
    if (actorId && notif && String(notif.user_id) !== String(actorId)) return null;
    if (notif) notif.is_read = true;
    persistS3NotificationStore();
    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('notifications').update({ is_read: true }).eq('id', sid);
        if (actorId) q = q.eq('user_id', actorId);
        await q;
      } catch (e) {}
    }
    return notif;
  },

  async create(userId, title, message, type = 'info', meta = {}) {
    return createAndDispatchNotification(userId, title, message, type, meta);
  }
};
