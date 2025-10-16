import { api } from './api';
import { apiFetch } from '../config/api';
import {
  Chat,
  ChatsResponse,
  ChatResponse,
  ChatStatsResponse,
  Message,
  ChatStatus,
} from '../types';

// ============================================================================
// CHATS SERVICE
// ============================================================================

export const chatsService = {
  // Listar chats
  async getChats(params?: {
    page?: number;
    pageSize?: number;
    status?: ChatStatus | string;
    assignedTo?: string;
    search?: string;
    unreadOnly?: boolean;
  }): Promise<ChatsResponse> {
    const response = await api.get<ChatsResponse>('/chats', { params });
    return response.data;
  },

  // Obter chat por ID com mensagens
  async getChatById(
    id: string,
    params?: {
      messagesPage?: number;
      messagesPageSize?: number;
    }
  ): Promise<ChatResponse> {
    const response = await api.get<ChatResponse>(`/chats/${id}`, { params });
    return response.data;
  },

  // Upload de arquivo de mídia (reutilizando lógica existente)
  async uploadMedia(file: File): Promise<{
    success: boolean;
    data: {
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
      mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'VOICE' | 'DOCUMENT';
      url: string;
    };
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await apiFetch('/media/upload', {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao fazer upload do arquivo');
    }

    const data = await response.json();

    console.log('📤 [Upload] Resposta do backend:', data);

    // Mapear resposta do sistema existente para o formato esperado
    const uploadResult = {
      success: true,
      data: {
        filename: data.data.filename || file.name,
        originalname: data.data.originalname || file.name,
        mimetype: data.data.mimetype || file.type,
        size: data.data.size || file.size,
        mediaType:
          data.data.mediaType || chatsService.getMediaType(data.data.mimetype || file.type),
        url: data.data.url || data.data.fileUrl,
      },
    };

    console.log('✅ [Upload] Resultado mapeado:', uploadResult);

    return uploadResult;
  },

  // Função auxiliar para determinar tipo de mídia
  getMediaType(mimetype: string): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'VOICE' | 'DOCUMENT' {
    if (mimetype.startsWith('image/')) return 'IMAGE';
    if (mimetype.startsWith('video/')) return 'VIDEO';
    if (mimetype.startsWith('audio/')) return 'AUDIO';
    return 'DOCUMENT';
  },

  // Enviar mensagem
  async sendMessage(
    chatId: string,
    data: {
      body?: string;
      type?: string;
      mediaUrl?: string;
    }
  ): Promise<{ success: boolean; message: Message; whatsappResult?: any }> {
    const response = await api.post<{
      success: boolean;
      message: Message;
      whatsappResult?: any;
    }>(`/chats/${chatId}/messages`, data);
    return response.data;
  },

  // Atribuir chat a um usuário
  async assignChat(chatId: string, assignedTo: string): Promise<{ success: boolean; chat: Chat }> {
    const response = await api.patch<{ success: boolean; chat: Chat }>(`/chats/${chatId}/assign`, {
      assignedTo,
    });
    return response.data;
  },

  // Marcar chat como lido
  async markChatAsRead(chatId: string): Promise<{ success: boolean; chat: Chat }> {
    const response = await api.patch<{ success: boolean; chat: Chat }>(
      `/chats/${chatId}/mark-read`,
      {}
    );
    return response.data;
  },

  // Atualizar status do chat
  async updateChatStatus(
    chatId: string,
    status: ChatStatus
  ): Promise<{ success: boolean; chat: Chat }> {
    const response = await api.patch<{ success: boolean; chat: Chat }>(`/chats/${chatId}/status`, {
      status,
    });
    return response.data;
  },

  // Criar lead a partir do chat
  async createLeadFromChat(
    chatId: string,
    data: {
      firstName: string;
      lastName: string;
      email?: string;
      company?: string;
      score?: number;
    }
  ): Promise<{ success: boolean; lead: any; message: string }> {
    const response = await api.post<{
      success: boolean;
      lead: any;
      message: string;
    }>(`/chats/${chatId}/create-lead`, data);
    return response.data;
  },

  // Obter estatísticas de chats
  async getStats(): Promise<ChatStatsResponse> {
    const response = await api.get<ChatStatsResponse>('/chats/stats');
    return response.data;
  },

  // Sincronizar chats da Evolution API
  async syncChatsFromEvolution(instanceName: string): Promise<{
    success: boolean;
    syncedCount: number;
    message: string;
  }> {
    const response = await api.post<{
      success: boolean;
      syncedCount: number;
      message: string;
    }>(`/chats/sync/${instanceName}`);
    return response.data;
  },
};
