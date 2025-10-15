/**
 * Script para verificar sessões WhatsApp
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSessions() {
  console.log('🔍 Verificando sessões WhatsApp...\n');

  try {
    const sessions = await prisma.whatsAppSession.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        provider: true,
        tenantId: true
      }
    });

    console.log(`📊 Total de sessões: ${sessions.length}\n`);

    // Agrupar por status
    const byStatus: Record<string, number> = {};
    sessions.forEach((s) => {
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
    });

    console.log('📊 Sessões por status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });

    console.log('\n📋 Detalhes das sessões:');
    sessions.forEach((s) => {
      console.log(`   ${s.name} (${s.provider}) → ${s.status}`);
    });
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();






