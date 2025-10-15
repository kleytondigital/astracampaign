import { settingsService } from './settingsService';
import {
  WebhookConfig,
  EvolutionWebhookConfig,
  WebhookSetResponse,
  WebhookGetResponse,
  WebhookDeleteResponse,
  EvolutionWebhookEvent
} from '../types/webhook.types';

interface EvolutionCreateInstanceRequest {
  instanceName: string;
  qrcode: boolean;
  integration: string;
  webhook?: EvolutionWebhookConfig;
}

interface EvolutionCreateInstanceResponse {
  instance: {
    instanceName: string;
    status: string;
  };
  hash: {
    apikey: string;
  };
  qrcode?: {
    pairingCode?: string;
    code?: string;
    base64?: string;
  };
}

interface EvolutionInstanceInfo {
  instanceName: string;
  status: string;
  profilePictureUrl?: string;
  profileName?: string;
  profileStatus?: string;
  owner?: string;
}

export class EvolutionApiService {
  private static instance: EvolutionApiService;

  public static getInstance(): EvolutionApiService {
    if (!EvolutionApiService.instance) {
      EvolutionApiService.instance = new EvolutionApiService();
    }
    return EvolutionApiService.instance;
  }

  private async getConfig() {
    return await settingsService.getEvolutionConfig();
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const config = await this.getConfig();

    if (!config.host || !config.apiKey) {
      throw new Error(
        'Configurações Evolution API não encontradas. Configure nas configurações do sistema.'
      );
    }

    const url = `${config.host}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      apikey: config.apiKey,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Evolution API Error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    return response;
  }

  async createInstance(
    instanceName: string
  ): Promise<EvolutionCreateInstanceResponse> {
    const requestData: EvolutionCreateInstanceRequest = {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    };

    const response = await this.makeRequest('/instance/create', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    return response.json() as Promise<EvolutionCreateInstanceResponse>;
  }

  async getInstanceInfo(instanceName: string): Promise<EvolutionInstanceInfo> {
    const response = await this.makeRequest(
      `/instance/fetchInstances?instanceName=${instanceName}`
    );
    const data = (await response.json()) as EvolutionInstanceInfo[];

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }

    throw new Error(`Instância ${instanceName} não encontrada`);
  }

  async getQRCode(instanceName: string): Promise<string> {
    const response = await this.makeRequest(
      `/instance/connect/${instanceName}`
    );
    const data = (await response.json()) as { base64?: string };

    if (data.base64) {
      // Verificar se o base64 já tem o prefixo data:image
      if (data.base64.startsWith('data:image/')) {
        return data.base64;
      }
      return `data:image/png;base64,${data.base64}`;
    }

    throw new Error('QR Code não disponível');
  }

  async logoutInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/logout/${instanceName}`, {
      method: 'DELETE'
    });
    console.log(`✅ Logout realizado para instância ${instanceName}`);
  }

  async deleteInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/delete/${instanceName}`, {
      method: 'DELETE'
    });
    console.log(`✅ Instância ${instanceName} deletada`);
  }

  async restartInstance(instanceName: string): Promise<void> {
    await this.makeRequest(`/instance/restart/${instanceName}`, {
      method: 'POST'
    });
    console.log(`✅ Instância ${instanceName} reiniciada`);
  }

  async getInstanceStatus(instanceName: string): Promise<string> {
    try {
      const info = await this.getInstanceInfo(instanceName);
      console.log(`🔍 Evolution getInstanceInfo para ${instanceName}:`, info);

      // Mapear status Evolution para status do sistema
      const statusMap: { [key: string]: string } = {
        open: 'WORKING',
        connecting: 'SCAN_QR_CODE',
        close: 'STOPPED',
        qr: 'SCAN_QR_CODE'
      };

      // Evolution API usa connectionStatus, não status
      const evolutionStatus = (info as any).connectionStatus || info.status;
      return statusMap[evolutionStatus] || 'STOPPED';
    } catch (error) {
      console.warn(
        `⚠️ Erro ao obter status Evolution para ${instanceName}:`,
        error
      );
      return 'STOPPED';
    }
  }

  async listInstances(): Promise<EvolutionInstanceInfo[]> {
    const response = await this.makeRequest('/instance/fetchInstances');
    const data = await response.json();

    if (Array.isArray(data)) {
      return data;
    }

    return [];
  }

  // ============================================================================
  // WEBHOOK METHODS
  // ============================================================================

  /**
   * Configura webhook para uma instância Evolution
   * @param instanceName Nome da instância
   * @param webhookConfig Configuração do webhook
   */
  async setWebhook(
    instanceName: string,
    webhookConfig: Partial<EvolutionWebhookConfig>
  ): Promise<WebhookSetResponse> {
    try {
      const config: EvolutionWebhookConfig = {
        url: webhookConfig.url || '',
        enabled: webhookConfig.enabled !== false,
        webhookByEvents: webhookConfig.webhookByEvents !== false,
        webhookBase64:
          webhookConfig.webhookBase64 === true
            ? true
            : webhookConfig.webhookBase64 === false
              ? false
              : undefined, // ✅ Corrigido: usar valor exato
        events: webhookConfig.events || [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
          'QRCODE_UPDATED'
        ],
        headers: webhookConfig.headers || {}
      };

      // Evolution API v2 espera o webhook dentro de um objeto "webhook"
      // Mas com 'base64' ao invés de 'webhookBase64'
      const payload = {
        webhook: {
          enabled: config.enabled,
          url: config.url,
          headers: config.headers,
          byEvents: config.webhookByEvents,
          base64: config.webhookBase64, // ✅ Evolution espera 'base64', não 'webhookBase64'
          events: config.events
        }
      };

      console.log(
        `🔧 [Evolution] Configurando webhook para ${instanceName}:`,
        payload
      );
      console.log(
        `🔧 [Evolution] webhookBase64 original:`,
        webhookConfig.webhookBase64
      );
      console.log(
        `🔧 [Evolution] webhookBase64 processado:`,
        config.webhookBase64
      );
      console.log(
        `🔧 [Evolution] base64 que será enviado:`,
        payload.webhook.base64
      );

      const response = await this.makeRequest(`/webhook/set/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log(
        `✅ [Evolution] Webhook configurado para instância ${instanceName}:`,
        data
      );

      return {
        success: true,
        message: 'Webhook configurado com sucesso',
        webhook: config
      };
    } catch (error: any) {
      console.error(
        `❌ Erro ao configurar webhook para ${instanceName}:`,
        error
      );
      throw new Error(`Erro ao configurar webhook: ${error.message}`);
    }
  }

  /**
   * Busca a configuração de webhook de uma instância
   * @param instanceName Nome da instância
   */
  async getWebhook(instanceName: string): Promise<WebhookGetResponse> {
    try {
      const response = await this.makeRequest(`/webhook/find/${instanceName}`);
      const data = await response.json();

      console.log(
        `🔍 [Evolution] Webhook config encontrado para ${instanceName}:`,
        data
      );

      // Log específico para webhookBase64
      if (data && typeof data === 'object') {
        console.log(
          `🔍 [Evolution] webhookBase64 na resposta:`,
          data.webhookBase64
        );
        console.log(
          `🔍 [Evolution] Estrutura completa:`,
          JSON.stringify(data, null, 2)
        );
      }

      // Mapear o formato da Evolution API para nosso formato interno
      console.log(`🔍 [Evolution] Dados brutos da API:`, data);
      console.log(`🔍 [Evolution] data.base64:`, data?.base64);
      console.log(`🔍 [Evolution] Tipo de data.base64:`, typeof data?.base64);

      let webhookConfig = null;
      if (data && typeof data === 'object' && 'url' in data) {
        webhookConfig = {
          ...data,
          webhookBase64: data.base64, // ✅ Mapear 'base64' para 'webhookBase64'
          webhookByEvents: data.byEvents // ✅ Mapear 'byEvents' para 'webhookByEvents'
        };
      }

      console.log(`🔍 [Evolution] Webhook config mapeado:`, webhookConfig);
      console.log(
        `🔍 [Evolution] webhookConfig.webhookBase64:`,
        webhookConfig?.webhookBase64
      );

      return {
        success: true,
        webhook: webhookConfig
      };
    } catch (error: any) {
      console.warn(`⚠️ Erro ao buscar webhook para ${instanceName}:`, error);
      return {
        success: false,
        webhook: null
      };
    }
  }

  /**
   * Remove a configuração de webhook de uma instância
   * @param instanceName Nome da instância
   */
  async deleteWebhook(instanceName: string): Promise<WebhookDeleteResponse> {
    try {
      await this.makeRequest(`/webhook/set/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ enabled: false, url: '' })
      });

      console.log(`✅ Webhook removido da instância ${instanceName}`);

      return {
        success: true,
        message: 'Webhook removido com sucesso'
      };
    } catch (error: any) {
      console.error(`❌ Erro ao remover webhook de ${instanceName}:`, error);
      throw new Error(`Erro ao remover webhook: ${error.message}`);
    }
  }

  /**
   * Cria uma instância já com webhook configurado
   * @param instanceName Nome da instância
   * @param webhookConfig Configuração opcional do webhook
   */
  async createInstanceWithWebhook(
    instanceName: string,
    webhookConfig?: Partial<EvolutionWebhookConfig>
  ): Promise<EvolutionCreateInstanceResponse> {
    // Criar instância
    const instance = await this.createInstance(instanceName);

    // Se webhook foi fornecido, configurar
    if (webhookConfig && webhookConfig.url) {
      try {
        await this.setWebhook(instanceName, webhookConfig);
        console.log(
          `✅ Instância ${instanceName} criada com webhook configurado`
        );
      } catch (error) {
        console.warn(
          `⚠️ Instância criada mas falha ao configurar webhook:`,
          error
        );
      }
    }

    return instance;
  }

  // ============================================================================
  // WEBSOCKET METHODS
  // ============================================================================

  /**
   * Configura WebSocket para uma instância Evolution
   * @param instanceName Nome da instância
   * @param websocketConfig Configuração do WebSocket
   */
  async setWebSocket(
    instanceName: string,
    websocketConfig: {
      enabled: boolean;
      events?: string[];
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const config = {
        websocket: {
          enabled: websocketConfig.enabled,
          events: websocketConfig.events || [
            'APPLICATION_STARTUP',
            'QRCODE_UPDATED',
            'MESSAGES_SET',
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'MESSAGES_DELETE',
            'SEND_MESSAGE',
            'CONTACTS_SET',
            'CONTACTS_UPSERT',
            'CONTACTS_UPDATE',
            'PRESENCE_UPDATE',
            'CHATS_SET',
            'CHATS_UPSERT',
            'CHATS_UPDATE',
            'CHATS_DELETE',
            'GROUPS_UPSERT',
            'GROUP_UPDATE',
            'GROUP_PARTICIPANTS_UPDATE',
            'CONNECTION_UPDATE',
            'LABELS_EDIT',
            'LABELS_ASSOCIATION',
            'CALL',
            'TYPEBOT_START',
            'TYPEBOT_CHANGE_STATUS'
          ]
        }
      };

      const response = await this.makeRequest(
        `/websocket/set/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify(config)
        }
      );

      const data = await response.json();

      console.log(
        `✅ WebSocket configurado para instância ${instanceName}:`,
        data
      );

      return {
        success: true,
        message: 'WebSocket configurado com sucesso'
      };
    } catch (error: any) {
      console.error(
        `❌ Erro ao configurar WebSocket para ${instanceName}:`,
        error
      );
      throw new Error(`Erro ao configurar WebSocket: ${error.message}`);
    }
  }

  /**
   * Busca a configuração de WebSocket de uma instância
   * @param instanceName Nome da instância
   */
  async getWebSocket(instanceName: string): Promise<{
    success: boolean;
    websocket: any | null;
  }> {
    try {
      const response = await this.makeRequest(
        `/websocket/find/${instanceName}`
      );
      const data = await response.json();

      return {
        success: true,
        websocket: data || null
      };
    } catch (error: any) {
      console.warn(`⚠️ Erro ao buscar WebSocket para ${instanceName}:`, error);
      return {
        success: false,
        websocket: null
      };
    }
  }

  // ============================================================================
  // ADVANCED CHAT METHODS
  // ============================================================================

  /**
   * Faz uma chamada falsa (fake call) para um número
   * @param instanceName Nome da instância
   * @param number Número com código do país (ex: 5511999999999)
   * @param isVideo Se é chamada de vídeo
   * @param callDuration Duração da chamada em segundos
   */
  async fakeCall(
    instanceName: string,
    number: string,
    isVideo: boolean = false,
    callDuration: number = 3
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`/call/offer/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({
          number,
          isVideo,
          callDuration
        })
      });

      await response.json();

      console.log(`✅ Fake call enviada para ${number}`);

      return {
        success: true,
        message: 'Fake call enviada com sucesso'
      };
    } catch (error: any) {
      console.error(`❌ Erro ao enviar fake call:`, error);
      throw new Error(`Erro ao enviar fake call: ${error.message}`);
    }
  }

  /**
   * Arquiva ou desarquiva uma conversa
   * @param instanceName Nome da instância
   * @param chatJid JID do chat (ex: 123@s.whatsapp.net)
   * @param archive true para arquivar, false para desarquivar
   * @param lastMessageKey Chave da última mensagem (opcional)
   */
  async archiveChat(
    instanceName: string,
    chatJid: string,
    archive: boolean,
    lastMessageKey?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const body: any = {
        chat: chatJid,
        archive
      };

      if (lastMessageKey) {
        body.lastMessage = {
          key: lastMessageKey
        };
      }

      const response = await this.makeRequest(
        `/chat/archiveChat/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify(body)
        }
      );

      await response.json();

      console.log(
        `✅ Chat ${archive ? 'arquivado' : 'desarquivado'}: ${chatJid}`
      );

      return {
        success: true,
        message: `Chat ${archive ? 'arquivado' : 'desarquivado'} com sucesso`
      };
    } catch (error: any) {
      console.error(`❌ Erro ao arquivar chat:`, error);
      throw new Error(`Erro ao arquivar chat: ${error.message}`);
    }
  }

  /**
   * Deleta uma mensagem para todos
   * @param instanceName Nome da instância
   * @param messageId ID da mensagem
   * @param remoteJid JID do chat
   * @param fromMe Se a mensagem foi enviada por você
   * @param participant JID do participante (para grupos)
   */
  async deleteMessageForEveryone(
    instanceName: string,
    messageId: string,
    remoteJid: string,
    fromMe: boolean,
    participant?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const body: any = {
        id: messageId,
        remoteJid,
        fromMe
      };

      if (participant) {
        body.participant = participant;
      }

      const response = await this.makeRequest(
        `/chat/deleteMessageForEveryone/${instanceName}`,
        {
          method: 'DELETE',
          body: JSON.stringify(body)
        }
      );

      await response.json();

      console.log(`✅ Mensagem deletada: ${messageId}`);

      return {
        success: true,
        message: 'Mensagem deletada com sucesso'
      };
    } catch (error: any) {
      console.error(`❌ Erro ao deletar mensagem:`, error);
      throw new Error(`Erro ao deletar mensagem: ${error.message}`);
    }
  }

  /**
   * Atualiza a foto de perfil
   * @param instanceName Nome da instância
   * @param pictureUrl URL da imagem
   */
  async updateProfilePicture(
    instanceName: string,
    pictureUrl: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(
        `/chat/updateProfilePicture/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify({
            picture: pictureUrl
          })
        }
      );

      await response.json();

      console.log(`✅ Foto de perfil atualizada`);

      return {
        success: true,
        message: 'Foto de perfil atualizada com sucesso'
      };
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar foto de perfil:`, error);
      throw new Error(`Erro ao atualizar foto de perfil: ${error.message}`);
    }
  }

  /**
   * Atualiza o status do perfil
   * @param instanceName Nome da instância
   * @param status Texto do status
   */
  async updateProfileStatus(
    instanceName: string,
    status: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(
        `/chat/updateProfileStatus/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify({
            status
          })
        }
      );

      await response.json();

      console.log(`✅ Status do perfil atualizado: ${status}`);

      return {
        success: true,
        message: 'Status do perfil atualizado com sucesso'
      };
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar status do perfil:`, error);
      throw new Error(`Erro ao atualizar status do perfil: ${error.message}`);
    }
  }

  /**
   * Atualiza o nome do perfil
   * @param instanceName Nome da instância
   * @param name Novo nome
   */
  async updateProfileName(
    instanceName: string,
    name: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(
        `/chat/updateProfileName/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify({
            name
          })
        }
      );

      await response.json();

      console.log(`✅ Nome do perfil atualizado: ${name}`);

      return {
        success: true,
        message: 'Nome do perfil atualizado com sucesso'
      };
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar nome do perfil:`, error);
      throw new Error(`Erro ao atualizar nome do perfil: ${error.message}`);
    }
  }

  /**
   * Busca o status de uma mensagem
   * @param instanceName Nome da instância
   * @param remoteJid JID do chat
   * @param messageId ID da mensagem
   * @param page Página (padrão: 1)
   * @param offset Limite de resultados (padrão: 10)
   */
  async findStatusMessage(
    instanceName: string,
    remoteJid: string,
    messageId: string,
    page: number = 1,
    offset: number = 10
  ): Promise<{ success: boolean; data: any }> {
    try {
      const response = await this.makeRequest(
        `/chat/findStatusMessage/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify({
            where: {
              remoteJid,
              id: messageId
            },
            page,
            offset
          })
        }
      );

      const data = await response.json();

      console.log(`✅ Status da mensagem encontrado: ${messageId}`);

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error(`❌ Erro ao buscar status da mensagem:`, error);
      throw new Error(`Erro ao buscar status da mensagem: ${error.message}`);
    }
  }

  /**
   * Obtém a URL de uma mídia armazenada no S3
   * @param instanceName Nome da instância
   * @param mediaId ID da mídia
   */
  async getMediaUrl(
    instanceName: string,
    mediaId: string
  ): Promise<{ success: boolean; url: string | null }> {
    try {
      const response = await this.makeRequest(
        `/s3/getMediaUrl/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify({
            id: mediaId
          })
        }
      );

      const data = (await response.json()) as { url?: string };

      console.log(`✅ URL da mídia obtida: ${mediaId}`);

      return {
        success: true,
        url: data.url || null
      };
    } catch (error: any) {
      console.error(`❌ Erro ao obter URL da mídia:`, error);
      throw new Error(`Erro ao obter URL da mídia: ${error.message}`);
    }
  }

  // ============================================================================
  // SETTINGS METHODS
  // ============================================================================

  /**
   * Configura as definições da instância
   * @param instanceName Nome da instância
   * @param settings Configurações
   */
  async setSettings(
    instanceName: string,
    settings: {
      rejectCall?: boolean;
      msgCall?: string;
      groupsIgnore?: boolean;
      alwaysOnline?: boolean;
      readMessages?: boolean;
      syncFullHistory?: boolean;
      readStatus?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest(`/settings/set/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify(settings)
      });

      await response.json();

      console.log(`✅ Configurações atualizadas para ${instanceName}`);

      return {
        success: true,
        message: 'Configurações atualizadas com sucesso'
      };
    } catch (error: any) {
      console.error(`❌ Erro ao atualizar configurações:`, error);
      throw new Error(`Erro ao atualizar configurações: ${error.message}`);
    }
  }

  /**
   * Busca as configurações da instância
   * @param instanceName Nome da instância
   */
  async getSettings(instanceName: string): Promise<{
    success: boolean;
    settings: any | null;
  }> {
    try {
      const response = await this.makeRequest(`/settings/find/${instanceName}`);
      const data = await response.json();

      console.log(`✅ Configurações obtidas para ${instanceName}`);

      return {
        success: true,
        settings: data || null
      };
    } catch (error: any) {
      console.warn(`⚠️ Erro ao buscar configurações:`, error);
      return {
        success: false,
        settings: null
      };
    }
  }

  // ============================================================================
  // CHAT METHODS
  // ============================================================================

  /**
   * Busca todos os chats de uma instância
   * @param instanceName Nome da instância
   */
  async findChats(instanceName: string): Promise<{
    success: boolean;
    chats: any[];
  }> {
    try {
      const response = await this.makeRequest(
        `/chat/findChats/${instanceName}`,
        {
          method: 'POST'
        }
      );

      const data: unknown = await response.json();
      const chatsArray = Array.isArray(data) ? data : [];

      console.log(
        `✅ Chats obtidos para ${instanceName}: ${chatsArray.length} chats`
      );

      return {
        success: true,
        chats: chatsArray
      };
    } catch (error: any) {
      console.error(`❌ Erro ao buscar chats para ${instanceName}:`, error);
      return {
        success: false,
        chats: []
      };
    }
  }

  /**
   * Buscar foto de perfil de um contato
   */
  async getProfilePicture(
    instanceName: string,
    phone: string
  ): Promise<{ success: boolean; profilePicture?: string }> {
    try {
      const response = await this.makeRequest(
        `/chat/fetchProfilePictureUrl/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify({
            number: phone
          })
        }
      );

      const data: any = await response.json();

      return {
        success: true,
        profilePicture: data?.profilePictureUrl || data?.url || null
      };
    } catch (error: any) {
      console.error(`❌ Erro ao buscar foto de perfil:`, error);
      return {
        success: false,
        profilePicture: undefined
      };
    }
  }

  /**
   * Buscar mensagens de um chat
   */
  async fetchMessages(
    instanceName: string,
    remoteJid: string,
    limit: number = 50
  ): Promise<{ success: boolean; messages: any[] }> {
    try {
      const response = await this.makeRequest(
        `/chat/fetchMessages/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify({
            remoteJid,
            limit
          })
        }
      );

      const data: any = await response.json();
      const messages = Array.isArray(data) ? data : data?.messages || [];

      console.log(
        `✅ Mensagens obtidas para ${remoteJid}: ${messages.length} mensagens`
      );

      return {
        success: true,
        messages
      };
    } catch (error: any) {
      console.error(`❌ Erro ao buscar mensagens:`, error);
      return {
        success: false,
        messages: []
      };
    }
  }

  /**
   * Envia mensagem de mídia via Evolution API
   */
  async sendMedia(
    instanceName: string,
    remoteJid: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    options: {
      caption?: string;
      fileName?: string;
      mimetype?: string;
    } = {}
  ): Promise<any> {
    try {
      console.log(
        `📤 Enviando mídia via Evolution API: ${mediaType} para ${remoteJid}`
      );

      const body: any = {
        number: remoteJid,
        mediatype: mediaType,
        media: mediaUrl
      };

      if (options.caption) body.caption = options.caption;
      if (options.fileName) body.fileName = options.fileName;
      if (options.mimetype) body.mimetype = options.mimetype;

      const response = await this.makeRequest(
        `/message/sendMedia/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();
      console.log(`✅ Mídia enviada com sucesso via Evolution API`);
      return data;
    } catch (error: any) {
      console.error(`❌ Erro ao enviar mídia:`, error);
      throw new Error(`Erro ao enviar mídia: ${error.message}`);
    }
  }

  /**
   * Envia mensagem de áudio/voz via Evolution API
   */
  async sendAudio(
    instanceName: string,
    remoteJid: string,
    audioUrl: string,
    encoding?: boolean
  ): Promise<any> {
    try {
      console.log(`🎤 Enviando áudio via Evolution API para ${remoteJid}`);

      const body: any = {
        number: remoteJid,
        audio: audioUrl,
        encoding: encoding ?? false
      };

      const response = await this.makeRequest(
        `/message/sendWhatsAppAudio/${instanceName}`,
        {
          method: 'POST',
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();
      console.log(`✅ Áudio enviado com sucesso via Evolution API`);
      return data;
    } catch (error: any) {
      console.error(`❌ Erro ao enviar áudio:`, error);
      throw new Error(`Erro ao enviar áudio: ${error.message}`);
    }
  }
}

export const evolutionApiService = EvolutionApiService.getInstance();
