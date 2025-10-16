import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartmentUsers
} from '../controllers/departmentsController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// ============================================================================
// ROTAS DE DEPARTAMENTOS
// ============================================================================

// GET /api/departments - Listar departamentos
router.get('/', getDepartments);

// GET /api/departments/:id - Obter departamento por ID
router.get('/:id', getDepartmentById);

// GET /api/departments/:id/users - Listar usuários do departamento
router.get('/:id/users', getDepartmentUsers);

// POST /api/departments - Criar departamento
router.post('/', createDepartment);

// PUT /api/departments/:id - Atualizar departamento
router.put('/:id', updateDepartment);

// DELETE /api/departments/:id - Deletar departamento
router.delete('/:id', deleteDepartment);

export default router;
