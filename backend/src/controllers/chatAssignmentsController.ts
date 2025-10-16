import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { websocketService } from '../services/websocketService';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

// ============================================================================
// ATRIBUIR CHAT PARA USUÁRIO
// ============================================================================
export const assignChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { chatId } = req.params;
    const { userId, departmentId, notes } = req.body;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!userId || !departmentId) {
      return res.status(400).json({ error: 'userId e departmentId são obrigatórios' });
    }

    // Verificar se o chat existe e pertence ao tenant
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        tenantId: user.tenantId
      },
      include: {
        assignedUser: {
          select: { id: true, nome: true, department: { select: { name: true } } }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Verificar se o usuário e departamento existem
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: user.tenantId,
        ativo: true
      },
      include: {
        department: true
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

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

    // Verificar se o usuário pertence ao departamento
    if (targetUser.departmentId !== departmentId) {
      return res.status(400).json({ error: 'Usuário não pertence ao departamento especificado' });
    }

    // Se há uma atribuição ativa, desativar ela
    const currentAssignment = await prisma.chatAssignment.findFirst({
      where: {
        chatId,
        status: 'ACTIVE'
      }
    });

    if (currentAssignment) {
      await prisma.chatAssignment.update({
        where: { id: currentAssignment.id },
        data: {
          status: 'TRANSFERRED',
          unassignedAt: new Date()
        }
      });
    }

    // Criar nova atribuição
    const assignment = await prisma.chatAssignment.create({
      data: {
        chatId,
        userId,
        departmentId,
        notes: notes?.trim() || null
      },
      include: {
        user: {
          select: { id: true, nome: true, email: true }
        },
        department: {
          select: { id: true, name: true, color: true }
        }
      }
    });

    // Atualizar o chat
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        assignedTo: userId,
        departmentId,
        serviceStatus: 'ACTIVE'
      }
    });

    // Notificar via WebSocket
    websocketService.emitToTenant(user.tenantId, 'chat:assigned', {
      chatId,
      assignment,
      previousAssignee: chat.assignedUser
    });

    res.json({
      success: true,
      data: assignment,
      message: `Chat atribuído para ${targetUser.nome} [${department.name}]`
    });
  } catch (error) {
    console.error('❌ Erro ao atribuir chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// TRANSFERIR CHAT ENTRE DEPARTAMENTOS
// ============================================================================
export const transferChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { chatId } = req.params;
    const { departmentId, userId, notes } = req.body;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!departmentId) {
      return res.status(400).json({ error: 'departmentId é obrigatório' });
    }

    // Verificar se o chat existe e pertence ao tenant
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        tenantId: user.tenantId
      },
      include: {
        assignedUser: {
          select: { id: true, nome: true, department: { select: { name: true } } }
        },
        department: true
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Verificar se o departamento de destino existe
    const targetDepartment = await prisma.department.findFirst({
      where: {
        id: departmentId,
        tenantId: user.tenantId,
        active: true
      }
    });

    if (!targetDepartment) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Se userId foi fornecido, verificar se pertence ao departamento
    let targetUser = null;
    if (userId) {
      targetUser = await prisma.user.findFirst({
        where: {
          id: userId,
          departmentId,
          tenantId: user.tenantId,
          ativo: true
        }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'Usuário não encontrado ou não pertence ao departamento' });
      }
    }

    // Desativar atribuição atual
    const currentAssignment = await prisma.chatAssignment.findFirst({
      where: {
        chatId,
        status: 'ACTIVE'
      }
    });

    if (currentAssignment) {
      await prisma.chatAssignment.update({
        where: { id: currentAssignment.id },
        data: {
          status: 'TRANSFERRED',
          unassignedAt: new Date(),
          notes: `Transferido para ${targetDepartment.name}${notes ? ` - ${notes}` : ''}`
        }
      });
    }

    // Criar nova atribuição se há usuário específico
    let newAssignment = null;
    if (targetUser) {
      newAssignment = await prisma.chatAssignment.create({
        data: {
          chatId,
          userId: targetUser.id,
          departmentId,
          notes: `Transferido de ${chat.department?.name || 'Sem departamento'}${notes ? ` - ${notes}` : ''}`
        },
        include: {
          user: {
            select: { id: true, nome: true, email: true }
          },
          department: {
            select: { id: true, name: true, color: true }
          }
        }
      });
    }

    // Atualizar o chat
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        assignedTo: targetUser?.id || null,
        departmentId,
        serviceStatus: targetUser ? 'ACTIVE' : 'WAITING'
      }
    });

    // Notificar via WebSocket
    websocketService.emitToTenant(user.tenantId, 'chat:transferred', {
      chatId,
      newAssignment,
      targetDepartment,
      previousDepartment: chat.department,
      previousAssignee: chat.assignedUser
    });

    res.json({
      success: true,
      data: {
        assignment: newAssignment,
        department: targetDepartment
      },
      message: `Chat transferido para ${targetDepartment.name}${targetUser ? ` - Atribuído para ${targetUser.nome}` : ''}`
    });
  } catch (error) {
    console.error('❌ Erro ao transferir chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// FECHAR CHAT
// ============================================================================
export const closeChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { chatId } = req.params;
    const { notes } = req.body;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o chat existe e pertence ao tenant
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        tenantId: user.tenantId
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Desativar atribuição atual
    const currentAssignment = await prisma.chatAssignment.findFirst({
      where: {
        chatId,
        status: 'ACTIVE'
      }
    });

    if (currentAssignment) {
      await prisma.chatAssignment.update({
        where: { id: currentAssignment.id },
        data: {
          status: 'CLOSED',
          unassignedAt: new Date(),
          notes: `Chat fechado${notes ? ` - ${notes}` : ''}`
        }
      });
    }

    // Atualizar o chat
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        status: 'RESOLVED',
        serviceStatus: 'CLOSED',
        assignedTo: null
      }
    });

    // Notificar via WebSocket
    websocketService.emitToTenant(user.tenantId, 'chat:closed', {
      chatId,
      closedBy: user.id
    });

    res.json({
      success: true,
      message: 'Chat fechado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao fechar chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// LISTAR ATRIBUIÇÕES DE CHAT
// ============================================================================
export const getChatAssignments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { chatId } = req.params;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o chat existe e pertence ao tenant
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        tenantId: user.tenantId
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    const assignments = await prisma.chatAssignment.findMany({
      where: { chatId },
      include: {
        user: {
          select: { id: true, nome: true, email: true }
        },
        department: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    console.error('❌ Erro ao listar atribuições:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// OBTER CHATS DISPONÍVEIS PARA ATRIBUIÇÃO
// ============================================================================
export const getAvailableChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { departmentId, status } = req.query;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // ADMIN pode ver todos os chats, USER só vê do seu departamento
    const where: any = {
      tenantId: user.tenantId,
      status: status === 'closed' ? 'RESOLVED' : 'OPEN'
    };

    if (user.role === 'USER' && user.departmentId) {
      where.departmentId = user.departmentId;
    } else if (departmentId) {
      where.departmentId = departmentId;
    }

    const chats = await prisma.chat.findMany({
      where,
      include: {
        assignedUser: {
          select: { id: true, nome: true, department: { select: { name: true, color: true } } }
        },
        department: {
          select: { id: true, name: true, color: true }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      take: 100
    });

    res.json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('❌ Erro ao listar chats disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
