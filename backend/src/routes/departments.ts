import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartmentUsers,
  addUserToDepartment,
  removeUserFromDepartment,
  getAvailableUsers
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

// GET /api/departments/:id/available-users - Listar usuários disponíveis para adicionar
router.get('/:id/available-users', getAvailableUsers);

// POST /api/departments - Criar departamento
router.post('/', createDepartment);

// POST /api/departments/:id/users - Adicionar usuário ao departamento
router.post('/:id/users', addUserToDepartment);

// PUT /api/departments/:id - Atualizar departamento
router.put('/:id', updateDepartment);

// DELETE /api/departments/:id - Deletar departamento
router.delete('/:id', deleteDepartment);

// DELETE /api/departments/:id/users/:userId - Remover usuário do departamento
router.delete('/:id/users/:userId', removeUserFromDepartment);

export default router;
