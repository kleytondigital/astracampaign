import { Router } from 'express';
import {
  login,
  register,
  getProfile,
  verifyToken,
  authValidators
} from '../controllers/authController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Rotas públicas
router.post('/login', authValidators.login, login);

// Rotas protegidas
router.get('/profile', authMiddleware, getProfile);
router.get('/verify', authMiddleware, verifyToken);

// Rotas de admin
router.post('/register', authMiddleware, adminMiddleware, authValidators.register, register);

export default router;