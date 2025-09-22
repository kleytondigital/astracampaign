import { Router } from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  usersValidators
} from '../controllers/usersController';
import { authMiddleware, adminMiddleware } from '../middleware/auth';

const router = Router();

// Todas as rotas de usuários requerem autenticação e permissão de admin
router.use(authMiddleware, adminMiddleware);

router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', usersValidators.create, createUser);
router.put('/:id', usersValidators.update, updateUser);
router.delete('/:id', deleteUser);

export default router;