import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * SUPERADMIN: Criar nova empresa/tenant
 * Cria:
 * 1. Tenant (empresa)
 * 2. User ADMIN (dono da empresa)
 * 3. Company (registro no CRM - opcional)
 */
export const createTenantCompany = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Validar que é SUPERADMIN
    if (req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado',
        message: 'Apenas SUPERADMIN pode criar empresas/tenants'
      });
    }

    // Validar dados de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Erros de validação ao criar tenant/empresa:', errors.array());
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const {
      // Dados da Empresa/Tenant
      companyName,
      slug,
      industry,
      size,
      website,
      phone,
      email,
      address,
      description,
      
      // Dados do Usuário Admin
      adminName,
      adminEmail,
      adminPassword,
      
      // Opcionais
      maxUsers,
      maxWhatsappSessions,
      tags = []
    } = req.body;

    console.log('🏢 SUPERADMIN criando empresa/tenant:', {
      companyName,
      slug,
      adminEmail,
      superadminId: req.user.id
    });

    // 1. Verificar se slug já existe
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existingTenant) {
      return res.status(400).json({
        success: false,
        error: 'Slug já existe',
        message: `O slug "${slug}" já está em uso. Escolha outro.`
      });
    }

    // 2. Verificar se email do admin já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já existe',
        message: `O email "${adminEmail}" já está em uso.`
      });
    }

    // 3. Hash da senha do admin
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // 4. Criar Tenant
    console.log('📝 Criando tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        nome: companyName,
        slug,
        ativo: true,
        maxUsers: maxUsers || 10,
        maxWhatsappSessions: maxWhatsappSessions || 5
      }
    });

    console.log('✅ Tenant criado:', tenant.id);

    // 5. Criar User ADMIN do tenant
    console.log('📝 Criando usuário ADMIN...');
    const adminUser = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        nome: adminName,
        email: adminEmail,
        senha: hashedPassword,
        role: 'ADMIN',
        ativo: true
      }
    });

    console.log('✅ Usuário ADMIN criado:', adminUser.id);

    // 6. Criar Company (registro no CRM) - OPCIONAL
    let company = null;
    if (companyName) {
      console.log('📝 Criando registro da empresa no CRM...');
      company = await prisma.company.create({
        data: {
          tenantId: tenant.id,
          name: companyName,
          industry: industry || null,
          size: size || null,
          website: website || null,
          phone: phone || null,
          email: email || null,
          address: address || null,
          description: description || null,
          tags: tags || [],
          assignedTo: adminUser.id // Admin é o responsável
        }
      });

      console.log('✅ Empresa criada no CRM:', company.id);
    }

    // 7. Criar departamento padrão "Atendimento Geral"
    console.log('📝 Criando departamento padrão...');
    const defaultDepartment = await prisma.department.create({
      data: {
        tenantId: tenant.id,
        name: 'Atendimento Geral',
        description: 'Departamento padrão para atendimento',
        color: '#3B82F6',
        active: true
      }
    });

    // Adicionar admin ao departamento padrão
    await prisma.userDepartment.create({
      data: {
        userId: adminUser.id,
        departmentId: defaultDepartment.id,
        isDefault: true
      }
    });

    console.log('✅ Departamento padrão criado:', defaultDepartment.id);

    // 8. Log da operação
    await prisma.metaLog.create({
      data: {
        tenantId: tenant.id,
        connectionId: 0, // Não é uma operação Meta
        type: 'TENANT_CREATED',
        message: `Tenant criado por SUPERADMIN ${req.user.email}`,
        details: {
          superadminId: req.user.id,
          superadminEmail: req.user.email,
          tenantId: tenant.id,
          companyName
        }
      }
    }).catch(err => {
      // Ignorar erro de log (não crítico)
      console.warn('⚠️ Erro ao criar log (não crítico):', err);
    });

    // 9. Retornar resultado
    res.status(201).json({
      success: true,
      message: 'Empresa/Tenant criado com sucesso',
      data: {
        tenant: {
          id: tenant.id,
          nome: tenant.nome,
          slug: tenant.slug,
          ativo: tenant.ativo,
          maxUsers: tenant.maxUsers,
          maxWhatsappSessions: tenant.maxWhatsappSessions,
          createdAt: tenant.criadoEm
        },
        admin: {
          id: adminUser.id,
          nome: adminUser.nome,
          email: adminUser.email,
          role: adminUser.role
        },
        company: company ? {
          id: company.id,
          name: company.name,
          industry: company.industry,
          size: company.size
        } : null,
        department: {
          id: defaultDepartment.id,
          name: defaultDepartment.name
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao criar tenant/empresa:', error);
    console.error('📊 Detalhes do erro:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
};

/**
 * SUPERADMIN: Listar todos os tenants/empresas
 */
export const getTenants = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Validar que é SUPERADMIN
    if (req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const {
      page = '1',
      pageSize = '10',
      search = '',
      ativo = ''
    } = req.query;

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (ativo !== '') {
      where.ativo = ativo === 'true';
    }

    // Buscar tenants com paginação
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        include: {
          _count: {
            select: {
              users: true,
              whatsappSessions: true,
              companies: true,
              contacts: true,
              leads: true
            }
          }
        },
        orderBy: { criadoEm: 'desc' },
        skip,
        take: pageSizeNum
      }),
      prisma.tenant.count({ where })
    ]);

    res.json({
      success: true,
      data: tenants,
      total,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum)
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar tenants:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

/**
 * SUPERADMIN: Ativar/Desativar tenant
 */
export const toggleTenantStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    // Validar que é SUPERADMIN
    if (req.user?.role !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      });
    }

    const { id } = req.params;
    const { ativo } = req.body;

    const tenant = await prisma.tenant.update({
      where: { id },
      data: { ativo }
    });

    console.log(`✅ Tenant ${tenant.nome} ${ativo ? 'ativado' : 'desativado'} por SUPERADMIN`);

    res.json({
      success: true,
      data: tenant
    });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar status do tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

