import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getTenantMetrics,
  getDepartmentMetrics,
  getUserMetrics
} from '../controllers/metricsController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// ============================================================================
// ROTAS DE MÉTRICAS
// ============================================================================

// GET /api/metrics/tenant - Métricas gerais do tenant
router.get('/tenant', getTenantMetrics);

// GET /api/metrics/department/:departmentId - Métricas por departamento
router.get('/department/:departmentId', getDepartmentMetrics);

// GET /api/metrics/user/:userId - Métricas por usuário
router.get('/user/:userId', getUserMetrics);

export default router;
