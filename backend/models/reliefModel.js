import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  fallbackReliefDrives,
  fallbackReliefDonations,
  persistS3ReliefStore,
  persistS3ReliefDonationStore,
  getReliefDonationSummary,
  s3FounderAccessKeys,
  s3IsCoFounderOf,
  debitFounderWalletFromPersonal
} from '../utils/storeUtils.js';

export const reliefModel = {
  async getAll() {
    return fallbackReliefDrives.map(d => {
      const summary = getReliefDonationSummary(String(d.id || d._id));
      const raised = Math.max(Number(d.raised || 0), summary.total);
      return {
        ...d,
        raised,
        totalDonations: summary.total,
        donorsCount: Math.max(summary.donorsCount, Array.isArray(d.donors) ? d.donors.length : 0),
        donors: summary.donors.length > 0 ? summary.donors : (d.donors || [])
      };
    });
  },

  async getByFounder(founderId) {
    const accessKeys = await s3FounderAccessKeys(founderId);
    const list = fallbackReliefDrives.filter(d => {
      const fid = String(d.founder_id || d.founderId || '');
      const isOwner = fid && accessKeys.has(fid);
      const isCf = s3IsCoFounderOf(d, accessKeys);
      return isOwner || isCf;
    });

    return list.map(d => {
      const summary = getReliefDonationSummary(String(d.id || d._id));
      const raised = Math.max(Number(d.raised || 0), summary.total);
      const fid = String(d.founder_id || d.founderId || '');
      const viewerRole = accessKeys.has(fid) ? 'owner' : (s3IsCoFounderOf(d, accessKeys) ? 'cofounder' : 'owner');
      return {
        ...d,
        viewerRole,
        viewer_role: viewerRole,
        raised,
        totalDonations: summary.total,
        donorsCount: Math.max(summary.donorsCount, Array.isArray(d.donors) ? d.donors.length : 0),
        donors: summary.donors.length > 0 ? summary.donors : (d.donors || [])
      };
    });
  },

  async getPending() {
    return fallbackReliefDrives.filter(d => d.status === 'pending');
  },

  async getById(id) {
    const sid = String(id || '');
    const drive = fallbackReliefDrives.find(d => String(d.id || d._id) === sid);
    if (!drive) return null;
    const summary = getReliefDonationSummary(sid);
    const raised = Math.max(Number(drive.raised || 0), summary.total);
    return {
      ...drive,
      raised,
      totalDonations: summary.total,
      donorsCount: Math.max(summary.donorsCount, Array.isArray(drive.donors) ? drive.donors.length : 0),
      donors: summary.donors.length > 0 ? summary.donors : (drive.donors || [])
    };
  },

  async create(driveData) {
    fallbackReliefDrives.unshift(driveData);
    persistS3ReliefStore();
    return driveData;
  },

  async update(id, updateData) {
    const sid = String(id || '');
    const idx = fallbackReliefDrives.findIndex(d => String(d.id || d._id) === sid);
    if (idx === -1) return null;
    fallbackReliefDrives[idx] = { ...fallbackReliefDrives[idx], ...updateData };
    persistS3ReliefStore();
    return fallbackReliefDrives[idx];
  },

  async delete(id) {
    const sid = String(id || '');
    const idx = fallbackReliefDrives.findIndex(d => String(d.id || d._id) === sid);
    if (idx === -1) return false;
    if (fallbackReliefDrives[idx].status !== 'rejected') {
      fallbackReliefDrives[idx].status = 'cancelled';
    } else {
      fallbackReliefDrives.splice(idx, 1);
    }
    persistS3ReliefStore();
    return true;
  },

  async donate(driveId, donationData) {
    const sid = String(driveId || '');
    const drive = fallbackReliefDrives.find(d => String(d.id || d._id) === sid);
    if (!drive) return null;

    fallbackReliefDonations.unshift(donationData);
    persistS3ReliefDonationStore();

    if (!Array.isArray(drive.donors)) drive.donors = [];
    drive.donors.unshift(donationData);
    drive.raised = (Number(drive.raised) || 0) + Number(donationData.amount);
    persistS3ReliefStore();

    return { donation: donationData, drive };
  },

  getDonations(driveId) {
    const sid = String(driveId || '');
    return fallbackReliefDonations.filter(d => String(d.drive_id) === sid);
  },

  getInvestorDonations(investorId) {
    const iid = String(investorId || '');
    return fallbackReliefDonations.filter(d => String(d.investor_id) === iid);
  },

  fundFromWallet(founderId, driveId, amount) {
    const fid = String(founderId || '');
    const did = String(driveId || '');
    const amt = Number(amount);

    const drive = fallbackReliefDrives.find(d => String(d.id || d._id) === did);
    if (!drive) return { ok: false, error: 'Relief campaign not found.' };

    const debitRes = debitFounderWalletFromPersonal({
      founderId: fid,
      amount: amt,
      type: 'RELIEF_SELF_FUND',
      title: `Self-donate: ${drive.title || did}`,
      note: `Personal contribution from Add Money balance to relief campaign.`,
      campaignId: did,
      purposeLabel: 'Relief self-donation'
    });

    if (!debitRes.ok) return debitRes;

    const donationRow = {
      id: `don_${Date.now()}_self`,
      drive_id: did,
      drive_title: drive.title || did,
      investor_id: fid,
      investor_name: 'Founder (Self-Allocation)',
      amount: amt,
      currency: 'BDT',
      payment_method: 'Founder Personal Wallet',
      created_at: new Date().toISOString()
    };
    fallbackReliefDonations.unshift(donationRow);
    persistS3ReliefDonationStore();

    drive.raised = Number(drive.raised || 0) + amt;
    if (!Array.isArray(drive.donors)) drive.donors = [];
    drive.donors.unshift(donationRow);
    persistS3ReliefStore();

    return { ok: true, drive, wallet: debitRes.wallet, donation: donationRow };
  },

  addMilestoneProof(driveId, milestoneIdx, proofObj) {
    const sid = String(driveId || '');
    const drive = fallbackReliefDrives.find(d => String(d.id || d._id) === sid);
    if (!drive || !Array.isArray(drive.milestones)) return null;
    const mIdx = Number(milestoneIdx);
    if (mIdx < 0 || mIdx >= drive.milestones.length) return null;
    if (!Array.isArray(drive.milestones[mIdx].proofs)) {
      drive.milestones[mIdx].proofs = [];
    }
    drive.milestones[mIdx].proofs.push(proofObj);
    drive.milestones[mIdx].status = 'pending_approval';
    persistS3ReliefStore();
    return drive.milestones[mIdx];
  }
};
