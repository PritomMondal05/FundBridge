import { userModel } from '../models/userModel.js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackWatchlist,
  fallbackConnections,
  fallbackBookmarkedFounders,
  createAndDispatchNotification
} from '../utils/storeUtils.js';

export const investorController = {
  async getDirectory(req, res) {
    try {
      const investors = await userModel.getInvestors();
      res.status(200).json(investors);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching investor directory.' });
    }
  },

  async getProfile(req, res) {
    try {
      const { investorId } = req.params;
      const user = await userModel.findById(investorId);
      if (!user) return res.status(404).json({ error: 'Investor not found.' });
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching investor profile.' });
    }
  },

  async getWatchlist(req, res) {
    try {
      const { userId } = req.query;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('investor_watchlist').select('*').eq('investor_id', userId);
        if (!error && data) return res.status(200).json(data);
      }
      const list = fallbackWatchlist.filter(w => w.investor_id === userId);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching watchlist.' });
    }
  },

  async toggleWatchlist(req, res) {
    try {
      const { investorId, campaignId } = req.body;
      if (!investorId || !campaignId) return res.status(400).json({ error: 'Investor ID and Campaign ID required.' });

      const existingIdx = fallbackWatchlist.findIndex(w => w.investor_id === investorId && w.campaign_id === campaignId);
      let status = 'added';

      if (existingIdx >= 0) {
        fallbackWatchlist.splice(existingIdx, 1);
        status = 'removed';
        if (isSupabaseConfigured && supabase) {
          try { await supabase.from('investor_watchlist').delete().eq('investor_id', investorId).eq('campaign_id', campaignId); } catch(e){}
        }
      } else {
        const item = { id: 'wl_' + Date.now(), investor_id: investorId, campaign_id: campaignId, created_at: new Date().toISOString() };
        fallbackWatchlist.push(item);
        if (isSupabaseConfigured && supabase) {
          try { await supabase.from('investor_watchlist').insert([item]); } catch(e){}
        }
      }

      res.status(200).json({ status, campaignId });
    } catch (err) {
      res.status(500).json({ error: 'Error updating watchlist.' });
    }
  },

  async getConnections(req, res) {
    try {
      const { userId } = req.query;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('investor_connections').select('*').or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
        if (!error && data) return res.status(200).json(data);
      }
      const list = fallbackConnections.filter(c => c.requester_id === userId || c.receiver_id === userId);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching connections.' });
    }
  },

  async sendConnectionRequest(req, res) {
    try {
      const { requesterId, receiverId } = req.body;
      if (!requesterId || !receiverId) return res.status(400).json({ error: 'Requester ID and Receiver ID required.' });

      const existing = fallbackConnections.find(c =>
        (c.requester_id === requesterId && c.receiver_id === receiverId) ||
        (c.requester_id === receiverId && c.receiver_id === requesterId)
      );

      if (existing) {
        return res.status(200).json({ message: 'Connection request already exists.', connection: existing });
      }

      const conn = {
        id: 'conn_' + Date.now(),
        requester_id: requesterId,
        receiver_id: receiverId,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabase) {
        try { await supabase.from('investor_connections').insert([conn]); } catch(e){}
      }
      fallbackConnections.push(conn);

      await createAndDispatchNotification(
        receiverId,
        'New Co-Investor Connection Request! 🤝',
        'An alumni angel investor wants to connect with your investment network.',
        'info'
      );

      res.status(201).json({ message: 'Connection request sent.', connection: conn });
    } catch (err) {
      res.status(500).json({ error: 'Error sending connection request.' });
    }
  },

  async getBookmarkedFounders(req, res) {
    try {
      const { userId } = req.query;
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from('bookmarked_founders').select('*').eq('investor_id', userId);
        if (!error && data) return res.status(200).json(data);
      }
      const list = fallbackBookmarkedFounders.filter(b => b.investor_id === userId);
      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching bookmarked founders.' });
    }
  },

  async toggleBookmarkFounder(req, res) {
    try {
      const { investorId, founderId } = req.body;
      if (!investorId || !founderId) return res.status(400).json({ error: 'Investor ID and Founder ID required.' });

      const existingIdx = fallbackBookmarkedFounders.findIndex(b => b.investor_id === investorId && b.founder_id === founderId);
      let status = 'bookmarked';

      if (existingIdx >= 0) {
        fallbackBookmarkedFounders.splice(existingIdx, 1);
        status = 'unbookmarked';
        if (isSupabaseConfigured && supabase) {
          try { await supabase.from('bookmarked_founders').delete().eq('investor_id', investorId).eq('founder_id', founderId); } catch(e){}
        }
      } else {
        const item = { id: 'bf_' + Date.now(), investor_id: investorId, founder_id: founderId, created_at: new Date().toISOString() };
        fallbackBookmarkedFounders.push(item);
        if (isSupabaseConfigured && supabase) {
          try { await supabase.from('bookmarked_founders').insert([item]); } catch(e){}
        }
      }

      res.status(200).json({ status, founderId });
    } catch (err) {
      res.status(500).json({ error: 'Error toggling bookmarked founder.' });
    }
  }
};
