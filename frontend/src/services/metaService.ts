import { apiFetch } from '../config/api';
import {
  MetaGlobalSettings,
  MetaConnectionStatus,
  MetaAdAccountFromAPI,
  MetaLinkAccountRequest,
  MetaGlobalSettingsForm,
  MetaDashboardData,
  MetaSyncResult,
  MetaSyncStatus
} from '../types/meta';

export const metaService = {
  // ============================================================================
  // CONFIGURAÇÕES GLOBAIS (SUPERADMIN)
  // ============================================================================

  /**
   * Obter configurações globais Meta
   */
  async getGlobalSettings(): Promise<MetaGlobalSettings | null> {
    const response = await apiFetch('/meta/admin/global');
    if (!response.ok) {
      throw new Error('Erro ao obter configurações Meta');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Salvar configurações globais Meta
   */
  async setGlobalSettings(settings: MetaGlobalSettingsForm): Promise<MetaGlobalSettings> {
    const response = await apiFetch('/meta/admin/global', {
      method: 'POST',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao salvar configurações Meta');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Testar conexão com Meta API
   */
  async testGlobalConnection(): Promise<any> {
    const response = await apiFetch('/meta/admin/test-connection');
    if (!response.ok) {
      throw new Error('Erro ao testar conexão Meta');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Obter estatísticas globais Meta
   */
  async getGlobalStats(): Promise<any> {
    const response = await apiFetch('/meta/admin/stats');
    if (!response.ok) {
      throw new Error('Erro ao obter estatísticas Meta');
    }
    const data = await response.json();
    return data.data;
  },

  // ============================================================================
  // GERENCIAMENTO POR TENANT
  // ============================================================================

  /**
   * Iniciar fluxo OAuth para o tenant
   */
  async startOAuthFlow(tenantId: string): Promise<{ authUrl: string; state: string }> {
    const response = await apiFetch(`/meta/tenant/${tenantId}/redirect`);
    if (!response.ok) {
      throw new Error('Erro ao iniciar fluxo OAuth');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Obter status da conexão Meta do tenant
   */
  async getConnectionStatus(tenantId: string): Promise<MetaConnectionStatus> {
    const response = await apiFetch(`/meta/tenant/${tenantId}/status`);
    if (!response.ok) {
      throw new Error('Erro ao obter status da conexão');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Listar contas de anúncios disponíveis
   */
  async listAccounts(tenantId: string): Promise<MetaAdAccountFromAPI[]> {
    const response = await apiFetch(`/meta/tenant/${tenantId}/accounts`);
    if (!response.ok) {
      throw new Error('Erro ao listar contas Meta');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Vincular conta Meta ao tenant
   */
  async linkAccount(tenantId: string, request: MetaLinkAccountRequest): Promise<any> {
    const response = await apiFetch(`/meta/tenant/${tenantId}/link-account`, {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao vincular conta Meta');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Desconectar tenant do Meta
   */
  async disconnect(tenantId: string): Promise<void> {
    const response = await apiFetch(`/meta/tenant/${tenantId}/disconnect`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao desconectar Meta');
    }
  },

  // ============================================================================
  // DASHBOARD E RELATÓRIOS
  // ============================================================================

  /**
   * Obter dados do dashboard Meta
   */
  async getDashboardData(tenantId: string, filters?: any): Promise<MetaDashboardData> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, String(value));
      });
    }

    const response = await apiFetch(`/meta/tenant/${tenantId}/dashboard?${params}`);
    if (!response.ok) {
      throw new Error('Erro ao obter dados do dashboard');
    }
    const data = await response.json();
    return data.data;
  },

  /**
   * Forçar sincronização de dados Meta
   */
  async forceSync(tenantId: string): Promise<MetaSyncResult> {
    const response = await apiFetch(`/meta/tenant/${tenantId}/sync`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao sincronizar dados Meta');
    }

    const data = await response.json();
    return data.data;
  },

  /**
   * Obter status da sincronização
   */
  async getSyncStatus(tenantId: string): Promise<MetaSyncStatus> {
    const response = await apiFetch(`/meta/tenant/${tenantId}/sync-status`);
    if (!response.ok) {
      throw new Error('Erro ao obter status da sincronização');
    }
    const data = await response.json();
    return data.data;
  },

  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================

  /**
   * Verificar se o tenant tem conexão Meta ativa
   */
  async hasActiveConnection(tenantId: string): Promise<boolean> {
    try {
      const status = await this.getConnectionStatus(tenantId);
      return status.connected && status.tokenValid;
    } catch (error) {
      return false;
    }
  },

  /**
   * Redirecionar para OAuth do Meta
   */
  redirectToMetaOAuth(authUrl: string): void {
    window.location.href = authUrl;
  },

  /**
   * Verificar se está no callback do OAuth
   */
  isOAuthCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') && urlParams.has('state');
  },

  /**
   * Extrair parâmetros do callback OAuth
   */
  getOAuthCallbackParams(): { code: string; state: string; error?: string } | null {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      return { code: '', state: '', error };
    }

    if (code && state) {
      return { code, state };
    }

    return null;
  },

  /**
   * Limpar URL do callback OAuth
   */
  clearOAuthCallback(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    url.searchParams.delete('error');
    window.history.replaceState({}, '', url.toString());
  }
};
