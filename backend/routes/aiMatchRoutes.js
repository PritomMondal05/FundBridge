import express from 'express';
import { investorMatchesHandler, founderMatchesHandler } from '../controllers/aiMatchController.js';

const router = express.Router();

router.get('/investor-matches/:investorId', investorMatchesHandler);
router.get('/founder-matches/:campaignId', founderMatchesHandler);

export default router;