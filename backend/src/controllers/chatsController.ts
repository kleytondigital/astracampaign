import { Response } from 'express';
import { PrismaClient, ChatStatus, ChatMessageType } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendMessage as sendWAHA } from '../services/wahaApiService';
import { sendMessageViaEvolution } from '../services/evolutionMessageService';
import { formatMessageWithSignature, shouldSignMessage } from '../utils/messageSignature';

const prisma = new PrismaClient();

// ============================================================================
// LISTAR CHATS COM FILTROS E PAGINAÇÃO
// ============================================================================

export const getChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '20',
      status = '',
      assignedTo = '',
      search = '',
      unreadOnly = 'false'
    } = req.query;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!tenantId && userRole !== 'SUPERADMIN') {
      return res.status(400).json({
        success: false,
        error: 'Tenant não identificado',
        message:
          'Sua sessão não possui informações de tenant. Faça login novamente.'
      });
    }

    const pageNum = parseInt(page as string);
    const pageSizeNum = parseInt(pageSize as string);
    const skip = (pageNum - 1) * pageSizeNum;

    // Filtros baseados em permissões
    const where: any = {};

    // SUPERADMIN vê todos os chats
    // ADMIN vê todos os chats do tenant
    // USER vê apenas chats atribuídos a ele
    if (userRole === 'SUPERADMIN') {
      // Sem filtro de tenant
    } else if (userRole === 'ADMIN') {
      where.tenantId = tenantId;
    } else {
      where.tenantId = tenantId;
      where.assignedTo = userId;
    }

    // Filtro por status
    if (status) {
      where.status = status as ChatStatus;
    }

    // Filtro por usuário atribuído
    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    // Filtro por não lidos
    if (unreadOnly === 'true') {
      where.unreadCount = { gt: 0 };
    }

    // Busca por telefone ou última mensagem
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { lastMessage: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [chats, total] = await Promise.all([
      prisma.chat.findMany({
        where,
        skip,
        take: pageSizeNum,
        orderBy: [
          { unreadCount: 'desc' }, // Não lidos primeiro
          { lastMessageAt: 'desc' } // Mais recentes primeiro
        ],
        include: {
          contact: {
            select: {
              id: true,
              nome: true,
              email: true,
              telefone: true
            }
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              score: true,
              status: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              color: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        }
      }),
      prisma.chat.count({ where })
    ]);

    const totalPages = Math.ceil(total / pageSizeNum);

    res.json({
      success: true,
      chats,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar chats:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// BUSCAR CHAT POR ID COM MENSAGENS
// ============================================================================

export const getChatById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { messagesPage = '1', messagesPageSize = '50' } = req.query;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const messagesPageNum = parseInt(messagesPage as string);
    const messagesPageSizeNum = parseInt(messagesPageSize as string);
    const messagesSkip = (messagesPageNum - 1) * messagesPageSizeNum;

    // Buscar chat
    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        contact: true,
        lead: true,
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Verificar permissões
    if (userRole === 'USER' && chat.assignedTo !== userId) {
      return res
        .status(403)
        .json({ error: 'Você não tem permissão para acessar este chat' });
    }

    if (userRole !== 'SUPERADMIN' && chat.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Chat não pertence ao seu tenant' });
    }

    // Buscar mensagens com paginação
    const [messages, totalMessages] = await Promise.all([
      prisma.message.findMany({
        where: { chatId: id },
        skip: messagesSkip,
        take: messagesPageSizeNum,
        orderBy: { timestamp: 'asc' } // Mais antigas primeiro (ordem cronológica)
      }),
      prisma.message.count({ where: { chatId: id } })
    ]);

    const totalMessagesPages = Math.ceil(totalMessages / messagesPageSizeNum);

    res.json({
      success: true,
      chat,
      messages,
      messagesPagination: {
        page: messagesPageNum,
        pageSize: messagesPageSizeNum,
        total: totalMessages,
        totalPages: totalMessagesPages
      }
    });
  } catch (error) {
    console.error('Erro ao buscar chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ENVIAR MENSAGEM
// ============================================================================

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: chatId } = req.params; // ✅ Corrigido: rota usa :id, não :chatId
    const { body, type = 'TEXT', mediaUrl, preRegisteredMediaId } = req.body;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!body && !mediaUrl && !preRegisteredMediaId) {
      return res.status(400).json({
        error: 'Corpo da mensagem, mídia ou mídia pré-cadastrada é obrigatório'
      });
    }

    // Se usar mídia pré-cadastrada, buscar dados da mídia
    let finalMediaUrl = mediaUrl;
    let finalType = type;
    let finalBody = body;
    
    // Aplicar assinatura se necessário (apenas para mensagens de texto)
    if (finalBody && finalType === 'TEXT' && shouldSignMessage(userRole || 'USER')) {
      finalBody = await formatMessageWithSignature(finalBody, userId || '', true);
    }

    if (preRegisteredMediaId) {
      const preRegisteredMedia = await prisma.preRegisteredMedia.findUnique({
        where: { id: preRegisteredMediaId }
      });

      if (!preRegisteredMedia || !preRegisteredMedia.isActive) {
        return res
          .status(404)
          .json({ error: 'Mídia pré-cadastrada não encontrada ou inativa' });
      }

      // Verificar se a mídia pertence ao tenant (exceto SUPERADMIN)
      if (
        userRole !== 'SUPERADMIN' &&
        preRegisteredMedia.tenantId !== tenantId
      ) {
        return res
          .status(403)
          .json({ error: 'Sem permissão para usar esta mídia pré-cadastrada' });
      }

      finalMediaUrl = preRegisteredMedia.mediaUrl;
      finalType = preRegisteredMedia.type;
      finalBody = body || preRegisteredMedia.name;

      // Incrementar contador de uso
      await prisma.preRegisteredMedia.update({
        where: { id: preRegisteredMediaId },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
    }

    // Buscar chat
    const chat = await prisma.chat.findUnique({
      where: { id: chatId }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Verificar permissões
    if (userRole === 'USER' && chat.assignedTo !== userId) {
      return res.status(403).json({
        error: 'Você não tem permissão para enviar mensagens neste chat'
      });
    }

    if (userRole !== 'SUPERADMIN' && chat.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Chat não pertence ao seu tenant' });
    }

    // Buscar sessão WhatsApp
    const session = await prisma.whatsAppSession.findUnique({
      where: { id: chat.sessionId || '' }
    });

    if (!session) {
      return res
        .status(400)
        .json({ error: 'Sessão WhatsApp não encontrada para este chat' });
    }

    // Enviar mensagem via WAHA ou Evolution (reutilizando lógica das campanhas)
    let sentResult: any;
    try {
      if (session.provider === 'EVOLUTION') {
        // Usar a lógica das campanhas que já funciona
        if (finalType === 'TEXT') {
          sentResult = await sendMessageViaEvolution(session.name, chat.phone, {
            text: finalBody
          });
        } else if (finalType === 'IMAGE' && finalMediaUrl) {
          sentResult = await sendMessageViaEvolution(session.name, chat.phone, {
            image: { url: finalMediaUrl },
            caption: finalBody || '',
            fileName: 'imagem.png'
          });
        } else if (finalType === 'VIDEO' && finalMediaUrl) {
          sentResult = await sendMessageViaEvolution(session.name, chat.phone, {
            video: { url: finalMediaUrl },
            caption: finalBody || '',
            fileName: 'video.mp4'
          });
        } else if (finalType === 'AUDIO' && finalMediaUrl) {
          sentResult = await sendMessageViaEvolution(session.name, chat.phone, {
            audio: { url: finalMediaUrl },
            fileName: 'audio.ogg'
          });
        } else if (finalType === 'DOCUMENT' && finalMediaUrl) {
          sentResult = await sendMessageViaEvolution(session.name, chat.phone, {
            document: { url: finalMediaUrl },
            fileName: 'documento.pdf',
            caption: finalBody || ''
          });
        }
      } else {
        // Enviar via WAHA (lógica das campanhas)
        if (finalType === 'TEXT') {
          sentResult = await sendWAHA(session.name, chat.phone, {
            text: finalBody
          });
        } else if (finalType === 'IMAGE' && finalMediaUrl) {
          sentResult = await sendWAHA(session.name, chat.phone, {
            image: { url: finalMediaUrl },
            caption: finalBody
          });
        } else if (finalType === 'VIDEO' && finalMediaUrl) {
          sentResult = await sendWAHA(session.name, chat.phone, {
            video: { url: finalMediaUrl },
            caption: finalBody
          });
        } else if (finalType === 'AUDIO' && finalMediaUrl) {
          sentResult = await sendWAHA(session.name, chat.phone, {
            audio: { url: finalMediaUrl }
          });
        } else if (finalType === 'DOCUMENT' && finalMediaUrl) {
          sentResult = await sendWAHA(session.name, chat.phone, {
            document: { url: finalMediaUrl },
            fileName: finalBody || 'document.pdf'
          });
        }
      }

      console.log('✅ Mensagem enviada via WhatsApp:', sentResult);
      console.log('📊 Tipo de mensagem enviada:', finalType);
      console.log('🔗 URL da mídia:', finalMediaUrl);
      console.log('📝 Conteúdo da mensagem:', finalBody);
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via WhatsApp:', error);
      console.error('📊 Dados do erro:', {
        type: finalType,
        mediaUrl: finalMediaUrl,
        body: finalBody,
        sessionName: session.name,
        phone: chat.phone
      });
      return res
        .status(500)
        .json({ error: 'Erro ao enviar mensagem via WhatsApp' });
    }

    // Buscar informações do usuário para assinatura (departamento padrão)
    const userWithDepartment = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        departments: {
          where: { isDefault: true },
          include: {
            department: {
              select: { name: true }
            }
          },
          take: 1
        }
      }
    });

    const departmentName = userWithDepartment?.departments?.[0]?.department?.name || null;

    // Criar mensagem no banco
    const message = await prisma.message.create({
      data: {
        chatId,
        phone: chat.phone,
        fromMe: true,
        body: finalBody, // Usar o body final (com assinatura se aplicável)
        type: finalType as ChatMessageType,
        mediaUrl: finalMediaUrl,
        timestamp: new Date(),
        ack: 1, // Enviado
        messageId: sentResult?.id || sentResult?.key?.id,
        // Campos de assinatura
        sentBy: userId,
        departmentName: departmentName,
        isSigned: shouldSignMessage(userRole || 'USER')
      }
    });

    // Atualizar última mensagem do chat (sem assinatura)
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: body || '[Mídia]', // Usar o body original, sem assinatura
        lastMessageAt: new Date()
      }
    });

    res.json({
      success: true,
      message,
      whatsappResult: sentResult
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ATRIBUIR CHAT A UM USUÁRIO
// ============================================================================

export const assignChat = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    if (!assignedTo) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório' });
    }

    // Buscar chat
    const chat = await prisma.chat.findUnique({
      where: { id }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Verificar permissões
    if (userRole === 'USER') {
      return res
        .status(403)
        .json({ error: 'Apenas ADMIN pode atribuir chats' });
    }

    if (userRole !== 'SUPERADMIN' && chat.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Chat não pertence ao seu tenant' });
    }

    // Verificar se o usuário existe e pertence ao tenant
    const user = await prisma.user.findUnique({
      where: { id: assignedTo }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (userRole !== 'SUPERADMIN' && user.tenantId !== tenantId) {
      return res
        .status(400)
        .json({ error: 'Usuário não pertence ao seu tenant' });
    }

    // Atribuir chat
    const updatedChat = await prisma.chat.update({
      where: { id },
      data: { assignedTo },
      include: {
        assignedUser: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // Criar notificação para o usuário atribuído
    await prisma.cRMNotification.create({
      data: {
        tenantId: chat.tenantId,
        userId: assignedTo,
        type: 'CHAT_ASSIGNED',
        title: 'Chat atribuído a você',
        message: `Você foi atribuído ao chat com ${chat.phone}`,
        link: `/atendimento?chat=${id}`
      }
    });

    res.json({
      success: true,
      chat: updatedChat
    });
  } catch (error) {
    console.error('Erro ao atribuir chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// MARCAR CHAT COMO LIDO
// ============================================================================

export const markChatAsRead = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Buscar chat
    const chat = await prisma.chat.findUnique({
      where: { id }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Verificar permissões
    if (userRole === 'USER' && chat.assignedTo !== userId) {
      return res.status(403).json({
        error: 'Você não tem permissão para marcar este chat como lido'
      });
    }

    if (userRole !== 'SUPERADMIN' && chat.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Chat não pertence ao seu tenant' });
    }

    // Marcar como lido
    const updatedChat = await prisma.chat.update({
      where: { id },
      data: { unreadCount: 0 }
    });

    res.json({
      success: true,
      chat: updatedChat
    });
  } catch (error) {
    console.error('Erro ao marcar chat como lido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ATUALIZAR STATUS DO CHAT
// ============================================================================

export const updateChatStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (
      !status ||
      !['OPEN', 'PENDING', 'RESOLVED', 'ARCHIVED'].includes(status)
    ) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    // Buscar chat
    const chat = await prisma.chat.findUnique({
      where: { id }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Verificar permissões
    if (userRole === 'USER' && chat.assignedTo !== userId) {
      return res
        .status(403)
        .json({ error: 'Você não tem permissão para atualizar este chat' });
    }

    if (userRole !== 'SUPERADMIN' && chat.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Chat não pertence ao seu tenant' });
    }

    // Atualizar status
    const updatedChat = await prisma.chat.update({
      where: { id },
      data: { status: status as ChatStatus }
    });

    res.json({
      success: true,
      chat: updatedChat
    });
  } catch (error) {
    console.error('Erro ao atualizar status do chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// CRIAR LEAD AUTOMATICAMENTE A PARTIR DO CHAT
// ============================================================================

export const createLeadFromChat = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, company, score = 50 } = req.body;

    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ error: 'Nome e sobrenome são obrigatórios' });
    }

    // Buscar chat
    const chat = await prisma.chat.findUnique({
      where: { id }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat não encontrado' });
    }

    // Verificar permissões
    if (userRole !== 'SUPERADMIN' && chat.tenantId !== tenantId) {
      return res.status(403).json({ error: 'Chat não pertence ao seu tenant' });
    }

    // Verificar se já existe lead para este chat
    if (chat.leadId) {
      return res
        .status(400)
        .json({ error: 'Este chat já possui um lead vinculado' });
    }

    // Criar lead
    const lead = await prisma.lead.create({
      data: {
        tenantId: chat.tenantId,
        firstName,
        lastName,
        email: email || `${chat.phone}@whatsapp.com`,
        phone: chat.phone,
        company,
        source: 'WHATSAPP_CAMPAIGN',
        status: 'NEW',
        score,
        assignedTo: chat.assignedTo || userId
      }
    });

    // Vincular lead ao chat
    await prisma.chat.update({
      where: { id },
      data: { leadId: lead.id }
    });

    res.json({
      success: true,
      lead,
      message: 'Lead criado e vinculado ao chat com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar lead:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// ESTATÍSTICAS DE CHATS
// ============================================================================

export const getChatStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const where: any = {};

    if (userRole === 'USER') {
      where.tenantId = tenantId;
      where.assignedTo = userId;
    } else if (userRole === 'ADMIN') {
      where.tenantId = tenantId;
    }
    // SUPERADMIN vê tudo

    const [
      totalChats,
      openChats,
      pendingChats,
      resolvedChats,
      unreadChats,
      chatsToday
    ] = await Promise.all([
      prisma.chat.count({ where }),
      prisma.chat.count({ where: { ...where, status: 'OPEN' } }),
      prisma.chat.count({ where: { ...where, status: 'PENDING' } }),
      prisma.chat.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.chat.count({ where: { ...where, unreadCount: { gt: 0 } } }),
      prisma.chat.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      })
    ]);

    res.json({
      success: true,
      stats: {
        total: totalChats,
        open: openChats,
        pending: pendingChats,
        resolved: resolvedChats,
        unread: unreadChats,
        today: chatsToday
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ============================================================================
// SINCRONIZAR CHATS DA EVOLUTION API
// ============================================================================

export const syncChatsFromEvolution = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { instanceName } = req.params;
    const tenantId = req.user?.tenantId;
    const userRole = req.user?.role;

    console.log(`\n🔄 [SYNC] ========== INICIANDO SINCRONIZAÇÃO ==========`);
    console.log(`🔄 [SYNC] Instância: ${instanceName}`);
    console.log(`🔄 [SYNC] Tenant ID: ${tenantId}`);
    console.log(`🔄 [SYNC] User Role: ${userRole}`);

    if (!tenantId && userRole !== 'SUPERADMIN') {
      console.error(`❌ [SYNC] Tenant não identificado`);
      return res.status(400).json({
        success: false,
        error: 'Tenant não identificado'
      });
    }

    // Buscar sessão WhatsApp
    console.log(`🔍 [SYNC] Buscando sessão WhatsApp...`);
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        name: instanceName,
        ...(userRole !== 'SUPERADMIN' && { tenantId })
      }
    });

    if (!session) {
      console.error(`❌ [SYNC] Sessão não encontrada: ${instanceName}`);
      return res.status(404).json({
        success: false,
        error: 'Sessão não encontrada'
      });
    }

    console.log(
      `✅ [SYNC] Sessão encontrada:`,
      JSON.stringify(
        {
          id: session.id,
          name: session.name,
          provider: session.provider,
          status: session.status,
          tenantId: session.tenantId
        },
        null,
        2
      )
    );

    if (session.provider !== 'EVOLUTION') {
      console.error(`❌ [SYNC] Provider inválido: ${session.provider}`);
      return res.status(400).json({
        success: false,
        error: 'Esta funcionalidade é apenas para instâncias Evolution API'
      });
    }

    // Importar o serviço de Evolution API
    console.log(`📦 [SYNC] Importando evolutionApiService...`);
    const { evolutionApiService } = await import(
      '../services/evolutionApiService'
    );

    // Buscar chats da Evolution
    console.log(`📡 [SYNC] Chamando evolutionApiService.findChats()...`);
    const { success, chats } =
      await evolutionApiService.findChats(instanceName);

    console.log(`📊 [SYNC] Resultado findChats:`, {
      success,
      totalChats: chats.length
    });

    if (!success || chats.length === 0) {
      console.warn(`⚠️ [SYNC] Nenhum chat encontrado`);
      return res.json({
        success: true,
        syncedCount: 0,
        message: 'Nenhum chat encontrado para sincronizar'
      });
    }

    console.log(
      `📋 [SYNC] Primeiros 2 chats:`,
      JSON.stringify(chats.slice(0, 2), null, 2)
    );

    let syncedCount = 0;

    // Sincronizar cada chat
    console.log(`\n🔄 [SYNC] Iniciando loop de sincronização...`);
    for (const chat of chats) {
      try {
        const remoteJid = chat.id || chat.remoteJid;
        console.log(`\n  ➡️  [SYNC] Processando chat: ${remoteJid}`);

        if (!remoteJid) {
          console.warn(`  ⚠️  [SYNC] Chat sem remoteJid, pulando...`);
          continue;
        }

        // Extrair informações do chat
        const isGroup = remoteJid.includes('@g.us');
        const phone = isGroup
          ? remoteJid
          : remoteJid.replace('@s.whatsapp.net', '');

        console.log(`  🔍 [SYNC] Verificando se chat existe no banco...`);
        console.log(`  📱 [SYNC] Phone: ${phone}`);

        // Verificar se chat já existe
        const existingChat = await prisma.chat.findFirst({
          where: {
            phone: phone,
            tenantId: session.tenantId
          }
        });

        if (existingChat) {
          console.log(
            `  ℹ️  [SYNC] Chat já existe (ID: ${existingChat.id}), pulando...`
          );
        } else {
          const contactName =
            chat.name || chat.pushName || chat.verifiedName || phone;

          console.log(`  📝 [SYNC] Criando novo chat:`, {
            phone,
            contactName,
            isGroup,
            unreadCount: chat.unreadMessages || chat.unreadCount || 0
          });

          // Buscar foto de perfil (tentativa, não bloqueia se falhar)
          let profilePicture: string | null = null;
          try {
            const { profilePicture: pic } =
              await evolutionApiService.getProfilePicture(instanceName, phone);
            profilePicture = pic || null;
            if (profilePicture) {
              console.log(`  🖼️  [SYNC] Foto de perfil obtida para ${phone}`);
            }
          } catch (picError) {
            console.warn(
              `  ⚠️  [SYNC] Não foi possível buscar foto de perfil para ${phone}`
            );
          }

          // Criar chat
          const newChat = await prisma.chat.create({
            data: {
              phone: phone,
              contactName: contactName,
              profilePicture: profilePicture,
              tenantId: session.tenantId,
              lastMessage: chat.lastMessage?.message?.conversation || null,
              lastMessageAt: chat.conversationTimestamp
                ? new Date(chat.conversationTimestamp * 1000)
                : new Date(),
              unreadCount: chat.unreadMessages || chat.unreadCount || 0,
              status: 'OPEN',
              sessionId: session.id
            }
          });

          console.log(`  ✅ [SYNC] Chat criado com sucesso! ID: ${newChat.id}`);
          syncedCount++;
        }
      } catch (chatError) {
        console.error(
          `  ❌ [SYNC] Erro ao sincronizar chat ${chat.id}:`,
          chatError
        );
      }
    }

    console.log(`\n✅ [SYNC] ========== SINCRONIZAÇÃO CONCLUÍDA ==========`);
    console.log(`✅ [SYNC] Total sincronizados: ${syncedCount} chats\n`);

    res.json({
      success: true,
      syncedCount,
      message: `${syncedCount} chats sincronizados com sucesso`
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar chats:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao sincronizar chats',
      message: error.message
    });
  }
};
