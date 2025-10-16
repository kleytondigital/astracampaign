import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToContact,
  getLeadsStats
} from '../controllers/leadsController';
import { LeadSource, LeadStatus } from '@prisma/client';

const router = Router();

// Validações comuns para criação e atualização de leads
const leadValidators = [
  body('firstName').notEmpty().withMessage('O primeiro nome é obrigatório.'),
  body('lastName').notEmpty().withMessage('O sobrenome é obrigatório.'),
  body('email').isEmail().withMessage('E-mail inválido.'),
  body('phone')
    .optional({ nullable: true })
    .isString()
    .withMessage('Telefone deve ser uma string.'),
  body('company')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return typeof value === 'string';
    })
    .withMessage('Empresa deve ser uma string.'),
  body('source')
    .isIn(Object.values(LeadSource))
    .withMessage('Fonte do lead inválida.'),
  body('status')
    .optional({ nullable: true })
    .isIn(Object.values(LeadStatus))
    .withMessage('Status do lead inválido.'),
  body('score')
    .optional({ nullable: true })
    .isInt({ min: 0, max: 100 })
    .withMessage('Score deve ser um número entre 0 e 100.'),
  body('tags')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Tags devem ser um array de strings.'),
  body('assignedTo')
    .optional({ nullable: true })
    .isUUID()
    .withMessage('ID de usuário atribuído inválido.')
];

// Rotas para Leads
router.get('/', getLeads);
router.get('/stats', getLeadsStats);
router.get('/:id', getLeadById);
router.post('/', leadValidators, createLead);
router.put('/:id', leadValidators, updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/convert', convertLeadToContact); // Rota para converter lead em contato

export default router;




