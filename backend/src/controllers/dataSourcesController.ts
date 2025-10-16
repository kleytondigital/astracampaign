import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { googleSheetsService } from '../services/googleSheetsService';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

// ============================================================================
// LISTAR FONTES DE DADOS
// ============================================================================
export const getDataSources = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const dataSources = await prisma.dataSource.findMany({
      where: {
        tenantId: user.tenantId
      },
      include: {
        _count: {
          select: {
            campaigns: true,
            reports: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: dataSources
    });
  } catch (error) {
    console.error('❌ Erro ao listar fontes de dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// OBTER FONTE DE DADOS POR ID
// ============================================================================
export const getDataSourceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        _count: {
          select: {
            campaigns: true,
            reports: true
          }
        }
      }
    });

    if (!dataSource) {
      return res.status(404).json({ error: 'Fonte de dados não encontrada' });
    }

    res.json({
      success: true,
      data: dataSource
    });
  } catch (error) {
    console.error('❌ Erro ao obter fonte de dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// CRIAR FONTE DE DADOS
// ============================================================================
export const createDataSource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, url, credentials } = req.body;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Validações básicas
    if (!name || !type || !url) {
      return res.status(400).json({ 
        error: 'Nome, tipo e URL são obrigatórios' 
      });
    }

    // Verificar se já existe uma fonte com o mesmo nome
    const existingDataSource = await prisma.dataSource.findFirst({
      where: {
        tenantId: user.tenantId,
        name
      }
    });

    if (existingDataSource) {
      return res.status(400).json({ 
        error: 'Já existe uma fonte de dados com este nome' 
      });
    }

    const dataSource = await prisma.dataSource.create({
      data: {
        tenantId: user.tenantId,
        name,
        type,
        url,
        credentials: credentials ? JSON.stringify(credentials) : null,
        active: true,
        syncStatus: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      data: dataSource,
      message: 'Fonte de dados criada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar fonte de dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ATUALIZAR FONTE DE DADOS
// ============================================================================
export const updateDataSource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, url, credentials, active } = req.body;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se a fonte existe
    const existingDataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingDataSource) {
      return res.status(404).json({ error: 'Fonte de dados não encontrada' });
    }

    // Verificar se o nome já existe em outra fonte
    if (name && name !== existingDataSource.name) {
      const duplicateDataSource = await prisma.dataSource.findFirst({
        where: {
          tenantId: user.tenantId,
          name,
          id: { not: id }
        }
      });

      if (duplicateDataSource) {
        return res.status(400).json({ 
          error: 'Já existe uma fonte de dados com este nome' 
        });
      }
    }

    const dataSource = await prisma.dataSource.update({
      where: { id },
      data: {
        name,
        type,
        url,
        credentials: credentials ? JSON.stringify(credentials) : existingDataSource.credentials,
        active: active !== undefined ? active : existingDataSource.active,
        syncStatus: 'PENDING' // Resetar status ao atualizar
      }
    });

    res.json({
      success: true,
      data: dataSource,
      message: 'Fonte de dados atualizada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar fonte de dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// DELETAR FONTE DE DADOS
// ============================================================================
export const deleteDataSource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se a fonte existe
    const existingDataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingDataSource) {
      return res.status(404).json({ error: 'Fonte de dados não encontrada' });
    }

    // Deletar fonte (cascade vai deletar campanhas e relatórios)
    await prisma.dataSource.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Fonte de dados deletada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar fonte de dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// TESTAR CONEXÃO COM GOOGLE SHEETS
// ============================================================================
export const testConnection = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { url, credentials } = req.body;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    // Testar conexão com Google Sheets
    const testResult = await googleSheetsService.testConnection(url, credentials);
    
    if (testResult.success) {
      res.json({
        success: true,
        data: {
          columns: testResult.columns,
          sampleData: testResult.sampleData,
          totalRows: testResult.totalRows
        },
        message: 'Conexão testada com sucesso'
      });
    } else {
      res.status(400).json({
        success: false,
        error: testResult.error,
        message: 'Falha ao conectar com a planilha'
      });
    }
  } catch (error) {
    console.error('❌ Erro ao testar conexão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// SINCRONIZAR DADOS DA FONTE
// ============================================================================
export const syncDataSource = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar fonte de dados
    const dataSource = await prisma.dataSource.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!dataSource) {
      return res.status(404).json({ error: 'Fonte de dados não encontrada' });
    }

    // Atualizar status para sincronizando
    await prisma.dataSource.update({
      where: { id },
      data: {
        syncStatus: 'SYNCING',
        errorMessage: null
      }
    });

    try {
      // Sincronizar dados baseado no tipo
      let syncResult;
      if (dataSource.type === 'GOOGLE_SHEETS') {
        const credentials = dataSource.credentials ? JSON.parse(dataSource.credentials) : null;
        syncResult = await googleSheetsService.syncData(dataSource.url, credentials, dataSource.id, user.tenantId);
      } else {
        throw new Error('Tipo de fonte de dados não suportado');
      }

      // Atualizar status de sucesso
      await prisma.dataSource.update({
        where: { id },
        data: {
          syncStatus: 'SUCCESS',
          lastSync: new Date(),
          errorMessage: null
        }
      });

      res.json({
        success: true,
        data: {
          recordsProcessed: syncResult.recordsProcessed,
          recordsCreated: syncResult.recordsCreated,
          recordsUpdated: syncResult.recordsUpdated
        },
        message: 'Sincronização concluída com sucesso'
      });
    } catch (syncError) {
      // Atualizar status de erro
      await prisma.dataSource.update({
        where: { id },
        data: {
          syncStatus: 'ERROR',
          errorMessage: syncError instanceof Error ? syncError.message : 'Erro desconhecido'
        }
      });

      throw syncError;
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar fonte de dados:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};
