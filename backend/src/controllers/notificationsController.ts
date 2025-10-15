import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId?: string;
  };
}

export const getAllNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await prisma.cRMNotification.findMany({
      where: {
        userId,
        ...(unreadOnly && { read: false })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50 // Limitar a 50 notificações mais recentes
    });

    res.json(notifications);
  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const count = await prisma.cRMNotification.count({
      where: {
        userId,
        read: false
      }
    });

    res.json({ count });
  } catch (error: any) {
    console.error('Erro ao buscar contagem:', error);
    res.status(500).json({ error: 'Erro ao buscar contagem' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const notification = await prisma.cRMNotification.update({
      where: {
        id,
        userId // Garantir que só pode marcar suas próprias notificações
      },
      data: {
        read: true
      }
    });

    res.json(notification);
  } catch (error: any) {
    console.error('Erro ao marcar como lida:', error);
    res.status(500).json({ error: 'Erro ao marcar como lida' });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    await prisma.cRMNotification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    await prisma.cRMNotification.delete({
      where: {
        id,
        userId // Garantir que só pode excluir suas próprias notificações
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir notificação:', error);
    res.status(500).json({ error: 'Erro ao excluir notificação' });
  }
};

// Função auxiliar para criar notificações (chamada por outros serviços)
export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) => {
  try {
    const notification = await prisma.cRMNotification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        read: false
      }
    });

    // Emitir via WebSocket (opcional)
    // websocketService.emitToUser(userId, 'notification', notification);

    return notification;
  } catch (error: any) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};
