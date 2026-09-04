import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackCampaigns,
  fallbackUpdates,
  fallbackProgressTags,
  normalizeCampaign,
  persistS3CampaignStore,
  persistS3UpdateStore,
  persistS3ProgressTagStore,
  s3DedupeLiveCampaigns,
  s3FounderAccessKeys,
  s3CampaignAccessibleBy,
  annotateViewerRole
} from '../utils/storeUtils.js';

export const campaignModel = {
  async getAll() {
    const byId = new Map();
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('campaigns').select('*');
        if (!error && Array.isArray(data)) {
          data.forEach(row => {
            const norm = normalizeCampaign(row);
            if (norm && (norm.id || norm._id)) {
              byId.set(norm.id || norm._id, norm);
            }
          });
        }
      } catch (e) {}
    }
    fallbackCampaigns.forEach(fc => {
      const norm = normalizeCampaign(fc);
      if (norm && (norm.id || norm._id)) {
        byId.set(norm.id || norm._id, norm);
      }
    });
    return s3DedupeLiveCampaigns(Array.from(byId.values()));
  },

  async getWatchable() {
    const all = await this.getAll();
    return all.filter(c => c.verified === true && c.status !== 'archived' && c.status !== 'blocked');
  },

  async getByFounder(founderId) {
    const accessKeys = await s3FounderAccessKeys(founderId);
    const all = await this.getAll();
    return all
      .filter(c => s3CampaignAccessibleBy(c, accessKeys))
      .map(c => annotateViewerRole(c, accessKeys));
  },

  async getById(id) {
    const sid = String(id || '');
    const all = await this.getAll();
    return all.find(c => String(c.id || c._id) === sid) || null;
  },

  async create(campaignData) {
    fallbackCampaigns.unshift(campaignData);
    persistS3CampaignStore();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').insert([{
          id: campaignData.id,
          title: campaignData.title,
          founder_id: campaignData.founder_id || campaignData.founderId,
          university: campaignData.university,
          location: campaignData.location,
          category: campaignData.category,
          stage: campaignData.stage,
          goal: Number(campaignData.goal || 0),
          raised: Number(campaignData.raised || 0),
          equity_offer: campaignData.equityOffer || campaignData.equity_offer,
          description: campaignData.description,
          milestones: campaignData.milestones || [],
          verified: Boolean(campaignData.verified),
          status: campaignData.status || 'pending',
          cover_photo: campaignData.coverPhoto || '',
          pitch_video_url: campaignData.pitchVideoUrl || '',
          created_at: new Date().toISOString()
        }]);
      } catch (e) {
        console.warn('Supabase campaign insert warning:', e.message);
      }
    }
    return normalizeCampaign(campaignData);
  },

  async update(id, updateData) {
    const sid = String(id || '');
    const idx = fallbackCampaigns.findIndex(c => String(c.id || c._id) === sid);
    if (idx !== -1) {
      fallbackCampaigns[idx] = { ...fallbackCampaigns[idx], ...updateData };
      persistS3CampaignStore();
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update(updateData).eq('id', sid);
      } catch (e) {}
    }
    return idx !== -1 ? normalizeCampaign(fallbackCampaigns[idx]) : null;
  },

  async delete(id) {
    const sid = String(id || '');
    const idx = fallbackCampaigns.findIndex(c => String(c.id || c._id) === sid);
    let deleted = null;
    if (idx !== -1) {
      deleted = fallbackCampaigns.splice(idx, 1)[0];
      persistS3CampaignStore();
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').delete().eq('id', sid);
      } catch (e) {}
    }
    return deleted;
  },

  // Updates / Announcements
  async getUpdates(campaignId) {
    const sid = String(campaignId || '');
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('campaign_updates')
          .select('*')
          .eq('campaign_id', sid)
          .order('created_at', { ascending: false });
        if (!error && Array.isArray(data)) return data;
      } catch (e) {}
    }
    return fallbackUpdates
      .filter(u => String(u.campaign_id || u.campaignId) === sid)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async createUpdate(updateObj) {
    fallbackUpdates.unshift(updateObj);
    persistS3UpdateStore();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaign_updates').insert([updateObj]);
      } catch (e) {}
    }
    return updateObj;
  },

  async updateUpdateStatus(updateId, status, reviewNote = '') {
    const sid = String(updateId || '');
    const idx = fallbackUpdates.findIndex(u => String(u.id || u._id) === sid);
    if (idx !== -1) {
      fallbackUpdates[idx].status = status;
      fallbackUpdates[idx].review_note = reviewNote;
      persistS3UpdateStore();
    }
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaign_updates').update({ status, review_note: reviewNote }).eq('id', sid);
      } catch (e) {}
    }
    return idx !== -1 ? fallbackUpdates[idx] : null;
  },

  // Progress tags
  getProgressTags(founderId) {
    return fallbackProgressTags[founderId] || {};
  },

  setProgressTag(campaignId, tag) {
    if (!fallbackProgressTags[campaignId]) fallbackProgressTags[campaignId] = [];
    if (!fallbackProgressTags[campaignId].includes(tag)) {
      fallbackProgressTags[campaignId].push(tag);
      persistS3ProgressTagStore();
    }
    return fallbackProgressTags[campaignId];
  },

  // Milestone proofs
  async addMilestoneProof(campaignId, milestoneIdx, proofObj) {
    const sid = String(campaignId || '');
    const camp = fallbackCampaigns.find(c => String(c.id || c._id) === sid);
    if (!camp || !Array.isArray(camp.milestones)) return null;
    const mIdx = Number(milestoneIdx);
    if (mIdx < 0 || mIdx >= camp.milestones.length) return null;
    if (!Array.isArray(camp.milestones[mIdx].proofs)) {
      camp.milestones[mIdx].proofs = [];
    }
    camp.milestones[mIdx].proofs.push(proofObj);
    camp.milestones[mIdx].status = 'pending_approval';
    persistS3CampaignStore();

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({ milestones: camp.milestones }).eq('id', sid);
      } catch (e) {}
    }
    return camp.milestones[mIdx];
  }
};
