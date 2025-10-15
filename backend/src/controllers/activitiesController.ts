import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

// Listar atividades com filtros e paginação
export const getActivities = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '10',
      search = '',
      type = '',
      status = '',
      priority = '',
      assignedTo = '',
      contactId = '',
      opportunityId = ''
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
        { subject: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
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
          opportunity: {
            select: {
              id: true,
              title: true,
              value: true,
              stage: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // Pendentes primeiro
          { priority: 'desc' }, // Alta prioridade primeiro
          { dueDate: 'asc' }, // Mais próximas do vencimento
          { createdAt: 'desc' }
        ],
        skip,
        take: pageSizeNum
      }),
      prisma.activity.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSizeNum);

    res.json({
      activities,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages
    });
  } catch (error) {
    console.error('Erro ao buscar atividades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter atividade por ID
export const getActivityById = async (req: Request, res: Response) => {
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

    const activity = await prisma.activity.findFirst({
      where: {
        id,
        tenantId
      },
      include: {
        contact: true,
        opportunity: true,
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    res.json(activity);
  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar nova atividade
export const createActivity = async (req: Request, res: Response) => {
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
      opportunityId,
      type,
      subject,
      description,
      dueDate,
      assignedTo,
      priority = 'MEDIUM',
      status = 'PENDING',
      metadata
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

    // Verificar se a oportunidade pertence ao tenant
    if (opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: opportunityId, tenantId }
      });
      if (!opportunity) {
        return res.status(400).json({ error: 'Oportunidade não encontrada' });
      }
    }

    // Verificar se o usuário atribuído pertence ao tenant
    const assignedUser = await prisma.user.findFirst({
      where: { id: assignedTo, tenantId }
    });
    if (!assignedUser) {
      return res
        .status(400)
        .json({ error: 'Usuário atribuído não encontrado' });
    }

    const activity = await prisma.activity.create({
      data: {
        tenantId,
        contactId,
        opportunityId,
        type,
        subject,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedTo,
        priority,
        status,
        metadata
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
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true
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

    res.status(201).json(activity);
  } catch (error) {
    console.error('Erro ao criar atividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar atividade
export const updateActivity = async (req: Request, res: Response) => {
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

    // Verificar se a atividade existe e pertence ao tenant
    const existingActivity = await prisma.activity.findFirst({
      where: { id, tenantId }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    const {
      contactId,
      opportunityId,
      type,
      subject,
      description,
      dueDate,
      assignedTo,
      priority,
      status,
      metadata
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

    // Verificar se a oportunidade pertence ao tenant
    if (opportunityId) {
      const opportunity = await prisma.opportunity.findFirst({
        where: { id: opportunityId, tenantId }
      });
      if (!opportunity) {
        return res.status(400).json({ error: 'Oportunidade não encontrada' });
      }
    }

    // Verificar se o usuário atribuído pertence ao tenant
    if (assignedTo) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: assignedTo, tenantId }
      });
      if (!assignedUser) {
        return res
          .status(400)
          .json({ error: 'Usuário atribuído não encontrado' });
      }
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        contactId,
        opportunityId,
        type,
        subject,
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo,
        priority,
        status,
        metadata,
        // Se marcando como concluída, definir completedAt
        completedAt:
          status === 'COMPLETED' && !existingActivity.completedAt
            ? new Date()
            : status !== 'COMPLETED'
              ? null
              : existingActivity.completedAt
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
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true
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

    res.json(activity);
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Marcar atividade como concluída
export const completeActivity = async (req: Request, res: Response) => {
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

    // Verificar se a atividade existe e pertence ao tenant
    const existingActivity = await prisma.activity.findFirst({
      where: { id, tenantId }
    });

    if (!existingActivity) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    const activity = await prisma.activity.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
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
        opportunity: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true
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

    res.json(activity);
  } catch (error) {
    console.error('Erro ao concluir atividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Deletar atividade
export const deleteActivity = async (req: Request, res: Response) => {
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

    // Verificar se a atividade existe e pertence ao tenant
    const activity = await prisma.activity.findFirst({
      where: { id, tenantId }
    });

    if (!activity) {
      return res.status(404).json({ error: 'Atividade não encontrada' });
    }

    await prisma.activity.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar atividade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas de atividades
export const getActivityStats = async (req: Request, res: Response) => {
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

    const [totalActivities, completedToday, overdue, byType, byPriority] =
      await Promise.all([
        prisma.activity.count({
          where: { tenantId }
        }),
        prisma.activity.count({
          where: {
            tenantId,
            status: 'COMPLETED',
            completedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }),
        prisma.activity.count({
          where: {
            tenantId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            dueDate: {
              lt: new Date()
            }
          }
        }),
        prisma.activity.groupBy({
          by: ['type'],
          where: { tenantId },
          _count: {
            id: true
          }
        }),
        prisma.activity.groupBy({
          by: ['priority'],
          where: { tenantId },
          _count: {
            id: true
          }
        })
      ]);

    res.json({
      totalActivities,
      completedToday,
      overdue,
      byType: byType.map((stat) => ({
        type: stat.type,
        count: stat._count.id
      })),
      byPriority: byPriority.map((stat) => ({
        priority: stat.priority,
        count: stat._count.id
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de atividades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter timeline de atividades
export const getActivityTimeline = async (req: Request, res: Response) => {
  try {
    const { contactId = '', opportunityId = '', limit = '50' } = req.query;

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

    const where: any = {
      tenantId
    };

    if (contactId) {
      where.contactId = contactId;
    }

    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        contact: {
          select: {
            id: true,
            nome: true,
            telefone: true
          }
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            stage: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json(activities);
  } catch (error) {
    console.error('Erro ao buscar timeline de atividades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
