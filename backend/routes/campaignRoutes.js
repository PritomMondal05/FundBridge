import express from 'express';
import { campaignController } from '../controllers/campaignController.js';

const router = express.Router();

router.get('/campaigns', campaignController.getAllCampaigns);
router.get('/campaigns/watchable', campaignController.getWatchableCampaigns);
router.get('/campaigns/founder/:founderId', campaignController.getFounderCampaigns);
router.get('/founders/:founderId/campaigns', campaignController.getFounderCampaigns);
router.get('/campaigns/:id', campaignController.getCampaignById);
router.post('/campaigns', campaignController.createCampaign);
router.put('/campaigns/:id', campaignController.updateCampaign);
router.delete('/campaigns/:id', campaignController.deleteCampaign);

// Updates
router.get('/campaigns/:id/updates', campaignController.getCampaignUpdates);
router.post('/campaigns/:id/updates', campaignController.createCampaignUpdate);

// Progress Tags
router.get('/progress-tags/founder/:founderId', campaignController.getProgressTags);
router.post('/campaigns/:id/progress-tags', campaignController.addProgressTag);

// Milestone proofs
router.post('/campaigns/:id/milestones/:milestoneId/proofs', campaignController.addMilestoneProof);

export default router;
