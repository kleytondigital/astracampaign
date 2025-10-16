import { apiFetch } from '../config/api';

export interface Department {
  id: string;
  name: string;
  description?: string;
  color: string;
  active: boolean;
  users?: User[];
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  departmentId?: string;
}

export interface TransferChatRequest {
  chatId: string;
  departmentId?: string;
  userId?: string;
  notes?: string;
}

export const chatAssignmentsService = {
  // Listar departamentos disponíveis
  async getDepartments(): Promise<Department[]> {
    const response = await apiFetch('/departments');
    if (!response.ok) {
      throw new Error('Erro ao buscar departamentos');
    }
    const data = await response.json();
    return data.data || [];
  },

  // Listar usuários de um departamento
  async getDepartmentUsers(departmentId: string): Promise<User[]> {
    const response = await apiFetch(`/departments/${departmentId}/users`);
    if (!response.ok) {
      throw new Error('Erro ao buscar usuários do departamento');
    }
    const data = await response.json();
    return data.data || [];
  },

  // Transferir chat
  async transferChat(data: TransferChatRequest): Promise<void> {
    const response = await apiFetch('/chat-assignments/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao transferir chat');
    }
  },

  // Fechar chat
  async closeChat(chatId: string, notes?: string): Promise<void> {
    const response = await apiFetch(`/chat-assignments/close/${chatId}`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao fechar chat');
    }
  },

  // Atribuir chat a usuário
  async assignChat(chatId: string, userId: string, departmentId: string, notes?: string): Promise<void> {
    const response = await apiFetch('/chat-assignments/assign', {
      method: 'POST',
      body: JSON.stringify({ chatId, userId, departmentId, notes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atribuir chat');
    }
  },
};

