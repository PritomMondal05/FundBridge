import express from 'express';
import { cofounderController } from '../controllers/cofounderController.js';

const router = express.Router();

// Applications
router.post('/campaigns/:id/cofounder-applications', cofounderController.createApplication);
router.post('/relief-drives/:id/cofounder-applications', cofounderController.createApplication);
router.get('/cofounder-applications/owner/:founderId', cofounderController.getApplicationsByOwner);
router.get('/cofounder-applications/applicant/:founderId', cofounderController.getApplicationsByApplicant);
router.get('/cofounder-applications/target/:type/:id', cofounderController.getApplicationsByTarget);
router.post('/cofounder-applications/:id/status', cofounderController.updateApplicationStatus);
router.post('/campaigns/:id/cofounders/:userId/remove', cofounderController.removeCoFounder);
router.post('/relief-drives/:id/cofounders/:userId/remove', cofounderController.removeCoFounder);

// Edit Requests
router.get('/edit-requests/founder/:founderId', cofounderController.getEditRequestsByFounder);
router.post('/campaigns/:id/edit-requests', cofounderController.createCampaignEditRequest);
router.post('/relief-drives/:id/edit-requests', cofounderController.createReliefEditRequest);

// Handover Requests
router.post('/campaigns/:id/handover-requests', cofounderController.createCampaignHandoverRequest);
router.post('/relief-drives/:id/handover-requests', cofounderController.createReliefHandoverRequest);
router.get('/handover-requests/founder/:founderId', cofounderController.getHandoverRequestsByFounder);

export default router;
