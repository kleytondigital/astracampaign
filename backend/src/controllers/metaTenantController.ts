import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';
import { MetaApiService, MetaGlobalSettings } from '../services/metaApiService';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId?: string;
  };
}

/**
 * Iniciar fluxo OAuth para tenant
 */
export const tenantRedirect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { tenantId } = req.params;
    
    if (!user || !user.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (user.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Acesso negado ao tenant' });
    }

    // Verificar se já existe conexão ativa
    const existingConnection = await prisma.metaTenantConnection.findUnique({
      where: { tenantId: user.tenantId }
    });

    if (existingConnection && existingConnection.active) {
      return res.status(400).json({ 
        error: 'Tenant já possui conexão Meta ativa. Desconecte primeiro para reconectar.' 
      });
    }

    // Obter configurações globais
    const globalSettings = await prisma.metaGlobalSetting.findFirst({
      where: { active: true }
    });

    if (!globalSettings) {
      return res.status(404).json({ error: 'Configurações Meta não encontradas. Contate o administrador.' });
    }

    // Criar state com CSRF protection
    const stateData = {
      tenantId: user.tenantId,
      userId: user.id,
      nonce: crypto.randomBytes(16).toString('hex'),
      timestamp: Date.now()
    };

    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Gerar URL de autorização
    const metaSettings: MetaGlobalSettings = {
      appId: globalSettings.appId,
      appSecretEnc: globalSettings.appSecretEnc,
      redirectUri: globalSettings.redirectUri,
      apiVersion: globalSettings.apiVersion, // Incluir versão da API
      scopes: globalSettings.scopes
    };

    console.log('🔧 Configurações Meta para OAuth:', {
      appId: globalSettings.appId,
      redirectUri: globalSettings.redirectUri,
      apiVersion: globalSettings.apiVersion,
      scopes: globalSettings.scopes
    });

    const metaService = new MetaApiService(metaSettings);
    const authUrl = metaService.generateAuthUrl(state);

    // Log da operação
    console.log('🔗 Iniciando OAuth Meta para tenant:', {
      tenantId: user.tenantId,
      userId: user.id,
      state: state
    });

    res.json({
      success: true,
      data: {
        authUrl: authUrl,
        state: state
      }
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar OAuth Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Callback OAuth do Meta
 */
export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error, error_description } = req.query;
    
    console.log('🔄 Meta OAuth Callback recebido:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      error,
      error_description,
      query: req.query
    });

    if (error) {
      console.error('❌ Erro no callback OAuth:', error, error_description);
      return res.redirect(`${process.env.FRONTEND_URL}/meta-integration?error=${encodeURIComponent(error_description as string)}`);
    }

    if (!code || !state) {
      console.error('❌ Parâmetros inválidos no callback:', { code: !!code, state: !!state });
      return res.redirect(`${process.env.FRONTEND_URL}/meta-integration?error=Parâmetros inválidos no callback`);
    }

    // Decodificar state
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString('utf8'));
    } catch (error) {
      console.error('❌ Erro ao decodificar state:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/meta-integration?error=State inválido`);
    }

    // Validar state (CSRF protection)
    const { tenantId, userId, nonce, timestamp } = stateData;
    const maxAge = 10 * 60 * 1000; // 10 minutos

    if (!tenantId || !userId || !nonce || !timestamp) {
      return res.redirect(`${process.env.FRONTEND_URL}/meta-integration?error=State malformado`);
    }

    if (Date.now() - timestamp > maxAge) {
      return res.redirect(`${process.env.FRONTEND_URL}/meta-integration?error=State expirado`);
    }

    // Verificar se tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return res.redirect(`${process.env.FRONTEND_URL}/meta-integration?error=Tenant não encontrado`);
    }

    // Obter configurações globais
    const globalSettings = await prisma.metaGlobalSetting.findFirst({
      where: { active: true }
    });

    if (!globalSettings) {
      return res.redirect(`${process.env.FRONTEND_URL}/meta-integration?error=Configurações Meta não encontradas`);
    }

    // Trocar código por token
    const metaSettings: MetaGlobalSettings = {
      appId: globalSettings.appId,
      appSecretEnc: globalSettings.appSecretEnc,
      redirectUri: globalSettings.redirectUri,
      apiVersion: globalSettings.apiVersion, // Incluir versão da API
      scopes: globalSettings.scopes
    };

    const metaService = new MetaApiService(metaSettings);
    
    // Obter token de curta duração
    const tokenResponse = await metaService.exchangeCodeForToken(code as string, globalSettings.redirectUri);
    
    // Converter para token de longa duração
    const longLivedToken = await metaService.exchangeForLongLivedToken(tokenResponse.access_token);

    // Calcular data de expiração (tokens de longa duração duram ~60 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Salvar/atualizar conexão
    const connection = await prisma.metaTenantConnection.upsert({
      where: { tenantId: tenantId },
      update: {
        accessTokenEnc: encrypt(longLivedToken.access_token),
        tokenType: longLivedToken.token_type,
        expiresAt: expiresAt,
        lastUsedAt: new Date(),
        active: true,
        updatedAt: new Date()
      },
      create: {
        tenantId: tenantId,
        accessTokenEnc: encrypt(longLivedToken.access_token),
        tokenType: longLivedToken.token_type,
        expiresAt: expiresAt,
        lastUsedAt: new Date(),
        active: true
      }
    });

    // Log da operação
    await prisma.metaLog.create({
      data: {
        tenantId: tenantId,
        connectionId: connection.id,
        type: 'TOKEN_CREATED',
        message: 'Token Meta criado/atualizado com sucesso',
        details: {
          tokenType: longLivedToken.token_type,
          expiresAt: expiresAt,
          userId: userId
        }
      }
    });

    console.log('✅ OAuth Meta concluído para tenant:', {
      tenantId: tenantId,
      connectionId: connection.id
    });

    // Redirecionar para página de seleção de contas
    res.redirect(`${process.env.FRONTEND_URL}/meta-integration?success=true&step=accounts`);
  } catch (error) {
    console.error('❌ Erro no callback OAuth Meta:', error);
    res.redirect(`${process.env.FRONTEND_URL}/meta-integration?error=Erro interno no callback`);
  }
};

