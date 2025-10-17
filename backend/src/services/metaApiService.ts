import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { decrypt } from '../utils/encryption';

export interface MetaGlobalSettings {
  appId: string;
  appSecretEnc: string;
  redirectUri: string;
  apiVersion?: string; // Versão da Graph API (v19.0 até v24.0)
  scopes: string;
}

export interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  timezone_name: string;
  account_status: number;
  business_name?: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: string;
  optimization_goal: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  end_time?: string;
  campaign_id: string;
}

export interface MetaAd {
  id: string;
  name: string;
  status: string;
  creative: any;
  adset_id: string;
  campaign_id: string;
}

export interface MetaInsight {
  impressions: string;
  clicks: string;
  spend: string;
  reach: string;
  frequency: string;
  ctr: string;
  cpc: string;
  cpm: string;
  cpp?: string;
  conversions?: string;
  conversion_rate?: string;
  roas?: string;
  date_start: string;
  date_stop: string;
}

export class MetaApiService {
  private client: AxiosInstance;
  private globalSettings: MetaGlobalSettings;

  constructor(globalSettings: MetaGlobalSettings) {
    this.globalSettings = globalSettings;
    const apiVersion = globalSettings.apiVersion || 'v21.0';
    this.client = axios.create({
      baseURL: `https://graph.facebook.com/${apiVersion}`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    console.log(`🌐 MetaApiService criado com Graph API ${apiVersion}`);
  }

  /**
   * Troca código OAuth por token de acesso
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<MetaTokenResponse> {
    try {
      const appSecret = decrypt(this.globalSettings.appSecretEnc);
      
      const response = await this.client.get('/oauth/access_token', {
        params: {
          client_id: this.globalSettings.appId,
          redirect_uri: redirectUri,
          client_secret: appSecret,
          code: code,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao trocar código por token:', error);
      throw new Error('Falha na troca de código por token');
    }
  }

  /**
   * Converte token de curta duração para longa duração
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaTokenResponse> {
    try {
      const appSecret = decrypt(this.globalSettings.appSecretEnc);
      
      const response = await this.client.get('/oauth/access_token', {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: this.globalSettings.appId,
          client_secret: appSecret,
          fb_exchange_token: shortLivedToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao converter para token de longa duração:', error);
      throw new Error('Falha na conversão para token de longa duração');
    }
  }

  /**
   * Lista contas de anúncios do usuário
   */
  async listAdAccounts(accessToken: string): Promise<MetaAdAccount[]> {
    try {
      const response = await this.client.get('/me/adaccounts', {
        params: {
          access_token: accessToken,
          fields: 'id,name,currency,timezone_name,account_status,business_name',
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar contas de anúncios:', error);
      throw new Error('Falha ao listar contas de anúncios');
    }
  }

  /**
   * Lista campanhas de uma conta
   */
  async listCampaigns(accountId: string, accessToken: string, since?: string, until?: string): Promise<MetaCampaign[]> {
    try {
      const params: any = {
        access_token: accessToken,
        fields: 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time',
      };

      if (since) {
        params.time_range = JSON.stringify({ since, until });
      }

      const response = await this.client.get(`/${accountId}/campaigns`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar campanhas:', error);
      throw new Error('Falha ao listar campanhas');
    }
  }

  /**
   * Lista conjuntos de anúncios de uma conta
   */
  async listAdSets(accountId: string, accessToken: string, since?: string, until?: string): Promise<MetaAdSet[]> {
    try {
      const params: any = {
        access_token: accessToken,
        fields: 'id,name,status,optimization_goal,daily_budget,lifetime_budget,start_time,end_time,campaign_id',
      };

      if (since) {
        params.time_range = JSON.stringify({ since, until });
      }

      const response = await this.client.get(`/${accountId}/adsets`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar conjuntos de anúncios:', error);
      throw new Error('Falha ao listar conjuntos de anúncios');
    }
  }

  /**
   * Lista anúncios de uma conta
   */
  async listAds(accountId: string, accessToken: string, since?: string, until?: string): Promise<MetaAd[]> {
    try {
      const params: any = {
        access_token: accessToken,
        fields: 'id,name,status,creative,adset_id,campaign_id',
      };

      if (since) {
        params.time_range = JSON.stringify({ since, until });
      }

      const response = await this.client.get(`/${accountId}/ads`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao listar anúncios:', error);
      throw new Error('Falha ao listar anúncios');
    }
  }

  /**
   * Obtém insights de uma conta, campanha, conjunto ou anúncio
   */
  async getInsights(
    objectId: string,
    accessToken: string,
    since: string,
    until: string,
    level: 'account' | 'campaign' | 'adset' | 'ad' = 'account'
  ): Promise<MetaInsight[]> {
    try {
      const params = {
        access_token: accessToken,
        fields: 'impressions,clicks,spend,reach,frequency,ctr,cpc,cpm,cpp,conversions,conversion_rate,roas',
        time_range: JSON.stringify({ since, until }),
        level: level,
        time_increment: 1, // Dados diários
      };

      const response = await this.client.get(`/${objectId}/insights`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Erro ao obter insights:', error);
      throw new Error('Falha ao obter insights');
    }
  }

  /**
   * Obtém informações detalhadas de uma conta
   */
  async getAccountInfo(accountId: string, accessToken: string): Promise<any> {
    try {
      const response = await this.client.get(`/${accountId}`, {
        params: {
          access_token: accessToken,
          fields: 'id,name,currency,timezone_name,account_status,business_name',
        },
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter informações da conta:', error);
      throw new Error('Falha ao obter informações da conta');
    }
  }

  /**
   * Verifica se o token ainda é válido
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await this.client.get('/me', {
        params: {
          access_token: accessToken,
          fields: 'id,name',
        },
      });

      return response.status === 200;
    } catch (error) {
      console.error('❌ Token inválido:', error);
      return false;
    }
  }

  /**
   * Gera URL de autorização OAuth
   */
  generateAuthUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.globalSettings.appId,
      redirect_uri: this.globalSettings.redirectUri,
      scope: this.globalSettings.scopes,
      response_type: 'code',
      state: state,
    });

    // Usar versão configurada ao invés de hardcoded
    const apiVersion = this.globalSettings.apiVersion || 'v21.0';
    const authUrl = `https://www.facebook.com/${apiVersion}/dialog/oauth?${params.toString()}`;
    
    console.log(`🔗 URL de autorização gerada com ${apiVersion}:`, authUrl);
    
    return authUrl;
  }
}
