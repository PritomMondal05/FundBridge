import { proposalModel } from '../models/proposalModel.js';
import { campaignModel } from '../models/campaignModel.js';
import {
  createAndDispatchNotification,
  creditFounderWalletInvestment
} from '../utils/storeUtils.js';

export const proposalController = {
  async createProposal(req, res) {
    try {
      const { id } = req.params; // campaignId
      const { investorId, investorName, amount, terms, customNotes, founderId } = req.body;

      if (!investorId || !amount) {
        return res.status(400).json({ error: 'Investor ID and Investment Amount are required.' });
      }

      const campaign = await campaignModel.getById(id);
      const fid = founderId || (campaign ? (campaign.founder_id || campaign.founderId || campaign.founder?.id) : '');

      const newId = 'prop_' + Date.now();
      const proposalData = {
        id: newId,
        _id: newId,
        campaign_id: id,
        campaignId: id,
        campaign_title: campaign?.title || id,
        investor_id: investorId,
        investorId,
        investor_name: investorName || 'Angel Backer',
        founder_id: fid,
        amount: Number(amount),
        terms: terms || 'Standard Terms',
        custom_notes: customNotes || '',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const created = await proposalModel.create(proposalData);

      if (fid) {
        await createAndDispatchNotification(
          fid,
          'New Investment Proposal! 💰',
          `${investorName || 'An investor'} submitted an investment proposal of ৳ ${Number(amount).toLocaleString()} for ${campaign?.title || 'your startup'}.`,
          'info'
        );
      }

      res.status(201).json({ message: 'Proposal submitted.', proposal: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting proposal.' });
    }
  },

  async getCampaignProposals(req, res) {
    try {
      const { campaignId } = req.params;
      const proposals = await proposalModel.getByCampaign(campaignId);
      res.status(200).json(proposals);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching campaign proposals.' });
    }
  },

  async getInvestorProposals(req, res) {
    try {
      const { investorId } = req.params;
      const proposals = await proposalModel.getByInvestor(investorId);
      res.status(200).json(proposals);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching investor proposals.' });
    }
  },

  async getFounderProposals(req, res) {
    try {
      const { founderId } = req.params;
      const proposals = await proposalModel.getByFounder(founderId);
      res.status(200).json(proposals);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching founder proposals.' });
    }
  },

  async updateProposalStatus(req, res) {
    try {
      const { proposalId } = req.params;
      const { status, founderId } = req.body;

      if (!status) return res.status(400).json({ error: 'Status is required.' });

      const existing = await proposalModel.getById(proposalId);
      if (!existing) return res.status(404).json({ error: 'Proposal not found.' });

      const updated = await proposalModel.updateStatus(proposalId, status);

      // If accepted, credit founder wallet and add to campaign raised
      if (status === 'accepted') {
        const amt = Number(existing.counter_amount != null && Number(existing.counter_amount) > 0 ? existing.counter_amount : existing.amount) || 0;
        const fid = founderId || existing.founder_id || existing.founderId;
        const cid = existing.campaign_id || existing.campaignId;

        creditFounderWalletInvestment({
          founderId: fid,
          amount: amt,
          investorId: existing.investor_id || existing.investorId,
          investorName: existing.investor_name,
          campaignId: cid,
          campaignTitle: existing.campaign_title || cid,
          proposalId: existing.id || existing._id
        });

        const camp = await campaignModel.getById(cid);
        if (camp) {
          await campaignModel.update(cid, { raised: (Number(camp.raised) || 0) + amt });
        }

        if (existing.investor_id) {
          await createAndDispatchNotification(
            existing.investor_id,
            'Proposal Accepted! 🎉',
            `Your proposal for ${existing.campaign_title || 'the startup'} has been accepted!`,
            'success'
          );
        }
      } else if (status === 'declined' || status === 'rejected') {
        if (existing.investor_id) {
          await createAndDispatchNotification(
            existing.investor_id,
            'Proposal Update',
            `Your proposal for ${existing.campaign_title || 'the startup'} was not accepted.`,
            'info'
          );
        }
      }

      res.status(200).json({ message: `Proposal status updated to ${status}.`, proposal: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating proposal status.' });
    }
  },

  async negotiateProposal(req, res) {
    try {
      const { proposalId } = req.params;
      const { counterAmount, counterTerms, message, founderId } = req.body;

      const existing = await proposalModel.getById(proposalId);
      if (!existing) return res.status(404).json({ error: 'Proposal not found.' });

      const updated = await proposalModel.updateStatus(proposalId, 'negotiating', {
        counter_amount: counterAmount != null ? Number(counterAmount) : null,
        counter_terms: counterTerms || '',
        negotiate_message: message || '',
        negotiated_at: new Date().toISOString()
      });

      if (existing.investor_id) {
        await createAndDispatchNotification(
          existing.investor_id,
          'Counter-Offer Received! 🤝',
          `The founder has made a counter-proposal on ${existing.campaign_title || 'your investment'}.`,
          'info'
        );
      }

      res.status(200).json({ message: 'Counter-offer dispatched.', proposal: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error negotiating proposal.' });
    }
  },

  async withdrawProposal(req, res) {
    try {
      const proposalId = req.params.proposalId || req.params.id;
      const existing = await proposalModel.getById(proposalId);
      if (!existing) return res.status(404).json({ error: 'Proposal not found.' });

      const updated = await proposalModel.updateStatus(proposalId, 'withdrawn');
      res.status(200).json({ message: 'Proposal withdrawn.', proposal: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error withdrawing proposal.' });
    }
  },

  async deleteProposal(req, res) {
    try {
      const { id } = req.params;
      const deleted = await proposalModel.delete(id);
      if (!deleted) return res.status(404).json({ error: 'Proposal not found.' });
      res.status(200).json({ message: 'Proposal deleted.' });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting proposal.' });
    }
  }
};
