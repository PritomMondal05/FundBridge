import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackNotifications,
  createAndDispatchNotification
} from '../utils/storeUtils.js';

export const notificationModel = {
  async getByUser(userId) {
    const uid = String(userId || '');
    if (isSupabaseConfigured && supabase) {
      try {
        let q = supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (uid) q = q.eq('user_id', uid);
        const { data, error } = await q;
        if (!error && Array.isArray(data)) return data;
      } catch (e) {}
    }
    return uid
      ? fallbackNotifications.filter(n => String(n.user_id) === uid)
      : fallbackNotifications;
  },

  async markAsRead(id) {
    const sid = String(id || '');
    const notif = fallbackNotifications.find(n => n.id === sid);
    if (notif) notif.is_read = true;

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', sid);
      } catch (e) {}
    }
    return notif;
  },

  async create(userId, title, message, type = 'info') {
    return createAndDispatchNotification(userId, title, message, type);
  }
};
