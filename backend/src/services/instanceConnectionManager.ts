import { PrismaClient } from '@prisma/client';
import { evolutionApiService } from './evolutionApiService';
import { evolutionWebSocketClient } from './evolutionWebSocketClient';

const prisma = new PrismaClient();

/**
 * Serviço para gerenciar conexões Evolution (Webhook vs WebSocket)
 *
 * Regras:
 * - Apenas UMA forma de receber mensagens por vez: Webhook OU WebSocket
 * - Ativar Webhook → Desativa WebSocket automaticamente
 * - Ativar WebSocket → Desativa Webhook automaticamente
 */
export class InstanceConnectionManager {
  /**
   * Ativa Webhook e desativa WebSocket
   */
  async enableWebhook(
    instanceName: string,
    tenantId: string,
    webhookConfig: {
      url: string;
      webhook_base64: boolean;
      webhook_by_events?: boolean;
      events?: string[];
    }
  ): Promise<{ success: boolean; message: string; debugLogs?: string[] }> {
    try {
      console.log(
        `🔄 [ConnectionManager] Ativando Webhook para: ${instanceName}`
      );

      // 1. Desconectar WebSocket se estiver ativo
      try {
        evolutionWebSocketClient.disconnectInstance(instanceName);
        console.log(
          `✅ [ConnectionManager] WebSocket desconectado: ${instanceName}`
        );
      } catch (error) {
        console.log(
          `⚠️ [ConnectionManager] WebSocket já estava desconectado: ${instanceName}`
        );
      }

      // 2. Configurar Webhook na Evolution API
      console.log(`🔧 [ConnectionManager] Dados recebidos do frontend:`, {
        url: webhookConfig.url,
        webhook_base64: webhookConfig.webhook_base64,
        webhook_by_events: webhookConfig.webhook_by_events,
        events: webhookConfig.events
      });

      console.log(`🔧 [ConnectionManager] Enviando para Evolution API:`, {
        url: webhookConfig.url,
        webhookBase64: webhookConfig.webhook_base64,
        webhookByEvents: webhookConfig.webhook_by_events,
        events: webhookConfig.events
      });

      await evolutionApiService.setWebhook(instanceName, {
        url: webhookConfig.url,
        webhookBase64: webhookConfig.webhook_base64,
        webhookByEvents:
          webhookConfig.webhook_by_events !== undefined
            ? webhookConfig.webhook_by_events
            : false,
        events: webhookConfig.events, // Usar exatamente os eventos enviados
        enabled: true
      });
      console.log(
        `✅ [ConnectionManager] Webhook configurado na Evolution API: ${instanceName}`
      );

      // 3. Atualizar banco de dados
      await prisma.whatsAppSession.update({
        where: { name: instanceName },
        data: {
          webhookEnabled: true,
          websocketEnabled: false,
          webhookUrl: webhookConfig.url,
          webhookBase64: webhookConfig.webhook_base64,
          atualizadoEm: new Date()
        }
      });
      console.log(
        `💾 [ConnectionManager] Estado salvo no banco: ${instanceName}`
      );

      return {
        success: true,
        message: 'Webhook ativado com sucesso. WebSocket foi desativado.'
      };
    } catch (error: any) {
      console.error(`❌ [ConnectionManager] Erro ao ativar Webhook:`, error);
      throw new Error(`Erro ao ativar Webhook: ${error.message}`);
    }
  }

  /**
   * Ativa WebSocket e desativa Webhook
   */
  async enableWebSocket(
    instanceName: string,
    tenantId: string,
    evolutionHost: string,
    apiKey: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        `🔄 [ConnectionManager] Ativando WebSocket para: ${instanceName}`
      );

      // 1. Desativar Webhook na Evolution API
      try {
        await evolutionApiService.deleteWebhook(instanceName);
        console.log(
          `✅ [ConnectionManager] Webhook desativado na Evolution API: ${instanceName}`
        );
      } catch (error) {
        console.log(
          `⚠️ [ConnectionManager] Webhook já estava desativado: ${instanceName}`
        );
      }

      // 2. Conectar WebSocket
      let wsHost = evolutionHost;
      if (wsHost.startsWith('https://')) {
        wsHost = wsHost.replace('https://', 'wss://');
      } else if (wsHost.startsWith('http://')) {
        wsHost = wsHost.replace('http://', 'ws://');
      }

      await evolutionWebSocketClient.connectInstance(
        instanceName,
        tenantId,
        wsHost,
        apiKey
      );
      console.log(
        `✅ [ConnectionManager] WebSocket conectado: ${instanceName}`
      );

