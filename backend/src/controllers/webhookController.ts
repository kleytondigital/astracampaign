/**
 * Controller para gerenciamento de Webhooks
 * Evolution API e WAHA API
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { evolutionApiService } from '../services/evolutionApiService';
import * as wahaApiService from '../services/wahaApiService';
import { PrismaClient } from '@prisma/client';
import {
  EvolutionWebhookConfig,
  WahaWebhookConfig,
  EvolutionWebhookEvent,
  WahaWebhookEvent
} from '../types/webhook.types';

const prisma = new PrismaClient();

// ============================================================================
// EVOLUTION API WEBHOOK MANAGEMENT
// ============================================================================

/**
 * Configurar webhook para instância Evolution
 */
export const setEvolutionWebhook = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { instanceName } = req.params;
    const webhookConfig: Partial<EvolutionWebhookConfig> = req.body;

    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId && userRole !== 'SUPERADMIN') {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    // Verificar se a instância pertence ao tenant
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        name: instanceName,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (session.provider !== 'EVOLUTION') {
      return res.status(400).json({ error: 'Sessão não é Evolution API' });
    }

    // Configurar URL automática se não fornecida
    if (!webhookConfig.url) {
      const publicUrl =
        process.env.PUBLIC_URL ||
        `http://localhost:${process.env.PORT || 3001}`;
      webhookConfig.url = `${publicUrl}/api/webhooks/whatsapp`;
    }

    // Configurar webhook
    const result = await evolutionApiService.setWebhook(
      instanceName,
      webhookConfig
    );

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao configurar webhook Evolution:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

/**
 * Buscar configuração de webhook Evolution
 */
export const getEvolutionWebhook = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { instanceName } = req.params;

    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // Verificar se a instância pertence ao tenant
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        name: instanceName,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (session.provider !== 'EVOLUTION') {
      return res.status(400).json({ error: 'Sessão não é Evolution API' });
    }

    const result = await evolutionApiService.getWebhook(instanceName);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao buscar webhook Evolution:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

/**
 * Remover webhook de instância Evolution
 */
export const deleteEvolutionWebhook = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { instanceName } = req.params;

    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // Verificar se a instância pertence ao tenant
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        name: instanceName,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (session.provider !== 'EVOLUTION') {
      return res.status(400).json({ error: 'Sessão não é Evolution API' });
    }

    const result = await evolutionApiService.deleteWebhook(instanceName);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao remover webhook Evolution:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

// ============================================================================
// WAHA API WEBHOOK MANAGEMENT
// ============================================================================

/**
 * Configurar webhook para sessão WAHA
 */
export const setWahaWebhook = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sessionName } = req.params;
    const webhookConfig: Partial<WahaWebhookConfig> = req.body;

    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    if (!tenantId && userRole !== 'SUPERADMIN') {
      return res.status(400).json({ error: 'Tenant não identificado' });
    }

    // Verificar se a sessão pertence ao tenant
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        name: sessionName,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (session.provider !== 'WAHA') {
      return res.status(400).json({ error: 'Sessão não é WAHA API' });
    }

    // Configurar URL automática se não fornecida
    if (!webhookConfig.url) {
      const publicUrl =
        process.env.PUBLIC_URL ||
        `http://localhost:${process.env.PORT || 3001}`;
      webhookConfig.url = `${publicUrl}/api/webhooks/whatsapp`;
    }

    // Configurar webhook
    const result = await wahaApiService.setWebhook(sessionName, webhookConfig);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao configurar webhook WAHA:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

/**
 * Buscar configuração de webhook WAHA
 */
export const getWahaWebhook = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sessionName } = req.params;

    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // Verificar se a sessão pertence ao tenant
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        name: sessionName,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (session.provider !== 'WAHA') {
      return res.status(400).json({ error: 'Sessão não é WAHA API' });
    }

    const result = await wahaApiService.getWebhook(sessionName);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao buscar webhook WAHA:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

/**
 * Remover webhook de sessão WAHA
 */
