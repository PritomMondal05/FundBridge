import { partnershipModel } from '../models/partnershipModel.js';
import { disputeModel } from '../models/disputeModel.js';
import {
  createAndDispatchNotification,
  persistS3WalletStore,
  writeFounderAuditLog,
  writeInvestorAuditLog,
  ensureFounderWallet
} from '../utils/storeUtils.js';
import { getIO } from '../config/socket.js';
import { participantRole } from '../lib/milestoneState.js';

function actorFrom(req) {
  return String(req.body?.actorId || req.body?.userId || req.query?.actorId || req.query?.userId || '').trim();
}

function deny(res, status, error) {
  return res.status(status).json({ error });
}

function loadAuthorized(req, res, expectedRole) {
  const { id } = req.params;
  const actorId = actorFrom(req);
  if (!actorId) {
    deny(res, 400, 'actorId is required.');
    return null;
  }
  const partnership = partnershipModel.getById(id);
  if (!partnership) {
    deny(res, 404, 'Partnership not found.');
    return null;
  }
  if (!partnershipModel.assertParticipant(partnership, actorId, expectedRole || null)) {
    deny(res, 403, 'You are not a participant in this transaction.');
    return null;
  }
  return { partnership, actorId, role: partnershipModel.getRole(partnership, actorId) || participantRole(partnership, actorId) || expectedRole };
}

function emit(event, payload) {
  try {
    const io = getIO();
    if (!io) return;
    io.emit(event, payload);
    if (payload.founderId) io.to(payload.founderId).emit(event, payload);
    if (payload.investorId) io.to(payload.investorId).emit(event, payload);
  } catch (ioErr) {
    console.warn('Socket emit warning:', ioErr.message);
  }
}

async function auditBoth(part, title, status = 'RECORDED') {
  await writeFounderAuditLog({ founderId: part.founder_id, category: 'MILESTONE', title, status });
  await writeInvestorAuditLog({ investorId: part.investor_id, category: 'MILESTONE', title, status });
}

