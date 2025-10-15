import { Router } from 'express';
import {
  logoutInstance,
  deleteInstanceFromProvider,
  restartInstance,
  setWebSocket,
  getWebSocket,
  setInstanceSettings,
  getInstanceSettings
} from '../controllers/instanceManagementController';

const router = Router();

// ============================================================================
// INSTANCE MANAGEMENT ROUTES (Evolution API)
// ============================================================================

// Logout (desconectar instância)
router.post('/logout/:instanceName', logoutInstance);

// Delete (deletar instância na Evolution)
router.delete('/delete/:instanceName', deleteInstanceFromProvider);

// Restart (reiniciar instância)
router.post('/restart/:instanceName', restartInstance);

// WebSocket - Configurar
router.post('/websocket/:instanceName', setWebSocket);

// WebSocket - Buscar configuração
router.get('/websocket/:instanceName', getWebSocket);

// Settings - Configurar definições da instância
router.put('/settings/:instanceName', setInstanceSettings);

// Settings - Buscar definições
router.get('/settings/:instanceName', getInstanceSettings);

// ============================================================================
// CONNECTION MODE MANAGEMENT (Webhook vs WebSocket)
// ============================================================================

// Obter estado atual da conexão
router.get('/connection-state/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const { instanceConnectionManager } = await import(
      '../services/instanceConnectionManager'
    );

    const state =
      await instanceConnectionManager.getConnectionState(instanceName);
    res.json(state);
  } catch (error: any) {
    console.error('Erro ao obter estado da conexão:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ativar Webhook (desativa WebSocket)
router.post('/enable-webhook/:instanceName', async (req, res) => {
  const debugLogs: string[] = [];

  // Função para capturar logs
  const log = (message: string) => {
    console.log(message);
    debugLogs.push(message);
  };

  try {
    const { instanceName } = req.params;
    const {
      url,
      webhook_base64,
      webhook_by_events = false,
      events = [
        'MESSAGES_UPSERT',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
        'MESSAGES_UPDATE'
      ]
    } = req.body;
    const tenantId = req.user?.tenantId;

    log(
      `🔧 [Backend] Recebendo configuração de webhook: ${JSON.stringify({
        instanceName,
        url,
        webhook_base64,
        webhook_by_events,
        events
      })}`
    );

    if (!tenantId) {
      return res.status(400).json({
        error: 'Tenant não identificado',
        debugLogs
      });
    }

    if (!url) {
      return res.status(400).json({
        error: 'URL do webhook é obrigatória',
        debugLogs
      });
    }

    const { instanceConnectionManager } = await import(
      '../services/instanceConnectionManager'
    );

    log(`🔧 [Backend] Chamando instanceConnectionManager.enableWebhook...`);

    const result = await instanceConnectionManager.enableWebhook(
      instanceName,
      tenantId,
      {
        url,
        webhook_base64,
        webhook_by_events,
        events
      }
    );

    log(`✅ [Backend] Resultado: ${JSON.stringify(result)}`);

    res.json({
      ...result,
      debugLogs
    });
  } catch (error: any) {
    log(`❌ [Backend] Erro: ${error.message}`);
    console.error('Erro ao ativar webhook:', error);
    res.status(500).json({
      error: error.message,
      debugLogs
    });
  }
});

// Ativar WebSocket (desativa Webhook)
router.post('/enable-websocket/:instanceName', async (req, res) => {
  try {
    const { instanceName } = req.params;
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    const { instanceConnectionManager } = await import(
      '../services/instanceConnectionManager'
    );
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Buscar configurações globais
    const settings = await prisma.globalSettings.findFirst();

    if (!settings?.evolutionHost || !settings?.evolutionApiKey) {
      return res
        .status(400)
        .json({ error: 'Configurações Evolution não encontradas' });
    }

    const result = await instanceConnectionManager.enableWebSocket(
      instanceName,
      tenantId,
      settings.evolutionHost,
      settings.evolutionApiKey
    );

    await prisma.$disconnect();
    res.json(result);
  } catch (error: any) {
    console.error('Erro ao ativar websocket:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
