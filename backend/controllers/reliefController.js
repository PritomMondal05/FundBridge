import { reliefModel } from '../models/reliefModel.js';
import {
  resolveCoFoundersFromBody,
  syncSuccessorFromCoFounders,
  createAndDispatchNotification
} from '../utils/storeUtils.js';

export const reliefController = {
  async getAllReliefDrives(req, res) {
    try {
      const drives = await reliefModel.getAll();
      res.status(200).json(drives);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching relief drives.' });
    }
  },

  async getFounderReliefDrives(req, res) {
    try {
      const { founderId } = req.params;
      const drives = await reliefModel.getByFounder(founderId);
      res.status(200).json(drives);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching founder relief drives.' });
    }
  },

  async getPendingReliefDrives(req, res) {
    try {
      const drives = await reliefModel.getPending();
      res.status(200).json(drives);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching pending relief drives.' });
    }
  },

  async updateReliefDriveStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updated = await reliefModel.update(id, {
        status,
        verified: status === 'verified'
      });
      if (!updated) return res.status(404).json({ error: 'Relief drive not found.' });
      res.status(200).json({ message: `Relief drive status updated to ${status}.`, drive: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating relief drive status.' });
    }
  },

  async createReliefDrive(req, res) {
    try {
      const {
        title,
        founderId,
        founderName,
        goal,
        location,
        description,
        milestones,
        coverPhoto,
        university,
        tagline
      } = req.body;

      if (!title || !founderId || !goal) {
        return res.status(400).json({ error: 'Title, founder ID, and goal amount are required.' });
      }

      const cfCheck = resolveCoFoundersFromBody(req.body, founderId, null);
      if (!cfCheck.ok) {
        return res.status(400).json({ error: cfCheck.error });
      }

      const newId = 'relief_' + Date.now();
      const driveData = {
        id: newId,
        _id: newId,
        title,
        founder_id: founderId,
        founderId,
        founder_name: founderName || 'Founder',
        goal: Number(goal),
        raised: 0,
        location: location || 'Bangladesh',
        university: university || '',
        tagline: tagline || '',
        description: description || '',
        milestones: Array.isArray(milestones) ? milestones : [],
        cover_photo: coverPhoto || '',
        coverPhoto: coverPhoto || '',
        status: 'pending',
        verified: false,
        donors: [],
        created_at: new Date().toISOString()
      };

      syncSuccessorFromCoFounders(driveData, cfCheck.coFounders);
      const created = await reliefModel.create(driveData);

      await createAndDispatchNotification(
        founderId,
        'Relief Drive Created! 🤝',
        `"${title}" submitted for administrative verification.`,
        'info'
      );

      res.status(201).json({ message: 'Relief drive created.', drive: created });
    } catch (err) {
      res.status(500).json({ error: 'Error creating relief drive.' });
    }
  },

  async updateReliefDrive(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updated = await reliefModel.update(id, updates);
      if (!updated) return res.status(404).json({ error: 'Relief drive not found.' });
      res.status(200).json({ message: 'Relief drive updated.', drive: updated });
    } catch (err) {
      res.status(500).json({ error: 'Error updating relief drive.' });
    }
  },

  async deleteReliefDrive(req, res) {
    try {
      const { id } = req.params;
      const ok = await reliefModel.delete(id);
      if (!ok) return res.status(404).json({ error: 'Relief drive not found.' });
      res.status(200).json({ message: 'Relief drive removed.' });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting relief drive.' });
    }
  },

  async donateToReliefDrive(req, res) {
    try {
      const { id } = req.params;
      const { investorId, investorName, amount, message } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid donation amount required.' });
      }

      const drive = await reliefModel.getById(id);
      if (!drive) return res.status(404).json({ error: 'Relief drive not found.' });

      const donationData = {
        id: 'don_' + Date.now(),
        drive_id: id,
        drive_title: drive.title || id,
        investor_id: investorId || 'anon',
        investor_name: investorName || 'Alumni Donor',
        amount: Number(amount),
        currency: 'BDT',
        payment_method: 'Direct MFS / Card Transfer',
        message: message || '',
        created_at: new Date().toISOString()
      };

      const result = await reliefModel.donate(id, donationData);

      const fid = drive.founder_id || drive.founderId;
      if (fid) {
        await createAndDispatchNotification(
          fid,
          'New Relief Donation! 💚',
          `${investorName || 'An alumni donor'} donated ৳ ${Number(amount).toLocaleString()} to ${drive.title}.`,
          'success'
        );
      }

      res.status(201).json({ message: 'Donation recorded.', donation: result.donation, drive: result.drive });
    } catch (err) {
      res.status(500).json({ error: 'Error processing donation.' });
    }
  },

  async getReliefDonations(req, res) {
    try {
      const { id } = req.params;
      const donations = reliefModel.getDonations(id);
      res.status(200).json(donations);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching donations.' });
    }
  },

  async getInvestorReliefDonations(req, res) {
    try {
      const { investorId } = req.params;
      const donations = reliefModel.getInvestorDonations(investorId);
      res.status(200).json(donations);
    } catch (err) {
      res.status(500).json({ error: 'Error fetching investor donations.' });
    }
  },

  async fundReliefFromWallet(req, res) {
    try {
      const { founderId, driveId } = req.params;
      const { amount } = req.body;

      const result = reliefModel.fundFromWallet(founderId, driveId, amount);
      if (!result.ok) {
        return res.status(400).json({ error: result.error });
      }

      res.status(200).json({
        message: 'Personal funds contributed to relief drive.',
        drive: result.drive,
        wallet: result.wallet,
        donation: result.donation
      });
    } catch (err) {
      res.status(500).json({ error: 'Error funding relief from wallet.' });
    }
  },

  async addMilestoneProof(req, res) {
    try {
      const { id, milestoneId } = req.params;
      const { fileUrl, fileName, notes, proofType, submittedBy } = req.body;

      const proofObj = {
        id: 'proof_' + Date.now(),
        file_url: fileUrl || '',
        file_name: fileName || 'Proof Document',
        notes: notes || '',
        proof_type: proofType || 'document',
        submitted_by: submittedBy || 'Founder',
        submitted_at: new Date().toISOString()
      };

      const milestone = reliefModel.addMilestoneProof(id, milestoneId, proofObj);
      if (!milestone) return res.status(404).json({ error: 'Relief drive milestone not found.' });

      res.status(200).json({ message: 'Proof submitted for review.', milestone });
    } catch (err) {
      res.status(500).json({ error: 'Error submitting milestone proof.' });
    }
  }
};
