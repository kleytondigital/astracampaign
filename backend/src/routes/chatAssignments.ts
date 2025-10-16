import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  assignChat,
  transferChat,
  closeChat,
  getChatAssignments,
  getAvailableChats
} from '../controllers/chatAssignmentsController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// ============================================================================
// ROTAS DE ATRIBUIÇÃO DE CHATS
// ============================================================================

// GET /api/chat-assignments/available - Listar chats disponíveis para atribuição
router.get('/available', getAvailableChats);

// GET /api/chat-assignments/:chatId - Listar histórico de atribuições de um chat
router.get('/:chatId', getChatAssignments);

// POST /api/chat-assignments/:chatId/assign - Atribuir chat para usuário
router.post('/:chatId/assign', assignChat);

// POST /api/chat-assignments/:chatId/transfer - Transferir chat entre departamentos
router.post('/:chatId/transfer', transferChat);

// POST /api/chat-assignments/:chatId/close - Fechar chat
router.post('/:chatId/close', closeChat);

export default router;
