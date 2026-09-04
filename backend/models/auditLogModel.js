import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackAuditLogs,
  writeFounderAuditLog,
  writeInvestorAuditLog,
  auditBelongsToFounder,
  auditBelongsToInvestor
} from '../utils/storeUtils.js';

export const auditLogModel = {
  async getAll() {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
        if (!error && Array.isArray(data) && data.length > 0) return data;
      } catch (e) {}
    }
    return fallbackAuditLogs;
  },

  async getByFounder(founderId) {
    const fid = String(founderId || '');
    const all = await this.getAll();
    return all.filter(r => auditBelongsToFounder(r, fid));
  },

  async getByInvestor(investorId) {
    const iid = String(investorId || '');
    const all = await this.getAll();
    return all.filter(r => auditBelongsToInvestor(r, iid));
  },

  async createFounderLog({ founderId, category, title, status = 'RECORDED' }) {
    return writeFounderAuditLog({ founderId, category, title, status });
  },

  async createInvestorLog({ investorId, category, title, status = 'RECORDED' }) {
    return writeInvestorAuditLog({ investorId, category, title, status });
  }
};
