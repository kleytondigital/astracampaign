import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getOpportunities,
  getOpportunityById,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getPipelineStats
} from '../controllers/opportunitiesController';

const router = Router();

// Validações para criação de oportunidades
const opportunityCreateValidation = [
  body('title')
    .notEmpty()
    .withMessage('Título é obrigatório')
    .isLength({ min: 3, max: 255 })
    .withMessage('Título deve ter entre 3 e 255 caracteres'),

  body('value')
    .isNumeric()
    .withMessage('Valor deve ser numérico')
    .custom((value) => {
      if (parseFloat(value) < 0) {
        throw new Error('Valor deve ser positivo');
      }
      return true;
    }),

  body('stage')
    .isIn([
      'PROSPECT',
      'QUALIFIED',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST',
      'ON_HOLD'
    ])
    .withMessage('Estágio inválido'),

  body('probability')
    .isInt({ min: 0, max: 100 })
    .withMessage('Probabilidade deve estar entre 0 e 100'),

  body('expectedClose')
    .optional()
    .isISO8601()
    .withMessage('Data de fechamento esperado deve ser válida'),

  body('assignedTo')
    .optional()
    .isUUID()
    .withMessage('ID do usuário atribuído deve ser válido'),

  body('contactId')
    .optional()
    .isUUID()
    .withMessage('ID do contato deve ser válido'),

  body('companyId')
    .optional()
    .isUUID()
    .withMessage('ID da empresa deve ser válido'),

  body('tags').optional().isArray().withMessage('Tags devem ser um array'),

  body('customFields')
    .optional()
    .isObject()
    .withMessage('Campos customizados devem ser um objeto')
];

// Validações para atualização de oportunidades (campos opcionais)
const opportunityUpdateValidation = [
  body('title')
    .optional()
    .isLength({ min: 3, max: 255 })
    .withMessage('Título deve ter entre 3 e 255 caracteres'),

  body('value')
    .optional()
    .isNumeric()
    .withMessage('Valor deve ser numérico')
    .custom((value) => {
      if (value !== undefined && parseFloat(value) < 0) {
        throw new Error('Valor deve ser positivo');
      }
      return true;
    }),

  body('stage')
    .optional()
    .isIn([
      'PROSPECT',
      'QUALIFIED',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST',
      'ON_HOLD'
    ])
    .withMessage('Estágio inválido'),

  body('probability')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Probabilidade deve estar entre 0 e 100'),

  body('expectedClose')
    .optional()
    .isISO8601()
    .withMessage('Data de fechamento esperado deve ser válida'),

  body('assignedTo')
    .optional()
    .isUUID()
    .withMessage('ID do usuário atribuído deve ser válido'),

  body('contactId')
    .optional()
    .isUUID()
    .withMessage('ID do contato deve ser válido'),

  body('companyId')
    .optional()
    .isUUID()
    .withMessage('ID da empresa deve ser válido'),

  body('tags').optional().isArray().withMessage('Tags devem ser um array'),

  body('customFields')
    .optional()
    .isObject()
    .withMessage('Campos customizados devem ser um objeto')
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

  query('stage')
    .optional()
    .isIn([
      'PROSPECT',
      'QUALIFIED',
      'PROPOSAL',
      'NEGOTIATION',
      'CLOSED_WON',
      'CLOSED_LOST',
      'ON_HOLD'
    ])
    .withMessage('Estágio inválido'),

  query('assignedTo')
    .optional()
    .isUUID()
    .withMessage('ID do usuário atribuído deve ser válido'),

  query('contactId')
    .optional()
    .isUUID()
    .withMessage('ID do contato deve ser válido'),

  query('companyId')
    .optional()
    .isUUID()
    .withMessage('ID da empresa deve ser válido')
];

// Rotas
router.get('/', queryValidation, getOpportunities);
router.get('/stats', getPipelineStats);
router.get('/:id', idValidation, getOpportunityById);
router.post('/', opportunityCreateValidation, createOpportunity);
router.put(
  '/:id',
  [...idValidation, ...opportunityUpdateValidation],
  updateOpportunity
);
router.delete('/:id', idValidation, deleteOpportunity);

export default router;

