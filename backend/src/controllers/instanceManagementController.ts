/**
 * Controller para gerenciamento de instâncias WhatsApp
 * Evolution API e WAHA API
 * Inclui: logout, delete, restart, webhook, websocket
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { evolutionApiService } from '../services/evolutionApiService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// LOGOUT INSTANCE (Desconectar)
// ============================================================================

export const logoutInstance = async (
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
      return res
        .status(400)
        .json({ error: 'Logout disponível apenas para Evolution API' });
    }

    // Fazer logout na Evolution API
    await evolutionApiService.logoutInstance(instanceName);

    // Atualizar status no banco
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        status: 'STOPPED',
        qr: null,
        qrExpiresAt: null
      }
    });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao fazer logout da instância:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

// ============================================================================
// DELETE INSTANCE (Deletar instância)
// ============================================================================

export const deleteInstanceFromProvider = async (
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
      return res
        .status(400)
        .json({ error: 'Delete disponível apenas para Evolution API' });
    }

    // Deletar na Evolution API
    await evolutionApiService.deleteInstance(instanceName);

    // Deletar do banco de dados
    await prisma.whatsAppSession.delete({
      where: { id: session.id }
    });

    res.json({
      success: true,
      message: 'Instância deletada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao deletar instância:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

// ============================================================================
// RESTART INSTANCE (Reiniciar instância)
// ============================================================================

export const restartInstance = async (
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
      return res
        .status(400)
        .json({ error: 'Restart disponível apenas para Evolution API' });
    }

    // Reiniciar na Evolution API
    await evolutionApiService.restartInstance(instanceName);

    // Atualizar status no banco
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: {
        status: 'SCAN_QR_CODE'
      }
    });

    res.json({
      success: true,
      message: 'Instância reiniciada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao reiniciar instância:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

// ============================================================================
// SET WEBSOCKET (Configurar WebSocket)
// ============================================================================

export const setWebSocket = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { instanceName } = req.params;
    const { enabled, events } = req.body;
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
      return res
        .status(400)
        .json({ error: 'WebSocket disponível apenas para Evolution API' });
    }

    // Configurar WebSocket na Evolution API
    const result = await evolutionApiService.setWebSocket(instanceName, {
      enabled: enabled !== false,
      events
    });

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao configurar WebSocket:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

// ============================================================================
// GET WEBSOCKET (Buscar configuração WebSocket)
// ============================================================================

export const getWebSocket = async (
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
      return res
        .status(400)
        .json({ error: 'WebSocket disponível apenas para Evolution API' });
    }

    // Buscar configuração WebSocket
    const result = await evolutionApiService.getWebSocket(instanceName);

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao buscar WebSocket:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

// ============================================================================
// SETTINGS (Configurar definições da instância)
// ============================================================================

export const setInstanceSettings = async (
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
      return res
        .status(400)
        .json({ error: 'Configurações disponíveis apenas para Evolution API' });
    }

    const {
      rejectCall,
      msgCall,
      groupsIgnore,
      alwaysOnline,
      readMessages,
      syncFullHistory,
      readStatus
    } = req.body;

    // Configurar settings na Evolution API
    const result = await evolutionApiService.setSettings(instanceName, {
      rejectCall,
      msgCall,
      groupsIgnore,
      alwaysOnline,
      readMessages,
      syncFullHistory,
      readStatus
    });

    res.json(result);
  } catch (error: any) {
    console.error('Erro ao configurar settings:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};

export const getInstanceSettings = async (
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
      return res
        .status(400)
        .json({ error: 'Configurações disponíveis apenas para Evolution API' });
    }

    // Buscar configurações
    const result = await evolutionApiService.getSettings(instanceName);

    // Retornar apenas os settings, não o wrapper
    res.json(result.settings || {});
  } catch (error: any) {
    console.error('Erro ao buscar settings:', error);
    res
      .status(500)
      .json({ error: error.message || 'Erro interno do servidor' });
  }
};
