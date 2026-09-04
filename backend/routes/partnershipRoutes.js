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
router.post('/partnerships/:id/milestones/:mId/reject', partnershipController.rejectMilestoneFunding);
router.post('/partnerships/:id/milestones/:mId/release', partnershipController.releaseMilestoneFunding);
router.post('/partnerships/:id/milestones/:mId/progress', partnershipController.updateMilestoneProgress);
router.post('/partnerships/:id/milestones/:mId/complete', partnershipController.submitMilestoneCompletion);
router.post('/partnerships/:id/milestones/:mId/revise', partnershipController.requestMilestoneRevision);
router.post('/partnerships/:id/milestones/:mId/verify', partnershipController.verifyMilestoneCompletion);
router.post('/partnerships/:id/milestones/:mId/dispute', partnershipController.flagMilestoneDispute);

export default router;
