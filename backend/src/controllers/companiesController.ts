import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Listar empresas com filtros e paginação
export const getCompanies = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      search = '',
      industry = '',
      size = '',
      assignedTo = ''
    } = req.query;

    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // SUPERADMIN não precisa de tenant
    if (!tenantId && userRole !== 'SUPERADMIN') {
      console.log('❌ Tenant não identificado:', {
        user: req.user,
        tenantId: req.tenantId
      });
      return res.status(400).json({
        success: false,
        error: 'Tenant não identificado',
        message:
          'Sua sessão não possui informações de tenant. Faça login novamente.'
      });
    }

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;

    // Construir filtros
    const where: any = {};

    // SUPERADMIN vê todas as empresas, outros veem apenas do seu tenant
    if (userRole !== 'SUPERADMIN' && tenantId) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (industry) {
      where.industry = industry;
    }

    if (size) {
      where.size = size;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    // Buscar empresas com paginação
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        include: {
          assignedUser: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          contacts: {
            select: {
              id: true,
              nome: true
            }
          },
          opportunities: {
            select: {
              id: true,
              title: true,
              stage: true,
              value: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSizeNum
      }),
      prisma.company.count({ where })
    ]);

    res.json({
      data: companies,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    });
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter empresa por ID
export const getCompanyById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // SUPERADMIN não precisa de tenant
    if (!tenantId && userRole !== 'SUPERADMIN') {
      console.log('❌ Tenant não identificado:', {
        user: req.user,
        tenantId: req.tenantId
      });
      return res.status(400).json({
        success: false,
        error: 'Tenant não identificado',
        message:
          'Sua sessão não possui informações de tenant. Faça login novamente.'
      });
    }

    // Construir where baseado no role
    const where: any = { id };
    if (userRole !== 'SUPERADMIN' && tenantId) {
      where.tenantId = tenantId;
    }

    const company = await prisma.company.findFirst({
      where,
      include: {
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        contacts: {
          include: {
            categories: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        },
        opportunities: {
          include: {
            contact: {
              select: {
                id: true,
                nome: true
              }
            },
            assignedUser: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    res.json(company);
  } catch (error) {
    console.error('Erro ao buscar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova empresa
export const createCompany = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      console.log('❌ Tenant não identificado:', {
        user: req.user,
        tenantId: req.tenantId
      });
      return res.status(400).json({
        success: false,
        error: 'Tenant não identificado',
        message:
          'Sua sessão não possui informações de tenant. Faça login novamente.'
      });
    }

    const {
      name,
      industry,
      size,
      website,
      phone,
      email,
      address,
      description,
      tags = [],
      customFields,
      assignedTo
    } = req.body;

    const company = await prisma.company.create({
      data: {
        tenantId,
        name,
        industry,
        size,
        website,
        phone,
        email,
        address: address || undefined,
        description,
        tags,
        customFields: customFields || undefined,
        assignedTo
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(company);
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar empresa
export const updateCompany = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      console.log('❌ Tenant não identificado:', {
        user: req.user,
        tenantId: req.tenantId
      });
      return res.status(400).json({
        success: false,
        error: 'Tenant não identificado',
        message:
          'Sua sessão não possui informações de tenant. Faça login novamente.'
      });
    }

    const {
      name,
      industry,
      size,
      website,
      phone,
      email,
      address,
      description,
      tags,
      customFields,
      assignedTo
    } = req.body;

    // Verificar se a empresa existe e pertence ao tenant
    const existingCompany = await prisma.company.findFirst({
      where: { id, tenantId }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        industry,
        size,
        website,
        phone,
        email,
        address: address || undefined,
        description,
        tags: tags || existingCompany.tags,
        customFields: customFields || existingCompany.customFields,
        assignedTo
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    res.json(company);
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar empresa
export const deleteCompany = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      console.log('❌ Tenant não identificado:', {
        user: req.user,
        tenantId: req.tenantId
      });
      return res.status(400).json({
        success: false,
        error: 'Tenant não identificado',
        message:
          'Sua sessão não possui informações de tenant. Faça login novamente.'
      });
    }

    // Verificar se a empresa existe e pertence ao tenant
    const existingCompany = await prisma.company.findFirst({
      where: { id, tenantId }
    });

    if (!existingCompany) {
      return res.status(404).json({ error: 'Empresa não encontrada' });
    }

    await prisma.company.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar empresa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
