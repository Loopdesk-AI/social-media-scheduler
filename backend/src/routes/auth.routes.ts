import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new AuthController();

// Public routes
router.post('/register', controller.register.bind(controller));
router.post('/login', controller.login.bind(controller));

// Protected routes
router.use(authMiddleware);
router.get('/me', controller.me.bind(controller));
router.put('/profile', controller.updateProfile.bind(controller));
router.post('/change-password', controller.changePassword.bind(controller));

export { router as authRoutes };
