import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Listar oportunidades com filtros e paginação
export const getOpportunities = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      search = '',
      stage = '',
      assignedTo = '',
      contactId = '',
      companyId = ''
    } = req.query;

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

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;

    // Construir filtros
    const where: any = {
      tenantId
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        {
          contact: { nome: { contains: search as string, mode: 'insensitive' } }
        },
        {
          company: { name: { contains: search as string, mode: 'insensitive' } }
        }
      ];
    }

    if (stage) {
      where.stage = stage;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              nome: true,
              telefone: true,
              email: true
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              industry: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          activities: {
            select: {
              id: true,
              type: true,
              subject: true,
              status: true,
              dueDate: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 5
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: pageSizeNum
      }),
      prisma.opportunity.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSizeNum);

    res.json({
      opportunities,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages
    });
  } catch (error) {
    console.error('Erro ao buscar oportunidades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter oportunidade por ID
export const getOpportunityById = async (
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

    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        contact: true,
        company: true,
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        activities: {
          include: {
            assignedUser: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    res.json(opportunity);
  } catch (error) {
    console.error('Erro ao buscar oportunidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova oportunidade
export const createOpportunity = async (req: Request, res: Response) => {
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
      contactId,
      companyId,
      title,
      value,
      stage,
      probability,
      expectedClose,
      source,
      description,
      assignedTo,
      tags = [],
      customFields
    } = req.body;

    // Verificar se o contato pertence ao tenant
    if (contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: contactId, tenantId }
      });
      if (!contact) {
        return res.status(400).json({ error: 'Contato não encontrado' });
      }
    }

    // Verificar se a empresa pertence ao tenant
    if (companyId) {
      const company = await prisma.company.findFirst({
        where: { id: companyId, tenantId }
      });
      if (!company) {
        return res.status(400).json({ error: 'Empresa não encontrada' });
      }
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        contactId,
        companyId,
        title,
        value: parseFloat(value),
        stage,
        probability: parseInt(probability),
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        source,
        description,
        assignedTo,
        tags,
        customFields
      },
      include: {
        contact: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    res.status(201).json(opportunity);
  } catch (error) {
    console.error('Erro ao criar oportunidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar oportunidade
export const updateOpportunity = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ [Backend] Erros de validação:', errors.array());
      return res.status(400).json({ 
        errors: errors.array(),
        message: errors.array().map(e => e.msg).join(', ')
      });
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

    // Verificar se a oportunidade existe e pertence ao tenant
    const existingOpportunity = await prisma.opportunity.findFirst({
      where: { id, tenantId }
    });

    if (!existingOpportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    const {
      contactId,
      companyId,
      title,
      value,
      stage,
      probability,
      expectedClose,
      actualClose,
      source,
      description,
      assignedTo,
      tags,
      customFields
    } = req.body;

    console.log('🔄 [Backend] Atualizando oportunidade:', {
      id,
      stage,
      body: req.body
    });

    // Verificar se o contato pertence ao tenant
    if (contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: contactId, tenantId }
      });
      if (!contact) {
        return res.status(400).json({ error: 'Contato não encontrado' });
      }
    }

    // Verificar se a empresa pertence ao tenant
    if (companyId) {
      const company = await prisma.company.findFirst({
        where: { id: companyId, tenantId }
      });
      if (!company) {
        return res.status(400).json({ error: 'Empresa não encontrada' });
      }
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: {
        contactId,
        companyId,
        title,
        value: value ? parseFloat(value) : undefined,
        stage,
        probability: probability ? parseInt(probability) : undefined,
        expectedClose: expectedClose ? new Date(expectedClose) : undefined,
        actualClose: actualClose ? new Date(actualClose) : undefined,
        source,
        description,
        assignedTo,
        tags,
        customFields
      },
      include: {
        contact: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    console.log('✅ [Backend] Oportunidade atualizada:', {
      id: opportunity.id,
      stage: opportunity.stage,
      title: opportunity.title
    });

    res.json(opportunity);
  } catch (error: any) {
    console.error('❌ [Backend] Erro ao atualizar oportunidade:', error);
    console.error('❌ [Backend] Mensagem:', error.message);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
};

// Deletar oportunidade
export const deleteOpportunity = async (req: Request, res: Response) => {
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

    // Verificar se a oportunidade existe e pertence ao tenant
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, tenantId }
    });

    if (!opportunity) {
      return res.status(404).json({ error: 'Oportunidade não encontrada' });
    }

    await prisma.opportunity.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar oportunidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas do pipeline
export const getPipelineStats = async (req: Request, res: Response) => {
  try {
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

    const [totalValue, wonValue, lostValue, stageStats] = await Promise.all([
      prisma.opportunity.aggregate({
        where: {
          tenantId,
          stage: {
            not: 'CLOSED_WON'
          }
        },
        _sum: {
          value: true
        }
      }),
      prisma.opportunity.aggregate({
        where: {
          tenantId,
          stage: 'CLOSED_WON'
        },
        _sum: {
          value: true
        }
      }),
      prisma.opportunity.aggregate({
        where: {
          tenantId,
          stage: 'CLOSED_LOST'
        },
        _sum: {
          value: true
        }
      }),
      prisma.opportunity.groupBy({
        by: ['stage'],
        where: { tenantId },
        _count: {
          id: true
        },
        _sum: {
          value: true
        }
      })
    ]);

    const conversionRate =
      totalValue._sum.value && wonValue._sum.value
        ? (wonValue._sum.value /
            (wonValue._sum.value + (lostValue._sum.value || 0))) *
          100
        : 0;

    res.json({
      pipeline: {
        totalValue: totalValue._sum.value || 0,
        wonValue: wonValue._sum.value || 0,
        lostValue: lostValue._sum.value || 0,
        conversionRate: Math.round(conversionRate * 100) / 100
      },
      stageStats: stageStats.map((stat) => ({
        stage: stat.stage,
        count: stat._count.id,
        value: stat._sum.value || 0
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do pipeline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
