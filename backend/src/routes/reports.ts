import { Router } from 'express';
import {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport,
  getReportData,
  getPublicReport
} from '../controllers/reportsController';

const router = Router();

// Middleware de autenticação já aplicado no server.ts

// ============================================================================
// ROTAS DE RELATÓRIOS
// ============================================================================

router.get('/', getReports); // Listar relatórios
router.get('/:id', getReportById); // Obter relatório por ID
router.get('/:id/data', getReportData); // Obter dados do relatório
router.get('/public/:token', getPublicReport); // Acesso público ao relatório
router.post('/', createReport); // Criar novo relatório
router.put('/:id', updateReport); // Atualizar relatório
router.delete('/:id', deleteReport); // Deletar relatório

export default router;