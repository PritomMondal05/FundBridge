import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import { fallbackUsers, normalizeUser } from '../utils/storeUtils.js';

export const userModel = {
  async findByEmail(email) {
    const em = String(email || '').trim().toLowerCase();
    if (!em) return null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('email', em).single();
        if (!error && data) return normalizeUser(data);
      } catch (e) {}
    }
    const found = fallbackUsers.find(u => String(u.email || '').toLowerCase() === em);
    return normalizeUser(found);
  },

  async findById(id) {
    const sid = String(id || '');
    if (!sid) return null;
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('id', sid).single();
        if (!error && data) return normalizeUser(data);
      } catch (e) {}
    }
    const found = fallbackUsers.find(u => String(u.id || u._id) === sid);
    return normalizeUser(found);
  },

  async create(userData) {
    fallbackUsers.push(userData);
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').insert([userData]).select('*').single();
        if (!error && data) return normalizeUser(data);
      } catch (e) {
        console.warn('Supabase user insert warning:', e.message);
      }
    }
    return normalizeUser(userData);
  },

  async update(id, updateData) {
    const sid = String(id || '');
    const idx = fallbackUsers.findIndex(u => String(u.id || u._id) === sid);
    if (idx !== -1) {
      fallbackUsers[idx] = { ...fallbackUsers[idx], ...updateData };
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').update(updateData).eq('id', sid);
      } catch (e) {}
    }
    return idx !== -1 ? normalizeUser(fallbackUsers[idx]) : null;
  },

  async updateVettingStatus(id, status) {
    const sid = String(id || '');
    const idx = fallbackUsers.findIndex(u => String(u.id || u._id) === sid);
    if (idx !== -1) {
      fallbackUsers[idx].vettingStatus = status;
      fallbackUsers[idx].vetting_status = status;
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').update({ vetting_status: status }).eq('id', sid);
      } catch (e) {}
    }
    return idx !== -1 ? normalizeUser(fallbackUsers[idx]) : null;
  },

  async delete(id) {
    const sid = String(id || '');
    const idx = fallbackUsers.findIndex(u => String(u.id || u._id) === sid);
    let deleted = null;
    if (idx !== -1) {
      deleted = fallbackUsers.splice(idx, 1)[0];
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').delete().eq('id', sid);
      } catch (e) {}
    }
    return deleted;
  },

  async getVettingApplicants() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('vetting_status', 'pending');
        if (!error && Array.isArray(data)) {
          return data.map(normalizeUser);
        }
      } catch (e) {}
    }
    return fallbackUsers
      .filter(u => (u.vettingStatus || u.vetting_status) === 'pending')
      .map(normalizeUser);
  },

  async getFounders() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'founder');
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(normalizeUser);
        }
      } catch (e) {}
    }
    return fallbackUsers.filter(u => u.role === 'founder').map(normalizeUser);
  },

  async getInvestors() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('role', 'investor');
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(normalizeUser);
        }
      } catch (e) {}
    }
    return fallbackUsers.filter(u => u.role === 'investor').map(normalizeUser);
  }
};
