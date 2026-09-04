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
        reportedRole,
        complainantName,
        complainantId,
        complainantRole,
        campaignTitle,
        campaignId,
        category,
        issueType,
        reason,
        description,
        evidenceLink,
        severity
      } = req.body;

      const reportedName = String(reportedUser || '').trim();
      const issue = String(issueType || category || '').trim() || 'Policy violation';
      const details = String(description || reason || '').trim();
      const reporterId = String(complainantId || '').trim();
      const targetId = String(reportedUserId || '').trim();

      if (!reportedName || !details) {
        return res.status(400).json({ error: 'Reported user and reason for complaint are required.' });
      }
      if (reporterId && targetId && reporterId === targetId) {
        return res.status(400).json({ error: 'You cannot report your own profile.' });
      }

      const disputeData = {
        id: 'disp_' + Date.now(),
        reported_user: reportedName,
        reportedUser: reportedName,
        reported_user_id: targetId,
        reported_role: reportedRole || '',
        reportedRole: reportedRole || '',
        complainant_name: complainantName || 'Anonymous Backer',
        complainantName: complainantName || 'Anonymous Backer',
        complainant: complainantName || 'Anonymous Backer',
        complainant_id: reporterId,
        complainantId: reporterId,
        complainant_role: complainantRole || '',
        complainantRole: complainantRole || '',
        campaign_title: campaignTitle || 'User profile report',
        campaignTitle: campaignTitle || 'User profile report',
        campaign_id: campaignId || '',
        category: issue,
        issue_type: issue,
        issueType: issue,
        reason: details,
        description: details,
        evidence_link: evidenceLink || '',
        evidenceLink: evidenceLink || '',
        severity: severity || 'High',
        status: 'Open',
        created_at: new Date().toISOString()
      };

      const created = await disputeModel.create(disputeData);

      if (targetId) {
        await createAndDispatchNotification(
          targetId,
          'Notice: Report Filed Against Account',
          `A ${issue} report was submitted regarding your FundBridge profile. Platform administration is reviewing.`,
          'DISPUTE_OPENED'
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
      try {
        const { partnershipModel } = await import('../models/partnershipModel.js');
        if (resolved.partnership_id) partnershipModel.clearFreeze(resolved.partnership_id, resolutionNote || 'Dispute resolved');
      } catch (e) {}
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
