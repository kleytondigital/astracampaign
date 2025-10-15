import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Listar leads com filtros e paginação
export const getLeads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      search = '',
      status = '',
      source = '',
      assignedTo = ''
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

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    // Construir filtros
    const where: any = {
      tenantId
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    // Buscar leads
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take,
        include: {
          assignedUser: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          convertedToContact: {
            select: {
              id: true,
              nome: true,
              telefone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.lead.count({ where })
    ]);

    res.json({
      data: leads,
      pagination: {
        total,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(total / parseInt(pageSize as string))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter lead por ID
export const getLeadById = async (req: AuthenticatedRequest, res: Response) => {
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

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        convertedToContact: {
          select: {
            id: true,
            nome: true,
            telefone: true
          }
        }
      }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    res.json(lead);
  } catch (error) {
    console.error('Erro ao buscar lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar novo lead
export const createLead = async (req: AuthenticatedRequest, res: Response) => {
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
      firstName,
      lastName,
      email,
      phone,
      company,
      source,
      status,
      score,
      tags,
      customFields,
      assignedTo
    } = req.body;

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        firstName,
        lastName,
        email,
        phone,
        company,
        source,
        status: status || 'NEW',
        score: score || 0,
        tags: tags || [],
        customFields,
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

    res.status(201).json(lead);
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar lead
export const updateLead = async (req: AuthenticatedRequest, res: Response) => {
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
      firstName,
      lastName,
      email,
      phone,
      company,
      source,
      status,
      score,
      tags,
      customFields,
      assignedTo
    } = req.body;

    // Verificar se o lead pertence ao tenant
    const existingLead = await prisma.lead.findFirst({
      where: { id, tenantId }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        source,
        status,
        score,
        tags,
        customFields,
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

    res.json(lead);
  } catch (error) {
    console.error('Erro ao atualizar lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar lead
export const deleteLead = async (req: AuthenticatedRequest, res: Response) => {
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

    // Verificar se o lead pertence ao tenant
    const existingLead = await prisma.lead.findFirst({
      where: { id, tenantId }
    });

    if (!existingLead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    await prisma.lead.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Converter lead em contato
export const convertLeadToContact = async (
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

    // Buscar o lead
    const lead = await prisma.lead.findFirst({
      where: { id, tenantId }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead não encontrado' });
    }

    if (lead.status === 'CONVERTED') {
      return res.status(400).json({ error: 'Lead já foi convertido' });
    }

    // Criar contato a partir do lead
    const contact = await prisma.contact.create({
      data: {
        tenantId,
        nome: `${lead.firstName} ${lead.lastName}`,
        telefone: lead.phone || '',
        email: lead.email,
        tags: lead.tags
      }
    });

    // Atualizar lead como convertido
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
        convertedToContactId: contact.id
      },
      include: {
        convertedToContact: {
          select: {
            id: true,
            nome: true,
            telefone: true
          }
        }
      }
    });

    res.json({
      lead: updatedLead,
      contact
    });
  } catch (error) {
    console.error('Erro ao converter lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas de leads
export const getLeadsStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    // Estatísticas por status
    const statusStats = await prisma.lead.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: {
        id: true
      }
    });

    // Estatísticas por fonte
    const sourceStats = await prisma.lead.groupBy({
      by: ['source'],
      where: { tenantId },
      _count: {
        id: true
      }
    });

    // Total de leads
    const totalLeads = await prisma.lead.count({
      where: { tenantId }
    });

    // Leads convertidos
    const convertedLeads = await prisma.lead.count({
      where: {
        tenantId,
        status: 'CONVERTED'
      }
    });

    // Taxa de conversão
    const conversionRate =
      totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    // Score médio
    const avgScore = await prisma.lead.aggregate({
      where: { tenantId },
      _avg: {
        score: true
      }
    });

    res.json({
      statusStats: statusStats.map((stat) => ({
        status: stat.status,
        count: stat._count.id
      })),
      sourceStats: sourceStats.map((stat) => ({
        source: stat.source,
        count: stat._count.id
      })),
      totalLeads,
      convertedLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageScore: Math.round((avgScore._avg.score || 0) * 100) / 100
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de leads:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};




