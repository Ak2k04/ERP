import { Router } from 'express';
import * as authController from '../controllers/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../utils/schemas';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);

export default router;
