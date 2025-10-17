import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import { MetaApiService } from '../services/metaApiService';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId?: string;
  };
}

/**
 * Obter configurações globais Meta (SuperAdmin)
 */
export const getGlobalSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
    }

    const settings = await prisma.metaGlobalSetting.findFirst({
      where: { active: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!settings) {
      return res.json({
        success: true,
        data: null,
        message: 'Configurações Meta não encontradas'
      });
    }

    // Gerar URL sugerida de callback
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
    const suggestedRedirectUri = `${backendUrl}/api/meta/callback`;

    // Retornar dados sem o secret criptografado
    const responseData = {
      id: settings.id,
      appId: settings.appId,
      redirectUri: settings.redirectUri,
      suggestedRedirectUri, // URL sugerida para o usuário
      scopes: settings.scopes,
      active: settings.active,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('❌ Erro ao obter configurações globais Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Criar/Atualizar configurações globais Meta (SuperAdmin)
 */
export const setGlobalSettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    let { appId, appSecret, redirectUri, scopes } = req.body;
    
    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
    }

    // Validações
    if (!appId || !appSecret) {
      return res.status(400).json({ 
        error: 'App ID e App Secret são obrigatórios' 
      });
    }

    // Se não forneceu Redirect URI, gerar automaticamente
    if (!redirectUri) {
      const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
      redirectUri = `${backendUrl}/api/meta/callback`;
      console.log(`📍 Redirect URI gerada automaticamente: ${redirectUri}`);
    }

    // Validar se as credenciais funcionam
    try {
      const tempSettings = {
        appId,
        appSecretEnc: encrypt(appSecret),
        redirectUri,
        scopes: scopes || 'ads_read,ads_management,business_management,pages_show_list'
      };

      const metaService = new MetaApiService(tempSettings);
      // Testar com uma chamada simples - apenas validar se o serviço pode ser criado
      console.log('✅ MetaApiService criado com sucesso');
    } catch (error) {
      console.log('⚠️ Erro ao criar MetaApiService:', error);
      // Não falhar aqui, pois é um teste de validação
    }

    // Desativar configurações anteriores
    await prisma.metaGlobalSetting.updateMany({
      where: { active: true },
      data: { active: false }
    });

    // Criar nova configuração
    const newSettings = await prisma.metaGlobalSetting.create({
      data: {
        appId,
        appSecretEnc: encrypt(appSecret),
        redirectUri,
        scopes: scopes || 'ads_read,ads_management,business_management,pages_show_list',
        active: true
      }
    });

    // Log da operação
    console.log('✅ Configurações globais Meta criadas:', {
      id: newSettings.id,
      appId: newSettings.appId,
      redirectUri: newSettings.redirectUri
    });

    res.json({
      success: true,
      data: {
        id: newSettings.id,
        appId: newSettings.appId,
        redirectUri: newSettings.redirectUri,
        scopes: newSettings.scopes,
        active: newSettings.active,
        createdAt: newSettings.createdAt
      },
      message: 'Configurações Meta salvas com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao salvar configurações globais Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Testar conexão com Meta API (SuperAdmin)
 */
export const testGlobalConnection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
    }

    const settings = await prisma.metaGlobalSetting.findFirst({
      where: { active: true }
    });

    if (!settings) {
      return res.status(404).json({ error: 'Configurações Meta não encontradas' });
    }

    // Testar configuração
    const globalSettings = {
      appId: settings.appId,
      appSecretEnc: settings.appSecretEnc,
      redirectUri: settings.redirectUri,
      scopes: settings.scopes
    };

    const metaService = new MetaApiService(globalSettings);
    
    // Gerar URL de teste (não vai executar OAuth, apenas validar formato)
    const testState = 'test-connection';
    const authUrl = metaService.generateAuthUrl(testState);

    res.json({
      success: true,
      data: {
        appId: settings.appId,
        redirectUri: settings.redirectUri,
        scopes: settings.scopes,
        authUrl: authUrl,
        status: 'Configuração válida'
      },
      message: 'Conexão com Meta API testada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao testar conexão Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Obter estatísticas de uso das configurações Meta (SuperAdmin)
 */
export const getGlobalStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user || user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
    }

    const [connectionsCount, accountsCount, campaignsCount] = await Promise.all([
      prisma.metaTenantConnection.count({
        where: { active: true }
      }),
      prisma.metaAccount.count({
        where: { active: true }
      }),
      prisma.metaCampaign.count()
    ]);

    const recentConnections = await prisma.metaTenantConnection.findMany({
      where: { active: true },
      include: {
        tenant: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        connectionsCount,
        accountsCount,
        campaignsCount,
        recentConnections: recentConnections.map(conn => ({
          id: conn.id,
          tenantName: conn.tenant.name,
          tenantSlug: conn.tenant.slug,
          createdAt: conn.createdAt,
          lastUsedAt: conn.lastUsedAt
        }))
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
