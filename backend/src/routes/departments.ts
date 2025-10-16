import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartmentUsers
} from '../controllers/departmentsController';

const router = Router();

// Middleware de autenticação já aplicado no server.ts

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
