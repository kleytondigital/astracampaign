import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Opportunities seed...');

  // Buscar tenant de teste
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'empresa-teste-crm' }
  });

  if (!tenant) {
    console.log('❌ Tenant não encontrado. Execute primeiro o seed CRM.');
    return;
  }

  // Buscar contatos existentes
  const contacts = await prisma.contact.findMany({
    where: { tenantId: tenant.id },
    take: 3
  });

  // Buscar usuário admin
  const admin = await prisma.user.findFirst({
    where: {
      tenantId: tenant.id,
      role: 'ADMIN'
    }
  });

  if (!admin) {
    console.log('❌ Usuário admin não encontrado.');
    return;
  }

  // Criar empresas de exemplo
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: 'TechCorp Solutions',
        industry: 'Tecnologia',
        size: 'MEDIUM',
        website: 'https://techcorp.com',
        phone: '+5511999999999',
        email: 'contato@techcorp.com',
        description: 'Empresa de tecnologia focada em soluções inovadoras',
        tags: ['tecnologia', 'inovacao', 'software'],
        assignedTo: admin.id
      }
    }),
    prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: 'VarejoMax',
        industry: 'Varejo',
        size: 'LARGE',
        website: 'https://varejomax.com.br',
        phone: '+5511888888888',
        email: 'vendas@varejomax.com.br',
        description: 'Rede de varejo com múltiplas lojas',
        tags: ['varejo', 'grande-cliente', 'multiplas-lojas'],
        assignedTo: admin.id
      }
    }),
    prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: 'StartupX',
        industry: 'Inovação',
        size: 'STARTUP',
        website: 'https://startupx.com.br',
        phone: '+5511777777777',
        email: 'hello@startupx.com.br',
        description: 'Startup em crescimento rápido',
        tags: ['startup', 'inovacao', 'crescimento'],
        assignedTo: admin.id
      }
    })
  ]);

  console.log('✅ Companies created');

  // Criar oportunidades de exemplo
  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        contactId: contacts[0]?.id,
        companyId: companies[0].id,
        title: 'Implementação de CRM',
        value: 50000.0,
        stage: 'PROPOSAL',
        probability: 75,
        expectedClose: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        source: 'WEBSITE',
        description: 'Implementação completa de CRM para TechCorp Solutions',
        assignedTo: admin.id,
        tags: ['crm', 'implementacao', 'grande-valor']
      }
    }),
    prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        contactId: contacts[1]?.id,
        companyId: companies[1].id,
        title: 'Sistema de Vendas',
        value: 25000.0,
        stage: 'NEGOTIATION',
        probability: 60,
        expectedClose: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
        source: 'REFERRAL',
        description: 'Sistema de vendas para VarejoMax',
        assignedTo: admin.id,
        tags: ['vendas', 'sistema', 'varejo']
      }
    }),
    prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        contactId: contacts[2]?.id,
        companyId: companies[2].id,
        title: 'Plataforma de Automação',
        value: 15000.0,
        stage: 'QUALIFIED',
        probability: 40,
        expectedClose: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 dias
        source: 'SOCIAL_MEDIA',
        description: 'Plataforma de automação para StartupX',
        assignedTo: admin.id,
        tags: ['automacao', 'plataforma', 'startup']
      }
    }),
    prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        contactId: contacts[0]?.id,
        companyId: companies[0].id,
        title: 'Consultoria em Transformação Digital',
        value: 80000.0,
        stage: 'CLOSED_WON',
        probability: 100,
        expectedClose: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 dias atrás
        actualClose: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        source: 'WEBSITE',
        description: 'Consultoria completa em transformação digital',
        assignedTo: admin.id,
        tags: ['consultoria', 'transformacao-digital', 'ganha']
      }
    }),
    prisma.opportunity.create({
      data: {
        tenantId: tenant.id,
        contactId: contacts[1]?.id,
        companyId: companies[1].id,
        title: 'Integração de Sistemas',
        value: 12000.0,
        stage: 'CLOSED_LOST',
        probability: 0,
        expectedClose: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 dias atrás
        actualClose: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        source: 'COLD_CALL',
        description: 'Integração de sistemas legados',
        assignedTo: admin.id,
        tags: ['integracao', 'sistemas-legados', 'perdida']
      }
    })
  ]);

  console.log('✅ Opportunities created');

  // Criar atividades de exemplo
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        opportunityId: opportunities[0].id,
        contactId: contacts[0]?.id,
        type: 'MEETING',
        subject: 'Reunião de apresentação da proposta',
        description: 'Apresentar proposta detalhada de implementação do CRM',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 dias
        assignedTo: admin.id,
        priority: 'HIGH',
        status: 'PENDING'
      }
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        opportunityId: opportunities[1].id,
        contactId: contacts[1]?.id,
        type: 'CALL',
        subject: 'Ligação de follow-up',
        description: 'Verificar status da negociação',
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 dia
        assignedTo: admin.id,
        priority: 'MEDIUM',
        status: 'PENDING'
      }
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        opportunityId: opportunities[2].id,
        contactId: contacts[2]?.id,
        type: 'DEMO',
        subject: 'Demonstração da plataforma',
        description: 'Demonstrar funcionalidades da plataforma de automação',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        assignedTo: admin.id,
        priority: 'HIGH',
        status: 'PENDING'
      }
    }),
    prisma.activity.create({
      data: {
        tenantId: tenant.id,
        opportunityId: opportunities[0].id,
        contactId: contacts[0]?.id,
        type: 'EMAIL',
        subject: 'Envio de proposta por email',
        description: 'Enviar proposta detalhada por email',
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 dia atrás
        assignedTo: admin.id,
        priority: 'MEDIUM',
        status: 'COMPLETED'
      }
    })
  ]);

  console.log('✅ Activities created');

  console.log('🎉 Opportunities seed completed successfully!');
  console.log('📋 Summary:');
  console.log(`   - Companies: ${companies.length} created`);
  console.log(`   - Opportunities: ${opportunities.length} created`);
  console.log(`   - Activities: ${activities.length} created`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

