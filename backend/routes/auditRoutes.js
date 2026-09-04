import express from 'express';
import { auditLogController } from '../controllers/auditLogController.js';

const router = express.Router();

router.get('/audit-logs', auditLogController.getAllLogs);
router.get('/founders/:founderId/audit-logs', auditLogController.getFounderLogs);
router.post('/founders/:founderId/audit-logs', auditLogController.createFounderLog);
router.get('/investors/:investorId/audit-logs', auditLogController.getInvestorLogs);
router.post('/investors/:investorId/audit-logs', auditLogController.createInvestorLog);

export default router;
