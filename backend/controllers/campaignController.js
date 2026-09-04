import { campaignModel } from '../models/campaignModel.js';
import { userModel } from '../models/userModel.js';
import { resolveCoFoundersFromBody, syncSuccessorFromCoFounders, createAndDispatchNotification } from '../utils/storeUtils.js';

export const campaignController = {
  async getAllCampaigns(req, res) {
    try {
      const campaigns = await campaignModel.getAll();
      res.status(200).json(campaigns);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching campaigns.' });
    }
  },

  async getWatchableCampaigns(req, res) {
    try {
      const campaigns = await campaignModel.getWatchable();
      res.status(200).json(campaigns);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching watchable campaigns.' });
    }
  },

  async getFounderCampaigns(req, res) {
    try {
      const { founderId } = req.params;
      const campaigns = await campaignModel.getByFounder(founderId);
      res.status(200).json(campaigns);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching founder campaigns.' });
    }
  },

  async getCampaignById(req, res) {
    try {
      const { id } = req.params;
      const campaign = await campaignModel.getById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
      res.status(200).json(campaign);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching campaign.' });
    }
  },

  async createCampaign(req, res) {
    try {
      const {
        title,
        founderId,
        university,
        location,
        category,
        stage,
        goal,
        equityOffer,
        description,
        milestones,
        tagline,
        coverPhoto,
        pitchVideoUrl
      } = req.body;

      if (!title || !founderId || !goal) {
        return res.status(400).json({ error: 'Title, founder ID, and funding goal are required.' });
      }

      const cfCheck = resolveCoFoundersFromBody(req.body, founderId, null);
      if (!cfCheck.ok) {
        return res.status(400).json({ error: cfCheck.error });
      }

      const newId = 'camp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const newCampaign = {
        id: newId,
        _id: newId,
        title,
        founder_id: founderId,
        founderId,
        university: university || 'Bangladeshi University',
        location: location || 'Dhaka, Bangladesh',
        category: category || 'General Tech',
        stage: stage || 'Early Stage',
        goal: Number(goal),
        raised: 0,
        equityOffer: equityOffer || '8% Revenue Share',
        equity_offer: equityOffer || '8% Revenue Share',
        description: description || '',
        milestones: Array.isArray(milestones) ? milestones : [],
        tagline: tagline || '',
        coverPhoto: coverPhoto || '',
        pitchVideoUrl: pitchVideoUrl || '',
        verified: false,
        status: 'pending',
        escrowFrozen: false,
        escrow_frozen: false,
        created_at: new Date().toISOString()
      };

      syncSuccessorFromCoFounders(newCampaign, cfCheck.coFounders);
      const created = await campaignModel.create(newCampaign);

      await createAndDispatchNotification(
        founderId,
        'Venture Submitted for Review! 📝',
        `"${title}" has been successfully drafted and submitted to platform admin audit.`,
        'info'
      );

      res.status(201).json({ message: 'Campaign created successfully.', campaign: created });
    } catch (err) {
      console.error('Error creating campaign:', err);
      res.status(500).json({ error: 'Error creating campaign.' });
    }
  },

  async updateCampaign(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await campaignModel.update(id, updates);
      if (!updated) return res.status(404).json({ error: 'Campaign not found.' });
      res.status(200).json({ message: 'Campaign updated.', campaign: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating campaign.' });
    }
  },

  async deleteCampaign(req, res) {
    try {
      const { id } = req.params;
      const deleted = await campaignModel.delete(id);
      if (!deleted) return res.status(404).json({ error: 'Campaign not found.' });
      res.status(200).json({ message: 'Campaign deleted.' });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting campaign.' });
    }
  },

  async getCampaignUpdates(req, res) {
    try {
      const { id } = req.params;
      const updates = await campaignModel.getUpdates(id);
      res.status(200).json(updates);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching campaign updates.' });
    }
  },

  async createCampaignUpdate(req, res) {
    try {
      const { id } = req.params;
      const { title, message, category, founderId, founderName } = req.body;

      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required.' });
      }

      const updateObj = {
        id: 'upd_' + Date.now(),
        campaign_id: id,
        title,
        message,
        category: category || 'GENERAL',
        founder_id: founderId || '',
        founder_name: founderName || 'Founder',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const created = await campaignModel.createUpdate(updateObj);
      res.status(201).json({ message: 'Update submitted for admin approval.', update: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting update.' });
    }
  },

  async getProgressTags(req, res) {
    try {
      const { founderId } = req.params;
      const tags = campaignModel.getProgressTags(founderId);
      res.status(200).json(tags);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching progress tags.' });
    }
  },

  async addProgressTag(req, res) {
    try {
      const { id } = req.params;
      const { tag } = req.body;
      if (!tag) return res.status(400).json({ error: 'Tag is required.' });

      const tags = campaignModel.setProgressTag(id, tag);
      res.status(200).json({ message: 'Tag added.', tags });
    } catch (err) {
      res.status(500).json({ error: 'Error adding tag.' });
    }
  },

  async addMilestoneProof(req, res) {
    try {
      const { id, milestoneId } = req.params;
      const { fileUrl, fileName, notes, proofType, submittedBy } = req.body;

      const proofObj = {
        id: 'proof_' + Date.now(),
        file_url: fileUrl || '',
        file_name: fileName || 'Proof Document',
        notes: notes || '',
        proof_type: proofType || 'document',
        submitted_by: submittedBy || 'Founder',
        submitted_at: new Date().toISOString()
      };

      const updated = await campaignModel.addMilestoneProof(id, milestoneId, proofObj);
      if (!updated) return res.status(404).json({ error: 'Milestone or campaign not found.' });

      res.status(200).json({ message: 'Proof submitted for review.', milestone: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting milestone proof.' });
    }
  }
};
