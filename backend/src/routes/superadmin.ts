import { Router } from 'express';
import { body } from 'express-validator';
import {
  createTenantCompany,
  getTenants,
  toggleTenantStatus
} from '../controllers/superadminController';
import { CompanySize } from '@prisma/client';

const router = Router();

// Validações para criação de tenant/empresa
const createTenantValidators = [
  // Dados da Empresa/Tenant
  body('companyName')
    .notEmpty()
    .withMessage('Nome da empresa é obrigatório')
    .isString()
    .withMessage('Nome deve ser uma string'),
  body('slug')
    .notEmpty()
    .withMessage('Slug é obrigatório')
    .isString()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug deve conter apenas letras minúsculas, números e hífens'),
  body('industry')
    .optional({ nullable: true })
    .isString()
    .withMessage('Indústria deve ser uma string'),
  body('size')
    .optional({ nullable: true })
    .isIn(Object.values(CompanySize))
    .withMessage('Tamanho inválido'),
  body('website')
    .optional({ nullable: true })
    .custom((value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage('Website deve ser uma URL válida'),
  body('phone')
    .optional({ nullable: true })
    .isString()
    .withMessage('Telefone deve ser uma string'),
  body('email')
    .optional({ nullable: true })
    .isEmail()
    .withMessage('Email deve ser válido'),
  body('address')
    .optional({ nullable: true })
    .isString()
    .withMessage('Endereço deve ser uma string'),
  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Descrição deve ser uma string'),
  
  // Dados do Admin
  body('adminName')
    .notEmpty()
    .withMessage('Nome do administrador é obrigatório')
    .isString()
    .withMessage('Nome do admin deve ser uma string'),
  body('adminEmail')
    .notEmpty()
    .withMessage('Email do administrador é obrigatório')
    .isEmail()
    .withMessage('Email do admin deve ser válido'),
  body('adminPassword')
    .notEmpty()
    .withMessage('Senha do administrador é obrigatória')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres'),
  
  // Opcionais
  body('maxUsers')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Máximo de usuários deve ser um número maior que 0'),
  body('maxWhatsappSessions')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Máximo de sessões WhatsApp deve ser um número maior que 0'),
  body('tags')
    .optional({ nullable: true })
    .isArray()
    .withMessage('Tags devem ser um array')
];

// Rotas SUPERADMIN
router.post('/tenants', createTenantValidators, createTenantCompany);
router.get('/tenants', getTenants);
router.patch('/tenants/:id/status', toggleTenantStatus);

export default router;

