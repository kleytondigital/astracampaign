import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { websocketService } from '../services/websocketService';

const prisma = new PrismaClient();

// ============================================================================
// WEBHOOK WHATSAPP - Receber mensagens de WAHA e Evolution
// ============================================================================

export const handleWhatsAppWebhook = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log(
      '📨 Webhook WhatsApp recebido:',
      JSON.stringify(payload, null, 2)
    );

    // Identificar provider (WAHA ou Evolution)
    const isEvolution = payload.event === 'messages.upsert' || payload.instance;
    const isWAHA = payload.event === 'message' || payload.session;

    if (isEvolution) {
      await handleEvolutionMessage(payload);
    } else if (isWAHA) {
      await handleWAHAMessage(payload);
    } else {
      console.log('⚠️ Webhook não reconhecido:', payload);
      return res
        .status(400)
        .json({ error: 'Formato de webhook não reconhecido' });
    }

    res.json({ success: true, message: 'Webhook processado' });
  } catch (error) {
    console.error('❌ Erro ao processar webhook WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
};

// ============================================================================
// PROCESSAR MENSAGEM DA WAHA
// ============================================================================

async function handleWAHAMessage(payload: any) {
  try {
    const sessionName = payload.session;
    const messageData = payload.payload;

    // Ignorar mensagens enviadas por nós
    if (messageData.fromMe) {
      console.log('📤 Mensagem enviada por nós, ignorando...');
      return;
    }

    // Buscar sessão no banco
    const session = await prisma.whatsAppSession.findUnique({
      where: { name: sessionName }
    });

    if (!session) {
      console.log(`❌ Sessão ${sessionName} não encontrada no banco`);
      return;
    }

    const tenantId = session.tenantId;

    // ChatId original do WhatsApp (ex: 556295473360@c.us)
    const whatsappChatId = messageData.from;

    // Extrair telefone SEM NORMALIZAR (ex: 556295473360)
    const phone = messageData.from.replace(/@c\.us|@s\.whatsapp\.net/g, '');

    console.log(`📱 WhatsApp ChatId: ${whatsappChatId}`);
    console.log(`📞 Telefone (sem normalização): ${phone}`);

    // Buscar ou criar chat
    let chat = await findOrCreateChat(tenantId, phone, sessionName, whatsappChatId);

    // Salvar mensagem
    const message = await prisma.message.create({
      data: {
        chatId: chat.id,
        phone: phone,
        fromMe: false,
        body: messageData.body || messageData.caption || '[Mídia]',
        type: mapWAHAMessageType(messageData.type || messageData._data?.type),
        timestamp: new Date(messageData.timestamp * 1000),
        ack: messageData.ack || 0,
        messageId: messageData.id,
        quotedMsgId: messageData.quotedMsg?.id,
        metadata: messageData._data || {}
      }
    });

    // Atualizar chat
    chat = await prisma.chat.update({
      where: { id: chat.id },
      data: {
        lastMessage: message.body,
        lastMessageAt: message.timestamp,
        unreadCount: { increment: 1 },
        status: 'OPEN'
      },
      include: {
        contact: true,
        lead: true,
        assignedUser: true
      }
    });

    console.log(`✅ Mensagem salva no chat ${chat.id}`);

    // Notificar via WebSocket
    notifyNewMessage(chat, message);

    // Criar notificação para o usuário atribuído
    if (chat.assignedTo) {
      await prisma.cRMNotification.create({
        data: {
          tenantId: chat.tenantId,
          userId: chat.assignedTo,
          type: 'NEW_MESSAGE',
          title: `Nova mensagem de ${chat.contact?.nome || chat.lead?.firstName || normalizedPhone}`,
          message: message.body || '[Mídia]',
          link: `/atendimento?chat=${chat.id}`
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem WAHA:', error);
    throw error;
  }
}

// ============================================================================
// PROCESSAR MENSAGEM DA EVOLUTION
// ============================================================================

async function handleEvolutionMessage(payload: any) {
  try {
    const instanceName = payload.instance;
    const messageData = payload.data;

    // Ignorar mensagens enviadas por nós
    if (messageData.key?.fromMe) {
      console.log('📤 Mensagem enviada por nós, ignorando...');
      return;
    }

    // Buscar sessão no banco
    const session = await prisma.whatsAppSession.findUnique({
      where: { name: instanceName }
    });

    if (!session) {
      console.log(`❌ Sessão ${instanceName} não encontrada no banco`);
      return;
    }

    // ✅ VERIFICAR SE WEBHOOK ESTÁ ATIVO
    if (!session.webhookEnabled) {
      console.log(
        `⚠️ [Webhook] Sessão ${instanceName} com webhook DESATIVADO - ignorando mensagem`
      );
      console.log(`   → websocketEnabled: ${session.websocketEnabled}`);
      console.log(
        `   → Para processar via webhook, ative em "Modo de Conexão"`
      );
      return;
    }

    console.log(
      `✅ [Webhook] Sessão ${instanceName} com webhook ATIVO - processando mensagem`
    );

    const tenantId = session.tenantId;

    // Extrair telefone
    const phone = messageData.key?.remoteJid?.replace(/@s\.whatsapp\.net/g, '');

    // Normalizar para formato brasileiro
    const normalizedPhone = normalizePhone(phone);

    console.log(`📞 Telefone normalizado: ${normalizedPhone}`);

    // Buscar ou criar chat
    let chat = await findOrCreateChat(tenantId, normalizedPhone, instanceName);

    // Extrair texto da mensagem e processar mídia
    let bodyText = '';
    let mediaUrl: string | null = null;
    const messageType = mapEvolutionMessageType(messageData.message);

    // Processar diferentes tipos de mensagem
    if (messageData.message?.conversation) {
      bodyText = messageData.message.conversation;
    } else if (messageData.message?.extendedTextMessage?.text) {
      bodyText = messageData.message.extendedTextMessage.text;
    } else if (messageData.message?.imageMessage) {
      const imageMsg = messageData.message.imageMessage;
      bodyText = imageMsg.caption || '[Imagem]';

      // Base64 vem em message.base64, não em imageMessage.base64
      const base64Data = messageData.message.base64 || imageMsg.base64;

      console.log('🖼️ Imagem detectada:', {
        hasBase64: !!base64Data,
        hasBase64InMessage: !!messageData.message.base64,
        hasBase64InImageMsg: !!imageMsg.base64,
        hasUrl: !!imageMsg.url,
        mimetype: imageMsg.mimetype,
        fileName: imageMsg.fileName
      });

      // Processar Base64 se disponível
      if (base64Data) {
        console.log('🖼️ Processando imagem Base64 recebida via webhook');
        const { mediaProcessingService } = await import(
          '../services/mediaProcessingService'
        );
        const savedFile = await mediaProcessingService.saveBase64AsFile(
          base64Data,
          imageMsg.mimetype || 'image/jpeg',
          imageMsg.fileName || undefined
        );
        mediaUrl = savedFile.url;
        console.log(`✅ Imagem salva: ${mediaUrl}`);
      } else {
        console.log(
          '⚠️ Base64 não encontrado na imagem. Verifique se webhook_base64 está ativo.'
        );
      }
    } else if (messageData.message?.videoMessage) {
      const videoMsg = messageData.message.videoMessage;
      bodyText = videoMsg.caption || '[Vídeo]';

      // Base64 vem em message.base64, não em videoMessage.base64
      const base64Data = messageData.message.base64 || videoMsg.base64;

      console.log('🎥 Vídeo detectado:', {
        hasBase64: !!base64Data,
        hasBase64InMessage: !!messageData.message.base64,
        hasUrl: !!videoMsg.url,
        mimetype: videoMsg.mimetype,
        fileName: videoMsg.fileName
      });

      if (base64Data) {
        console.log('🎥 Processando vídeo Base64 recebido via webhook');
        const { mediaProcessingService } = await import(
          '../services/mediaProcessingService'
        );
        const savedFile = await mediaProcessingService.saveBase64AsFile(
          base64Data,
          videoMsg.mimetype || 'video/mp4',
          videoMsg.fileName || undefined
        );
        mediaUrl = savedFile.url;
        console.log(`✅ Vídeo salvo: ${mediaUrl}`);
      } else {
        console.log(
          '⚠️ Base64 não encontrado no vídeo. Verifique se webhook_base64 está ativo.'
        );
      }
    } else if (messageData.message?.audioMessage) {
      const audioMsg = messageData.message.audioMessage;
      bodyText = '[Áudio]';

      // Base64 vem em message.base64, não em audioMessage.base64
      const base64Data = messageData.message.base64 || audioMsg.base64;

      console.log('🎵 Áudio detectado:', {
        hasBase64: !!base64Data,
        hasBase64InMessage: !!messageData.message.base64,
        hasUrl: !!audioMsg.url,
        mimetype: audioMsg.mimetype,
        fileName: audioMsg.fileName
      });

      if (base64Data) {
        console.log('🎵 Processando áudio Base64 recebido via webhook');
        const { mediaProcessingService } = await import(
          '../services/mediaProcessingService'
        );
        const savedFile = await mediaProcessingService.saveBase64AsFile(
          base64Data,
          audioMsg.mimetype || 'audio/ogg',
          audioMsg.fileName || undefined
        );
        mediaUrl = savedFile.url;
        console.log(`✅ Áudio salvo: ${mediaUrl}`);
      } else {
        console.log(
          '⚠️ Base64 não encontrado no áudio. Verifique se webhook_base64 está ativo.'
        );
      }
    } else if (messageData.message?.documentMessage) {
      const docMsg = messageData.message.documentMessage;
      bodyText = `[Documento] ${docMsg.fileName || ''}`;

      // Base64 vem em message.base64, não em documentMessage.base64
      const base64Data = messageData.message.base64 || docMsg.base64;

      console.log('📄 Documento detectado:', {
        hasBase64: !!base64Data,
        hasBase64InMessage: !!messageData.message.base64,
        hasUrl: !!docMsg.url,
        mimetype: docMsg.mimetype,
        fileName: docMsg.fileName
      });

      if (base64Data) {
        console.log('📄 Processando documento Base64 recebido via webhook');
        const { mediaProcessingService } = await import(
          '../services/mediaProcessingService'
        );
        const savedFile = await mediaProcessingService.saveBase64AsFile(
          base64Data,
          docMsg.mimetype || 'application/octet-stream',
          docMsg.fileName || undefined
        );
        mediaUrl = savedFile.url;
        console.log(`✅ Documento salvo: ${mediaUrl}`);
      } else {
        console.log(
          '⚠️ Base64 não encontrado no documento. Verifique se webhook_base64 está ativo.'
        );
      }
    } else {
      bodyText = '[Mídia]';
    }

    // Salvar mensagem
    const message = await prisma.message.create({
      data: {
        chatId: chat.id,
        phone: normalizedPhone,
        fromMe: false,
        body: bodyText,
        mediaUrl,
        type: messageType,
        timestamp: new Date(
          (messageData.messageTimestamp || Date.now() / 1000) * 1000
        ),
        ack: 0,
        messageId: messageData.key?.id,
        metadata: messageData
      }
    });

    // Atualizar chat
    chat = await prisma.chat.update({
      where: { id: chat.id },
      data: {
        lastMessage: message.body,
        lastMessageAt: message.timestamp,
        unreadCount: { increment: 1 },
        status: 'OPEN'
      },
      include: {
        contact: true,
        lead: true,
        assignedUser: true
      }
    });

    console.log(`✅ Mensagem salva no chat ${chat.id}`);

    // Notificar via WebSocket
    notifyNewMessage(chat, message);

    // Criar notificação para o usuário atribuído
    if (chat.assignedTo) {
      await prisma.cRMNotification.create({
        data: {
          tenantId: chat.tenantId,
          userId: chat.assignedTo,
          type: 'NEW_MESSAGE',
          title: `Nova mensagem de ${chat.contact?.nome || chat.lead?.firstName || normalizedPhone}`,
          message: message.body || '[Mídia]',
          link: `/atendimento?chat=${chat.id}`
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao processar mensagem Evolution:', error);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function findOrCreateChat(
  tenantId: string,
  phone: string,
  sessionName: string,
  whatsappChatId?: string
) {
  // Tentar encontrar chat existente
  let chat = await prisma.chat.findUnique({
    where: {
      tenantId_phone: {
        tenantId,
        phone
      }
    },
    include: {
      contact: true,
      lead: true
    }
  });

  if (chat) {
    console.log(`✅ Chat existente encontrado: ${chat.id}`);
    return chat;
  }

  // Chat não existe, verificar se há contato ou lead
  let contactId: string | undefined;
  let leadId: string | undefined;

  // Buscar contato pelo telefone
  const contact = await prisma.contact.findFirst({
    where: {
      tenantId,
      telefone: phone
    }
  });

  if (contact) {
    contactId = contact.id;
    console.log(`✅ Contato encontrado: ${contact.nome}`);
  } else {
    // Se não há contato, criar lead automaticamente
    const lead = await prisma.lead.create({
      data: {
        tenantId,
        firstName: 'Lead WhatsApp',
        lastName: phone.slice(-4), // Últimos 4 dígitos
        email: `${phone}@whatsapp.com`,
        phone,
        source: 'WHATSAPP_CAMPAIGN', // Origem clara (enum correto)
        status: 'CONTACTED', // Já foi contatado (iniciou conversa)
        score: 70, // Score alto pois iniciou contato proativamente
        tags: ['WhatsApp', 'Auto-Criado']
      }
    });

    leadId = lead.id;
    console.log(
      `✅ Lead criado automaticamente: ${lead.firstName} ${lead.lastName} (Score: 70)`
    );

    // Notificar todos os ADMINs e USERs sobre novo lead quente
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        role: {
          in: ['ADMIN', 'USER']
        }
      }
    });

    // Criar notificações para todos
    for (const user of users) {
      await prisma.cRMNotification.create({
        data: {
          tenantId: tenantId,
          userId: user.id,
          type: 'LEAD_HOT',
          title: `🔥 Novo lead quente via WhatsApp!`,
          message: `Lead ${phone} iniciou conversa e foi criado automaticamente. Score inicial: 70/100`,
          link: `/leads/${lead.id}`,
          read: false
        }
      });
    }

    console.log(
      `📢 Notificações criadas para ${users.length} usuário(s) sobre novo lead`
    );
  }

  // Criar chat
  const session = await prisma.whatsAppSession.findUnique({
    where: { name: sessionName }
  });

  chat = await prisma.chat.create({
    data: {
      tenantId,
      phone,
      whatsappChatId: whatsappChatId || null,
      contactId,
      leadId,
      status: 'OPEN',
      sessionId: session?.id,
      assignedTo: contact?.assignedTo
    },
    include: {
      contact: true,
      lead: true
    }
  });

  console.log(`✅ Novo chat criado: ${chat.id}`);

  return chat;
}

function normalizePhone(phone: string): string {
  // Remover tudo que não é número
  let cleaned = phone.replace(/\D/g, '');

  // Se começa com 55 (Brasil), garantir que tem 13 dígitos (55 + 11 + 9 dígitos)
  if (cleaned.startsWith('55')) {
    // Verificar se tem 9 dígitos após DDD
    if (cleaned.length === 12) {
      // Falta o 9, adicionar
      cleaned = cleaned.slice(0, 4) + '9' + cleaned.slice(4);
    }
    return `+${cleaned}`;
  }

  // Se não tem código do país, assumir Brasil
  if (cleaned.length === 11) {
    // Formato: DDD + 9 dígitos
    return `+55${cleaned}`;
  } else if (cleaned.length === 10) {
    // Falta o 9, adicionar
    return `+55${cleaned.slice(0, 2)}9${cleaned.slice(2)}`;
  }

  // Retornar com + se não tiver
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

function mapWAHAMessageType(type: string): any {
  const typeMap: any = {
    chat: 'TEXT',
    image: 'IMAGE',
    video: 'VIDEO',
    audio: 'AUDIO',
    ptt: 'VOICE',
    document: 'DOCUMENT',
    sticker: 'STICKER',
    location: 'LOCATION',
    vcard: 'CONTACT',
    link: 'LINK'
  };

  return typeMap[type] || 'OTHER';
}

function mapEvolutionMessageType(message: any): any {
  if (message?.conversation || message?.extendedTextMessage) return 'TEXT';
  if (message?.imageMessage) return 'IMAGE';
  if (message?.videoMessage) return 'VIDEO';
  if (message?.audioMessage) return 'AUDIO';
  if (message?.documentMessage) return 'DOCUMENT';
  if (message?.stickerMessage) return 'STICKER';
  if (message?.locationMessage) return 'LOCATION';
  if (message?.contactMessage) return 'CONTACT';

  return 'OTHER';
}

function notifyNewMessage(chat: any, message: any) {
  try {
    // Emitir evento WebSocket para o tenant usando websocketService
    websocketService.emitToTenant(chat.tenantId, 'chat:new-message', {
      chatId: chat.id,
      message: {
        id: message.id,
        body: message.body,
        mediaUrl: message.mediaUrl,
        fromMe: message.fromMe,
        timestamp: message.timestamp,
        type: message.type
      },
      chat: {
        id: chat.id,
        phone: chat.phone,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage,
        lastMessageAt: chat.lastMessageAt,
        contact: chat.contact,
        lead: chat.lead
      }
    });

    console.log(
      `📡 WebSocket emitido para tenant ${chat.tenantId}: chat:new-message`
    );
  } catch (error) {
    console.error('❌ Erro ao emitir WebSocket:', error);
  }
}

// ============================================================================
// WEBHOOK ACK (Confirmação de Entrega)
// ============================================================================

export const handleWhatsAppAck = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log('✅ ACK recebido:', JSON.stringify(payload, null, 2));

    // Atualizar status de entrega da mensagem
    const messageId = payload.payload?.id || payload.data?.key?.id;

    if (messageId) {
      await prisma.message.updateMany({
        where: { messageId },
        data: {
          ack: payload.payload?.ack || payload.data?.status || 3
        }
      });

      console.log(`✅ ACK atualizado para mensagem ${messageId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao processar ACK:', error);
    res.status(500).json({ error: 'Erro ao processar ACK' });
  }
};
