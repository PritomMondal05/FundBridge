import {
  fallbackCoFounderApplications,
  fallbackEditRequests,
  fallbackHandoverRequests,
  fallbackCampaigns,
  fallbackReliefDrives,
  persistS3CoFounderAppStore,
  persistS3EditRequestStore,
  persistS3HandoverStore,
  persistS3CampaignStore,
  persistS3ReliefStore,
  getCoFounders,
  syncSuccessorFromCoFounders,
  toCoFounderEntry,
  findPlatformUserByEmail,
  MAX_COFOUNDERS
} from '../utils/storeUtils.js';

export const cofounderModel = {
  // Applications
  getApplicationsByOwner(founderId) {
    const fid = String(founderId || '');
    return fallbackCoFounderApplications.filter(a => String(a.target_owner_id) === fid);
  },

  getApplicationsByApplicant(founderId) {
    const fid = String(founderId || '');
    return fallbackCoFounderApplications.filter(a => String(a.applicant_id) === fid);
  },

  getApplicationsByTarget(targetType, targetId) {
    const tid = String(targetId || '');
    return fallbackCoFounderApplications.filter(a => a.target_type === targetType && String(a.target_id) === tid);
  },

  createApplication(appData) {
    fallbackCoFounderApplications.unshift(appData);
    persistS3CoFounderAppStore();
    return appData;
  },

  updateApplicationStatus(id, status, founderId) {
    const sid = String(id || '');
    const app = fallbackCoFounderApplications.find(a => a.id === sid);
    if (!app) return { ok: false, error: 'Application not found.' };

    if (String(app.target_owner_id) !== String(founderId)) {
      return { ok: false, error: 'Only the primary owner can review this application.' };
    }

    app.status = status;
    app.reviewed_at = new Date().toISOString();
    persistS3CoFounderAppStore();

    // If accepted, add applicant to coFounders list of the target entity
    if (status === 'accepted') {
      const target = app.target_type === 'relief'
        ? fallbackReliefDrives.find(d => String(d.id || d._id) === String(app.target_id))
        : fallbackCampaigns.find(c => String(c.id || c._id) === String(app.target_id));

      if (target) {
        const current = getCoFounders(target);
        if (current.length < MAX_COFOUNDERS && !current.some(c => String(c.id) === String(app.applicant_id))) {
          const entry = toCoFounderEntry({
            id: app.applicant_id,
            name: app.applicant_name,
            email: app.applicant_email,
            university: app.applicant_university,
            department: app.applicant_department
          });
          current.push(entry);
          syncSuccessorFromCoFounders(target, current);
          if (app.target_type === 'relief') persistS3ReliefStore();
          else persistS3CampaignStore();
        }
      }
    }

    return { ok: true, application: app };
  },

  removeCoFounder(targetType, targetId, userId, requestingFounderId) {
    const tid = String(targetId || '');
    const uid = String(userId || '');
    const target = targetType === 'relief'
      ? fallbackReliefDrives.find(d => String(d.id || d._id) === tid)
      : fallbackCampaigns.find(c => String(c.id || c._id) === tid);

    if (!target) return { ok: false, error: 'Target venture not found.' };
    const ownerId = String(target.founder_id || target.founderId || '');
    if (ownerId !== String(requestingFounderId)) {
      return { ok: false, error: 'Only the primary owner can remove a co-founder.' };
    }

    const current = getCoFounders(target);
    const updated = current.filter(c => String(c.id) !== uid);
    syncSuccessorFromCoFounders(target, updated);

    if (targetType === 'relief') persistS3ReliefStore();
    else persistS3CampaignStore();

    return { ok: true, coFounders: updated };
  },

  // Edit Requests
  getEditRequestsByFounder(founderId) {
    const fid = String(founderId || '');
    return fallbackEditRequests.filter(r => String(r.requester_founder_id) === fid);
  },

  getPendingEditRequests() {
    return fallbackEditRequests.filter(r => r.status === 'pending');
  },

  createEditRequest(reqData) {
    fallbackEditRequests.unshift(reqData);
    persistS3EditRequestStore();
    return reqData;
  },

  updateEditRequestStatus(id, status, reviewNote) {
    const sid = String(id || '');
    const req = fallbackEditRequests.find(r => r.id === sid);
    if (!req) return null;

    req.status = status;
    req.reviewed_at = new Date().toISOString();
    req.review_note = reviewNote || '';
    persistS3EditRequestStore();

    // If approved, apply changes to campaign/relief
    if (status === 'approved' && req.proposed_changes) {
      const target = req.target_type === 'relief'
        ? fallbackReliefDrives.find(d => String(d.id || d._id) === String(req.target_id))
        : fallbackCampaigns.find(c => String(c.id || c._id) === String(req.target_id));

      if (target) {
        Object.assign(target, req.proposed_changes);
        if (req.target_type === 'relief') persistS3ReliefStore();
        else persistS3CampaignStore();
      }
    }

    return req;
  },

  // Handover Requests
  getHandoverRequestsByFounder(founderId) {
    const fid = String(founderId || '');
    return fallbackHandoverRequests.filter(r => String(r.current_founder_id) === fid);
  },

  getPendingHandoverRequests() {
    return fallbackHandoverRequests.filter(r => r.status === 'pending');
  },

  createHandoverRequest(reqData) {
    fallbackHandoverRequests.unshift(reqData);
    persistS3HandoverStore();
    return reqData;
  },

  updateHandoverRequestStatus(id, status, reviewNote) {
    const sid = String(id || '');
    const req = fallbackHandoverRequests.find(r => r.id === sid);
    if (!req) return null;

    req.status = status;
    req.reviewed_at = new Date().toISOString();
    req.review_note = reviewNote || '';
    persistS3HandoverStore();

    // If approved, transfer ownership
    if (status === 'approved') {
      const target = req.target_type === 'relief'
        ? fallbackReliefDrives.find(d => String(d.id || d._id) === String(req.target_id))
        : fallbackCampaigns.find(c => String(c.id || c._id) === String(req.target_id));

      if (target) {
        target.founder_id = req.successor_id;
        target.founderId = req.successor_id;
        if (req.target_type === 'relief') persistS3ReliefStore();
        else persistS3CampaignStore();
      }
    }

    return req;
  }
};
