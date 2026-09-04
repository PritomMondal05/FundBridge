import { walletModel } from '../models/walletModel.js';
import { createAndDispatchNotification } from '../utils/storeUtils.js';

export const walletController = {
  async getFounderWallet(req, res) {
    try {
      const { founderId } = req.params;
      const wallet = await walletModel.getFounderWallet(founderId);
      res.status(200).json(wallet);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching founder wallet.' });
    }
  },

  async getFounderDeposits(req, res) {
    try {
      const { founderId } = req.params;
      const deposits = walletModel.getFounderDeposits(founderId);
      res.status(200).json(deposits);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching founder deposits.' });
    }
  },

  async requestFounderDeposit(req, res) {
    try {
      const { founderId } = req.params;
      const { amount, method, reference, note, proofUrl, proofFilename } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Please enter a valid deposit amount.' });
      }

      const depositData = {
        id: 'dep_' + Date.now(),
        founder_id: founderId,
        owner_id: founderId,
        owner_role: 'founder',
        amount: Number(amount),
        method: method || 'bKash',
        reference: reference || '',
        note: note || '',
        proof_url: proofUrl || '',
        proof_filename: proofFilename || '',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const created = await walletModel.createDeposit(depositData);

      await createAndDispatchNotification(
        founderId,
        'Deposit Request Submitted 💳',
        `Your manual wallet top-up request for ৳ ${Number(amount).toLocaleString()} has been queued for verification.`,
        'info'
      );

      res.status(201).json({ message: 'Deposit request submitted.', deposit: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting deposit request.' });
    }
  },

  async getInvestorWallet(req, res) {
    try {
      const { investorId } = req.params;
      const wallet = await walletModel.getInvestorWallet(investorId);
      res.status(200).json(wallet);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching investor wallet.' });
    }
  },

  async getInvestorDeposits(req, res) {
    try {
      const { investorId } = req.params;
      const deposits = walletModel.getInvestorDeposits(investorId);
      res.status(200).json(deposits);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching investor deposits.' });
    }
  },

  async requestInvestorDeposit(req, res) {
    try {
      const { investorId } = req.params;
      const { amount, method, reference, note, proofUrl, proofFilename } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Please enter a valid deposit amount.' });
      }

      const depositData = {
        id: 'dep_' + Date.now(),
        investor_id: investorId,
        owner_id: investorId,
        owner_role: 'investor',
        amount: Number(amount),
        method: method || 'bKash',
        reference: reference || '',
        note: note || '',
        proof_url: proofUrl || '',
        proof_filename: proofFilename || '',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const created = await walletModel.createDeposit(depositData);

      await createAndDispatchNotification(
        investorId,
        'Deposit Request Submitted 💳',
        `Your manual wallet top-up request for ৳ ${Number(amount).toLocaleString()} has been queued for verification.`,
        'info'
      );

      res.status(201).json({ message: 'Deposit request submitted.', deposit: created });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting deposit request.' });
    }
  },

  async getFounderSecurityDeposit(req, res) {
    try {
      const { founderId } = req.params;
      const deposit = walletModel.getSecurityDeposit(founderId);
      res.status(200).json(deposit);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching security deposit.' });
    }
  },

  async submitFounderSecurityDeposit(req, res) {
    try {
      const { founderId } = req.params;
      const { amount } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid deposit amount required.' });
      }

      const debitRes = walletModel.setSecurityDeposit(founderId, amount);
      res.status(200).json({ message: 'Security deposit recorded.', deposit: debitRes });
    } catch (err) {
      res.status(500).json({ error: 'Error processing security deposit.' });
    }
  },

  async fundCampaignFromWallet(req, res) {
    try {
      const { founderId, campaignId } = req.params;
      const { amount } = req.body;

      const result = await walletModel.fundCampaignFromWallet(founderId, campaignId, amount);
      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      res.status(200).json({ message: 'Funds successfully allocated.', campaign: result.campaign, wallet: result.wallet });
    } catch (err) {
      res.status(500).json({ error: 'Error funding campaign from wallet.' });
    }
  },

  async getFounderPayouts(req, res) {
    try {
      const { founderId } = req.params;
      const payouts = await walletModel.getPayoutsByFounder(founderId);
      res.status(200).json(payouts);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching payouts.' });
    }
  },

  async requestPayout(req, res) {
    try {
      const { founderId, amount, mfsNumber, method, reason } = req.body;
      if (!founderId || !amount) {
        return res.status(400).json({ error: 'Founder ID and Amount are required.' });
      }

      const payoutData = {
        id: 'pay_' + Date.now(),
        founder_id: founderId,
        founderId,
        amount: Number(amount),
        mfs_number: mfsNumber || '',
        method: method || 'bKash',
        reason: reason || 'Milestone release',
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const created = await walletModel.createPayoutRequest(payoutData);
      res.status(201).json({ message: 'Payout requested.', payout: created });
    } catch (err) {
      res.status(500).json({ error: 'Error requesting payout.' });
    }
  }
};