export const deleteWahaWebhook = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { sessionName } = req.params;

    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    // Verificar se a sessão pertence ao tenant
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        name: sessionName,
        ...(tenantId ? { tenantId } : {})
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Sessão não encontrada' });
    }

    if (session.provider !== 'WAHA') {
      return res.status(400).json({ error: 'Sessão não é WAHA API' });
    }

    const result = await wahaApiService.deleteWebhook(sessionName);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao remover webhook WAHA:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

// ============================================================================
// WEBHOOK EVENTS LISTING
// ============================================================================

/**
 * Listar eventos disponíveis Evolution
 */
export const listEvolutionEvents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const events = Object.values(EvolutionWebhookEvent).map((event) => ({
      name: event,
      description: getEvolutionEventDescription(event)
    }));

    res.json({ success: true, events });
  } catch (error: any) {
    console.error('Erro ao listar eventos Evolution:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

/**
 * Listar eventos disponíveis WAHA
 */
export const listWahaEvents = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const events = Object.values(WahaWebhookEvent).map((event) => ({
      name: event,
      description: getWahaEventDescription(event)
    }));

    res.json({ success: true, events });
  } catch (error: any) {
    console.error('Erro ao listar eventos WAHA:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEvolutionEventDescription(event: EvolutionWebhookEvent): string {
  const descriptions: Record<EvolutionWebhookEvent, string> = {
    [EvolutionWebhookEvent.CONNECTION_UPDATE]: 'Atualização de conexão',
    [EvolutionWebhookEvent.QRCODE_UPDATED]: 'QR Code atualizado',
    [EvolutionWebhookEvent.MESSAGES_UPSERT]: 'Nova mensagem recebida',
    [EvolutionWebhookEvent.MESSAGES_UPDATE]: 'Mensagem atualizada',
    [EvolutionWebhookEvent.MESSAGES_DELETE]: 'Mensagem deletada',
    [EvolutionWebhookEvent.CONTACTS_UPDATE]: 'Contato atualizado',
    [EvolutionWebhookEvent.CONTACTS_UPSERT]: 'Novo contato',
    [EvolutionWebhookEvent.CHATS_UPDATE]: 'Chat atualizado',
    [EvolutionWebhookEvent.CHATS_UPSERT]: 'Novo chat',
    [EvolutionWebhookEvent.CHATS_DELETE]: 'Chat deletado',
    [EvolutionWebhookEvent.GROUPS_UPDATE]: 'Grupo atualizado',
    [EvolutionWebhookEvent.GROUPS_UPSERT]: 'Novo grupo',
    [EvolutionWebhookEvent.PRESENCE_UPDATE]: 'Presença atualizada',
    [EvolutionWebhookEvent.CALL]: 'Chamada recebida',
    [EvolutionWebhookEvent.STATUS_INSTANCE]: 'Status da instância',
    [EvolutionWebhookEvent.SEND_MESSAGE]: 'Mensagem enviada',
    [EvolutionWebhookEvent.LABELS_EDIT]: 'Etiqueta editada',
    [EvolutionWebhookEvent.LABELS_ASSOCIATION]: 'Etiqueta associada'
  };

  return descriptions[event] || event;
}

function getWahaEventDescription(event: WahaWebhookEvent): string {
  const descriptions: Record<WahaWebhookEvent, string> = {
    [WahaWebhookEvent.MESSAGE]: 'Nova mensagem',
    [WahaWebhookEvent.MESSAGE_ACK]: 'Confirmação de mensagem',
    [WahaWebhookEvent.MESSAGE_REVOKED]: 'Mensagem revogada',
    [WahaWebhookEvent.SESSION_STATUS]: 'Status da sessão',
    [WahaWebhookEvent.STATE_CHANGED]: 'Estado alterado',
    [WahaWebhookEvent.GROUP_JOIN]: 'Entrou no grupo',
    [WahaWebhookEvent.GROUP_LEAVE]: 'Saiu do grupo',
    [WahaWebhookEvent.POLL_VOTE]: 'Voto em enquete',
    [WahaWebhookEvent.POLL_VOTE_FAILED]: 'Falha no voto da enquete'
  };

  return descriptions[event] || event;
}