/**
 * Listar contas de anúncios disponíveis para o tenant
 */
export const listAccounts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user || !user.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se existe conexão ativa
    const connection = await prisma.metaTenantConnection.findUnique({
      where: { tenantId: user.tenantId, active: true }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Conexão Meta não encontrada. Faça login primeiro.' });
    }

    // Obter configurações globais
    const globalSettings = await prisma.metaGlobalSetting.findFirst({
      where: { active: true }
    });

    if (!globalSettings) {
      return res.status(404).json({ error: 'Configurações Meta não encontradas' });
    }

    // Descriptografar token
    const accessToken = decrypt(connection.accessTokenEnc);

    // Obter contas via API
    const metaSettings: MetaGlobalSettings = {
      appId: globalSettings.appId,
      appSecretEnc: globalSettings.appSecretEnc,
      redirectUri: globalSettings.redirectUri,
      apiVersion: globalSettings.apiVersion, // Incluir versão da API
      scopes: globalSettings.scopes
    };

    const metaService = new MetaApiService(metaSettings);
    const adAccounts = await metaService.listAdAccounts(accessToken);

    // Verificar quais contas já estão vinculadas
    const linkedAccounts = await prisma.metaAccount.findMany({
      where: { tenantId: user.tenantId, active: true },
      select: { accountId: true }
    });

    const linkedAccountIds = new Set(linkedAccounts.map(acc => acc.accountId));

    // Marcar contas como vinculadas ou não
    const accountsWithStatus = adAccounts.map(account => ({
      ...account,
      isLinked: linkedAccountIds.has(account.id),
      status: linkedAccountIds.has(account.id) ? 'LINKED' : 'AVAILABLE'
    }));

    res.json({
      success: true,
      data: accountsWithStatus
    });
  } catch (error) {
    console.error('❌ Erro ao listar contas Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Vincular conta selecionada ao tenant
 */
export const linkAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { accountId } = req.body;
    
    if (!user || !user.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!accountId) {
      return res.status(400).json({ error: 'ID da conta é obrigatório' });
    }

    // Verificar se existe conexão ativa
    const connection = await prisma.metaTenantConnection.findUnique({
      where: { tenantId: user.tenantId, active: true }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Conexão Meta não encontrada' });
    }

    // Verificar se conta já está vinculada
    const existingAccount = await prisma.metaAccount.findUnique({
      where: { 
        tenantId_accountId: {
          tenantId: user.tenantId,
          accountId: accountId
        }
      }
    });

    if (existingAccount) {
      return res.status(400).json({ error: 'Conta já está vinculada a este tenant' });
    }

    // Obter informações detalhadas da conta via API
    const globalSettings = await prisma.metaGlobalSetting.findFirst({
      where: { active: true }
    });

    if (!globalSettings) {
      return res.status(404).json({ error: 'Configurações Meta não encontradas' });
    }

    const accessToken = decrypt(connection.accessTokenEnc);
    const metaSettings: MetaGlobalSettings = {
      appId: globalSettings.appId,
      appSecretEnc: globalSettings.appSecretEnc,
      redirectUri: globalSettings.redirectUri,
      apiVersion: globalSettings.apiVersion, // Incluir versão da API
      scopes: globalSettings.scopes
    };

    const metaService = new MetaApiService(metaSettings);
    const accountInfo = await metaService.getAccountInfo(accountId, accessToken);

    // Criar conta vinculada
    const metaAccount = await prisma.metaAccount.create({
      data: {
        tenantId: user.tenantId,
        connectionId: connection.id,
        accountId: accountId,
        name: accountInfo.name,
        currency: accountInfo.currency,
        timezone: accountInfo.timezone_name,
        status: accountInfo.account_status?.toString(),
        syncStatus: 'PENDING',
        active: true
      }
    });

    // Log da operação
    await prisma.metaLog.create({
      data: {
        tenantId: user.tenantId,
        connectionId: connection.id,
        type: 'SYNC_SUCCESS',
        message: `Conta ${accountInfo.name} (${accountId}) vinculada com sucesso`,
        details: {
          accountId: accountId,
          accountName: accountInfo.name,
          currency: accountInfo.currency
        }
      }
    });

    console.log('✅ Conta Meta vinculada:', {
      tenantId: user.tenantId,
      accountId: accountId,
      accountName: accountInfo.name
    });

    res.json({
      success: true,
      data: metaAccount,
      message: 'Conta vinculada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao vincular conta Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Obter status da conexão Meta do tenant
 */
export const getConnectionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user || !user.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const connection = await prisma.metaTenantConnection.findUnique({
      where: { tenantId: user.tenantId },
      include: {
        accounts: {
          where: { active: true },
          select: {
            id: true,
            accountId: true,
            name: true,
            currency: true,
            status: true,
            syncStatus: true,
            lastSyncedAt: true
          }
        },
        _count: {
          select: {
            accounts: true,
            logs: true
          }
        }
      }
    });

    if (!connection) {
      return res.json({
        success: true,
        data: {
          connected: false,
          message: 'Nenhuma conexão Meta encontrada'
        }
      });
    }

    // Verificar se token ainda é válido
    const isTokenValid = connection.expiresAt ? new Date() < connection.expiresAt : true;

    res.json({
      success: true,
      data: {
        connected: connection.active && isTokenValid,
        connectionId: connection.id,
        expiresAt: connection.expiresAt,
        lastUsedAt: connection.lastUsedAt,
        tokenValid: isTokenValid,
        accountsCount: connection._count.accounts,
        accounts: connection.accounts,
        logsCount: connection._count.logs
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter status da conexão Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

/**
 * Desconectar tenant do Meta
 */
export const disconnect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user || !user.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const connection = await prisma.metaTenantConnection.findUnique({
      where: { tenantId: user.tenantId }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Conexão Meta não encontrada' });
    }

    // Desativar conexão e contas relacionadas
    await prisma.$transaction([
      prisma.metaTenantConnection.update({
        where: { id: connection.id },
        data: { active: false }
      }),
      prisma.metaAccount.updateMany({
        where: { tenantId: user.tenantId },
        data: { active: false }
      })
    ]);

    // Log da operação
    await prisma.metaLog.create({
      data: {
        tenantId: user.tenantId,
        connectionId: connection.id,
        type: 'SYNC_SUCCESS',
        message: 'Conexão Meta desconectada pelo usuário',
        details: {
          disconnectedBy: user.id,
          disconnectedAt: new Date()
        }
      }
    });

    console.log('🔌 Conexão Meta desconectada:', {
      tenantId: user.tenantId,
      connectionId: connection.id
    });

    res.json({
      success: true,
      message: 'Conexão Meta desconectada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao desconectar Meta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
