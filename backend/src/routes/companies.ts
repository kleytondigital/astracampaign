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
  body('name')
    .notEmpty()
    .withMessage('O nome da empresa é obrigatório.')
    .isString()
    .withMessage('O nome deve ser uma string.'),
  body('industry')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return typeof value === 'string';
    })
    .withMessage('A indústria deve ser uma string.'),
  body('size')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return Object.values(CompanySize).includes(value);
    })
    .withMessage('Tamanho da empresa inválido.'),
  body('website')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      // Validação de URL mais flexível
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage('Website deve ser uma URL válida.'),
  body('phone')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return typeof value === 'string';
    })
    .withMessage('Telefone deve ser uma string.'),
  body('email')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      // Validação de email simples
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    })
    .withMessage('E-mail deve ser um email válido.'),
  body('address')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return typeof value === 'string';
    })
    .withMessage('O endereço deve ser uma string.'),
  body('description')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return typeof value === 'string';
    })
    .withMessage('A descrição deve ser uma string.'),
  body('tags')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      return Array.isArray(value);
    })
    .withMessage('Tags devem ser um array de strings.'),
  body('customFields')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      return typeof value === 'object';
    })
    .withMessage('Custom fields devem ser um objeto.'),
  body('assignedTo')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      // Validação UUID
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    })
    .withMessage('ID de usuário atribuído inválido.')
];

// Rotas para Empresas
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', companyValidators, createCompany);
router.put('/:id', companyValidators, updateCompany);
router.delete('/:id', deleteCompany);

export default router;

