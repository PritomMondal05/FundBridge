import { partnershipModel } from '../models/partnershipModel.js';
import {
  createAndDispatchNotification,
  ensureFounderWallet,
  persistS3WalletStore,
  syncFounderWalletAccountToSupabase
} from '../utils/storeUtils.js';
import { getIO } from '../config/socket.js';

export const partnershipController = {
  // Get all partnerships (admin or overview)
  async getAllPartnerships(req, res) {
    try {
      const list = partnershipModel.getAll();
      res.status(200).json(list);
    } catch (err) {
      console.error('Error fetching partnerships:', err);
      res.status(500).json({ error: 'Failed to fetch partnerships.' });
    }
  },

  // Get partnerships for founder
  async getFounderPartnerships(req, res) {
    try {
      const { founderId } = req.params;
      const list = partnershipModel.getByFounder(founderId);
      res.status(200).json(list);
    } catch (err) {
      console.error('Error fetching founder partnerships:', err);
      res.status(500).json({ error: 'Failed to fetch founder partnerships.' });
    }
  },

  // Get partnerships for investor
  async getInvestorPartnerships(req, res) {
    try {
      const { investorId } = req.params;
      const list = partnershipModel.getByInvestor(investorId);
      res.status(200).json(list);
    } catch (err) {
      console.error('Error fetching investor partnerships:', err);
      res.status(500).json({ error: 'Failed to fetch investor partnerships.' });
    }
  },

  // Get single partnership by ID
  async getPartnershipById(req, res) {
    try {
      const { id } = req.params;
      const partnership = partnershipModel.getById(id);
      if (!partnership) {
        return res.status(404).json({ error: 'Partnership not found.' });
      }
      res.status(200).json(partnership);
    } catch (err) {
      console.error('Error fetching partnership:', err);
      res.status(500).json({ error: 'Failed to fetch partnership.' });
    }
  },

  // Step 2: Founder submits a funding request for a tranche/milestone
  async requestMilestoneFunding(req, res) {
    try {
      const { id, mId } = req.params;
      const {
        requested_amount,
        purpose,
        explanation,
        fund_usage,
        expected_outcome,
        timeline,
        supporting_documents,
        doc_name,
        doc_url,
        vendor_name,
        mandatory_checks
      } = req.body;

      const result = partnershipModel.requestMilestoneFunding(id, mId, {
        requested_amount,
        purpose,
        explanation,
        fund_usage,
        expected_outcome,
        timeline,
        supporting_documents,
        doc_name,
        doc_url,
        vendor_name,
        mandatory_checks
      });

      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      // Notify investor
      const part = result.partnership;
      if (part.investor_id) {
        await createAndDispatchNotification(
          part.investor_id,
          'Milestone Tranche Request Submitted 📑',
          `${part.founder_name || 'Founder'} submitted an investment release request for ${result.milestone.title}: ৳ ${Number(result.milestone.amount).toLocaleString()}. Review required.`,
          'info'
        );
      }

      // Realtime emit
      try {
        const io = getIO();
        if (io) {
          io.emit('milestone_requested', {
            partnershipId: id,
            milestoneId: mId,
            milestone: result.milestone
          });
        }
      } catch (ioErr) {
        console.warn('Socket emit warning:', ioErr.message);
      }

      res.status(200).json({
        message: 'Milestone tranche release requested successfully.',
        partnership: result.partnership,
        milestone: result.milestone
      });
    } catch (err) {
      console.error('Error requesting milestone funding:', err);
      res.status(500).json({ error: 'Failed to request milestone funding.' });
    }
  },

  // Step 4: Investor releases funding for a tranche/milestone
  async releaseMilestoneFunding(req, res) {
    try {
      const { id, mId } = req.params;
      const {
        approved_amount,
        reference_id,
        payment_method,
        mandatory_checks
      } = req.body;

      const result = partnershipModel.releaseMilestoneFunding(id, mId, {
        approved_amount,
        reference_id,
        payment_method,
        mandatory_checks
      });

      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      const part = result.partnership;
      const ms = result.milestone;
      const amt = Number(ms.release_details?.approved_amount || ms.amount || 0);

      // Record wallet credit to founder ledger
      try {
        const fid = String(part.founder_id || 'usr_founder_1');
        const w = ensureFounderWallet(fid);
        const ref = ms.release_details?.reference_id || `TRX-MFS-${Date.now().toString().slice(-6)}`;
        w.ledger.unshift({
          id: `wal_tranche_${Date.now()}`,
          type: 'TRANCHE_RELEASE_IN',
          direction: 'in',
          amount: amt,
          investor_id: String(part.investor_id || ''),
          investor_name: String(part.investor_name || 'Investor Partner'),
          campaign_id: String(part.campaign_id || ''),
          campaign_title: String(part.campaign_title || 'Roadmap Milestone'),
          partnership_id: id,
          milestone_id: mId,
          reference_id: ref,
          note: `Tranche Release for ${ms.title} (${ms.name || ms.purpose}). Ref: ${ref}`,
          created_at: new Date().toISOString()
        });
        w.balance = Number(w.balance || 0) + amt;
        persistS3WalletStore();
        syncFounderWalletAccountToSupabase(fid);
      } catch (walErr) {
        console.warn('Wallet ledger credit warning:', walErr.message);
      }

      // Notify founder
      if (part.founder_id) {
        await createAndDispatchNotification(
          part.founder_id,
          'Tranche Released! 🚀',
          `Investor ${part.investor_name || ''} approved and released ৳ ${amt.toLocaleString()} for ${ms.title}. Ref: ${ms.release_details?.reference_id}.`,
          'success'
        );
      }

      // Realtime emit
      try {
        const io = getIO();
        if (io) {
          io.emit('milestone_funded', {
            partnershipId: id,
            milestoneId: mId,
            milestone: ms,
            releaseDetails: ms.release_details
          });
        }
      } catch (ioErr) {
        console.warn('Socket emit warning:', ioErr.message);
      }

      res.status(200).json({
        message: 'Milestone tranche released and funded successfully.',
        partnership: result.partnership,
        milestone: ms
      });
    } catch (err) {
      console.error('Error releasing milestone funding:', err);
      res.status(500).json({ error: 'Failed to release milestone funding.' });
    }
  },

  // Step 6: Founder submits milestone completion report
  async submitMilestoneCompletion(req, res) {
    try {
      const { id, mId } = req.params;
      const {
        completed_objectives,
        amount_spent,
        remaining_amount,
        progress_description,
        media_urls
      } = req.body;

      const result = partnershipModel.submitMilestoneCompletion(id, mId, {
        completed_objectives,
        amount_spent,
        remaining_amount,
        progress_description,
        media_urls
      });

      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      const part = result.partnership;
      const ms = result.milestone;

      // Notify investor to verify completion
      if (part.investor_id) {
        await createAndDispatchNotification(
          part.investor_id,
          'Milestone Completion Report Submitted 🎯',
          `${part.founder_name || 'Founder'} submitted the completion report for ${ms.title}. Verification required to unlock the next milestone.`,
          'info'
        );
      }

      // Realtime emit
      try {
        const io = getIO();
        if (io) {
          io.emit('milestone_completion_submitted', {
            partnershipId: id,
            milestoneId: mId,
            milestone: ms
          });
        }
      } catch (ioErr) {
        console.warn('Socket emit warning:', ioErr.message);
      }

      res.status(200).json({
        message: 'Milestone completion report submitted for investor review.',
        partnership: result.partnership,
        milestone: ms
      });
    } catch (err) {
      console.error('Error submitting milestone completion:', err);
      res.status(500).json({ error: 'Failed to submit milestone completion report.' });
    }
  },

  // Step 7: Investor verifies milestone completion & unlocks next tranche
  async verifyMilestoneCompletion(req, res) {
    try {
      const { id, mId } = req.params;
      const { investor_notes } = req.body;

      const result = partnershipModel.verifyMilestoneCompletion(id, mId, { investor_notes });

      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      const part = result.partnership;
      const ms = result.milestone;
      const nextMs = result.next_milestone;

      // Notify founder that completion was approved and next phase is unlocked!
      if (part.founder_id) {
        await createAndDispatchNotification(
          part.founder_id,
          'Milestone Verified & Next Phase Unlocked! 🏆',
          `Investor ${part.investor_name || ''} verified completion of ${ms.title}. ${nextMs ? `${nextMs.title} is now UNLOCKED for funding requests!` : 'All roadmap milestones are fully completed!'}`,
          'success'
        );
      }

      // Realtime emit
      try {
        const io = getIO();
        if (io) {
          io.emit('milestone_verified', {
            partnershipId: id,
            milestoneId: mId,
            milestone: ms,
            nextMilestone: nextMs
          });
        }
      } catch (ioErr) {
        console.warn('Socket emit warning:', ioErr.message);
      }

      res.status(200).json({
        message: 'Milestone completion verified successfully. Next milestone unlocked.',
        partnership: result.partnership,
        milestone: ms,
        next_milestone: nextMs
      });
    } catch (err) {
      console.error('Error verifying milestone completion:', err);
      res.status(500).json({ error: 'Failed to verify milestone completion.' });
    }
  },

  // Flag milestone for dispute
  async flagMilestoneDispute(req, res) {
    try {
      const { id, mId } = req.params;
      const { reason, initiator_role, initiator_id } = req.body;

      const result = partnershipModel.flagMilestoneDispute(id, mId, {
        reason,
        initiator_role,
        initiator_id
      });

      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      const part = result.partnership;
      const ms = result.milestone;

      // Notify counterpart
      const targetUserId = initiator_role === 'investor' ? part.founder_id : part.investor_id;
      if (targetUserId) {
        await createAndDispatchNotification(
          targetUserId,
          'Milestone Dispute Flagged ⚠️',
          `A dispute has been raised regarding ${ms.title}: "${reason || 'Needs review'}". Milestone funding is paused pending arbitration.`,
          'warning'
        );
      }

      // Realtime emit
      try {
        const io = getIO();
        if (io) {
          io.emit('milestone_disputed', {
            partnershipId: id,
            milestoneId: mId,
            milestone: ms,
            reason
          });
        }
      } catch (ioErr) {
        console.warn('Socket emit warning:', ioErr.message);
      }

      res.status(200).json({
        message: 'Milestone flagged for dispute.',
        partnership: result.partnership,
        milestone: ms
      });
    } catch (err) {
      console.error('Error flagging milestone dispute:', err);
      res.status(500).json({ error: 'Failed to flag milestone dispute.' });
    }
  }
};
