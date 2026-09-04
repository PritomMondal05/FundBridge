import express from 'express';
import { walletController } from '../controllers/walletController.js';

const router = express.Router();

router.get('/founders/:founderId/wallet', walletController.getFounderWallet);
router.get('/founders/:founderId/wallet/deposits', walletController.getFounderDeposits);
router.post('/founders/:founderId/wallet/deposits', walletController.requestFounderDeposit);

router.get('/investors/:investorId/wallet', walletController.getInvestorWallet);
router.get('/investors/:investorId/wallet/deposits', walletController.getInvestorDeposits);
router.post('/investors/:investorId/wallet/deposits', walletController.requestInvestorDeposit);

router.get('/founders/:founderId/security-deposit', walletController.getFounderSecurityDeposit);
router.post('/founders/:founderId/security-deposit', walletController.submitFounderSecurityDeposit);

router.post('/founders/:founderId/campaigns/:campaignId/fund-from-wallet', walletController.fundCampaignFromWallet);

router.get('/payouts/founder/:founderId', walletController.getFounderPayouts);
router.post('/payouts/request', walletController.requestPayout);

export default router;
