import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Verificar se já existe um usuário admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Usuário admin já existe:', existingAdmin.email);
      return;
    }

    // Dados do usuário admin padrão
    const adminData = {
      nome: 'Administrador',
      email: 'admin@astra.com.br',
      senha: 'Admin123!',
      role: 'ADMIN'
    };

    // Hash da senha
    const hashedPassword = await bcrypt.hash(adminData.senha, 12);

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        nome: adminData.nome,
        email: adminData.email,
        senha: hashedPassword,
        role: adminData.role
      }
    });

    console.log('🎉 Usuário admin criado com sucesso!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Senha:', adminData.senha);
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();