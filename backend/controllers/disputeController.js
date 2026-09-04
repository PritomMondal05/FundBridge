import { disputeModel } from '../models/disputeModel.js';
import { createAndDispatchNotification } from '../utils/storeUtils.js';

export const disputeController = {
  async getDisputes(req, res) {
    try {
      const disputes = await disputeModel.getAll();
      res.status(200).json(disputes);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching disputes.' });
    }
  },

  async createDispute(req, res) {
    try {
      const {
        reportedUser,
        reportedUserId,
        complainantName,
        complainantId,
        campaignTitle,
        campaignId,
        category,
        reason,
        evidenceLink
      } = req.body;

      if (!reportedUser || !reason) {
        return res.status(400).json({ error: 'Reported user and reason for complaint are required.' });
      }

      const disputeData = {
        id: 'disp_' + Date.now(),
        reported_user: reportedUser,
        reportedUser,
        reported_user_id: reportedUserId || '',
        complainant_name: complainantName || 'Anonymous Backer',
        complainantName: complainantName || 'Anonymous Backer',
        complainant_id: complainantId || '',
        campaign_title: campaignTitle || 'General Venture',
        campaignTitle: campaignTitle || 'General Venture',
        campaign_id: campaignId || '',
        category: category || 'Breach of Agreement',
        reason,
        evidence_link: evidenceLink || '',
        evidenceLink: evidenceLink || '',
        status: 'Under Review',
        created_at: new Date().toISOString()
      };

      const created = await disputeModel.create(disputeData);

      if (reportedUserId) {
        await createAndDispatchNotification(
          reportedUserId,
          'Notice: Dispute Filed Against Account',
          `A dispute inquiry (${category || 'Breach of Agreement'}) has been submitted regarding your activity. Platform administration is reviewing.`,
          'warning'
        );
      }

      res.status(201).json({ message: 'Dispute submitted for admin review.', dispute: created });
    } catch (err) {
      res.status(500).json({ error: 'Error filing dispute.' });
    }
  },

  async dismissDispute(req, res) {
    try {
      const { id } = req.params;
      const { resolutionNote } = req.body;
      const dismissed = await disputeModel.dismiss(id, resolutionNote);
      if (!dismissed) return res.status(404).json({ error: 'Dispute not found.' });
      res.status(200).json({ message: 'Dispute dismissed.', dispute: dismissed });
    } catch (err) {
      res.status(500).json({ error: 'Error dismissing dispute.' });
    }
  },

  async resolveDispute(req, res) {
    try {
      const { id } = req.params;
      const { resolutionNote } = req.body;
      const resolved = await disputeModel.resolve(id, resolutionNote);
      if (!resolved) return res.status(404).json({ error: 'Dispute not found.' });
      res.status(200).json({ message: 'Dispute resolved.', dispute: resolved });
    } catch (err) {
      res.status(500).json({ error: 'Error resolving dispute.' });
    }
  },

  async blockUserDispute(req, res) {
    try {
      const { id } = req.params;
      const { resolutionNote } = req.body;
      const result = await disputeModel.blockReportedUser(id, resolutionNote);
      if (!result) return res.status(404).json({ error: 'Dispute not found.' });
      res.status(200).json({ message: 'Reported user blocked and dispute updated.', dispute: result });
    } catch (err) {
      res.status(500).json({ error: 'Error blocking user from dispute.' });
    }
  }
};
