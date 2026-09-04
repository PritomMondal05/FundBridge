import { cofounderModel } from '../models/cofounderModel.js';
import { campaignModel } from '../models/campaignModel.js';
import { reliefModel } from '../models/reliefModel.js';
import { userModel } from '../models/userModel.js';
import {
  createAndDispatchNotification,
  addWorkingDaysBD,
  assertSuccessorIsFounder
} from '../utils/storeUtils.js';

export const cofounderController = {
  // Applications
  async createApplication(req, res) {
    try {
      const { id } = req.params;
      const targetType = req.path.includes('relief-drives') ? 'relief' : 'investment';
      const { applicantId, reason } = req.body;

      if (!applicantId || !reason) {
        return res.status(400).json({ error: 'Applicant ID and reason are required.' });
      }

      const applicant = await userModel.findById(applicantId);
      if (!applicant) return res.status(404).json({ error: 'Applicant founder not found.' });

      const target = targetType === 'relief'
        ? await reliefModel.getById(id)
        : await campaignModel.getById(id);

      if (!target) return res.status(404).json({ error: 'Target venture not found.' });

      const ownerId = target.founder_id || target.founderId;
      if (String(ownerId) === String(applicantId)) {
        return res.status(400).json({ error: 'You are already the owner of this venture.' });
      }

      const existingApps = cofounderModel.getApplicationsByApplicant(applicantId);
      if (existingApps.some(a => a.target_id === id && a.status === 'pending')) {
        return res.status(400).json({ error: 'You already have a pending application for this venture.' });
      }

      const appData = {
        id: 'cfa_' + Date.now(),
        target_id: id,
        target_type: targetType,
        target_title: target.title,
        target_owner_id: ownerId,
        applicant_id: applicantId,
        applicant_name: applicant.name,
        applicant_email: applicant.email,
        applicant_university: applicant.university,
        applicant_department: applicant.department,
        reason,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const created = cofounderModel.createApplication(appData);

      await createAndDispatchNotification(
        ownerId,
        'New Co-Founder Application! 👥',
        `${applicant.name} applied to join ${target.title} as a co-founder.`,
        'info'
      );

      res.status(201).json({ message: 'Co-founder application submitted.', application: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting application.' });
    }
  },

  getApplicationsByOwner(req, res) {
    try {
      const { founderId } = req.params;
      const apps = cofounderModel.getApplicationsByOwner(founderId);
      res.status(200).json(apps);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching applications.' });
    }
  },

  getApplicationsByApplicant(req, res) {
    try {
      const { founderId } = req.params;
      const apps = cofounderModel.getApplicationsByApplicant(founderId);
      res.status(200).json(apps);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching applications.' });
    }
  },

  getApplicationsByTarget(req, res) {
    try {
      const { type, id } = req.params;
      const apps = cofounderModel.getApplicationsByTarget(type, id);
      res.status(200).json(apps);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching applications.' });
    }
  },

  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, founderId } = req.body;

      const result = cofounderModel.updateApplicationStatus(id, status, founderId);
      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      await createAndDispatchNotification(
        result.application.applicant_id,
        status === 'accepted' ? 'Co-Founder Application Accepted! 🎉' : 'Co-Founder Application Update',
        `Your application to join ${result.application.target_title} was ${status}.`,
        status === 'accepted' ? 'success' : 'info'
      );

      res.status(200).json({ message: `Application ${status}.`, application: result.application });
    } catch (err) {
      res.status(500).json({ error: 'Error updating application status.' });
    }
  },

  removeCoFounder(req, res) {
    try {
      const { id, userId } = req.params;
      const targetType = req.path.includes('relief-drives') ? 'relief' : 'campaign';
      const { requestingFounderId } = req.body;

      const result = cofounderModel.removeCoFounder(targetType, id, userId, requestingFounderId);
      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      res.status(200).json({ message: 'Co-founder removed.', coFounders: result.coFounders });
    } catch (err) {
      res.status(500).json({ error: 'Error removing co-founder.' });
    }
  },

  // Edit Requests
  getEditRequestsByFounder(req, res) {
    try {
      const { founderId } = req.params;
      const requests = cofounderModel.getEditRequestsByFounder(founderId);
      res.status(200).json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching edit requests.' });
    }
  },

  getPendingEditRequests(req, res) {
    try {
      const requests = cofounderModel.getPendingEditRequests();
      res.status(200).json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching pending edit requests.' });
    }
  },

  async createCampaignEditRequest(req, res) {
    try {
      const { id } = req.params;
      const { founderId, reason, proposedChanges } = req.body;

      if (!reason) return res.status(400).json({ error: 'Reason for edit is required.' });
      const campaign = await campaignModel.getById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

      const reqData = {
        id: 'er_' + Date.now(),
        target_id: id,
        target_type: 'campaign',
        target_title: campaign.title,
        requester_founder_id: founderId,
        reason,
        proposed_changes: proposedChanges || {},
        status: 'pending',
        review_deadline: addWorkingDaysBD(new Date(), 2),
        created_at: new Date().toISOString()
      };

      const created = cofounderModel.createEditRequest(reqData);
      res.status(201).json({ message: 'Edit request submitted.', editRequest: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting edit request.' });
    }
  },

  async createReliefEditRequest(req, res) {
    try {
      const { id } = req.params;
      const { founderId, reason, proposedChanges } = req.body;

      if (!reason) return res.status(400).json({ error: 'Reason for edit is required.' });
      const drive = await reliefModel.getById(id);
      if (!drive) return res.status(404).json({ error: 'Relief drive not found.' });

      const reqData = {
        id: 'er_' + Date.now(),
        target_id: id,
        target_type: 'relief',
        target_title: drive.title,
        requester_founder_id: founderId,
        reason,
        proposed_changes: proposedChanges || {},
        status: 'pending',
        review_deadline: addWorkingDaysBD(new Date(), 2),
        created_at: new Date().toISOString()
      };

      const created = cofounderModel.createEditRequest(reqData);
      res.status(201).json({ message: 'Edit request submitted.', editRequest: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting edit request.' });
    }
  },

  updateEditRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reviewNote } = req.body;

      const updated = cofounderModel.updateEditRequestStatus(id, status, reviewNote);
      if (!updated) return res.status(404).json({ error: 'Edit request not found.' });

      res.status(200).json({ message: `Edit request ${status}.`, editRequest: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating edit request.' });
    }
  },

  // Handover Requests
  async createCampaignHandoverRequest(req, res) {
    try {
      const { id } = req.params;
      const { founderId, successorName, successorEmail, reason } = req.body;

      const chk = assertSuccessorIsFounder(successorName, successorEmail, founderId);
      if (!chk.ok) return res.status(400).json({ error: chk.error });

      const campaign = await campaignModel.getById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

      const reqData = {
        id: 'ho_' + Date.now(),
        target_id: id,
        target_type: 'campaign',
        target_title: campaign.title,
        current_founder_id: founderId,
        successor_id: chk.successor.id || chk.successor._id,
        successor_name: chk.successor.name,
        successor_email: chk.successor.email,
        reason: reason || 'Transfer of project leadership',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const created = cofounderModel.createHandoverRequest(reqData);
      res.status(201).json({ message: 'Handover request submitted.', handoverRequest: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting handover request.' });
    }
  },

  async createReliefHandoverRequest(req, res) {
    try {
      const { id } = req.params;
      const { founderId, successorName, successorEmail, reason } = req.body;

      const chk = assertSuccessorIsFounder(successorName, successorEmail, founderId);
      if (!chk.ok) return res.status(400).json({ error: chk.error });

      const drive = await reliefModel.getById(id);
      if (!drive) return res.status(404).json({ error: 'Relief drive not found.' });

      const reqData = {
        id: 'ho_' + Date.now(),
        target_id: id,
        target_type: 'relief',
        target_title: drive.title,
        current_founder_id: founderId,
        successor_id: chk.successor.id || chk.successor._id,
        successor_name: chk.successor.name,
        successor_email: chk.successor.email,
        reason: reason || 'Transfer of relief leadership',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const created = cofounderModel.createHandoverRequest(reqData);
      res.status(201).json({ message: 'Handover request submitted.', handoverRequest: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting handover request.' });
    }
  },

  getHandoverRequestsByFounder(req, res) {
    try {
      const { founderId } = req.params;
      const requests = cofounderModel.getHandoverRequestsByFounder(founderId);
      res.status(200).json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching handover requests.' });
    }
  },

  getPendingHandoverRequests(req, res) {
    try {
      const requests = cofounderModel.getPendingHandoverRequests();
      res.status(200).json(requests);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching pending handover requests.' });
    }
  },

  updateHandoverRequestStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reviewNote } = req.body;

      const updated = cofounderModel.updateHandoverRequestStatus(id, status, reviewNote);
      if (!updated) return res.status(404).json({ error: 'Handover request not found.' });

      res.status(200).json({ message: `Handover request ${status}.`, handoverRequest: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating handover request.' });
    }
  }
};
