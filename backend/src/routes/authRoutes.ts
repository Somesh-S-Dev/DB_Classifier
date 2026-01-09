import { Router } from 'express';
import {
    signupInitiate, signupVerify, login, forgotInitiate, forgotVerify, forgotReset,
    updateProfile, changePasswordInitiate, changeEmailInitiate, changePasswordVerify, changeEmailVerify,
    changeMobileInitiate, changeMobileVerify, verify, logout
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/signup/initiate', signupInitiate);
router.post('/signup/verify', signupVerify);
router.post('/login', login);
router.post('/forgot/initiate', forgotInitiate);
router.post('/forgot/verify', forgotVerify);
router.post('/forgot/reset', forgotReset);

// Protected routes
router.patch('/profile', authenticateToken, updateProfile);
router.post('/change-password/initiate', authenticateToken, changePasswordInitiate);
router.post('/change-email/initiate', authenticateToken, changeEmailInitiate);
router.post('/change-mobile/initiate', authenticateToken, changeMobileInitiate);
router.post('/change-password/verify', authenticateToken, changePasswordVerify);
router.post('/change-email/verify', authenticateToken, changeEmailVerify);
router.post('/change-mobile/verify', authenticateToken, changeMobileVerify);
router.get('/verify', authenticateToken, verify);
router.post('/logout', authenticateToken, logout);

export default router;
