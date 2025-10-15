import { Router } from 'express';
import { upload } from '../middleware/upload';
import { uploadMedia } from '../controllers/mediaController';
import { authMiddleware } from '../middleware/auth';
import { attachTenant } from '../middleware/tenant';

const router = Router();

// Todas as rotas requerem autenticação e tenant
router.use(authMiddleware);
router.use(attachTenant);

/**
 * POST /api/media/upload
 * Upload de arquivo de mídia
 */
router.post('/upload', upload.single('file'), uploadMedia);

export default router;
