import express from 'express';
import { reliefController } from '../controllers/reliefController.js';

const router = express.Router();

router.get('/relief-drives', reliefController.getAllReliefDrives);
router.get('/relief-drives/founder/:founderId', reliefController.getFounderReliefDrives);
router.get('/founders/:founderId/relief-drives', reliefController.getFounderReliefDrives);
router.post('/relief-drives', reliefController.createReliefDrive);
router.put('/relief-drives/:id', reliefController.updateReliefDrive);
router.delete('/relief-drives/:id', reliefController.deleteReliefDrive);

router.post('/relief-drives/:id/donate', reliefController.donateToReliefDrive);
router.get('/relief-drives/:id/donations', reliefController.getReliefDonations);
router.get('/investors/:investorId/relief-donations', reliefController.getInvestorReliefDonations);

router.post('/founders/:founderId/relief-drives/:driveId/fund-from-wallet', reliefController.fundReliefFromWallet);
router.post('/relief-drives/:id/milestones/:milestoneId/proofs', reliefController.addMilestoneProof);

export default router;
