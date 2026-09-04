import express from 'express';
import { investorMatchesHandler, founderMatchesHandler, founderUserMatchesHandler } from '../controllers/aiMatchController.js';
import {
  generateBioHandler,
  improveBioHandler,
  generateCampaignHandler,
  improveCampaignHandler,
  whatsBurningHandler,
  legacyGenerateHandler
} from '../controllers/aiOptimizationController.js';

const router = express.Router();

router.get('/investor-matches/:investorId', investorMatchesHandler);
router.get('/founder-matches/:campaignId', founderMatchesHandler);
router.get('/founder-user-matches/:founderId', founderUserMatchesHandler);

router.post('/founder/bio/generate', generateBioHandler);
router.post('/founder/bio/improve', improveBioHandler);
router.post('/founder/campaign/generate', generateCampaignHandler);
router.post('/founder/campaign/improve', improveCampaignHandler);
router.get('/whats-burning', whatsBurningHandler);
router.get('/trends', whatsBurningHandler);
router.get('/trends/relevant', whatsBurningHandler);
router.post('/generate', legacyGenerateHandler);

export default router;
