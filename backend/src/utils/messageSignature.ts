import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// FORMATAR MENSAGEM COM ASSINATURA
// ============================================================================
export const formatMessageWithSignature = async (
  messageBody: string,
  userId: string,
  shouldSign: boolean = true
): Promise<string> => {
  try {
    // Se não deve assinar ou não há usuário, retorna mensagem original
    if (!shouldSign || !userId) {
      return messageBody;
    }

    // Buscar informações do usuário e departamento
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user) {
      return messageBody;
    }

    // ADMIN não assina mensagens
    if (user.role === 'ADMIN' || user.role === 'SUPERADMIN') {
      return messageBody;
    }

    // USER assina com nome e departamento
    const departmentName = user.department?.name || 'Sem Departamento';
    const signature = `\n\n_**${user.nome} [${departmentName}]**_`;
    
    return messageBody + signature;
  } catch (error) {
    console.error('❌ Erro ao formatar assinatura da mensagem:', error);
    return messageBody; // Retorna mensagem original em caso de erro
  }
};

// ============================================================================
// EXTRAIR ASSINATURA DE MENSAGEM
// ============================================================================
export const extractSignature = (messageBody: string): {
  originalMessage: string;
  signature?: {
    userName: string;
    departmentName: string;
  };
} => {
  try {
    // Regex para capturar assinatura no formato: **_Nome [Departamento]_**
    const signatureRegex = /\n\n\*\*_([^[]+)\[([^\]]+)\]_?\*\*/;
    const match = messageBody.match(signatureRegex);

    if (match) {
      const originalMessage = messageBody.replace(signatureRegex, '').trim();
      return {
        originalMessage,
        signature: {
          userName: match[1].trim(),
          departmentName: match[2].trim()
        }
      };
    }

    return {
      originalMessage: messageBody
    };
  } catch (error) {
    console.error('❌ Erro ao extrair assinatura:', error);
    return {
      originalMessage: messageBody
    };
  }
};

// ============================================================================
// VERIFICAR SE USUÁRIO DEVE ASSINAR MENSAGENS
// ============================================================================
export const shouldSignMessage = (userRole: string): boolean => {
  // Apenas usuários comuns (USER) assinam mensagens
  // ADMIN e SUPERADMIN não assinam
  return userRole === 'USER';
};
