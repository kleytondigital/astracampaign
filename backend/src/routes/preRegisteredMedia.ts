import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { attachTenant } from '../middleware/tenant';
import {
  getPreRegisteredMedia,
  createPreRegisteredMedia,
  updatePreRegisteredMedia,
  deletePreRegisteredMedia,
  incrementUsageCount,
  getCategories
} from '../controllers/preRegisteredMediaController';

const router = Router();

// Todas as rotas requerem autenticação e tenant
router.use(authMiddleware);
router.use(attachTenant);

/**
 * GET /api/pre-registered-media
 * Listar mídias pré-cadastradas com filtros e paginação
 * Query params: page, pageSize, category, type, search, isActive
 */
router.get('/', getPreRegisteredMedia);

/**
 * GET /api/pre-registered-media/categories
 * Buscar categorias disponíveis
 */
router.get('/categories', getCategories);

/**
 * POST /api/pre-registered-media
 * Criar nova mídia pré-cadastrada
 * Body: { name, description, category, type, mediaUrl, thumbnailUrl, fileSize, mimeType, tags }
 */
router.post('/', createPreRegisteredMedia);

/**
 * PUT /api/pre-registered-media/:id
 * Atualizar mídia pré-cadastrada
 * Body: { name, description, category, type, mediaUrl, thumbnailUrl, fileSize, mimeType, tags, isActive }
 */
router.put('/:id', updatePreRegisteredMedia);

/**
 * DELETE /api/pre-registered-media/:id
 * Deletar mídia pré-cadastrada
 */
router.delete('/:id', deletePreRegisteredMedia);

/**
 * POST /api/pre-registered-media/:id/increment-usage
 * Incrementar contador de uso da mídia
 */
router.post('/:id/increment-usage', incrementUsageCount);

export default router;






