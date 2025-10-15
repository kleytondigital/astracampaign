import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  completeActivity,
  getActivityStats,
  getActivityTimeline
} from '../controllers/activitiesController';

const router = Router();

// Validações para criação/atualização de atividades
const activityValidation = [
  body('type')
    .isIn([
      'CALL',
      'EMAIL',
      'MEETING',
      'TASK',
      'WHATSAPP',
      'NOTE',
      'FOLLOW_UP',
      'PROPOSAL',
      'DEMO'
    ])
    .withMessage('Tipo de atividade inválido'),

  body('subject')
    .notEmpty()
    .withMessage('Assunto é obrigatório')
    .isLength({ min: 3, max: 255 })
    .withMessage('Assunto deve ter entre 3 e 255 caracteres'),

  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Prioridade inválida'),

  body('status')
    .optional()
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status inválido'),

  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Data de vencimento deve ser válida'),

  body('assignedTo')
    .isUUID()
    .withMessage('ID do usuário atribuído deve ser válido'),

  body('contactId')
    .optional()
    .isUUID()
    .withMessage('ID do contato deve ser válido'),

  body('opportunityId')
    .optional()
    .isUUID()
    .withMessage('ID da oportunidade deve ser válido'),

  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadados devem ser um objeto')
];

// Validações para parâmetros
const idValidation = [
  param('id').isUUID().withMessage('ID deve ser um UUID válido')
];

// Validações para query parameters
const queryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),

  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Tamanho da página deve estar entre 1 e 100'),

  query('type')
    .optional()
    .isIn([
      'CALL',
      'EMAIL',
      'MEETING',
      'TASK',
      'WHATSAPP',
      'NOTE',
      'FOLLOW_UP',
      'PROPOSAL',
      'DEMO'
    ])
    .withMessage('Tipo de atividade inválido'),

  query('status')
    .optional()
    .isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .withMessage('Status inválido'),

  query('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Prioridade inválida'),

  query('assignedTo')
    .optional()
    .isUUID()
    .withMessage('ID do usuário atribuído deve ser válido'),

  query('contactId')
    .optional()
    .isUUID()
    .withMessage('ID do contato deve ser válido'),

  query('opportunityId')
    .optional()
    .isUUID()
    .withMessage('ID da oportunidade deve ser válido')
];

// Rotas
router.get('/', queryValidation, getActivities);
router.get('/stats', getActivityStats);
router.get('/timeline', queryValidation, getActivityTimeline);
router.get('/:id', idValidation, getActivityById);
router.post('/', activityValidation, createActivity);
router.put('/:id', [...idValidation, ...activityValidation], updateActivity);
router.patch('/:id/complete', idValidation, completeActivity);
router.delete('/:id', idValidation, deleteActivity);

export default router;