export const partnershipController = {
  async getAllPartnerships(req, res) {
    return res.status(403).json({ error: 'Listing all transactions is not permitted.' });
  },

  async getFounderPartnerships(req, res) {
    try {
      const { founderId } = req.params;
      const actorId = actorFrom(req);
      if (!actorId || actorId !== String(founderId)) {
        return deny(res, 403, 'You can only list your own transactions.');
      }
      res.status(200).json(partnershipModel.getByFounder(founderId));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch founder partnerships.' });
    }
  },

  async getInvestorPartnerships(req, res) {
    try {
      const { investorId } = req.params;
      const actorId = actorFrom(req);
      if (!actorId || actorId !== String(investorId)) {
        return deny(res, 403, 'You can only list your own transactions.');
      }
      res.status(200).json(partnershipModel.getByInvestor(investorId));
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch investor partnerships.' });
    }
  },

  async getPartnershipById(req, res) {
    try {
      const ctx = loadAuthorized(req, res, null);
      if (!ctx) return;
      res.status(200).json(ctx.partnership);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch partnership.' });
    }
  },

  async requestMilestoneFunding(req, res) {
    try {
      const ctx = loadAuthorized(req, res, 'founder');
      if (!ctx) return;
      const { id, mId } = req.params;
      const result = partnershipModel.requestMilestoneFunding(id, mId, { ...req.body, actorId: ctx.actorId });
      if (!result.ok) return deny(res, result.status || 400, result.error);

      const part = result.partnership;
      if (part.investor_id) {
        await createAndDispatchNotification(
          part.investor_id,
          'Funding request submitted',
          `${part.founder_name || 'Founder'} requested ৳ ${Number(result.milestone.request_details?.requested_amount || 0).toLocaleString()} for ${result.milestone.name || result.milestone.title}.`,
          'info'
        );
      }
      await auditBoth(part, `Funding requested: ${result.milestone.name || result.milestone.title}`);
      emit('milestone_requested', { partnershipId: id, milestoneId: mId, founderId: part.founder_id, investorId: part.investor_id, partnership: part, updatedAt: part.updated_at });
      res.status(200).json({ message: 'Funding request submitted.', partnership: part, milestone: result.milestone });
    } catch (err) {
      res.status(500).json({ error: 'Failed to request milestone funding.' });
    }
  },

  async rejectMilestoneFunding(req, res) {
    try {
      const ctx = loadAuthorized(req, res, 'investor');
      if (!ctx) return;
      const { id, mId } = req.params;
      const reason = String(req.body?.reason || '').trim();
      if (!reason) return deny(res, 400, 'A rejection reason is required.');
      const result = partnershipModel.rejectMilestoneFunding(id, mId, { reason, actorId: ctx.actorId });
      if (!result.ok) return deny(res, result.status || 400, result.error);
      const part = result.partnership;
      if (part.founder_id) {
        await createAndDispatchNotification(part.founder_id, 'Funding request rejected', `Investor rejected the request for ${result.milestone.name}: ${reason}`, 'warning');
      }
      await auditBoth(part, `Funding rejected: ${result.milestone.name}`);
      emit('milestone_funding_rejected', { partnershipId: id, milestoneId: mId, founderId: part.founder_id, investorId: part.investor_id, partnership: part, updatedAt: part.updated_at });
      res.status(200).json({ message: 'Funding request rejected.', partnership: part, milestone: result.milestone });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reject funding request.' });
    }
  },

  async releaseMilestoneFunding(req, res) {
    try {
      const ctx = loadAuthorized(req, res, 'investor');
      if (!ctx) return;
      const { id, mId } = req.params;
      const result = partnershipModel.releaseMilestoneFunding(id, mId, { ...req.body, actorId: ctx.actorId });
      if (!result.ok) return deny(res, result.status || 400, result.error);

      const part = result.partnership;
      const ms = result.milestone;
      const amt = Number(ms.release_details?.approved_amount || 0);

      if (!result.alreadyProcessed) {
        try {
          const w = ensureFounderWallet(String(part.founder_id || ''));
          w.ledger.unshift({
            id: `wal_tranche_${ms.release_details?.reference_id || Date.now()}`,
            type: 'TRANCHE_RELEASE_RECORDED',
            direction: 'note',
            amount: amt,
            investor_id: String(part.investor_id || ''),
            campaign_id: String(part.campaign_id || ''),
            partnership_id: id,
            milestone_id: mId,
            reference_id: ms.release_details?.reference_id,
            note: `Escrow tranche allocated for ${ms.name || ms.title}. Principal was funded at proposal acceptance; this records the milestone release.`,
            created_at: new Date().toISOString()
          });
          persistS3WalletStore();
        } catch (walErr) {
          console.warn('Wallet ledger note warning:', walErr.message);
        }

        if (part.founder_id) {
          await createAndDispatchNotification(
            part.founder_id,
            'Funds released',
            `Investor released ৳ ${amt.toLocaleString()} for ${ms.name || ms.title}. Ref: ${ms.release_details?.reference_id}.`,
            'success'
          );
        }
        await auditBoth(part, `Funds released ৳ ${amt.toLocaleString()} (${ms.release_details?.reference_id})`);
      }

      emit('milestone_funded', { partnershipId: id, milestoneId: mId, founderId: part.founder_id, investorId: part.investor_id, partnership: part, updatedAt: part.updated_at });
      res.status(200).json({
        message: result.alreadyProcessed ? 'Already processed' : 'Milestone tranche released.',
        alreadyProcessed: Boolean(result.alreadyProcessed),
        partnership: part,
        milestone: ms
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to release milestone funding.' });
    }
  },

  async updateMilestoneProgress(req, res) {
    try {
      const ctx = loadAuthorized(req, res, 'founder');
      if (!ctx) return;
      const { id, mId } = req.params;
      const result = partnershipModel.updateMilestoneProgress(id, mId, { ...req.body, actorId: ctx.actorId });
      if (!result.ok) return deny(res, result.status || 400, result.error);
      emit('milestone_progress', { partnershipId: id, milestoneId: mId, founderId: result.partnership.founder_id, investorId: result.partnership.investor_id, partnership: result.partnership, updatedAt: result.partnership.updated_at });
      res.status(200).json({ message: 'Progress updated.', partnership: result.partnership, milestone: result.milestone });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update progress.' });
    }
  },

  async submitMilestoneCompletion(req, res) {
    try {
      const ctx = loadAuthorized(req, res, 'founder');
      if (!ctx) return;
      const { id, mId } = req.params;
      const result = partnershipModel.submitMilestoneCompletion(id, mId, { ...req.body, actorId: ctx.actorId });
      if (!result.ok) return deny(res, result.status || 400, result.error);
      const part = result.partnership;
      if (part.investor_id) {
        await createAndDispatchNotification(
          part.investor_id,
          'Milestone proof submitted',
          `${part.founder_name || 'Founder'} submitted proof for ${result.milestone.name || result.milestone.title}.`,
          'info'
        );
      }
      await auditBoth(part, `Proof submitted: ${result.milestone.name || result.milestone.title}`);
      emit('milestone_completion_submitted', { partnershipId: id, milestoneId: mId, founderId: part.founder_id, investorId: part.investor_id, partnership: part, updatedAt: part.updated_at });
      res.status(200).json({ message: 'Proof submitted for investor review.', partnership: part, milestone: result.milestone });
    } catch (err) {
      res.status(500).json({ error: 'Failed to submit milestone completion report.' });
    }
  },

  async requestMilestoneRevision(req, res) {
    try {
      const ctx = loadAuthorized(req, res, 'investor');
      if (!ctx) return;
      const { id, mId } = req.params;
      const result = partnershipModel.requestMilestoneRevision(id, mId, { reason: req.body?.reason, actorId: ctx.actorId });
      if (!result.ok) return deny(res, result.status || 400, result.error);
      const part = result.partnership;
      if (part.founder_id) {
        await createAndDispatchNotification(part.founder_id, 'Revision requested', `Investor requested revision: ${req.body?.reason}`, 'warning');
      }
      await auditBoth(part, `Revision requested: ${result.milestone.name}`);
      emit('milestone_revision_requested', { partnershipId: id, milestoneId: mId, founderId: part.founder_id, investorId: part.investor_id, partnership: part, updatedAt: part.updated_at });
      res.status(200).json({ message: 'Revision requested.', partnership: part, milestone: result.milestone });
    } catch (err) {
      res.status(500).json({ error: 'Failed to request revision.' });
    }
  },

  async verifyMilestoneCompletion(req, res) {
    try {
      const ctx = loadAuthorized(req, res, 'investor');
      if (!ctx) return;
      const { id, mId } = req.params;
      const result = partnershipModel.verifyMilestoneCompletion(id, mId, { actorId: ctx.actorId, investor_notes: req.body?.investor_notes });
      if (!result.ok) return deny(res, result.status || 400, result.error);
      const part = result.partnership;
      const nextMs = result.next_milestone;
      if (part.founder_id && !result.alreadyProcessed) {
        await createAndDispatchNotification(
          part.founder_id,
          nextMs ? 'Milestone approved — next phase unlocked' : 'Investment transaction completed',
          nextMs
            ? `Investor approved ${result.milestone.name}. ${nextMs.name} is now active.`
            : 'All required milestones have been completed.',
          'success'
        );
      }
      if (!result.alreadyProcessed) await auditBoth(part, `Milestone approved: ${result.milestone.name}`);
      emit('milestone_verified', { partnershipId: id, milestoneId: mId, founderId: part.founder_id, investorId: part.investor_id, partnership: part, nextMilestone: nextMs, updatedAt: part.updated_at });
      res.status(200).json({
        message: result.alreadyProcessed ? 'Already processed' : 'Milestone verified.',
        alreadyProcessed: Boolean(result.alreadyProcessed),
        partnership: part,
        milestone: result.milestone,
        next_milestone: nextMs
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify milestone completion.' });
    }
  },

  async flagMilestoneDispute(req, res) {
    try {
      const ctx = loadAuthorized(req, res, null);
      if (!ctx) return;
      const { id, mId } = req.params;
      const reason = String(req.body?.reason || '').trim();
      if (!reason) return deny(res, 400, 'A dispute reason is required.');

      const dispute = await disputeModel.create({
        id: 'disp_' + Date.now(),
        reported_user: ctx.role === 'investor' ? ctx.partnership.founder_name : ctx.partnership.investor_name,
        reported_user_id: ctx.role === 'investor' ? ctx.partnership.founder_id : ctx.partnership.investor_id,
        complainant_name: ctx.role === 'investor' ? ctx.partnership.investor_name : ctx.partnership.founder_name,
        complainant_id: ctx.actorId,
        campaign_title: ctx.partnership.campaign_title,
        campaign_id: ctx.partnership.campaign_id,
        category: 'Milestone / escrow dispute',
        reason,
        partnership_id: id,
        milestone_id: mId,
        status: 'Under Review',
        created_at: new Date().toISOString()
      });

      const result = partnershipModel.flagMilestoneDispute(id, mId, {
        reason,
        initiator_role: ctx.role,
        initiator_id: ctx.actorId,
        dispute_id: dispute.id
      });
      if (!result.ok) return deny(res, result.status || 400, result.error);
      const part = result.partnership;
      const target = ctx.role === 'investor' ? part.founder_id : part.investor_id;
      if (target) {
        await createAndDispatchNotification(target, 'Dispute opened', `A dispute was opened on ${result.milestone.name}: ${reason}`, 'warning');
      }
      await auditBoth(part, `Dispute opened on ${result.milestone.name}`);
      emit('milestone_disputed', { partnershipId: id, milestoneId: mId, founderId: part.founder_id, investorId: part.investor_id, partnership: part, updatedAt: part.updated_at });
      res.status(200).json({ message: 'Dispute filed. Transaction frozen.', partnership: part, milestone: result.milestone, dispute });
    } catch (err) {
      res.status(500).json({ error: 'Failed to flag milestone dispute.' });
    }
  }
};
