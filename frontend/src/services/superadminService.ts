import { apiFetch } from '../config/api';

export interface CreateTenantRequest {
  // Dados da Empresa/Tenant
  companyName: string;
  slug: string;
  industry?: string;
  size?: 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE' | 'STARTUP';
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
  
  // Dados do Administrador
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  
  // Opcionais
  maxUsers?: number;
  maxWhatsappSessions?: number;
  tags?: string[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  _count?: {
    users: number;
    whatsappSessions: number;
    companies: number;
    contacts: number;
    leads: number;
  };
}

export const superadminService = {
  /**
   * Criar novo tenant/empresa
   */
  async createTenant(data: CreateTenantRequest) {
    const response = await apiFetch('/superadmin/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Erro ao criar empresa');
    }

    return response.json();
  },

  /**
   * Listar todos os tenants
   */
  async getTenants(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    ativo?: boolean;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.ativo !== undefined) queryParams.append('ativo', params.ativo.toString());

    const response = await apiFetch(`/superadmin/tenants?${queryParams.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao carregar empresas');
    }

    const data = await response.json();
    return {
      data: data.data as Tenant[],
      pagination: {
        total: data.total,
        page: data.page,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
      },
    };
  },

  /**
   * Ativar/Desativar tenant
   */
  async toggleTenantStatus(tenantId: string, ativo: boolean) {
    const response = await apiFetch(`/superadmin/tenants/${tenantId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ ativo }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar status');
    }

    return response.json();
  },
};

