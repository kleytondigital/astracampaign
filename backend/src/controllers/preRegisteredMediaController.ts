import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// ============================================================================
// LISTAR MÍDIAS PRÉ-CADASTRADAS
// ============================================================================

export const getPreRegisteredMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, role } = req.user!;
    const {
      page = 1,
      pageSize = 20,
      category,
      type,
      search,
      isActive = true
    } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;

    // Construir filtros
    const where: any = {
      isActive: isActive === 'true'
    };

    // Aplicar filtro de tenant (exceto para SUPERADMIN)
    if (role !== 'SUPERADMIN') {
      where.tenantId = tenantId;
    }

    // Filtros opcionais
    if (category) {
      where.category = category;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { has: search as string } }
      ];
    }

    const [media, total] = await Promise.all([
      prisma.preRegisteredMedia.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: [{ usageCount: 'desc' }, { createdAt: 'desc' }],
        include: {
          creator: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      }),
      prisma.preRegisteredMedia.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSizeNum);

    res.json({
      success: true,
      data: media,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar mídias pré-cadastradas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// CRIAR MÍDIA PRÉ-CADASTRADA
// ============================================================================

export const createPreRegisteredMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId } = req.user!;
    const {
      name,
      description,
      category,
      type,
      mediaUrl,
      thumbnailUrl,
      fileSize,
      mimeType,
      tags = []
    } = req.body;

    if (!name || !category || !type || !mediaUrl) {
      return res.status(400).json({
        error: 'Nome, categoria, tipo e URL da mídia são obrigatórios'
      });
    }

    const media = await prisma.preRegisteredMedia.create({
      data: {
        name,
        description,
        category,
        type,
        mediaUrl,
        thumbnailUrl,
        fileSize,
        mimeType,
        tags,
        tenantId,
        createdBy: userId!
      },
      include: {
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
      data: media,
      message: 'Mídia pré-cadastrada criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar mídia pré-cadastrada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ATUALIZAR MÍDIA PRÉ-CADASTRADA
// ============================================================================

export const updatePreRegisteredMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, userId, role } = req.user!;
    const { id } = req.params;
    const {
      name,
      description,
      category,
      type,
      mediaUrl,
      thumbnailUrl,
      fileSize,
      mimeType,
      tags,
      isActive
    } = req.body;

    // Buscar a mídia
    const existingMedia = await prisma.preRegisteredMedia.findUnique({
      where: { id }
    });

    if (!existingMedia) {
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }

    // Verificar permissões
    if (role !== 'SUPERADMIN' && existingMedia.tenantId !== tenantId) {
      return res
        .status(403)
        .json({ error: 'Sem permissão para editar esta mídia' });
    }

    const media = await prisma.preRegisteredMedia.update({
      where: { id },
      data: {
        name,
        description,
        category,
        type,
        mediaUrl,
        thumbnailUrl,
        fileSize,
        mimeType,
        tags,
        isActive
      },
      include: {
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
      data: media,
      message: 'Mídia pré-cadastrada atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar mídia pré-cadastrada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// DELETAR MÍDIA PRÉ-CADASTRADA
// ============================================================================

export const deletePreRegisteredMedia = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, role } = req.user!;
    const { id } = req.params;

    // Buscar a mídia
    const existingMedia = await prisma.preRegisteredMedia.findUnique({
      where: { id }
    });

    if (!existingMedia) {
      return res.status(404).json({ error: 'Mídia não encontrada' });
    }

    // Verificar permissões
    if (role !== 'SUPERADMIN' && existingMedia.tenantId !== tenantId) {
      return res
        .status(403)
        .json({ error: 'Sem permissão para deletar esta mídia' });
    }

    await prisma.preRegisteredMedia.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Mídia pré-cadastrada deletada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar mídia pré-cadastrada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// INCREMENTAR CONTADOR DE USO
// ============================================================================

export const incrementUsageCount = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const media = await prisma.preRegisteredMedia.update({
      where: { id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    res.json({
      success: true,
      data: media,
      message: 'Contador de uso incrementado'
    });
  } catch (error) {
    console.error('Erro ao incrementar contador de uso:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// BUSCAR CATEGORIAS
// ============================================================================

export const getCategories = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { tenantId, role } = req.user!;

    const where: any = {
      isActive: true
    };

    if (role !== 'SUPERADMIN') {
      where.tenantId = tenantId;
    }

    const categories = await prisma.preRegisteredMedia.findMany({
      where,
      select: {
        category: true
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc'
      }
    });

    const categoryList = categories.map((item) => item.category);

    res.json({
      success: true,
      data: categoryList
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
