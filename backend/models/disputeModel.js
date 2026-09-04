import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackDisputes,
  fallbackUsers,
  fallbackCampaigns,
  persistS3DisputesStore,
  persistS3CampaignStore
} from '../utils/storeUtils.js';

export const disputeModel = {
  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('disputes').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) {
          const byId = new Map(fallbackDisputes.map(d => [d.id, d]));
          data.forEach(d => { if (d && d.id) byId.set(d.id, { ...byId.get(d.id), ...d }); });
          return Array.from(byId.values());
        }
      } catch (e) {}
    }
    return fallbackDisputes;
  },

  async getById(id) {
    const sid = String(id || '');
    const all = await this.getAll();
    return all.find(d => d.id === sid) || null;
  },

  async create(disputeData) {
    fallbackDisputes.unshift(disputeData);
    persistS3DisputesStore();

    if (isSupabaseConfigured && supabase) {
      try {
        const row = {
          id: disputeData.id,
          complainant_name: disputeData.complainant_name,
          complainant_role: disputeData.complainant_role || 'user',
          reported_user: disputeData.reported_user,
          reported_user_id: disputeData.reported_user_id || null,
          reported_role: disputeData.reported_role || 'user',
          campaign_title: disputeData.campaign_title || null,
          campaign_id: disputeData.campaign_id || null,
          issue_type: disputeData.issue_type || disputeData.category || 'Policy violation',
          description: disputeData.description || disputeData.reason || '',
          evidence_file: disputeData.evidence_link || null,
          severity: disputeData.severity || 'High',
          status: disputeData.status || 'Open',
          created_at: disputeData.created_at
        };
        await supabase.from('disputes').insert([row]);
      } catch (e) {
        console.warn('Supabase dispute insert warning:', e.message);
      }
    }
    return disputeData;
  },

  async dismiss(id, note = '') {
    const sid = String(id || '');
    const dispute = fallbackDisputes.find(d => d.id === sid);
    if (!dispute) return null;

    dispute.status = 'Dismissed';
    dispute.resolution_note = note || 'Dismissed as non-actionable by platform administrator.';
    dispute.resolved_at = new Date().toISOString();
    persistS3DisputesStore();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('disputes').update({
          status: 'Dismissed',
          resolution_note: dispute.resolution_note,
          resolved_at: dispute.resolved_at
        }).eq('id', sid);
      } catch (e) {}
    }
    return dispute;
  },

  async resolve(id, note = '') {
    const sid = String(id || '');
    const dispute = fallbackDisputes.find(d => d.id === sid);
    if (!dispute) return null;

    dispute.status = 'Resolved';
    dispute.resolution_note = note || 'Resolution terms finalized by administrator.';
    dispute.resolved_at = new Date().toISOString();
    persistS3DisputesStore();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('disputes').update({
          status: 'Resolved',
          resolution_note: dispute.resolution_note,
          resolved_at: dispute.resolved_at
        }).eq('id', sid);
      } catch (e) {}
    }
    return dispute;
  },

  async blockReportedUser(id, note = '') {
    const sid = String(id || '');
    const dispute = fallbackDisputes.find(d => d.id === sid);
    if (!dispute) return null;

    dispute.status = 'Resolved (User Blocked)';
    dispute.resolution_note = note || 'Administrator blocked reported user.';
    dispute.resolved_at = new Date().toISOString();
    persistS3DisputesStore();

    const rUserId = dispute.reported_user_id || dispute.reportedUserId;
    const rUserName = dispute.reported_user || dispute.reportedUser;

    if (rUserId) {
      const u = fallbackUsers.find(x => x.id === rUserId || x._id === rUserId);
      if (u) {
        u.vettingStatus = 'blocked';
        u.vetting_status = 'blocked';
      }
      if (isSupabaseConfigured && supabase) {
        try { await supabase.from('users').update({ vetting_status: 'blocked' }).eq('id', rUserId); } catch (e) {}
      }
    } else if (rUserName) {
      const u = fallbackUsers.find(x => x.name === rUserName);
      if (u) {
        u.vettingStatus = 'blocked';
        u.vetting_status = 'blocked';
      }
      if (isSupabaseConfigured && supabase) {
        try { await supabase.from('users').update({ vetting_status: 'blocked' }).eq('name', rUserName); } catch (e) {}
      }
    }

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('disputes').update({
          status: dispute.status,
          resolution_note: dispute.resolution_note,
          resolved_at: dispute.resolved_at
        }).eq('id', sid);
      } catch (e) {}
    }

    return dispute;
  }
};
