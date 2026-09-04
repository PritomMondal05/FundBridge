import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackTrash,
  fallbackUsers,
  fallbackCampaigns,
  fallbackReliefDrives,
  persistS3TrashStore,
  persistS3CampaignStore,
  persistS3ReliefStore
} from '../utils/storeUtils.js';

export const trashModel = {
  getAll() {
    return fallbackTrash;
  },

  async addToTrash({ entityType, entityId, title, data, reason = 'Archived by administrator', deletedBy = 'ADMIN_PRITOM' }) {
    const trashEntry = {
      id: 'trash_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      entityType: entityType || 'member',
      entityId: String(entityId || ''),
      title: String(title || 'Untitled Record'),
      data: data || {},
      reason: String(reason || 'Archived by administrator'),
      deletedBy: String(deletedBy || 'ADMIN_PRITOM'),
      deletedAt: new Date().toISOString()
    };
    fallbackTrash.unshift(trashEntry);
    persistS3TrashStore();

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('trash').insert([trashEntry]); } catch (e) {}
    }
    return trashEntry;
  },

  async restoreFromTrash(trashId) {
    const idx = fallbackTrash.findIndex(t => t.id === trashId);
    if (idx === -1) return null;
    const item = fallbackTrash.splice(idx, 1)[0];
    persistS3TrashStore();

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('trash').delete().eq('id', trashId); } catch (e) {}
    }

    // Restore entity
    if (item.entityType === 'member' || item.entityType === 'applicant') {
      const orig = item.data;
      const origId = item.entityId;
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('users').update({ vetting_status: 'verified' }).eq('id', origId);
        } catch (e) {}
      }
      const fu = fallbackUsers.find(u => u.id === origId || u._id === origId);
      if (fu) {
        fu.vettingStatus = 'verified';
        fu.vetting_status = 'verified';
      } else if (orig) {
        fallbackUsers.push({ ...orig, vettingStatus: 'verified', vetting_status: 'verified' });
      }
    } else if (item.entityType === 'campaign') {
      const orig = item.data;
      const origId = item.entityId;
      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('campaigns').update({ status: 'verified', verified: true }).eq('id', origId);
        } catch (e) {}
      }
      const fc = fallbackCampaigns.find(c => c.id === origId || c._id === origId);
      if (fc) {
        fc.status = 'verified';
        fc.verified = true;
      } else if (orig) {
        fallbackCampaigns.push({ ...orig, status: 'verified', verified: true });
      }
      persistS3CampaignStore();
    } else if (item.entityType === 'relief') {
      const orig = item.data;
      const origId = item.entityId;
      const fr = fallbackReliefDrives.find(r => r.id === origId || r._id === origId);
      if (fr) {
        fr.status = 'open';
        fr.rejectionReason = null;
      } else if (orig) {
        fallbackReliefDrives.push({ ...orig, status: 'open', rejectionReason: null });
      }
      persistS3ReliefStore();
    }
    return item;
  },

  async purgeFromTrash(trashId) {
    const idx = fallbackTrash.findIndex(t => t.id === trashId);
    if (idx === -1) return false;
    const item = fallbackTrash.splice(idx, 1)[0];
    persistS3TrashStore();

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('trash').delete().eq('id', trashId); } catch (e) {}
    }

    // Permanently erase from active database/stores
    const origId = item?.entityId;
    if (origId) {
      if (item.entityType === 'member' || item.entityType === 'applicant') {
        const uIdx = fallbackUsers.findIndex(u => u.id === origId || u._id === origId);
        if (uIdx !== -1) fallbackUsers.splice(uIdx, 1);
        if (isSupabaseConfigured && supabase) {
          try { await supabase.from('users').delete().eq('id', origId); } catch (e) {}
        }
      } else if (item.entityType === 'campaign') {
        const cIdx = fallbackCampaigns.findIndex(c => c.id === origId || c._id === origId);
        if (cIdx !== -1) fallbackCampaigns.splice(cIdx, 1);
        persistS3CampaignStore();
        if (isSupabaseConfigured && supabase) {
          try { await supabase.from('campaigns').delete().eq('id', origId); } catch (e) {}
        }
      } else if (item.entityType === 'relief') {
        const rIdx = fallbackReliefDrives.findIndex(r => r.id === origId || r._id === origId);
        if (rIdx !== -1) fallbackReliefDrives.splice(rIdx, 1);
        persistS3ReliefStore();
      }
    }

    return true;
  },

  async emptyAllTrash() {
    // Erase all trashed items from underlying stores as well
    for (const item of fallbackTrash) {
      const origId = item?.entityId;
      if (!origId) continue;
      if (item.entityType === 'member' || item.entityType === 'applicant') {
        const uIdx = fallbackUsers.findIndex(u => u.id === origId || u._id === origId);
        if (uIdx !== -1) fallbackUsers.splice(uIdx, 1);
        if (isSupabaseConfigured && supabase) {
          try { await supabase.from('users').delete().eq('id', origId); } catch (e) {}
        }
      } else if (item.entityType === 'campaign') {
        const cIdx = fallbackCampaigns.findIndex(c => c.id === origId || c._id === origId);
        if (cIdx !== -1) fallbackCampaigns.splice(cIdx, 1);
        if (isSupabaseConfigured && supabase) {
          try { await supabase.from('campaigns').delete().eq('id', origId); } catch (e) {}
        }
      } else if (item.entityType === 'relief') {
        const rIdx = fallbackReliefDrives.findIndex(r => r.id === origId || r._id === origId);
        if (rIdx !== -1) fallbackReliefDrives.splice(rIdx, 1);
      }
    }
    fallbackTrash.length = 0;
    persistS3TrashStore();
    persistS3CampaignStore();
    persistS3ReliefStore();

    if (isSupabaseConfigured && supabase) {
      try { await supabase.from('trash').delete().neq('id', 'all_clear'); } catch (e) {}
    }
    return true;
  }
};
