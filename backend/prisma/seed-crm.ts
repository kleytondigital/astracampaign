import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CRM setup seed...');

  // 1. Create GlobalSettings (singleton)
  const globalSettings = await prisma.globalSettings.upsert({
    where: { singleton: true },
    update: {},
    create: {
      singleton: true,
      wahaHost: process.env.DEFAULT_WAHA_HOST || 'http://localhost:3000',
      wahaApiKey: process.env.DEFAULT_WAHA_API_KEY || 'dev-waha-key',
      evolutionHost: process.env.DEFAULT_EVOLUTION_HOST || '',
      evolutionApiKey: process.env.DEFAULT_EVOLUTION_API_KEY || '',
      companyName: process.env.DEFAULT_COMPANY_NAME || 'Astra Campaign CRM',
      pageTitle:
        process.env.DEFAULT_PAGE_TITLE || 'Sistema de CRM - Desenvolvimento',
      logoUrl: process.env.DEFAULT_LOGO_URL || null,
      faviconUrl: process.env.DEFAULT_FAVICON_URL || null,
      primaryColor: process.env.DEFAULT_PRIMARY_COLOR || '#3B82F6'
    }
  });

  console.log('✅ GlobalSettings created/updated');

  // 2. Create tenant de teste CRM
  const crmTenant = await prisma.tenant.upsert({
    where: { slug: 'empresa-teste-crm' },
    update: {},
    create: {
      slug: 'empresa-teste-crm',
      name: 'Empresa Teste CRM',
      active: true
    }
  });

  console.log('✅ CRM Tenant created: empresa-teste-crm');

  // 3. Create quotas for CRM tenant
  const crmQuotas = await prisma.tenantQuota.upsert({
    where: { tenantId: crmTenant.id },
    update: {},
    create: {
      tenantId: crmTenant.id,
      maxUsers: 50,
      maxContacts: 10000,
      maxCampaigns: 500,
      maxConnections: 10
    }
  });

  console.log('✅ CRM tenant quotas created');

  // 4. Create tenant settings
  const crmTenantSettings = await prisma.tenantSettings.upsert({
    where: { tenantId: crmTenant.id },
    update: {},
    create: {
      tenantId: crmTenant.id,
      openaiApiKey: null,
      groqApiKey: null,
      customBranding: {
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        logoUrl: null,
        faviconUrl: null
      }
    }
  });

  console.log('✅ CRM tenant settings created');

  // 5. Create SUPERADMIN user
  const superAdminPassword = await bcrypt.hash('Admin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@astraonline.com.br' },
    update: {
      role: 'SUPERADMIN',
      tenantId: null,
      senha: superAdminPassword
    },
    create: {
      nome: 'Super Administrador',
      email: 'superadmin@astraonline.com.br',
      senha: superAdminPassword,
      role: 'SUPERADMIN',
      tenantId: null,
      ativo: true
    }
  });

  console.log('✅ SUPERADMIN created: superadmin@astraonline.com.br');

  // 6. Create CRM ADMIN user
  const crmAdminPassword = await bcrypt.hash('Admin123', 12);
  const crmAdmin = await prisma.user.upsert({
    where: { email: 'admin@empresa-teste.com' },
    update: {
      role: 'ADMIN',
      tenantId: crmTenant.id,
      senha: crmAdminPassword
    },
    create: {
      nome: 'Admin CRM',
      email: 'admin@empresa-teste.com',
      senha: crmAdminPassword,
      role: 'ADMIN',
      tenantId: crmTenant.id,
      ativo: true
    }
  });

  console.log('✅ CRM ADMIN created: admin@empresa-teste.com');

  // 7. Create CRM USER
  const crmUserPassword = await bcrypt.hash('User123', 12);
  const crmUser = await prisma.user.upsert({
    where: { email: 'vendedor@empresa-teste.com' },
    update: {
      role: 'USER',
      tenantId: crmTenant.id,
      senha: crmUserPassword
    },
    create: {
      nome: 'João Vendedor',
      email: 'vendedor@empresa-teste.com',
      senha: crmUserPassword,
      role: 'USER',
      tenantId: crmTenant.id,
      ativo: true
    }
  });

  console.log('✅ CRM USER created: vendedor@empresa-teste.com');

  // 8. Create UserTenant associations
  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: superAdmin.id,
        tenantId: crmTenant.id
      }
    },
    update: {},
    create: {
      userId: superAdmin.id,
      tenantId: crmTenant.id,
      role: 'SUPERADMIN'
    }
  });

  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: crmAdmin.id,
        tenantId: crmTenant.id
      }
    },
    update: {},
    create: {
      userId: crmAdmin.id,
      tenantId: crmTenant.id,
      role: 'ADMIN'
    }
  });

  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: crmUser.id,
        tenantId: crmTenant.id
      }
    },
    update: {},
    create: {
      userId: crmUser.id,
      tenantId: crmTenant.id,
      role: 'USER'
    }
  });

  console.log('✅ User-Tenant associations created');

  // 9. Create categories for CRM
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Cliente VIP',
        cor: '#10B981',
        descricao: 'Clientes de alto valor'
      }
    }),
    prisma.category.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Prospect',
        cor: '#F59E0B',
        descricao: 'Clientes em potencial'
      }
    }),
    prisma.category.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Lead Qualificado',
        cor: '#3B82F6',
        descricao: 'Leads que demonstraram interesse'
      }
    }),
    prisma.category.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Cliente Inativo',
        cor: '#6B7280',
        descricao: 'Clientes sem atividade recente'
      }
    })
  ]);

  console.log('✅ CRM Categories created');

  // 10. Create contacts for CRM testing
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'João Silva',
        telefone: '+5511999999999',
        email: 'joao.silva@techcorp.com.br',
        tags: ['cliente-vip', 'tecnologia', 'brasil'],
        observacoes:
          'CEO da TechCorp, muito interessado em soluções de CRM. Prefere contato via WhatsApp.',
        categoriaId: categories[0].id
      }
    }),
    prisma.contact.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Maria Santos',
        telefone: '+5511888888888',
        email: 'maria.santos@varejomax.com.br',
        tags: ['prospect', 'varejo', 'grande-cliente'],
        observacoes:
          'Gerente de Vendas da VarejoMax. Interessada em automação de vendas.',
        categoriaId: categories[1].id
      }
    }),
    prisma.contact.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Pedro Costa',
        telefone: '+5511777777777',
        email: 'pedro.costa@startupx.com.br',
        tags: ['lead-qualificado', 'startup', 'inovacao'],
        observacoes:
          'Fundador da StartupX. Buscando soluções para crescimento rápido.',
        categoriaId: categories[2].id
      }
    }),
    prisma.contact.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Ana Oliveira',
        telefone: '+5511666666666',
        email: 'ana.oliveira@consultoria.com.br',
        tags: ['cliente-antigo', 'consultoria', 'pequeno'],
        observacoes:
          'Cliente antigo que não responde há 3 meses. Precisa reativar.',
        categoriaId: categories[3].id
      }
    }),
    prisma.contact.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Carlos Mendes',
        telefone: '+5511555555555',
        email: 'carlos.mendes@industria.com.br',
        tags: ['prospect', 'industria', 'medio-cliente'],
        observacoes:
          'Diretor Industrial. Interessado em automação de processos.',
        categoriaId: categories[1].id
      }
    })
  ]);

  console.log('✅ CRM Contacts created');

  // 11. Create WhatsApp sessions for testing
  const sessions = await Promise.all([
    prisma.whatsAppSession.create({
      data: {
        tenantId: crmTenant.id,
        name: 'vendas_crm_001',
        displayName: 'Vendas CRM',
        status: 'WORKING',
        provider: 'WAHA',
        mePushName: 'Vendas CRM',
        meId: '5511999999999@s.whatsapp.net',
        meJid: '5511999999999@s.whatsapp.net'
      }
    }),
    prisma.whatsAppSession.create({
      data: {
        tenantId: crmTenant.id,
        name: 'suporte_crm_002',
        displayName: 'Suporte CRM',
        status: 'WORKING',
        provider: 'EVOLUTION',
        mePushName: 'Suporte CRM',
        meId: '5511888888888@s.whatsapp.net',
        meJid: '5511888888888@s.whatsapp.net'
      }
    })
  ]);

  console.log('✅ WhatsApp Sessions created');

  // 12. Create sample campaigns
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Campanha Clientes VIP - Black Friday',
        targetTags: 'cliente-vip',
        sessionNames: 'vendas_crm_001',
        messageType: 'sequence',
        messageContent: JSON.stringify({
          sequence: [
            {
              type: 'text',
              content:
                'Olá {{nome}}! 🎉 A Black Friday chegou com ofertas exclusivas para você!'
            },
            {
              type: 'text',
              content:
                'Como nosso cliente VIP, você tem acesso antecipado aos melhores descontos!'
            },
            {
              type: 'text',
              content:
                'Quer saber mais? Responda SIM que te envio todas as ofertas! 😊'
            }
          ]
        }),
        randomDelay: 30,
        startImmediately: false,
        status: 'PENDING',
        totalContacts: 1,
        createdBy: crmAdmin.id,
        createdByName: 'Admin CRM'
      }
    }),
    prisma.campaign.create({
      data: {
        tenantId: crmTenant.id,
        nome: 'Reativação de Clientes Inativos',
        targetTags: 'cliente-antigo',
        sessionNames: 'suporte_crm_002',
        messageType: 'text',
        messageContent: JSON.stringify({
          text: 'Oi {{nome}}! 😊 Sentimos sua falta! Temos novidades incríveis que podem te interessar. Que tal conversarmos?'
        }),
        randomDelay: 60,
        startImmediately: false,
        status: 'PENDING',
        totalContacts: 1,
        createdBy: crmUser.id,
        createdByName: 'João Vendedor'
      }
    })
  ]);

  console.log('✅ Sample Campaigns created');

  // 13. Create sample campaign messages
  await Promise.all([
    prisma.campaignMessage.create({
      data: {
        tenantId: crmTenant.id,
        campaignId: campaigns[0].id,
        contactId: contacts[0].id,
        contactPhone: contacts[0].telefone,
        contactName: contacts[0].nome,
        status: 'PENDING',
        sessionName: 'vendas_crm_001'
      }
    }),
    prisma.campaignMessage.create({
      data: {
        tenantId: crmTenant.id,
        campaignId: campaigns[1].id,
        contactId: contacts[3].id,
        contactPhone: contacts[3].telefone,
        contactName: contacts[3].nome,
        status: 'PENDING',
        sessionName: 'suporte_crm_002'
      }
    })
  ]);

  console.log('✅ Campaign Messages created');

  console.log('🎉 CRM setup completed successfully!');
  console.log('📋 Summary:');
  console.log(`   - CRM Tenant: ${crmTenant.slug} (${crmTenant.name})`);
  console.log(`   - SUPERADMIN: superadmin@astraonline.com.br / Admin123`);
  console.log(`   - CRM ADMIN: admin@empresa-teste.com / Admin123`);
  console.log(`   - CRM USER: vendedor@empresa-teste.com / User123`);
  console.log(`   - Contacts: ${contacts.length} created`);
  console.log(`   - Categories: ${categories.length} created`);
  console.log(`   - Sessions: ${sessions.length} created`);
  console.log(`   - Campaigns: ${campaigns.length} created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
