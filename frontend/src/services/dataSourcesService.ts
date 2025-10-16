import { apiFetch } from '../config/api';
import { DataSource, TestConnectionResult, SyncResult } from '../types';

export const dataSourcesService = {
  // Listar fontes de dados
  async getDataSources(): Promise<DataSource[]> {
    const response = await apiFetch('/data-sources');
    if (!response.ok) {
      throw new Error('Erro ao buscar fontes de dados');
    }
    const data = await response.json();
    return data.data || [];
  },

  // Obter fonte de dados por ID
  async getDataSourceById(id: string): Promise<DataSource> {
    const response = await apiFetch(`/data-sources/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar fonte de dados');
    }
    const data = await response.json();
    return data.data;
  },

  // Criar fonte de dados
  async createDataSource(data: {
    name: string;
    type: string;
    url: string;
    credentials?: any;
  }): Promise<DataSource> {
    const response = await apiFetch('/data-sources', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar fonte de dados');
    }

    const result = await response.json();
    return result.data;
  },

  // Atualizar fonte de dados
  async updateDataSource(id: string, data: {
    name?: string;
    type?: string;
    url?: string;
    credentials?: any;
    active?: boolean;
  }): Promise<DataSource> {
    const response = await apiFetch(`/data-sources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar fonte de dados');
    }

    const result = await response.json();
    return result.data;
  },

  // Deletar fonte de dados
  async deleteDataSource(id: string): Promise<void> {
    const response = await apiFetch(`/data-sources/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao deletar fonte de dados');
    }
  },

  // Testar conexão
  async testConnection(data: {
    url: string;
    credentials?: any;
  }): Promise<TestConnectionResult> {
    const response = await apiFetch('/data-sources/test-connection', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Erro ao testar conexão'
      };
    }

    const result = await response.json();
    return result.data;
  },

  // Sincronizar dados
  async syncDataSource(id: string): Promise<SyncResult> {
    const response = await apiFetch(`/data-sources/${id}/sync`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao sincronizar dados');
    }

    const result = await response.json();
    return result.data;
  },
};
