import { userModel } from '../models/userModel.js';
import { campaignModel } from '../models/campaignModel.js';
import { walletModel } from '../models/walletModel.js';
import { trashModel } from '../models/trashModel.js';
import { reliefModel } from '../models/reliefModel.js';
import {
  fallbackUsers,
  fallbackCampaigns,
  fallbackProposals,
  fallbackDisputes,
  fallbackReliefDrives,
  createAndDispatchNotification
} from '../utils/storeUtils.js';

export const adminController = {
  async getStats(req, res) {
    try {
      const allUsers = fallbackUsers;
      const verifiedFounders = allUsers.filter(u => u.role === 'founder' && (u.vettingStatus === 'verified' || u.vetting_status === 'verified')).length;
      const verifiedInvestors = allUsers.filter(u => u.role === 'investor' && (u.vettingStatus === 'verified' || u.vetting_status === 'verified')).length;
      const pendingApplicants = allUsers.filter(u => (u.vettingStatus === 'pending' || u.vetting_status === 'pending')).length;

      const allCampaigns = await campaignModel.getAll();
      const liveCampaigns = allCampaigns.filter(c => c.verified === true && c.status !== 'archived').length;
      const pendingCampaigns = allCampaigns.filter(c => c.status === 'pending' || c.verified === false).length;

      const totalRaised = allCampaigns.reduce((sum, c) => sum + (Number(c.raised) || 0), 0);
      const totalVolume = totalRaised + 450000;

      res.status(200).json({
        totalMembers: allUsers.length,
        verifiedFounders,
        verifiedInvestors,
        pendingApplicants,
        liveCampaigns,
        pendingCampaigns,
        totalVolume,
        disputesCount: fallbackDisputes.filter(d => d.status !== 'Resolved' && d.status !== 'Dismissed').length
      });
    } catch (err) {
      res.status(500).json({ error: 'Error calculating admin stats.' });
    }
  },

  async getVettingApplicants(req, res) {
    try {
      const applicants = await userModel.getVettingApplicants();
      res.status(200).json(applicants);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching applicants.' });
    }
  },

  async updateVettingStatus(req, res) {
    try {
      const { userId, status } = req.body;
      if (!userId || !status) return res.status(400).json({ error: 'User ID and status are required.' });

      const updated = await userModel.updateVettingStatus(userId, status);
      if (!updated) return res.status(404).json({ error: 'User not found.' });

      await createAndDispatchNotification(
        userId,
        status === 'verified' ? 'Identity Vetting Approved! ✅' : 'Identity Vetting Update',
        status === 'verified'
          ? 'Your identity documents have been verified by platform administration.'
          : `Your identity vetting status was updated to: ${status}.`,
        status === 'verified' ? 'success' : 'info'
      );

      res.status(200).json({ message: `Vetting status updated to ${status}.`, user: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating vetting status.' });
    }
  },

  async rejectAllVetting(req, res) {
    try {
      const pending = fallbackUsers.filter(u => (u.vettingStatus === 'pending' || u.vetting_status === 'pending'));
      for (const u of pending) {
        await userModel.updateVettingStatus(u.id || u._id, 'rejected');
      }
      res.status(200).json({ message: `Rejected ${pending.length} pending applicants.` });
    } catch (err) {
      res.status(500).json({ error: 'Error rejecting vetting applicants.' });
    }
  },

  async holdUser(req, res) {
    try {
      const { userId } = req.params;
      const updated = await userModel.updateVettingStatus(userId, 'hold');
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json({ message: 'User placed on hold.', user: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error placing user on hold.' });
    }
  },

  async blockUser(req, res) {
    try {
      const { userId } = req.params;
      const updated = await userModel.updateVettingStatus(userId, 'blocked');
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json({ message: 'User blocked.', user: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error blocking user.' });
    }
  },

  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const updated = await userModel.update(userId, updates);
      if (!updated) return res.status(404).json({ error: 'User not found.' });
      res.status(200).json({ message: 'User updated.', user: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating user.' });
    }
  },

  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const { reason } = req.body || {};
      const user = await userModel.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      await trashModel.addToTrash({
        entityType: 'member',
        entityId: userId,
        title: user.name || user.email,
        data: user,
        reason: reason || 'Deleted by administrator'
      });

      await userModel.delete(userId);
      res.status(200).json({ message: 'User moved to trash.' });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting user.' });
    }
  },

  async getFounders(req, res) {
    try {
      const founders = await userModel.getFounders();
      res.status(200).json(founders);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching founders.' });
    }
  },

  async getInvestors(req, res) {
    try {
      const investors = await userModel.getInvestors();
      res.status(200).json(investors);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching investors.' });
    }
  },

  // Trash
  getTrash(req, res) {
    try {
      const items = trashModel.getAll();
      res.status(200).json(items);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching trash.' });
    }
  },

  async restoreTrash(req, res) {
    try {
      const { id } = req.params;
      const restored = await trashModel.restoreFromTrash(id);
      if (!restored) return res.status(404).json({ error: 'Item not found in trash.' });
      res.status(200).json({ message: 'Item restored.', item: restored });
    } catch (err) {
      res.status(500).json({ error: 'Error restoring item.' });
    }
  },

  async purgeTrash(req, res) {
    try {
      const { id } = req.params;
      const ok = await trashModel.purgeFromTrash(id);
      if (!ok) return res.status(404).json({ error: 'Item not found in trash.' });
      res.status(200).json({ message: 'Item permanently deleted.' });
    } catch (err) {
      res.status(500).json({ error: 'Error purging item.' });
    }
  },

  async emptyTrash(req, res) {
    try {
      await trashModel.emptyAllTrash();
      res.status(200).json({ message: 'Trash emptied.' });
    } catch (err) {
      res.status(500).json({ error: 'Error emptying trash.' });
    }
  },

  // Campaigns
  async getPendingCampaigns(req, res) {
    try {
      const all = await campaignModel.getAll();
      const pending = all.filter(c => c && (!c.verified || c.status === 'pending' || c.status === 'revisions' || c.status === 'revision_required' || c.status === 'rejected'));
      res.status(200).json(pending);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching pending campaigns.' });
    }
  },

  async verifyCampaign(req, res) {
    try {
      const { id } = req.params;
      const updated = await campaignModel.update(id, { verified: true, status: 'verified' });
      if (!updated) return res.status(404).json({ error: 'Campaign not found.' });

      if (updated.founderId) {
        await createAndDispatchNotification(
          updated.founderId,
          'Venture Verified! 🚀',
          `"${updated.title}" has been verified and published to the live marketplace.`,
          'success'
        );
      }

      res.status(200).json({ message: 'Campaign verified.', campaign: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error verifying campaign.' });
    }
  },

  async rejectCampaign(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const updated = await campaignModel.update(id, { verified: false, status: 'rejected', rejection_reason: reason });
      if (!updated) return res.status(404).json({ error: 'Campaign not found.' });

      if (updated.founderId) {
        await createAndDispatchNotification(
          updated.founderId,
          'Campaign Audit Update',
          `"${updated.title}" review note: ${reason || 'Needs revision before approval.'}`,
          'warning'
        );
      }

      res.status(200).json({ message: 'Campaign rejected.', campaign: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error rejecting campaign.' });
    }
  },

  async rejectAllCampaigns(req, res) {
    try {
      const all = await campaignModel.getAll();
      const pending = all.filter(c => c.status === 'pending' || c.verified === false);
      for (const c of pending) {
        await campaignModel.update(c.id, { verified: false, status: 'rejected' });
      }
      res.status(200).json({ message: `Rejected ${pending.length} pending campaigns.` });
    } catch (err) {
      res.status(500).json({ error: 'Error rejecting campaigns.' });
    }
  },

  async reuploadCampaign(req, res) {
    try {
      const { id } = req.params;
      const updated = await campaignModel.update(id, { status: 'pending', verified: false });
      if (!updated) return res.status(404).json({ error: 'Campaign not found.' });
      res.status(200).json({ message: 'Campaign queued for re-verification.', campaign: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error queuing reupload.' });
    }
  },

  async pauseFunding(req, res) {
    try {
      const { id } = req.params;
      const updated = await campaignModel.update(id, { status: 'paused' });
      if (!updated) return res.status(404).json({ error: 'Campaign not found.' });
      res.status(200).json({ message: 'Campaign funding paused.', campaign: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error pausing funding.' });
    }
  },

  async blockCampaign(req, res) {
    try {
      const { id } = req.params;
      const updated = await campaignModel.update(id, { status: 'blocked', verified: false });
      if (!updated) return res.status(404).json({ error: 'Campaign not found.' });
      res.status(200).json({ message: 'Campaign blocked.', campaign: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error blocking campaign.' });
    }
  },

  async freezeFunds(req, res) {
    try {
      const { id } = req.params;
      const camp = await campaignModel.getById(id);
      if (!camp) return res.status(404).json({ error: 'Campaign not found.' });
      const nextState = !camp.escrowFrozen;
      const updated = await campaignModel.update(id, { escrowFrozen: nextState, escrow_frozen: nextState });
      res.status(200).json({ message: `Escrow frozen: ${nextState}`, campaign: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error toggling escrow freeze.' });
    }
  },

  async deleteCampaignToTrash(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body || {};
      const camp = await campaignModel.getById(id);
      if (!camp) return res.status(404).json({ error: 'Campaign not found.' });

      await trashModel.addToTrash({
        entityType: 'campaign',
        entityId: id,
        title: camp.title,
        data: camp,
        reason: reason || 'Deleted by administrator'
      });

      await campaignModel.delete(id);
      res.status(200).json({ message: 'Campaign moved to trash.' });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting campaign.' });
    }
  },

  // Escrow & Milestones
  async getPendingEscrow(req, res) {
    try {
      const all = await campaignModel.getAll();
      const list = [];
      all.forEach(c => {
        if (Array.isArray(c.milestones)) {
          c.milestones.forEach((m, idx) => {
            if (m.status === 'pending' || m.status === 'pending_approval' || (Array.isArray(m.proofs) && m.proofs.length > 0 && m.status !== 'done')) {
              list.push({
                campaignId: c.id,
                campaignTitle: c.title,
                founderName: c.founder?.name || 'Student Founder',
                milestoneIndex: idx,
                milestone: m,
                goal: c.goal,
                raised: c.raised
              });
            }
          });
        }
      });

      fallbackReliefDrives.forEach(d => {
        if (Array.isArray(d.milestones)) {
          d.milestones.forEach((m, idx) => {
            if (m.status === 'pending' || m.status === 'pending_approval' || (Array.isArray(m.proofs) && m.proofs.length > 0 && m.status !== 'done')) {
              list.push({
                campaignId: d.id,
                campaignTitle: d.title,
                founderName: d.founder_name || 'Founder',
                milestoneIndex: idx,
                milestone: m,
                goal: d.goal,
                raised: d.raised,
                isRelief: true
              });
            }
          });
        }
      });

      res.status(200).json(list);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching escrow queue.' });
    }
  },

  async approveEscrowMilestone(req, res) {
    try {
      const { campaignId, milestoneId } = req.params;
      const mIdx = Number(milestoneId);

      // Check investment campaigns
      const camp = await campaignModel.getById(campaignId);
      if (camp && Array.isArray(camp.milestones) && mIdx >= 0 && mIdx < camp.milestones.length) {
        camp.milestones[mIdx].status = 'done';
        await campaignModel.update(campaignId, { milestones: camp.milestones });

        if (camp.founderId) {
          await createAndDispatchNotification(
            camp.founderId,
            'Milestone Escrow Released! 💸',
            `Milestone "${camp.milestones[mIdx].title}" was approved by administrator. Funds unlocked for release.`,
            'success'
          );
        }

        return res.status(200).json({ message: 'Milestone approved and tranche unlocked.', milestone: camp.milestones[mIdx] });
      }

      // Check relief drives
      const drive = await reliefModel.getById(campaignId);
      if (drive && Array.isArray(drive.milestones) && mIdx >= 0 && mIdx < drive.milestones.length) {
        drive.milestones[mIdx].status = 'done';
        await reliefModel.update(campaignId, { milestones: drive.milestones });
        return res.status(200).json({ message: 'Relief milestone approved.', milestone: drive.milestones[mIdx] });
      }

      res.status(404).json({ error: 'Campaign or milestone not found.' });
    } catch (err) {
      res.status(500).json({ error: 'Error approving milestone escrow.' });
    }
  },

  // Updates
  async getPendingUpdates(req, res) {
    try {
      const updates = await campaignModel.getUpdates('');
      const pending = updates.filter(u => u.status === 'pending');
      res.status(200).json(pending);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching updates.' });
    }
  },

  async updateCampaignUpdateStatus(req, res) {
    try {
      const { updateId } = req.params;
      const { status, reviewNote } = req.body;
      const updated = await campaignModel.updateUpdateStatus(updateId, status, reviewNote);
      if (!updated) return res.status(404).json({ error: 'Update not found.' });
      res.status(200).json({ message: `Update status set to ${status}.`, update: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating campaign update status.' });
    }
  },

  async rejectCampaignUpdate(req, res) {
    try {
      const { updateId } = req.params;
      const { reviewNote } = req.body;
      const updated = await campaignModel.updateUpdateStatus(updateId, 'rejected', reviewNote);
      if (!updated) return res.status(404).json({ error: 'Update not found.' });
      res.status(200).json({ message: 'Update rejected.', update: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error rejecting update.' });
    }
  },

  // Wallet deposits
  getPendingDeposits(req, res) {
    try {
      const deposits = walletModel.getPendingDeposits();
      res.status(200).json(deposits);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching pending deposits.' });
    }
  },

  async updateDepositStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reviewNote } = req.body;
      const deposit = await walletModel.updateDepositStatus(id, status, reviewNote);
      if (!deposit) return res.status(404).json({ error: 'Deposit request not found.' });

      const targetUserId = deposit.investor_id || deposit.founder_id || deposit.owner_id;
      if (targetUserId) {
        await createAndDispatchNotification(
          targetUserId,
          status === 'approved' ? 'Wallet Deposit Approved! 💳' : 'Wallet Deposit Update',
          status === 'approved'
            ? `Your manual deposit of ৳ ${Number(deposit.amount).toLocaleString()} has been credited to your balance.`
            : `Your manual deposit was ${status}${reviewNote ? ': ' + reviewNote : ''}.`,
          status === 'approved' ? 'success' : 'warning'
        );
      }

      res.status(200).json({ message: `Deposit request ${status}.`, deposit });
    } catch (err) {
      res.status(500).json({ error: 'Error updating deposit status.' });
    }
  }
};
