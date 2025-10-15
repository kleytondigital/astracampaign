import { PrismaClient, ChatStatus, ChatMessageType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Chats seed...');

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
    take: 5
  });

  // Buscar leads existentes
  const leads = await prisma.lead.findMany({
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

  // Criar chats de exemplo
  const chats = await Promise.all([
    // Chat 1: Cliente ativo com contato vinculado
    prisma.chat.create({
      data: {
        tenantId: tenant.id,
        phone: '+5511999990001',
        contactId: contacts[0]?.id,
        assignedTo: admin.id,
        lastMessage: 'Olá! Gostaria de saber mais sobre seus serviços.',
        lastMessageAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hora atrás
        unreadCount: 2,
        status: 'OPEN',
        sessionId: 'session-001'
      }
    }),

    // Chat 2: Lead novo (sem contato ainda)
    prisma.chat.create({
      data: {
        tenantId: tenant.id,
        phone: '+5511999990002',
        leadId: leads[0]?.id,
        assignedTo: admin.id,
        lastMessage: 'Quanto custa o plano empresarial?',
        lastMessageAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutos atrás
        unreadCount: 1,
        status: 'OPEN',
        sessionId: 'session-002'
      }
    }),

    // Chat 3: Conversa resolvida
    prisma.chat.create({
      data: {
        tenantId: tenant.id,
        phone: '+5511999990003',
        contactId: contacts[1]?.id,
        assignedTo: admin.id,
        lastMessage: 'Perfeito! Obrigado pela ajuda.',
        lastMessageAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
        unreadCount: 0,
        status: 'RESOLVED',
        sessionId: 'session-003'
      }
    }),

    // Chat 4: Aguardando resposta
    prisma.chat.create({
      data: {
        tenantId: tenant.id,
        phone: '+5511999990004',
        contactId: contacts[2]?.id,
        assignedTo: admin.id,
        lastMessage: 'Vou verificar com minha equipe e retorno em breve.',
        lastMessageAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 horas atrás
        unreadCount: 0,
        status: 'PENDING',
        sessionId: 'session-004'
      }
    }),

    // Chat 5: Lead quente (sem contato)
    prisma.chat.create({
      data: {
        tenantId: tenant.id,
        phone: '+5511999990005',
        leadId: leads[1]?.id,
        lastMessage: 'Preciso urgente! Quando podemos conversar?',
        lastMessageAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutos atrás
        unreadCount: 3,
        status: 'OPEN',
        sessionId: 'session-005'
      }
    })
  ]);

  console.log('✅ Chats created:', chats.length);

  // Criar mensagens de exemplo para cada chat
  const messages = [];

  // Mensagens do Chat 1
  messages.push(
    await prisma.message.create({
      data: {
        chatId: chats[0].id,
        phone: '+5511999990001',
        fromMe: false,
        body: 'Olá! Tudo bem?',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        ack: 3,
        messageId: 'msg-001-001'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[0].id,
        phone: tenant.id,
        fromMe: true,
        body: 'Olá! Tudo ótimo! Como posso ajudá-lo?',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000),
        ack: 3,
        messageId: 'msg-001-002'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[0].id,
        phone: '+5511999990001',
        fromMe: false,
        body: 'Gostaria de saber mais sobre seus serviços.',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        ack: 3,
        messageId: 'msg-001-003'
      }
    })
  );

  // Mensagens do Chat 2
  messages.push(
    await prisma.message.create({
      data: {
        chatId: chats[1].id,
        phone: '+5511999990002',
        fromMe: false,
        body: 'Oi, vi seu anúncio no Instagram',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        ack: 3,
        messageId: 'msg-002-001'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[1].id,
        phone: '+5511999990002',
        fromMe: false,
        body: 'Quanto custa o plano empresarial?',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        ack: 3,
        messageId: 'msg-002-002'
      }
    })
  );

  // Mensagens do Chat 3 (resolvido)
  messages.push(
    await prisma.message.create({
      data: {
        chatId: chats[2].id,
        phone: '+5511999990003',
        fromMe: false,
        body: 'Preciso de ajuda com minha conta',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ack: 3,
        messageId: 'msg-003-001'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[2].id,
        phone: tenant.id,
        fromMe: true,
        body: 'Claro! O que aconteceu?',
        type: 'TEXT',
        timestamp: new Date(
          Date.now() - 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000
        ),
        ack: 3,
        messageId: 'msg-003-002'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[2].id,
        phone: '+5511999990003',
        fromMe: false,
        body: 'Consegui resolver! Obrigado pela ajuda.',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ack: 3,
        messageId: 'msg-003-003'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[2].id,
        phone: tenant.id,
        fromMe: true,
        body: 'Ótimo! Sempre à disposição! 😊',
        type: 'TEXT',
        timestamp: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000
        ),
        ack: 3,
        messageId: 'msg-003-004'
      }
    })
  );

  // Mensagens do Chat 4 (pending)
  messages.push(
    await prisma.message.create({
      data: {
        chatId: chats[3].id,
        phone: '+5511999990004',
        fromMe: false,
        body: 'Vocês fazem integração com sistemas legados?',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        ack: 3,
        messageId: 'msg-004-001'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[3].id,
        phone: tenant.id,
        fromMe: true,
        body: 'Vou verificar com minha equipe e retorno em breve.',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        ack: 3,
        messageId: 'msg-004-002'
      }
    })
  );

  // Mensagens do Chat 5 (lead quente)
  messages.push(
    await prisma.message.create({
      data: {
        chatId: chats[4].id,
        phone: '+5511999990005',
        fromMe: false,
        body: 'URGENTE!',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        ack: 3,
        messageId: 'msg-005-001'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[4].id,
        phone: '+5511999990005',
        fromMe: false,
        body: 'Preciso de uma solução para ontem!',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        ack: 3,
        messageId: 'msg-005-002'
      }
    }),
    await prisma.message.create({
      data: {
        chatId: chats[4].id,
        phone: '+5511999990005',
        fromMe: false,
        body: 'Quando podemos conversar?',
        type: 'TEXT',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        ack: 3,
        messageId: 'msg-005-003'
      }
    })
  );

  console.log('✅ Messages created:', messages.length);

  // Criar notificações de exemplo
  const notifications = await Promise.all([
    prisma.cRMNotification.create({
      data: {
        tenantId: tenant.id,
        userId: admin.id,
        type: 'NEW_MESSAGE',
        title: 'Nova mensagem de +5511999990005',
        message: 'Você tem uma nova mensagem urgente!',
        link: `/atendimento?chat=${chats[4].id}`,
        read: false
      }
    }),
    prisma.cRMNotification.create({
      data: {
        tenantId: tenant.id,
        userId: admin.id,
        type: 'LEAD_HOT',
        title: 'Lead quente detectado',
        message: 'Um lead com score alto precisa de atenção imediata.',
        link: `/leads/${leads[1]?.id}`,
        read: false
      }
    }),
    prisma.cRMNotification.create({
      data: {
        tenantId: tenant.id,
        userId: admin.id,
        type: 'ACTIVITY_DUE',
        title: 'Atividade próxima do vencimento',
        message: 'Você tem uma reunião agendada para daqui a 1 hora.',
        link: '/atividades',
        read: true,
        readAt: new Date(Date.now() - 30 * 60 * 1000)
      }
    })
  ]);

  console.log('✅ CRM Notifications created:', notifications.length);

  console.log('🎉 Chats seed completed successfully!');
  console.log('📋 Summary:');
  console.log(`   - Chats: ${chats.length} created`);
  console.log(`   - Messages: ${messages.length} created`);
  console.log(`   - CRM Notifications: ${notifications.length} created`);
  console.log('\n📱 Status dos Chats:');
  console.log(
    `   - OPEN (Abertos): ${chats.filter((c) => c.status === 'OPEN').length}`
  );
  console.log(
    `   - PENDING (Aguardando): ${chats.filter((c) => c.status === 'PENDING').length}`
  );
  console.log(
    `   - RESOLVED (Resolvidos): ${chats.filter((c) => c.status === 'RESOLVED').length}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






