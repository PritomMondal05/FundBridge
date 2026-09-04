import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackWallets,
  fallbackInvestorWallets,
  fallbackWalletDeposits,
  fallbackSecurityDeposits,
  fallbackPayouts,
  fallbackCampaigns,
  ensureFounderWallet,
  ensureInvestorWallet,
  recomputeInvestorWalletBalance,
  creditFounderWalletManualDeposit,
  creditInvestorWalletManualDeposit,
  debitFounderWallet,
  debitFounderWalletForSecurityDeposit,
  syncFounderWalletFromAcceptedProposals,
  syncFounderWalletFromReliefDonations,
  syncInvestorWallet,
  syncWalletDepositToSupabase,
  persistS3WalletDepositStore,
  persistS3DepositStore,
  persistS3PayoutStore,
  persistS3CampaignStore,
  s3PendingPayoutTotal
} from '../utils/storeUtils.js';

export const walletModel = {
  async getFounderWallet(founderId) {
    const fid = String(founderId || '');
    await syncFounderWalletFromAcceptedProposals(fid);
    await syncFounderWalletFromReliefDonations(fid);
    return ensureFounderWallet(fid);
  },

  async getInvestorWallet(investorId) {
    const iid = String(investorId || '');
    return syncInvestorWallet(iid);
  },

  getFounderDeposits(founderId) {
    const fid = String(founderId || '');
    return fallbackWalletDeposits.filter(d => (d.founder_id === fid || d.owner_id === fid) && (d.owner_role === 'founder' || !d.owner_role));
  },

  getInvestorDeposits(investorId) {
    const iid = String(investorId || '');
    return fallbackWalletDeposits.filter(d => (d.investor_id === iid || d.owner_id === iid) && d.owner_role === 'investor');
  },

  getPendingDeposits() {
    return fallbackWalletDeposits.filter(d => d.status === 'pending');
  },

  async createDeposit(depositData) {
    fallbackWalletDeposits.unshift(depositData);
    persistS3WalletDepositStore();
    await syncWalletDepositToSupabase(depositData);
    return depositData;
  },

  async updateDepositStatus(id, status, reviewNote = '') {
    const sid = String(id || '');
    const deposit = fallbackWalletDeposits.find(d => d.id === sid);
    if (!deposit) return null;

    deposit.status = status;
    deposit.reviewed_at = new Date().toISOString();
    deposit.review_note = reviewNote || '';
    persistS3WalletDepositStore();
    await syncWalletDepositToSupabase(deposit);

    // If approved, credit target wallet
    if (status === 'approved') {
      if (deposit.owner_role === 'investor' || deposit.investor_id) {
        creditInvestorWalletManualDeposit({
          investorId: deposit.investor_id || deposit.owner_id,
          amount: deposit.amount,
          method: deposit.method,
          depositId: deposit.id,
          reference: deposit.reference
        });
      } else {
        creditFounderWalletManualDeposit({
          founderId: deposit.founder_id || deposit.owner_id,
          amount: deposit.amount,
          method: deposit.method,
          depositId: deposit.id,
          reference: deposit.reference
        });
      }
    }
    return deposit;
  },

  getSecurityDeposit(founderId) {
    const fid = String(founderId || '');
    return fallbackSecurityDeposits[fid] || { amount: 0, status: 'not_submitted', ledger: [] };
  },

  setSecurityDeposit(founderId, amount, bondTxId = null) {
    const fid = String(founderId || '');
    const amt = Number(amount);
    const existing = fallbackSecurityDeposits[fid] || { amount: 0, status: 'verified', ledger: [] };
    const row = {
      id: bondTxId || `sec_${Date.now()}`,
      amount: amt,
      source: 'PERSONAL_ADD_MONEY',
      created_at: new Date().toISOString(),
      note: 'Security deposit bond transferred from personal Add Money balance.'
    };
    existing.amount = Number(existing.amount || 0) + amt;
    existing.status = 'verified';
    if (!Array.isArray(existing.ledger)) existing.ledger = [];
    existing.ledger.unshift(row);
    fallbackSecurityDeposits[fid] = existing;
    persistS3DepositStore();
    return existing;
  },

  async fundCampaignFromWallet(founderId, campaignId, amount) {
    const fid = String(founderId || '');
    const cid = String(campaignId || '');
    const amt = Number(amount);

    const camp = fallbackCampaigns.find(c => (c.id || c._id) === cid);
    if (!camp) return { ok: false, error: 'Campaign not found.' };

    const debitRes = debitFounderWallet({
      founderId: fid,
      amount: amt,
      type: 'CAMPAIGN_SELF_FUND',
      title: `Self-fund: ${camp.title || cid}`,
      note: `Direct self-allocation from founder wallet into campaign escrow.`,
      campaignId: cid
    });

    if (!debitRes.ok) return debitRes;

    camp.raised = Number(camp.raised || 0) + amt;
    persistS3CampaignStore();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('campaigns').update({ raised: camp.raised }).eq('id', cid);
      } catch (e) {}
    }

    return { ok: true, campaign: camp, wallet: debitRes.wallet };
  },

  async getPayoutsByFounder(founderId) {
    const fid = String(founderId || '');
    const list = fallbackPayouts.filter(p => String(p.founder_id || p.founderId) === fid);
    return list;
  },

  async createPayoutRequest(payoutData) {
    fallbackPayouts.unshift(payoutData);
    persistS3PayoutStore();
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('payouts').insert([payoutData]);
      } catch (e) {}
    }
    return payoutData;
  }
};
