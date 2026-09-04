import express from 'express';
import { authController } from '../controllers/authController.js';
import { cpUpload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/health', authController.getHealth);
router.post('/users/register', cpUpload, authController.register);
router.post('/users/login', authController.login);
router.post('/admin/login', authController.adminLogin);
router.get('/users/profile', authController.getProfile);
router.put('/users/profile', authController.updateProfile);
router.post('/users/profile/documents', cpUpload, authController.uploadProfileDocuments);
router.get('/users/lookup-by-email', authController.lookupByEmail);

export default router;
