import { Router } from 'express';
import { upload } from '../middleware/upload';
import { uploadMedia } from '../controllers/mediaController';
import { authMiddleware } from '../middleware/auth';
import { attachTenant } from '../middleware/tenant';

const router = Router();

// Todas as rotas de mídia requerem autenticação
router.use(authMiddleware);
router.use(attachTenant);

/**
 * POST /api/media/upload
 * Upload de arquivo de mídia
 * Endpoint unificado para campanhas e chat
 */
router.post('/upload', upload.single('file'), uploadMedia);

// TODO: Implementar rotas de templates de mensagem multimídia
// GET /api/media - Listar arquivos de mídia
// router.get('/', listMediaFiles);

// DELETE /api/media/:filename - Deletar arquivo de mídia
// router.delete('/:filename', deleteMediaFile);

export default router;