      // 3. Atualizar banco de dados
      await prisma.whatsAppSession.update({
        where: { name: instanceName },
        data: {
          webhookEnabled: false,
          websocketEnabled: true,
          webhookUrl: null,
          webhookBase64: null,
          atualizadoEm: new Date()
        }
      });
      console.log(
        `💾 [ConnectionManager] Estado salvo no banco: ${instanceName}`
      );

      return {
        success: true,
        message: 'WebSocket ativado com sucesso. Webhook foi desativado.'
      };
    } catch (error: any) {
      console.error(`❌ [ConnectionManager] Erro ao ativar WebSocket:`, error);
      throw new Error(`Erro ao ativar WebSocket: ${error.message}`);
    }
  }

  /**
   * Desativa ambos (Webhook e WebSocket)
   */
  async disableBoth(
    instanceName: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(
        `🔄 [ConnectionManager] Desativando tudo para: ${instanceName}`
      );

      // 1. Desconectar WebSocket
      try {
        evolutionWebSocketClient.disconnectInstance(instanceName);
      } catch (error) {
        console.log(`⚠️ [ConnectionManager] WebSocket já estava desconectado`);
      }

      // 2. Desativar Webhook
      try {
        await evolutionApiService.deleteWebhook(instanceName);
      } catch (error) {
        console.log(`⚠️ [ConnectionManager] Webhook já estava desativado`);
      }

      // 3. Atualizar banco de dados
      await prisma.whatsAppSession.update({
        where: { name: instanceName },
        data: {
          webhookEnabled: false,
          websocketEnabled: false,
          webhookUrl: null,
          webhookBase64: null,
          atualizadoEm: new Date()
        }
      });

      return {
        success: true,
        message: 'Webhook e WebSocket desativados.'
      };
    } catch (error: any) {
      console.error(`❌ [ConnectionManager] Erro ao desativar:`, error);
      throw new Error(`Erro ao desativar: ${error.message}`);
    }
  }

  /**
   * Obtém o estado atual da conexão (Webhook ou WebSocket)
   */
  async getConnectionState(instanceName: string): Promise<{
    webhookEnabled: boolean;
    websocketEnabled: boolean;
    webhookConfig?: any; // ✅ Usar 'any' para aceitar o formato da Evolution API
  }> {
    try {
      // 1. Buscar configuração no banco
      const session = await prisma.whatsAppSession.findUnique({
        where: { name: instanceName }
      });

      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // 2. Buscar configuração real da Evolution API
      let webhookConfig;
      try {
        const result = await evolutionApiService.getWebhook(instanceName);
        webhookConfig = result.webhook;
        console.log(
          `🔍 [ConnectionManager] Webhook config da Evolution:`,
          webhookConfig
        );
      } catch (error) {
        console.log(
          `⚠️ [ConnectionManager] Webhook não configurado na Evolution API`
        );
        webhookConfig = null;
      }

      // 3. Verificar consistência
      const webhookEnabled = !!webhookConfig;
      const websocketEnabled = !webhookEnabled && session.status !== 'STOPPED';

      // 4. Atualizar banco se houver inconsistência
      if (
        session.webhookEnabled !== webhookEnabled ||
        session.websocketEnabled !== websocketEnabled
      ) {
        await prisma.whatsAppSession.update({
          where: { name: instanceName },
          data: {
            webhookEnabled,
            websocketEnabled,
            atualizadoEm: new Date()
          }
        });
        console.log(
          `🔄 [ConnectionManager] Estado sincronizado no banco: ${instanceName}`
        );
      }

      const result = {
        webhookEnabled,
        websocketEnabled,
        webhookConfig: webhookConfig || undefined
      };

      console.log(
        `📊 [ConnectionManager] Estado retornado para ${instanceName}:`,
        result
      );
      console.log(
        `📊 [ConnectionManager] webhookBase64 específico:`,
        result.webhookConfig?.webhookBase64
      );
      console.log(
        `📊 [ConnectionManager] Estrutura completa do webhookConfig:`,
        JSON.stringify(result.webhookConfig, null, 2)
      );

      return result;
    } catch (error: any) {
      console.error(`❌ [ConnectionManager] Erro ao obter estado:`, error);
      throw new Error(`Erro ao obter estado: ${error.message}`);
    }
  }

  /**
   * Sincroniza o estado atual com a Evolution API
   */
  async syncState(instanceName: string, tenantId: string): Promise<void> {
    try {
      const state = await this.getConnectionState(instanceName);

      console.log(`🔄 [ConnectionManager] Estado sincronizado:`, {
        instanceName,
        webhookEnabled: state.webhookEnabled,
        websocketEnabled: state.websocketEnabled
      });
    } catch (error: any) {
      console.error(
        `❌ [ConnectionManager] Erro ao sincronizar estado:`,
        error
      );
    }
  }
}

// Exportar instância singleton
export const instanceConnectionManager = new InstanceConnectionManager();
