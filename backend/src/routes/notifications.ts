import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getAllNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationsController';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(authMiddleware);

// Listar notificações
router.get('/', getAllNotifications);

// Contagem de não lidas
router.get('/unread-count', getUnreadCount);

// Marcar como lida
router.patch('/:id/read', markAsRead);

// Marcar todas como lidas
router.patch('/read-all', markAllAsRead);

// Excluir notificação
router.delete('/:id', deleteNotification);

export default router;
