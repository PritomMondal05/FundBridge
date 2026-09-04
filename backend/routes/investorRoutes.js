import express from 'express';
import { investorController } from '../controllers/investorController.js';

const router = express.Router();

router.get('/investors/directory', investorController.getDirectory);
router.get('/investors/:investorId/profile', investorController.getProfile);
router.get('/investors/watchlist', investorController.getWatchlist);
router.post('/investors/watchlist', investorController.toggleWatchlist);
router.get('/investors/connections', investorController.getConnections);
router.post('/investors/connect', investorController.sendConnectionRequest);
router.get('/investors/bookmarked-founders', investorController.getBookmarkedFounders);
router.post('/investors/bookmark-founder', investorController.toggleBookmarkFounder);

export default router;
