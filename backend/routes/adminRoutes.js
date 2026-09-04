import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { disputeController } from '../controllers/disputeController.js';
import { reliefController } from '../controllers/reliefController.js';
import { cofounderController } from '../controllers/cofounderController.js';

const router = express.Router();

// Stats
router.get('/admin/stats', adminController.getStats);

// Vetting & Users
router.get('/vetting/applicants', adminController.getVettingApplicants);
router.post('/vetting/status', adminController.updateVettingStatus);
router.post('/admin/vetting/reject-all', adminController.rejectAllVetting);
router.post('/admin/users/:userId/hold', adminController.holdUser);
router.post('/admin/users/:userId/block', adminController.blockUser);
router.put('/admin/users/:userId', adminController.updateUser);
router.delete('/admin/users/:userId', adminController.deleteUser);
router.get('/admin/users/founders', adminController.getFounders);
router.get('/users/founders', adminController.getFounders);
router.get('/admin/users/investors', adminController.getInvestors);

// Trash
router.get('/admin/trash', adminController.getTrash);
router.post('/admin/trash/restore/:id', adminController.restoreTrash);
router.delete('/admin/trash/:id', adminController.purgeTrash);
router.post('/admin/trash/empty', adminController.emptyTrash);

// Disputes moderation
router.post('/admin/disputes/:id/dismiss', disputeController.dismissDispute);
router.post('/admin/disputes/:id/resolve', disputeController.resolveDispute);
router.post('/admin/disputes/:id/block-user', disputeController.blockUserDispute);

// Campaigns moderation
router.get('/admin/campaigns/pending', adminController.getPendingCampaigns);
router.post('/admin/campaigns/reject-all', adminController.rejectAllCampaigns);
router.post('/admin/campaigns/:id/verify', adminController.verifyCampaign);
router.post('/admin/campaigns/:id/reject', adminController.rejectCampaign);
router.delete('/admin/campaigns/:id', adminController.deleteCampaignToTrash);
router.post('/admin/campaigns/:id/reupload', adminController.reuploadCampaign);
router.post('/admin/campaigns/:id/pause-funding', adminController.pauseFunding);
router.post('/admin/campaigns/:id/block', adminController.blockCampaign);
router.post('/admin/campaigns/:id/freeze-funds', adminController.freezeFunds);
router.post('/admin/campaigns/:id/freeze', adminController.freezeFunds);

// Escrow
router.get('/admin/escrow/pending', adminController.getPendingEscrow);
router.post('/admin/escrow/:campaignId/milestones/:milestoneId/approve', adminController.approveEscrowMilestone);

// Relief moderation
router.get('/admin/relief-drives/pending', reliefController.getPendingReliefDrives);
router.post('/admin/relief-drives/:id/status', reliefController.updateReliefDriveStatus);

// Edit & Handover moderation
router.get('/admin/edit-requests/pending', cofounderController.getPendingEditRequests);
router.post('/admin/edit-requests/:id/status', cofounderController.updateEditRequestStatus);
router.get('/admin/handover-requests/pending', cofounderController.getPendingHandoverRequests);
router.post('/admin/handover-requests/:id/status', cofounderController.updateHandoverRequestStatus);

// Wallet deposits moderation
router.get('/admin/wallet-deposits/pending', adminController.getPendingDeposits);
router.post('/admin/wallet-deposits/:id/status', adminController.updateDepositStatus);

// Campaign updates moderation
router.get('/admin/campaign-updates/pending', adminController.getPendingUpdates);
router.post('/admin/campaign-updates/:updateId/status', adminController.updateCampaignUpdateStatus);
router.post('/admin/campaign-updates/:updateId/reject', adminController.rejectCampaignUpdate);

export default router;
