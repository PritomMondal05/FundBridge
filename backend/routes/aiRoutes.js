import express from 'express';
import { aiController } from '../controllers/aiController.js';

const router = express.Router();

router.post('/ai/generate', aiController.generate);

export default router;
