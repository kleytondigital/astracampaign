import { api } from './api';
import {
  Opportunity,
  OpportunityInput,
  OpportunitiesResponse,
  Company,
  CompanyInput,
  CompaniesResponse,
  Activity,
  ActivityInput,
  ActivitiesResponse,
  Lead,
  LeadInput,
  LeadsResponse,
} from '../types';

// ============================================================================
// OPPORTUNITIES SERVICE
// ============================================================================

export const opportunitiesService = {
  // Listar oportunidades
  async getOpportunities(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    stage?: string;
    assignedTo?: string;
    contactId?: string;
    companyId?: string;
  }): Promise<OpportunitiesResponse> {
    const response = await api.get('/opportunities', { params });
    return response.data;
  },

  // Obter oportunidade por ID
  async getOpportunityById(id: string): Promise<Opportunity> {
    const response = await api.get(`/opportunities/${id}`);
    return response.data;
  },

  // Criar oportunidade
  async createOpportunity(data: OpportunityInput): Promise<Opportunity> {
    const response = await api.post('/opportunities', data);
    return response.data;
  },

  // Atualizar oportunidade
  async updateOpportunity(id: string, data: Partial<OpportunityInput>): Promise<Opportunity> {
    const response = await api.put(`/opportunities/${id}`, data);
    return response.data;
  },

  // Deletar oportunidade
  async deleteOpportunity(id: string): Promise<void> {
    await api.delete(`/opportunities/${id}`);
  },

  // Obter estatísticas do pipeline
  async getPipelineStats(): Promise<{
    pipeline: {
      totalValue: number;
      wonValue: number;
      lostValue: number;
      conversionRate: number;
    };
    stageStats: Array<{
      stage: string;
      count: number;
      value: number;
    }>;
  }> {
    const response = await api.get('/opportunities/stats');
    return response.data;
  },
};

// ============================================================================
// COMPANIES SERVICE
// ============================================================================

export const companiesService = {
  // Listar empresas
  async getCompanies(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    industry?: string;
    size?: string;
    assignedTo?: string;
  }): Promise<CompaniesResponse> {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  // Obter empresa por ID
  async getCompanyById(id: string): Promise<Company> {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Criar empresa
  async createCompany(data: CompanyInput): Promise<Company> {
    const response = await api.post('/companies', data);
    return response.data;
  },

  // Atualizar empresa
  async updateCompany(id: string, data: Partial<CompanyInput>): Promise<Company> {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  // Deletar empresa
  async deleteCompany(id: string): Promise<void> {
    await api.delete(`/companies/${id}`);
  },
};

// ============================================================================
// ACTIVITIES SERVICE
// ============================================================================

export const activitiesService = {
  // Listar atividades
  async getActivities(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    type?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    contactId?: string;
    opportunityId?: string;
  }): Promise<ActivitiesResponse> {
    const response = await api.get('/activities', { params });
    return response.data;
  },

  // Obter atividade por ID
  async getActivityById(id: string): Promise<Activity> {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  // Criar atividade
  async createActivity(data: ActivityInput): Promise<Activity> {
    const response = await api.post('/activities', data);
    return response.data;
  },

  // Atualizar atividade
  async updateActivity(id: string, data: Partial<ActivityInput>): Promise<Activity> {
    const response = await api.put(`/activities/${id}`, data);
    return response.data;
  },

  // Deletar atividade
  async deleteActivity(id: string): Promise<void> {
    await api.delete(`/activities/${id}`);
  },

  // Marcar atividade como concluída
  async completeActivity(id: string): Promise<Activity> {
    const response = await api.patch(`/activities/${id}/complete`);
    return response.data;
  },
};

// ============================================================================
// LEADS SERVICE
// ============================================================================

export const leadsService = {
  // Listar leads
  async getLeads(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    source?: string;
    assignedTo?: string;
  }): Promise<LeadsResponse> {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  // Obter lead por ID
  async getLeadById(id: string): Promise<Lead> {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  // Criar lead
  async createLead(data: LeadInput): Promise<Lead> {
    const response = await api.post('/leads', data);
    return response.data;
  },

  // Atualizar lead
  async updateLead(id: string, data: Partial<LeadInput>): Promise<Lead> {
    const response = await api.put(`/leads/${id}`, data);
    return response.data;
  },

  // Deletar lead
  async deleteLead(id: string): Promise<void> {
    await api.delete(`/leads/${id}`);
  },

  // Converter lead em contato
  async convertLead(id: string): Promise<{ lead: Lead; contact: any }> {
    const response = await api.post(`/leads/${id}/convert`, {});
    return response.data;
  },

  // Obter estatísticas de leads
  async getLeadsStats(): Promise<{
    statusStats: Array<{ status: string; count: number }>;
    sourceStats: Array<{ source: string; count: number }>;
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    averageScore: number;
  }> {
    const response = await api.get('/leads/stats');
    return response.data;
  },
};
