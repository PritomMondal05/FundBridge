import express from 'express';
import { chatController } from '../controllers/chatController.js';

const router = express.Router();

router.get('/chat/messages', chatController.getMessages);
router.get('/chat/thread', chatController.getThread);
router.post('/chat/messages', chatController.createMessage);

export default router;
