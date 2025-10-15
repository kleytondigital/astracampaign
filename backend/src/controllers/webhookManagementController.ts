import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { WebhookConfigService } from '../services/webhookConfigService';

const prisma = new PrismaClient();

/**
 * Configura webhook para uma sessão WhatsApp específica
 */
export const configureSessionWebhook = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    console.log(`🔧 Configurando webhook para sessão: ${sessionId}`);

    // Buscar sessão no banco
    const whereClause: any = { id: sessionId };

    // SUPERADMIN pode configurar qualquer sessão
    if (userRole !== 'SUPERADMIN' && tenantId) {
      whereClause.tenantId = tenantId;
    }

    const session = await prisma.whatsAppSession.findFirst({
      where: whereClause
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // Configurar webhook
    const success = await WebhookConfigService.configureWebhook(
      session.name,
      session.provider as 'WAHA' | 'EVOLUTION'
    );

    if (success) {
      // ✅ Desativar WebSocket se estiver ativo
      if (session.provider === 'EVOLUTION') {
        try {
          const { evolutionWebSocketClient } = await import(
            '../services/evolutionWebSocketClient'
          );
          evolutionWebSocketClient.disconnectInstance(session.name);
          console.log(
            `✅ WebSocket desconectado automaticamente: ${session.name}`
          );
        } catch (error) {
          console.log(`⚠️ WebSocket já estava desconectado: ${session.name}`);
        }
      }

      // Atualizar flags no banco
      await prisma.whatsAppSession.update({
        where: { id: sessionId },
        data: {
          webhookEnabled: true,
          websocketEnabled: false,
          webhookUrl: `${process.env.BACKEND_URL}/api/webhooks/${session.provider.toLowerCase()}`,
          webhookBase64: true,
          config: JSON.stringify({
            ...(session.config ? JSON.parse(session.config) : {}),
            webhookConfigured: true,
            webhookConfiguredAt: new Date().toISOString()
          })
        }
      });

      res.json({
        success: true,
        message: 'Webhook configurado com sucesso',
        session: {
          id: session.id,
          name: session.name,
          provider: session.provider,
          webhookUrl: `${process.env.PUBLIC_URL || 'http://localhost:3001'}/api/webhooks/whatsapp`
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erro ao configurar webhook. Verifique os logs do servidor.'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Configura webhooks para todas as sessões ativas do tenant
 */
export const configureAllWebhooks = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    console.log(`🔧 Configurando webhooks para todas as sessões do tenant`);

    // Buscar sessões ativas
    const whereClause: any = {
      status: 'WORKING'
    };

    if (userRole !== 'SUPERADMIN' && tenantId) {
      whereClause.tenantId = tenantId;
    }

    const sessions = await prisma.whatsAppSession.findMany({
      where: whereClause
    });

    console.log(`📋 Encontradas ${sessions.length} sessões ativas`);

    const results = [];

    for (const session of sessions) {
      const success = await WebhookConfigService.configureWebhook(
        session.name,
        session.provider as 'WAHA' | 'EVOLUTION'
      );

      results.push({
        sessionId: session.id,
        sessionName: session.name,
        provider: session.provider,
        success
      });

      if (success) {
        // Atualizar flag no banco
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: {
            config: JSON.stringify({
              ...(session.config ? JSON.parse(session.config) : {}),
              webhookConfigured: true,
              webhookConfiguredAt: new Date().toISOString()
            })
          }
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    res.json({
      success: true,
      message: `${successCount}/${sessions.length} webhooks configurados com sucesso`,
      results,
      webhookUrl: `${process.env.PUBLIC_URL || 'http://localhost:3001'}/api/webhooks/whatsapp`
    });
  } catch (error) {
    console.error('❌ Erro ao configurar webhooks:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Lista webhooks configurados para uma sessão
 */
export const listSessionWebhooks = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // Buscar sessão no banco
    const whereClause: any = { id: sessionId };

    if (userRole !== 'SUPERADMIN' && tenantId) {
      whereClause.tenantId = tenantId;
    }

    const session = await prisma.whatsAppSession.findFirst({
      where: whereClause
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // Listar webhooks (apenas WAHA suporta listagem)
    if (session.provider === 'WAHA') {
      const webhooks = await WebhookConfigService.listWAHAWebhooks(
        session.name
      );
      res.json({
        success: true,
        session: {
          id: session.id,
          name: session.name,
          provider: session.provider
        },
        webhooks
      });
    } else {
      res.json({
        success: true,
        message:
          'Evolution API não suporta listagem de webhooks via API. Verifique no painel da Evolution.',
        session: {
          id: session.id,
          name: session.name,
          provider: session.provider
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao listar webhooks:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Remove webhook de uma sessão
 */
export const removeSessionWebhook = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sessionId } = req.params;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // Buscar sessão no banco
    const whereClause: any = { id: sessionId };

    if (userRole !== 'SUPERADMIN' && tenantId) {
      whereClause.tenantId = tenantId;
    }

    const session = await prisma.whatsAppSession.findFirst({
      where: whereClause
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    // Remover webhook (apenas WAHA)
    if (session.provider === 'WAHA') {
      const success = await WebhookConfigService.removeWAHAWebhook(
        session.name
      );

      if (success) {
        // Atualizar flag no banco
        await prisma.whatsAppSession.update({
          where: { id: sessionId },
          data: {
            config: JSON.stringify({
              ...(session.config ? JSON.parse(session.config) : {}),
              webhookConfigured: false
            })
          }
        });

        res.json({
          success: true,
          message: 'Webhook removido com sucesso'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Erro ao remover webhook'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error:
          'Evolution API não suporta remoção de webhooks via API. Configure manualmente no painel.'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao remover webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Testa o webhook enviando uma mensagem de teste
 */
export const testWebhook = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // Buscar sessão no banco
    const whereClause: any = { id: sessionId };

    if (userRole !== 'SUPERADMIN' && tenantId) {
      whereClause.tenantId = tenantId;
    }

    const session = await prisma.whatsAppSession.findFirst({
      where: whereClause
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    res.json({
      success: true,
      message:
        'Para testar o webhook, envie uma mensagem WhatsApp para o número conectado.',
      instructions: [
        '1. Envie uma mensagem de qualquer número para o WhatsApp conectado',
        '2. O webhook receberá a mensagem automaticamente',
        '3. Verifique os logs do backend para confirmar o recebimento',
        '4. A mensagem aparecerá no frontend em tempo real'
      ],
      webhookUrl: `${process.env.PUBLIC_URL || 'http://localhost:3001'}/api/webhooks/whatsapp`,
      session: {
        id: session.id,
        name: session.name,
        provider: session.provider,
        status: session.status
      }
    });
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
