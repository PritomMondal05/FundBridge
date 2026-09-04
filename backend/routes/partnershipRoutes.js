import express from 'express';
import { partnershipController } from '../controllers/partnershipController.js';

const router = express.Router();

// List & Detail
router.get('/partnerships', partnershipController.getAllPartnerships);
router.get('/partnerships/founder/:founderId', partnershipController.getFounderPartnerships);
router.get('/partnerships/investor/:investorId', partnershipController.getInvestorPartnerships);
router.get('/partnerships/:id', partnershipController.getPartnershipById);

// Milestone Workflow Actions
// 1. Founder requests funding for an unlocked milestone
router.post('/partnerships/:id/milestones/:mId/request', partnershipController.requestMilestoneFunding);

// 2. Investor audits & releases tranche (MFS/Escrow)
router.post('/partnerships/:id/milestones/:mId/release', partnershipController.releaseMilestoneFunding);

// 3. Founder submits milestone completion report
router.post('/partnerships/:id/milestones/:mId/complete', partnershipController.submitMilestoneCompletion);

// 4. Investor verifies milestone completion (unlocks next tranche)
router.post('/partnerships/:id/milestones/:mId/verify', partnershipController.verifyMilestoneCompletion);

// 5. Dispute flag
router.post('/partnerships/:id/milestones/:mId/dispute', partnershipController.flagMilestoneDispute);

export default router;
