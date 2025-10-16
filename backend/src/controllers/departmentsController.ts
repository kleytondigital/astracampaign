import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Criar departamento
    const department = await prisma.department.create({
      data: {
        tenantId: user.tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6'
      }
    });

    // Adicionar automaticamente todos os usuários ADMIN do tenant ao departamento
    const adminUsers = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        role: { in: ['ADMIN', 'SUPERADMIN'] },
        ativo: true
      },
      select: { id: true }
    });

    if (adminUsers.length > 0) {
      await prisma.userDepartment.createMany({
        data: adminUsers.map(admin => ({
          userId: admin.id,
          departmentId: department.id,
          isDefault: false
        })),
        skipDuplicates: true
      });

      console.log(`✅ Adicionados ${adminUsers.length} admins ao departamento ${department.name}`);
    }

    // Buscar departamento com contagens
    const departmentWithCount = await prisma.department.findUnique({
      where: { id: department.id },
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
      data: departmentWithCount,
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

    // Buscar usuários através da tabela intermediária
    const userDepartments = await prisma.userDepartment.findMany({
      where: {
        departmentId: id
      },
      include: {
        user: {
          where: {
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
          }
        }
      }
    });

    const users = userDepartments
      .filter(ud => ud.user !== null)
      .map(ud => ({
        ...ud.user,
        isDefault: ud.isDefault,
        addedAt: ud.createdAt
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários do departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ADICIONAR USUÁRIO AO DEPARTAMENTO
// ============================================================================
export const addUserToDepartment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = req.params; // departmentId
    const { userId, isDefault } = req.body;
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Apenas ADMIN e SUPERADMIN podem adicionar usuários
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Sem permissão para adicionar usuários' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Verificar se o departamento existe e pertence ao tenant
    const department = await prisma.department.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Verificar se o usuário existe e pertence ao tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: user.tenantId,
        ativo: true
      }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Verificar se o usuário já está no departamento
    const existingRelation = await prisma.userDepartment.findFirst({
      where: {
        userId,
        departmentId: id
      }
    });

    if (existingRelation) {
      return res.status(400).json({ error: 'Usuário já está neste departamento' });
    }

    // Se isDefault for true, remover isDefault de outros departamentos do usuário
    if (isDefault) {
      await prisma.userDepartment.updateMany({
        where: {
          userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    // Adicionar usuário ao departamento
    const userDepartment = await prisma.userDepartment.create({
      data: {
        userId,
        departmentId: id,
        isDefault: isDefault || false
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            color: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: userDepartment,
      message: 'Usuário adicionado ao departamento com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao adicionar usuário ao departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// REMOVER USUÁRIO DO DEPARTAMENTO
// ============================================================================
export const removeUserFromDepartment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id, userId } = req.params; // id = departmentId
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Apenas ADMIN e SUPERADMIN podem remover usuários
    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return res.status(403).json({ error: 'Sem permissão para remover usuários' });
    }

    // Verificar se o departamento existe e pertence ao tenant
    const department = await prisma.department.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Verificar se o usuário alvo é ADMIN (admins não podem ser removidos)
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (targetUser && (targetUser.role === 'ADMIN' || targetUser.role === 'SUPERADMIN')) {
      return res.status(403).json({ 
        error: 'Administradores são automaticamente membros de todos os departamentos e não podem ser removidos' 
      });
    }

    // Remover usuário do departamento
    const deleted = await prisma.userDepartment.deleteMany({
      where: {
        userId,
        departmentId: id
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado neste departamento' });
    }

    res.json({
      success: true,
      message: 'Usuário removido do departamento com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao remover usuário do departamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// LISTAR USUÁRIOS DISPONÍVEIS PARA ADICIONAR
// ============================================================================
export const getAvailableUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { id } = req.params; // departmentId
    
    if (!user?.tenantId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o departamento existe e pertence ao tenant
    const department = await prisma.department.findFirst({
      where: {
        id,
        tenantId: user.tenantId
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Departamento não encontrado' });
    }

    // Buscar usuários do tenant que NÃO estão no departamento e NÃO são admins
    const usersInDepartment = await prisma.userDepartment.findMany({
      where: { departmentId: id },
      select: { userId: true }
    });

    const userIdsInDepartment = usersInDepartment.map(ud => ud.userId);

    const availableUsers = await prisma.user.findMany({
      where: {
        tenantId: user.tenantId,
        ativo: true,
        role: 'USER', // Apenas usuários comuns (admins são adicionados automaticamente)
        id: {
          notIn: userIdsInDepartment
        }
      },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ultimoLogin: true
      },
      orderBy: {
        nome: 'asc'
      }
    });

    res.json({
      success: true,
      data: availableUsers
    });
  } catch (error) {
    console.error('❌ Erro ao listar usuários disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
