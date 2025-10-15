import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getChats,
  getChatById,
  sendMessage,
  assignChat,
  markChatAsRead,
  updateChatStatus,
  createLeadFromChat,
  getChatStats,
  syncChatsFromEvolution
} from '../controllers/chatsController';

const router = Router();

// ============================================================================
// ROTAS DE CHATS
// ============================================================================

// GET /api/chats - Listar chats com filtros e paginação
router.get('/', getChats);

// GET /api/chats/stats - Estatísticas de chats
router.get('/stats', getChatStats);

// GET /api/chats/:id - Buscar chat por ID com mensagens
router.get('/:id', param('id').isUUID(), getChatById);

// POST /api/chats/:id/messages - Enviar mensagem
router.post(
  '/:id/messages',
  [
    param('id').isUUID(),
    body('body').optional().isString(),
    body('type')
      .optional()
      .isIn([
        'TEXT',
        'IMAGE',
        'AUDIO',
        'VOICE',
        'VIDEO',
        'DOCUMENT',
        'STICKER',
        'LOCATION',
        'CONTACT',
        'LINK',
        'OTHER'
      ]),
    body('mediaUrl').optional().isString()
  ],
  sendMessage
);

// PATCH /api/chats/:id/assign - Atribuir chat a um usuário
router.patch(
  '/:id/assign',
  [
    param('id').isUUID(),
    body('assignedTo').isUUID().withMessage('ID do usuário é inválido')
  ],
  assignChat
);

// PATCH /api/chats/:id/mark-read - Marcar chat como lido
router.patch('/:id/mark-read', param('id').isUUID(), markChatAsRead);

// PATCH /api/chats/:id/status - Atualizar status do chat
router.patch(
  '/:id/status',
  [
    param('id').isUUID(),
    body('status')
      .isIn(['OPEN', 'PENDING', 'RESOLVED', 'ARCHIVED'])
      .withMessage('Status inválido')
  ],
  updateChatStatus
);

// POST /api/chats/:id/create-lead - Criar lead a partir do chat
router.post(
  '/:id/create-lead',
  [
    param('id').isUUID(),
    body('firstName').notEmpty().withMessage('Nome é obrigatório'),
    body('lastName').notEmpty().withMessage('Sobrenome é obrigatório'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('company').optional().isString(),
    body('score')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Score deve ser entre 0 e 100')
  ],
  createLeadFromChat
);

// POST /api/chats/sync/:instanceName - Sincronizar chats da Evolution API
router.post('/sync/:instanceName', syncChatsFromEvolution);

export default router;
