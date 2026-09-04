import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackMessages,
  persistS3MessageStore
} from '../utils/storeUtils.js';

export const messageModel = {
  async getMessages({ senderId, receiverId, campaignId }) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
        if (!error && Array.isArray(data)) return data;
      } catch (e) {}
    }
    return fallbackMessages;
  },

  getThread(senderId, receiverId) {
    const s = String(senderId || '');
    const r = String(receiverId || '');
    return fallbackMessages.filter(
      (m) =>
        (String(m.sender_id) === s && String(m.receiver_id) === r) ||
        (String(m.sender_id) === r && String(m.receiver_id) === s) ||
        (String(m.receiver_id) === 'all' && (String(m.sender_id) === s || String(m.sender_id) === r))
    );
  },

  async createMessage(messageData) {
    fallbackMessages.push(messageData);
    persistS3MessageStore();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('messages').insert([messageData]);
      } catch (e) {
        console.warn('Supabase message insert warning:', e.message);
      }
    }
    return messageData;
  }
};
