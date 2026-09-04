import express from 'express';
import authRoutes from './authRoutes.js';
import campaignRoutes from './campaignRoutes.js';
import proposalRoutes from './proposalRoutes.js';
import walletRoutes from './walletRoutes.js';
import disputeRoutes from './disputeRoutes.js';
import reliefRoutes from './reliefRoutes.js';
import cofounderRoutes from './cofounderRoutes.js';
import chatRoutes from './chatRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import investorRoutes from './investorRoutes.js';
import adminRoutes from './adminRoutes.js';
import aiRoutes from './aiRoutes.js';
import auditRoutes from './auditRoutes.js';

const router = express.Router();

// Mount all modular routes under /api
router.use('/', authRoutes);
router.use('/', campaignRoutes);
router.use('/', proposalRoutes);
router.use('/', walletRoutes);
router.use('/', disputeRoutes);
router.use('/', reliefRoutes);
router.use('/', cofounderRoutes);
router.use('/', chatRoutes);
router.use('/', notificationRoutes);
router.use('/', investorRoutes);
router.use('/', adminRoutes);
router.use('/', aiRoutes);
router.use('/', auditRoutes);

export default router;
