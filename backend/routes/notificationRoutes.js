import express from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/notifications', notificationController.getNotifications);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.post('/notifications', notificationController.createNotification);

export default router;
