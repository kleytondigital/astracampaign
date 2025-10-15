/**
 * Script para corrigir chats sem sessionId
 * Executa: npx ts-node fix-chats-without-session.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixChatsWithoutSession() {
  console.log('🔧 Iniciando correção de chats sem sessionId...\n');

  try {
    // Buscar todos os chats sem sessionId
    const chatsWithoutSession = await prisma.chat.findMany({
      where: {
        sessionId: null
      },
      select: {
        id: true,
        phone: true,
        tenantId: true
      }
    });

    console.log(
      `📊 Encontrados ${chatsWithoutSession.length} chats sem sessionId\n`
    );

    if (chatsWithoutSession.length === 0) {
      console.log('✅ Todos os chats já possuem sessionId associado!');
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    // Processar cada chat
    for (const chat of chatsWithoutSession) {
      try {
        // Buscar primeira sessão ativa do tenant (qualquer status exceto STOPPED/FAILED)
        const session = await prisma.whatsAppSession.findFirst({
          where: {
            tenantId: chat.tenantId,
            status: {
              not: 'STOPPED'
            }
          },
          orderBy: {
            criadoEm: 'asc'
          }
        });

        if (session) {
          // Atualizar chat com sessionId
          await prisma.chat.update({
            where: { id: chat.id },
            data: { sessionId: session.id }
          });

          console.log(`✅ Chat ${chat.phone} → Sessão ${session.name}`);
          updatedCount++;
        } else {
          console.log(
            `⚠️  Chat ${chat.phone} → Nenhuma sessão ativa encontrada`
          );
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Erro ao atualizar chat ${chat.phone}:`, error);
        errorCount++;
      }
    }

    console.log('\n📊 RESUMO:');
    console.log(`   ✅ Chats atualizados: ${updatedCount}`);
    console.log(`   ⚠️  Chats sem sessão disponível: ${errorCount}`);
    console.log(`   📝 Total processados: ${chatsWithoutSession.length}`);

    if (updatedCount > 0) {
      console.log('\n🎉 Correção concluída com sucesso!');
    }
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
fixChatsWithoutSession()
  .then(() => {
    console.log('\n✅ Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
