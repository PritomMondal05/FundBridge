import express from 'express';
import { disputeController } from '../controllers/disputeController.js';

const router = express.Router();

router.get('/disputes', disputeController.getDisputes);
router.post('/disputes', disputeController.createDispute);

export default router;
