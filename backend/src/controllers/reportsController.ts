import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { reportCalculationService } from '../services/reportCalculationService';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

// ============================================================================
// LISTAR RELATÓRIOS
// ============================================================================
export const getReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const reports = await prisma.report.findMany({
      where: {
        tenantId: user.tenantId
      },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('❌ Erro ao listar relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// OBTER RELATÓRIO POR ID
// ============================================================================
export const getReportById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const report = await prisma.report.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('❌ Erro ao obter relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// CRIAR RELATÓRIO
// ============================================================================
export const createReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, dataSourceId, config, isPublic } = req.body;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Validações básicas
    if (!name || !type) {
      return res.status(400).json({ 
        error: 'Nome e tipo são obrigatórios' 
      });
    }

    // Verificar se a fonte de dados existe (se fornecida)
    if (dataSourceId) {
      const dataSource = await prisma.dataSource.findFirst({
        where: {
          id: dataSourceId,
          tenantId: user.tenantId
        }
      });

      if (!dataSource) {
        return res.status(404).json({ 
          error: 'Fonte de dados não encontrada' 
        });
      }
    }

    // Gerar token de compartilhamento se for público
    const shareToken = isPublic ? generateShareToken() : null;

    const report = await prisma.report.create({
      data: {
        tenantId: user.tenantId,
        dataSourceId: dataSourceId || null,
        name,
        type,
        config: config || {},
        isPublic: isPublic || false,
        shareToken,
        createdBy: user.id
      },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Relatório criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ATUALIZAR RELATÓRIO
// ============================================================================
export const updateReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, dataSourceId, config, isPublic } = req.body;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o relatório existe
    const existingReport = await prisma.report.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    // Verificar se a fonte de dados existe (se fornecida)
    if (dataSourceId) {
      const dataSource = await prisma.dataSource.findFirst({
        where: {
          id: dataSourceId,
          tenantId: user.tenantId
        }
      });

      if (!dataSource) {
        return res.status(404).json({ 
          error: 'Fonte de dados não encontrada' 
        });
      }
    }

    // Gerar novo token se mudou para público
    const shareToken = isPublic && !existingReport.isPublic ? generateShareToken() : existingReport.shareToken;

    const report = await prisma.report.update({
      where: { id },
      data: {
        name,
        type,
        dataSourceId: dataSourceId || null,
        config: config || existingReport.config,
        isPublic: isPublic !== undefined ? isPublic : existingReport.isPublic,
        shareToken
      },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: report,
      message: 'Relatório atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// DELETAR RELATÓRIO
// ============================================================================
export const deleteReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o relatório existe
    const existingReport = await prisma.report.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    // Deletar relatório
    await prisma.report.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Relatório deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// OBTER DADOS DO RELATÓRIO
// ============================================================================
export const getReportData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      startDate, 
      endDate, 
      campaigns, 
      dataSourceId,
      groupBy = 'day' // day, week, month
    } = req.query;
    
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar relatório
    const report = await prisma.report.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        dataSource: true
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado' });
    }

    // Construir filtros
    const where: any = {
      tenantId: user.tenantId
    };

    if (dataSourceId || report.dataSourceId) {
      where.dataSourceId = dataSourceId || report.dataSourceId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (campaigns) {
      const campaignList = (campaigns as string).split(',');
      where.campaignName = { in: campaignList };
    }

    // Buscar dados das campanhas
    const campaignData = await prisma.campaignData.findMany({
      where,
      orderBy: {
        date: 'asc'
      }
    });

    // Calcular métricas e insights
    const reportData = await reportCalculationService.generateReportData(
      campaignData,
      groupBy as string,
      {
        startDate: startDate as string,
        endDate: endDate as string
      }
    );

    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('❌ Erro ao obter dados do relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// COMPARTILHAR RELATÓRIO (ACESSO PÚBLICO)
// ============================================================================
export const getPublicReport = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    
    // Buscar relatório pelo token
    const report = await prisma.report.findFirst({
      where: {
        shareToken: token,
        isPublic: true
      },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        creator: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Relatório não encontrado ou não é público' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('❌ Erro ao obter relatório público:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// GERAR TOKEN DE COMPARTILHAMENTO
// ============================================================================
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
