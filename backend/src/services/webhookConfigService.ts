/**
 * Serviço para configurar webhooks automaticamente nas APIs de WhatsApp
 * Reaproveita fetch nativo (já usado em wahaApiService.ts)
 */
export class WebhookConfigService {
  private static getWebhookUrl(): string {
    // Em produção, usar a URL pública do servidor
    // Em desenvolvimento, você pode usar ngrok ou similar
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3001';
    return `${baseUrl}/api/webhooks/whatsapp`;
  }

  /**
   * Configura webhook na WAHA API
   */
  static async configureWAHAWebhook(sessionName: string): Promise<boolean> {
    try {
      const wahaHost = process.env.WAHA_HOST || 'http://localhost:3000';
      const wahaApiKey = process.env.WAHA_API_KEY;
      const webhookUrl = this.getWebhookUrl();

      console.log(`🔧 Configurando webhook WAHA para sessão: ${sessionName}`);
      console.log(`📍 URL do webhook: ${webhookUrl}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (wahaApiKey) {
        headers['X-Api-Key'] = wahaApiKey;
      }

      // Configurar webhook na WAHA
      const response = await fetch(`${wahaHost}/api/${sessionName}/webhooks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          url: webhookUrl,
          events: [
            'message', // Mensagens recebidas
            'message.ack', // Confirmações de entrega
            'session.status' // Status da sessão
          ],
          hmac: null, // Pode adicionar HMAC para segurança extra
          retries: 3,
          customHeaders: []
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Erro HTTP ${response.status}:`, errorData);
        return false;
      }

      const data = await response.json();
      console.log(
        `✅ Webhook WAHA configurado com sucesso para ${sessionName}`
      );
      console.log(`📊 Resposta:`, data);

      return true;
    } catch (error: any) {
      console.error(`❌ Erro ao configurar webhook WAHA:`, error.message);
      return false;
    }
  }

  /**
   * Configura webhook na Evolution API
   */
  static async configureEvolutionWebhook(
    instanceName: string
  ): Promise<boolean> {
    try {
      const evolutionHost =
        process.env.EVOLUTION_API_URL || 'http://localhost:8080';
      const evolutionApiKey = process.env.EVOLUTION_API_KEY;
      const webhookUrl = this.getWebhookUrl();

      console.log(
        `🔧 Configurando webhook Evolution para instância: ${instanceName}`
      );
      console.log(`📍 URL do webhook: ${webhookUrl}`);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (evolutionApiKey) {
        headers['apikey'] = evolutionApiKey;
      }

      // Configurar webhook na Evolution
      const response = await fetch(
        `${evolutionHost}/webhook/set/${instanceName}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            url: webhookUrl,
            webhook_by_events: false, // Receber todos os eventos em uma única URL
            webhook_base64: false,
            events: [
              'MESSAGES_UPSERT', // Novas mensagens
              'MESSAGES_UPDATE', // Atualizações de status
              'CONNECTION_UPDATE' // Status da conexão
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Erro HTTP ${response.status}:`, errorData);
        return false;
      }

      const data = await response.json();
      console.log(
        `✅ Webhook Evolution configurado com sucesso para ${instanceName}`
      );
      console.log(`📊 Resposta:`, data);

      return true;
    } catch (error: any) {
      console.error(`❌ Erro ao configurar webhook Evolution:`, error.message);
      return false;
    }
  }

  /**
   * Configura webhook automaticamente baseado no provider
   */
  static async configureWebhook(
    sessionName: string,
    provider: 'WAHA' | 'EVOLUTION'
  ): Promise<boolean> {
    console.log(
      `🚀 Iniciando configuração de webhook para ${sessionName} (${provider})`
    );

    try {
      if (provider === 'WAHA') {
        return await this.configureWAHAWebhook(sessionName);
      } else if (provider === 'EVOLUTION') {
        return await this.configureEvolutionWebhook(sessionName);
      } else {
        console.error(`❌ Provider desconhecido: ${provider}`);
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Erro geral ao configurar webhook:`, error.message);
      return false;
    }
  }

  /**
   * Remove webhook configurado
   */
  static async removeWAHAWebhook(sessionName: string): Promise<boolean> {
    try {
      const wahaHost = process.env.WAHA_HOST || 'http://localhost:3000';
      const wahaApiKey = process.env.WAHA_API_KEY;

      console.log(`🗑️ Removendo webhook WAHA para sessão: ${sessionName}`);

      const headers: Record<string, string> = {};
      if (wahaApiKey) {
        headers['X-Api-Key'] = wahaApiKey;
      }

      const response = await fetch(`${wahaHost}/api/${sessionName}/webhooks`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        console.error(`❌ Erro HTTP ${response.status} ao remover webhook`);
        return false;
      }

      console.log(`✅ Webhook WAHA removido com sucesso para ${sessionName}`);
      return true;
    } catch (error: any) {
      console.error(`❌ Erro ao remover webhook WAHA:`, error.message);
      return false;
    }
  }

  /**
   * Lista webhooks configurados (WAHA)
   */
  static async listWAHAWebhooks(sessionName: string): Promise<any[]> {
    try {
      const wahaHost = process.env.WAHA_HOST || 'http://localhost:3000';
      const wahaApiKey = process.env.WAHA_API_KEY;

      const headers: Record<string, string> = {};
      if (wahaApiKey) {
        headers['X-Api-Key'] = wahaApiKey;
      }

      const response = await fetch(`${wahaHost}/api/${sessionName}/webhooks`, {
        headers
      });

      if (!response.ok) {
        console.error(`❌ Erro HTTP ${response.status} ao listar webhooks`);
        return [];
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error(`❌ Erro ao listar webhooks WAHA:`, error.message);
      return [];
    }
  }
}
