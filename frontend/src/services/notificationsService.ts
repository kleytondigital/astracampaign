import { api } from './api';

export interface Notification {
  id: string;
  type: 'activity_overdue' | 'opportunity_won' | 'opportunity_lost' | 'lead_new' | 'lead_converted';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

class NotificationsService {
  async getAll(unreadOnly: boolean = false): Promise<Notification[]> {
    try {
      const response = await api.get(`/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
      return response.data || [];
    } catch (error: any) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.count || 0;
    } catch (error: any) {
      console.error('Erro ao buscar contagem de não lidas:', error);
      return 0;
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/read-all');
    } catch (error: any) {
      console.error('Erro ao marcar todas como lidas:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/notifications/${id}`);
    } catch (error: any) {
      console.error('Erro ao excluir notificação:', error);
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();

