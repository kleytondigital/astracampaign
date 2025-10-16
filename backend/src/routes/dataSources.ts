import { Router } from 'express';
import {
  getDataSources,
  getDataSourceById,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testConnection,
  syncDataSource
} from '../controllers/dataSourcesController';

const router = Router();

// Middleware de autenticação já aplicado no server.ts

// ============================================================================
// ROTAS DE FONTES DE DADOS
// ============================================================================

router.get('/', getDataSources); // Listar fontes de dados
router.get('/:id', getDataSourceById); // Obter fonte de dados por ID
router.post('/', createDataSource); // Criar nova fonte de dados
router.put('/:id', updateDataSource); // Atualizar fonte de dados
router.delete('/:id', deleteDataSource); // Deletar fonte de dados
router.post('/test-connection', testConnection); // Testar conexão
router.post('/:id/sync', syncDataSource); // Sincronizar dados

export default router;
