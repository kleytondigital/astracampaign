import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    role: string;
  };
}

// ============================================================================
// LISTAR DEPARTAMENTOS
// ============================================================================
export const getDepartments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const departments = await prisma.department.findMany({
      where: {
        tenantId: user.tenantId,
        active: true
      },
      include: {
        _count: {
          select: {
            users: true,
            chats: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    console.error('❌ Erro ao listar departamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// CRIAR DEPARTAMENTO
// ============================================================================
export const createDepartment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { name, description, color } = req.body;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome do departamento é obrigatório' });
    }

    // Verificar se já existe um departamento com o mesmo nome
    const existingDepartment = await prisma.department.findFirst({
      where: {
        tenantId: user.tenantId,
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingDepartment) {
      return res.status(400).json({ error: 'Já existe um departamento com este nome' });
    }

    const department = await prisma.department.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6'
      },
      include: {
        _count: {
          select: {
            users: true,
            chats: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: department,
      message: 'Departamento criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ATUALIZAR DEPARTAMENTO
// ============================================================================
export const updateDepartment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const { name, description, color, active } = req.body;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nome do departamento é obrigatório' });
    }

    // Verificar se o departamento existe e pertence ao tenant
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!existingDepartment) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Verificar se já existe outro departamento com o mesmo nome
    const duplicateDepartment = await prisma.department.findFirst({
      where: {
        id: { not: id },
        tenantId: user.tenantId,
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (duplicateDepartment) {
      return res.status(400).json({ error: 'Já existe um departamento com este nome' });
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        active: active !== undefined ? active : existingDepartment.active
      },
      include: {
        _count: {
          select: {
            users: true,
            chats: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: department,
      message: 'Departamento atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// DELETAR DEPARTAMENTO
// ============================================================================
export const deleteDepartment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = req.params;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o departamento existe e pertence ao tenant
    const existingDepartment = await prisma.department.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        _count: {
          select: {
            users: true,
            chats: true
          }
        }
      }
    });

    if (!existingDepartment) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Verificar se há usuários ou chats vinculados
    if (existingDepartment._count.users > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar departamento com usuários vinculados. Desative-o ao invés de deletar.' 
      });
    }

    if (existingDepartment._count.chats > 0) {
      return res.status(400).json({ 
        error: 'Não é possível deletar departamento com chats vinculados. Desative-o ao invés de deletar.' 
      });
    }

    await prisma.department.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Departamento deletado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao deletar departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// OBTER DEPARTAMENTO POR ID
// ============================================================================
export const getDepartmentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = req.params;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const department = await prisma.department.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      },
      include: {
        users: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            ativo: true
          }
        },
        _count: {
          select: {
            chats: true,
            assignments: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('❌ Erro ao obter departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// LISTAR USUÁRIOS DO DEPARTAMENTO
// ============================================================================
export const getDepartmentUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = req.params;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const department = await prisma.department.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    const users = await prisma.user.findMany({
      where: {
        departmentId: id,
        tenantId: user.tenantId,
        ativo: true
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ultimoLogin: true,
        criadoEm: true,
        _count: {
          select: {
            assignedChats: true,
            chatAssignments: {
              where: {
                status: 'ACTIVE'
              }
            }
          }
        }
      },
      orderBy: {
        nome: 'asc'
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários do departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
