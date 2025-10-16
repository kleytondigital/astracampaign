import { apiFetch } from '../config/api';
import { Report, ReportData } from '../types';

export const reportsService = {
  // Listar relatórios
  async getReports(): Promise<Report[]> {
    const response = await apiFetch('/reports');
    if (!response.ok) {
      throw new Error('Erro ao buscar relatórios');
    }
    const data = await response.json();
    return data.data || [];
  },

  // Obter relatório por ID
  async getReportById(id: string): Promise<Report> {
    const response = await apiFetch(`/reports/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar relatório');
    }
    const data = await response.json();
    return data.data;
  },

  // Criar relatório
  async createReport(data: {
    name: string;
    type: 'DASHBOARD' | 'SUMMARY' | 'CUSTOM';
    dataSourceId?: string;
    config?: any;
    isPublic?: boolean;
  }): Promise<Report> {
    const response = await apiFetch('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar relatório');
    }

    const result = await response.json();
    return result.data;
  },

  // Atualizar relatório
  async updateReport(id: string, data: {
    name?: string;
    type?: 'DASHBOARD' | 'SUMMARY' | 'CUSTOM';
    dataSourceId?: string;
    config?: any;
    isPublic?: boolean;
  }): Promise<Report> {
    const response = await apiFetch(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar relatório');
    }

    const result = await response.json();
    return result.data;
  },

  // Deletar relatório
  async deleteReport(id: string): Promise<void> {
    const response = await apiFetch(`/reports/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao deletar relatório');
    }
  },

  // Obter dados do relatório
  async getReportData(
    id: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      campaigns?: string[];
      dataSourceId?: string;
      groupBy?: 'day' | 'week' | 'month';
    }
  ): Promise<ReportData> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.campaigns) params.append('campaigns', filters.campaigns.join(','));
    if (filters?.dataSourceId) params.append('dataSourceId', filters.dataSourceId);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const queryString = params.toString();
    const url = queryString ? `/reports/${id}/data?${queryString}` : `/reports/${id}/data`;

    const response = await apiFetch(url);
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do relatório');
    }
    const data = await response.json();
    return data.data;
  },

  // Obter relatório público (por token)
  async getPublicReport(token: string): Promise<Report> {
    const response = await apiFetch(`/reports/public/${token}`);
    if (!response.ok) {
      throw new Error('Relatório não encontrado ou não é público');
    }
    const data = await response.json();
    return data.data;
  },

  // Obter dados do relatório público
  async getPublicReportData(
    token: string,
    filters?: {
      startDate?: string;
      endDate?: string;
      campaigns?: string[];
      dataSourceId?: string;
      groupBy?: 'day' | 'week' | 'month';
    }
  ): Promise<ReportData> {
    const params = new URLSearchParams();
    
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.campaigns) params.append('campaigns', filters.campaigns.join(','));
    if (filters?.dataSourceId) params.append('dataSourceId', filters.dataSourceId);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);

    const queryString = params.toString();
    const url = queryString ? `/reports/public/${token}/data?${queryString}` : `/reports/public/${token}/data`;

    const response = await apiFetch(url);
    if (!response.ok) {
      throw new Error('Erro ao buscar dados do relatório público');
    }
    const data = await response.json();
    return data.data;
  },
};
