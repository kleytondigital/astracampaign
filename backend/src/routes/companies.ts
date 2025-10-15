import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} from '../controllers/companiesController';
import { CompanySize } from '@prisma/client';

const router = Router();

// Validações comuns para criação e atualização de empresas
const companyValidators = [
  body('name').notEmpty().withMessage('O nome da empresa é obrigatório.'),
  body('industry')
    .optional()
    .isString()
    .withMessage('A indústria deve ser uma string.'),
  body('size')
    .optional()
    .isIn(Object.values(CompanySize))
    .withMessage('Tamanho da empresa inválido.'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website deve ser uma URL válida.'),
  body('phone')
    .optional()
    .isString()
    .withMessage('Telefone deve ser uma string.'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('E-mail deve ser um email válido.'),
  body('description')
    .optional()
    .isString()
    .withMessage('A descrição deve ser uma string.'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags devem ser um array de strings.'),
  body('assignedTo')
    .optional()
    .isUUID()
    .withMessage('ID de usuário atribuído inválido.')
];

// Rotas para Empresas
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', companyValidators, createCompany);
router.put('/:id', companyValidators, updateCompany);
router.delete('/:id', deleteCompany);

export default router;

