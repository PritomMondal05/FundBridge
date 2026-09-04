import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackProposals,
  normalizeProposal,
  persistS3ProposalStore,
  s3OverlayLocalProposals,
  s3EmitProposalUpdated,
  s3SyncProposalToSupabase,
  s3FounderOwnerKeys
} from '../utils/storeUtils.js';

export const proposalModel = {
  async getByCampaign(campaignId) {
    const cid = String(campaignId || '');
    const uniqueMap = new Map();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('proposals').select('*').eq('campaign_id', cid);
        if (!error && Array.isArray(data)) {
          data.forEach(p => {
            const n = normalizeProposal(p);
            if (n && n.id) uniqueMap.set(n.id, n);
          });
        }
      } catch (e) {}
    }
    s3OverlayLocalProposals(uniqueMap, p => (p.campaign_id || p.campaignId) === cid);
    return Array.from(uniqueMap.values());
  },

  async getByInvestor(investorId) {
    const iid = String(investorId || '');
    const uniqueMap = new Map();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('proposals').select('*').eq('investor_id', iid);
        if (!error && Array.isArray(data)) {
          data.forEach(p => {
            const n = normalizeProposal(p);
            if (n && n.id) uniqueMap.set(n.id, n);
          });
        }
      } catch (e) {}
    }
    s3OverlayLocalProposals(uniqueMap, p => (p.investor_id || p.investorId) === iid);
    return Array.from(uniqueMap.values());
  },

  async getByFounder(founderId) {
    const ownerKeys = await s3FounderOwnerKeys(founderId);
    const uniqueMap = new Map();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('proposals').select('*');
        if (!error && Array.isArray(data)) {
          data.forEach(p => {
            const n = normalizeProposal(p);
            if (n && n.id && (ownerKeys.has(String(n.founder_id)) || ownerKeys.has(String(p.founder_id)))) {
              uniqueMap.set(n.id, n);
            }
          });
        }
      } catch (e) {}
    }
    s3OverlayLocalProposals(uniqueMap, p => ownerKeys.has(String(p.founder_id || p.founderId)));
    return Array.from(uniqueMap.values());
  },

  async getById(id) {
    const sid = String(id || '');
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('proposals').select('*').eq('id', sid).single();
        if (!error && data) return normalizeProposal(data);
      } catch (e) {}
    }
    const found = fallbackProposals.find(p => String(p.id || p._id) === sid);
    return normalizeProposal(found);
  },

  async create(proposalData) {
    fallbackProposals.unshift(proposalData);
    persistS3ProposalStore();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('proposals').insert([{
          id: proposalData.id,
          campaign_id: proposalData.campaign_id || proposalData.campaignId,
          investor_id: proposalData.investor_id || proposalData.investorId,
          founder_id: proposalData.founder_id || proposalData.founderId,
          amount: Number(proposalData.amount || 0),
          terms: proposalData.terms || proposalData.return_structure || 'Standard Terms',
          custom_notes: proposalData.custom_notes || proposalData.customNotes || '',
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn('Supabase proposal insert warning:', e.message);
      }
    }
    s3EmitProposalUpdated(proposalData);
    return normalizeProposal(proposalData);
  },

  async updateStatus(id, status, extra = {}) {
    const sid = String(id || '');
    const idx = fallbackProposals.findIndex(p => String(p.id || p._id) === sid);
    let updated = null;
    if (idx !== -1) {
      fallbackProposals[idx] = { ...fallbackProposals[idx], status, ...extra };
      updated = fallbackProposals[idx];
      persistS3ProposalStore();
      s3SyncProposalToSupabase(updated);
      s3EmitProposalUpdated(updated);
    }
    return normalizeProposal(updated);
  },

  async delete(id) {
    const sid = String(id || '');
    const idx = fallbackProposals.findIndex(p => String(p.id || p._id) === sid);
    let deleted = null;
    if (idx !== -1) {
      deleted = fallbackProposals.splice(idx, 1)[0];
      persistS3ProposalStore();
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('proposals').delete().eq('id', sid);
      } catch (e) {}
    }
    return deleted;
  }
};
