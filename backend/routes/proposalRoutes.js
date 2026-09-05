import express from 'express';
import { proposalController } from '../controllers/proposalController.js';

const router = express.Router();

router.post('/campaigns/:id/proposals', proposalController.createProposal);
router.get('/proposals/campaign/:campaignId', proposalController.getCampaignProposals);
router.get('/proposals/investor/:investorId', proposalController.getInvestorProposals);
router.get('/proposals/founder/:founderId', proposalController.getFounderProposals);

router.post('/founder/proposals/:proposalId/status', proposalController.updateProposalStatus);
router.put('/campaigns/:id/proposals/:proposalId/status', proposalController.updateProposalStatus);
router.post('/campaigns/:id/proposals/:proposalId/status', proposalController.updateProposalStatus);
router.post('/founder/proposals/:proposalId/negotiate', proposalController.negotiateProposal);

router.post('/proposals/:proposalId/withdraw', proposalController.withdrawProposal);
router.post('/proposals/:id/withdraw', proposalController.withdrawProposal);
router.delete('/proposals/:id', proposalController.deleteProposal);

export default router;
