import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

// ============================================================================
// MÉTRICAS GERAIS DO TENANT
// ============================================================================
export const getTenantMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { period = '7d' } = req.query; // 1d, 7d, 30d, 90d
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Calcular período
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Métricas gerais
    const [
      totalChats,
      activeChats,
      closedChats,
      waitingChats,
      totalMessages,
      totalUsers,
      totalDepartments
    ] = await Promise.all([
      // Total de chats no período
      prisma.chat.count({
        where: {
          tenantId: user.tenantId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Chats ativos
      prisma.chat.count({
        where: {
          tenantId: user.tenantId,
          serviceStatus: 'ACTIVE'
        }
      }),
      
      // Chats fechados no período
      prisma.chat.count({
        where: {
          tenantId: user.tenantId,
          status: 'RESOLVED',
          updatedAt: { gte: startDate }
        }
      }),
      
      // Chats aguardando
      prisma.chat.count({
        where: {
          tenantId: user.tenantId,
          serviceStatus: 'WAITING'
        }
      }),
      
      // Total de mensagens no período
      prisma.message.count({
        where: {
          chat: {
            tenantId: user.tenantId
          },
          createdAt: { gte: startDate }
        }
      }),
      
      // Total de usuários ativos
      prisma.user.count({
        where: {
          tenantId: user.tenantId,
          ativo: true
        }
      }),
      
      // Total de departamentos ativos
      prisma.department.count({
        where: {
          tenantId: user.tenantId,
          active: true
        }
      })
    ]);

    // Métricas por departamento
    const departmentMetrics = await prisma.department.findMany({
      where: {
        tenantId: user.tenantId,
        active: true
      },
      include: {
        _count: {
          select: {
            users: true,
            chats: {
              where: {
                createdAt: { gte: startDate }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Top usuários por mensagens enviadas
    const topUsers = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        ativo: true,
        sentMessages: {
          some: {
            createdAt: { gte: startDate }
          }
        }
      },
      include: {
        department: {
          select: { name: true, color: true }
        },
        _count: {
          select: {
            sentMessages: {
              where: {
                createdAt: { gte: startDate }
              }
            }
          }
        }
      },
      orderBy: {
        sentMessages: {
          _count: 'desc'
        }
      },
      take: 10
    });

    // Gráfico de mensagens por dia (últimos 7 dias)
    const dailyMessages = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM messages 
      WHERE chat_id IN (
        SELECT id FROM chats WHERE tenant_id = ${user.tenantId}
      )
      AND created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    res.json({
      success: true,
      data: {
        period,
        overview: {
          totalChats,
          activeChats,
          closedChats,
          waitingChats,
          totalMessages,
          totalUsers,
          totalDepartments
        },
        departmentMetrics,
        topUsers,
        dailyMessages
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter métricas do tenant:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// MÉTRICAS POR DEPARTAMENTO
// ============================================================================
export const getDepartmentMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { departmentId } = req.params;
    const { period = '7d' } = req.query;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o departamento existe e pertence ao tenant
    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId: user.tenantId,
        active: true
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Calcular período
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Métricas do departamento
    const [
      totalChats,
      activeChats,
      closedChats,
      totalMessages,
      avgResponseTime,
      avgResolutionTime
    ] = await Promise.all([
      // Total de chats
      prisma.chat.count({
        where: {
          departmentId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Chats ativos
      prisma.chat.count({
        where: {
          departmentId,
          serviceStatus: 'ACTIVE'
        }
      }),
      
      // Chats fechados
      prisma.chat.count({
        where: {
          departmentId,
          status: 'RESOLVED',
          updatedAt: { gte: startDate }
        }
      }),
      
      // Total de mensagens
      prisma.message.count({
        where: {
          chat: {
            departmentId
          },
          createdAt: { gte: startDate }
        }
      }),
      
      // Tempo médio de resposta (simulado - seria calculado baseado em métricas reais)
      prisma.chatMetrics.aggregate({
        where: {
          departmentId,
          date: { gte: startDate }
        },
        _avg: {
          responseTime: true
        }
      }),
      
      // Tempo médio de resolução
      prisma.chatMetrics.aggregate({
        where: {
          departmentId,
          date: { gte: startDate }
        },
        _avg: {
          resolutionTime: true
        }
      })
    ]);

    // Usuários do departamento com métricas
    const departmentUsers = await prisma.user.findMany({
      where: {
        departmentId,
        tenantId: user.tenantId,
        ativo: true
      },
      include: {
        _count: {
          select: {
            sentMessages: {
              where: {
                createdAt: { gte: startDate }
              }
            },
            assignedChats: {
              where: {
                createdAt: { gte: startDate }
              }
            }
          }
        }
      },
      orderBy: {
        sentMessages: {
          _count: 'desc'
        }
      }
    });

    res.json({
      success: true,
      data: {
        department,
        period,
        metrics: {
          totalChats,
          activeChats,
          closedChats,
          totalMessages,
          avgResponseTime: avgResponseTime._avg.responseTime || 0,
          avgResolutionTime: avgResolutionTime._avg.resolutionTime || 0
        },
        users: departmentUsers
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter métricas do departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// MÉTRICAS POR USUÁRIO
// ============================================================================
export const getUserMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { userId } = req.params;
    const { period = '7d' } = req.query;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o usuário existe e pertence ao tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: user.tenantId,
        ativo: true
      },
      include: {
        department: {
          select: { name: true, color: true }
        }
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Calcular período
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Métricas do usuário
    const [
      totalChats,
      activeChats,
      closedChats,
      totalMessages,
      avgResponseTime
    ] = await Promise.all([
      // Total de chats atribuídos
      prisma.chat.count({
        where: {
          assignedTo: userId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Chats ativos
      prisma.chat.count({
        where: {
          assignedTo: userId,
          serviceStatus: 'ACTIVE'
        }
      }),
      
      // Chats fechados
      prisma.chat.count({
        where: {
          assignedTo: userId,
          status: 'RESOLVED',
          updatedAt: { gte: startDate }
        }
      }),
      
      // Total de mensagens enviadas
      prisma.message.count({
        where: {
          sentBy: userId,
          createdAt: { gte: startDate }
        }
      }),
      
      // Tempo médio de resposta
      prisma.chatMetrics.aggregate({
        where: {
          userId,
          date: { gte: startDate }
        },
        _avg: {
          responseTime: true
        }
      })
    ]);

    // Atividades recentes
    const recentActivities = await prisma.chatAssignment.findMany({
      where: {
        userId,
        assignedAt: { gte: startDate }
      },
      include: {
        chat: {
          select: {
            id: true,
            phone: true,
            contactName: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      },
      take: 10
    });

    res.json({
      success: true,
      data: {
        user: targetUser,
        period,
        metrics: {
          totalChats,
          activeChats,
          closedChats,
          totalMessages,
          avgResponseTime: avgResponseTime._avg.responseTime || 0
        },
        recentActivities
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter métricas do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
