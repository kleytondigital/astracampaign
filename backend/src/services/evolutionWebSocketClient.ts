import { io, Socket } from 'socket.io-client';
import { PrismaClient } from '@prisma/client';
import { websocketService } from './websocketService';
import { mediaProcessingService } from './mediaProcessingService';

const prisma = new PrismaClient();

/**
 * Serviço para conectar ao WebSocket da Evolution API e receber eventos em tempo real
 */
class EvolutionWebSocketClient {
  private connections: Map<string, Socket> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  /**
   * Conecta a uma instância Evolution via WebSocket
   * @param instanceName Nome da instância
   * @param tenantId ID do tenant
   * @param evolutionHost URL base da Evolution API (ex: https://evo.usezap.com.br)
   * @param apiKey API Key da Evolution
   */
  async connectInstance(
    instanceName: string,
    tenantId: string,
    evolutionHost: string,
    apiKey: string
  ): Promise<void> {
    // Evitar conexões duplicadas
    if (this.connections.has(instanceName)) {
      console.log(`⚠️ [WebSocket] Instância ${instanceName} já conectada`);
      return;
    }

    try {
      console.log(`🔌 [WebSocket] Conectando à instância: ${instanceName}`);
      console.log(`📡 [WebSocket] Host: ${evolutionHost}`);

      // Conectar ao WebSocket da Evolution
      const socket = io(`${evolutionHost}/${instanceName}`, {
        transports: ['websocket'],
        auth: {
          apikey: apiKey
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      // =================================================================
      // EVENTOS DE CONEXÃO
      // =================================================================

      socket.on('connect', () => {
        console.log(`✅ [WebSocket] Conectado: ${instanceName}`);
        console.log(`🆔 [WebSocket] Socket ID: ${socket.id}`);
        this.reconnectAttempts.set(instanceName, 0);
      });

      socket.on('connect_error', (error) => {
        console.error(
          `❌ [WebSocket] Erro de conexão: ${instanceName}`,
          error.message
        );
        const attempts = this.reconnectAttempts.get(instanceName) || 0;
        this.reconnectAttempts.set(instanceName, attempts + 1);

        if (attempts >= this.maxReconnectAttempts) {
          console.error(
            `🚫 [WebSocket] Máximo de tentativas atingido: ${instanceName}`
          );
          this.disconnectInstance(instanceName);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log(
          `⚠️ [WebSocket] Desconectado: ${instanceName}, Motivo: ${reason}`
        );
        this.connections.delete(instanceName);
      });

      socket.on('error', (error) => {
        console.error(`❌ [WebSocket] Erro: ${instanceName}`, error);
      });

      // =================================================================
      // EVENTOS EVOLUTION API
      // =================================================================

      // Evento de inicialização da aplicação
      socket.on('application.startup', (data) => {
        console.log(
          `🚀 [WebSocket] APPLICATION_STARTUP:`,
          JSON.stringify(data, null, 2)
        );
      });

      // QR Code atualizado
      socket.on('qrcode.updated', async (data) => {
        console.log(
          `📱 [WebSocket] QRCODE_UPDATED:`,
          JSON.stringify(data, null, 2)
        );
        await this.handleQRCodeUpdate(data, instanceName, tenantId);
      });

      // Status de conexão atualizado
      socket.on('connection.update', async (data) => {
        console.log(
          `🔄 [WebSocket] CONNECTION_UPDATE:`,
          JSON.stringify(data, null, 2)
        );
        await this.handleConnectionUpdate(data, instanceName, tenantId);
      });

      // Mensagens recebidas/enviadas (UPSERT)
      socket.on('messages.upsert', async (data) => {
        console.log(
          `📨 [WebSocket] MESSAGES_UPSERT:`,
          JSON.stringify(data, null, 2)
        );
        await this.handleMessageUpsert(data, instanceName, tenantId);
      });

      // Mensagens atualizadas (status, edição, etc)
      socket.on('messages.update', async (data) => {
        console.log(
          `✏️ [WebSocket] MESSAGES_UPDATE:`,
          JSON.stringify(data, null, 2)
        );
        await this.handleMessageUpdate(data, instanceName, tenantId);
      });

      // Mensagens deletadas
      socket.on('messages.delete', async (data) => {
        console.log(
          `🗑️ [WebSocket] MESSAGES_DELETE:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Mensagem enviada (confirmação)
      socket.on('send.message', async (data) => {
        console.log(
          `📤 [WebSocket] SEND_MESSAGE:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Chats recebidos (SET - sincronização inicial)
      socket.on('chats.set', async (data) => {
        console.log(`💬 [WebSocket] CHATS_SET:`, JSON.stringify(data, null, 2));
      });

      // Novos chats (UPSERT)
      socket.on('chats.upsert', async (data) => {
        console.log(
          `➕ [WebSocket] CHATS_UPSERT:`,
          JSON.stringify(data, null, 2)
        );
        await this.handleChatUpsert(data, instanceName, tenantId);
      });

      // Chats atualizados
      socket.on('chats.update', async (data) => {
        console.log(
          `🔄 [WebSocket] CHATS_UPDATE:`,
          JSON.stringify(data, null, 2)
        );
        await this.handleChatUpdate(data, instanceName, tenantId);
      });

      // Chats deletados
      socket.on('chats.delete', async (data) => {
        console.log(
          `🗑️ [WebSocket] CHATS_DELETE:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Contatos recebidos (SET)
      socket.on('contacts.set', async (data) => {
        console.log(
          `👥 [WebSocket] CONTACTS_SET:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Novos contatos (UPSERT)
      socket.on('contacts.upsert', async (data) => {
        console.log(
          `👤 [WebSocket] CONTACTS_UPSERT:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Contatos atualizados
      socket.on('contacts.update', async (data) => {
        console.log(
          `✏️ [WebSocket] CONTACTS_UPDATE:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Presença (online/offline/typing)
      socket.on('presence.update', async (data) => {
        console.log(
          `👁️ [WebSocket] PRESENCE_UPDATE:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Grupos criados/atualizados
      socket.on('groups.upsert', async (data) => {
        console.log(
          `👥 [WebSocket] GROUPS_UPSERT:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Grupo atualizado
      socket.on('group.update', async (data) => {
        console.log(
          `🔄 [WebSocket] GROUP_UPDATE:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Participantes do grupo atualizados
      socket.on('group.participants.update', async (data) => {
        console.log(
          `👥 [WebSocket] GROUP_PARTICIPANTS_UPDATE:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Chamadas
      socket.on('call', async (data) => {
        console.log(`📞 [WebSocket] CALL:`, JSON.stringify(data, null, 2));
      });

      // Labels (etiquetas)
      socket.on('labels.edit', async (data) => {
        console.log(
          `🏷️ [WebSocket] LABELS_EDIT:`,
          JSON.stringify(data, null, 2)
        );
      });

      socket.on('labels.association', async (data) => {
        console.log(
          `🏷️ [WebSocket] LABELS_ASSOCIATION:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Typebot eventos
      socket.on('typebot.start', async (data) => {
        console.log(
          `🤖 [WebSocket] TYPEBOT_START:`,
          JSON.stringify(data, null, 2)
        );
      });

      socket.on('typebot.change.status', async (data) => {
        console.log(
          `🤖 [WebSocket] TYPEBOT_CHANGE_STATUS:`,
          JSON.stringify(data, null, 2)
        );
      });

      // Evento genérico (captura qualquer evento não mapeado)
      socket.onAny((eventName, ...args) => {
        if (
          !eventName.startsWith('connect') &&
          !eventName.startsWith('disconnect') &&
          !eventName.startsWith('error')
        ) {
          console.log(
            `❓ [WebSocket] EVENTO NÃO MAPEADO: ${eventName}`,
            JSON.stringify(args, null, 2)
          );
        }
      });

      // Salvar conexão
      this.connections.set(instanceName, socket);
      console.log(`✅ [WebSocket] Instância registrada: ${instanceName}`);
    } catch (error: any) {
      console.error(`❌ [WebSocket] Erro ao conectar ${instanceName}:`, error);
      throw error;
    }
  }

  // =================================================================
  // HANDLERS DE EVENTOS
  // =================================================================

  /**
   * Processa atualização de QR Code
   */
  private async handleQRCodeUpdate(
    data: any,
    instanceName: string,
    tenantId: string
  ): Promise<void> {
    try {
      const qrCode = data.qrcode || data.qr || data.base64;

      if (!qrCode) {
        console.warn(`⚠️ [WebSocket] QR Code vazio para ${instanceName}`);
        return;
      }

      // Atualizar sessão no banco
      await prisma.whatsAppSession.updateMany({
        where: {
          name: instanceName,
          tenantId
        },
        data: {
          qr: qrCode,
          status: 'SCAN_QR_CODE',
          qrExpiresAt: new Date(Date.now() + 60000) // 1 minuto
        }
      });

      // Emitir para frontend via Socket.IO
      websocketService.emitToTenant(tenantId, 'whatsapp:qrcode', {
        instanceName,
        qrCode
      });

      console.log(`✅ [WebSocket] QR Code atualizado: ${instanceName}`);
    } catch (error) {
      console.error(`❌ [WebSocket] Erro ao processar QR Code:`, error);
    }
  }

  /**
   * Processa atualização de status de conexão
   */
  private async handleConnectionUpdate(
    data: any,
    instanceName: string,
    tenantId: string
  ): Promise<void> {
    try {
      const state = data.state || data.connection || data.status;

      console.log(`🔄 [WebSocket] Status de conexão ${instanceName}: ${state}`);

      let newStatus = 'STOPPED';

      if (state === 'open' || state === 'connected') {
        newStatus = 'WORKING';
      } else if (state === 'connecting') {
        newStatus = 'INITIALIZING';
      } else if (state === 'close' || state === 'closed') {
        newStatus = 'STOPPED';
      }

      // Atualizar sessão no banco
      await prisma.whatsAppSession.updateMany({
        where: {
          name: instanceName,
          tenantId
        },
        data: {
          status: newStatus as any,
          ...(newStatus === 'WORKING' && { qr: null, qrExpiresAt: null })
        }
      });

      // Emitir para frontend
      websocketService.emitToTenant(tenantId, 'whatsapp:connection', {
        instanceName,
        status: newStatus,
        state
      });

      console.log(
        `✅ [WebSocket] Status atualizado: ${instanceName} -> ${newStatus}`
      );
    } catch (error) {
      console.error(`❌ [WebSocket] Erro ao processar conexão:`, error);
    }
  }

  /**
   * Processa nova mensagem ou mensagem atualizada
   */
  private async handleMessageUpsert(
    data: any,
    instanceName: string,
    tenantId: string
  ): Promise<void> {
    try {
      // ✅ VERIFICAR SE WEBSOCKET ESTÁ ATIVO ANTES DE PROCESSAR
      const session = await prisma.whatsAppSession.findFirst({
        where: {
          name: instanceName,
          tenantId
        }
      });

      if (!session) {
        console.log(`❌ [WebSocket] Sessão ${instanceName} não encontrada`);
        return;
      }

      if (!session.websocketEnabled) {
        console.log(
          `⚠️ [WebSocket] Sessão ${instanceName} com websocket DESATIVADO - ignorando mensagem`
        );
        console.log(`   → webhookEnabled: ${session.webhookEnabled}`);
        console.log(
          `   → Para processar via websocket, ative em "Modo de Conexão"`
        );
        return;
      }

      console.log(
        `✅ [WebSocket] Sessão ${instanceName} com websocket ATIVO - processando mensagem`
      );

      console.log(
        `📨 [WebSocket] handleMessageUpsert recebido:`,
        JSON.stringify(data, null, 2).substring(0, 500)
      );

      // ✅ Evolution envia evento com estrutura: { event, instance, data: {...} }
      // Extrair os dados corretos
      const messageData = data.data || data;
      const messages =
        messageData.messages ||
        (Array.isArray(messageData) ? messageData : [messageData]);

      for (const message of messages) {
        const remoteJid = message.key?.remoteJid;
        const fromMe = message.key?.fromMe || false;
        const messageId = message.key?.id;

        console.log(
          `📝 [WebSocket] Processando mensagem: ${messageId} de ${remoteJid}`
        );

        if (!remoteJid) {
          console.warn(`⚠️ [WebSocket] Mensagem sem remoteJid`);
          continue;
        }

        // Extrair phone correto (remetente/destinatário)
        const isGroup = remoteJid.includes('@g.us');
        const phone = isGroup
          ? remoteJid
          : remoteJid.replace('@s.whatsapp.net', '');

        console.log(
          `📱 [WebSocket] Phone extraído: ${phone} (isGroup: ${isGroup})`
        );

        // Buscar ou criar chat
        let chat = await prisma.chat.findFirst({
          where: {
            phone: phone,
            tenantId
          }
        });

        if (!chat) {
          // Criar chat automaticamente
          const contactName = message.pushName || phone || 'Desconhecido';

          console.log(
            `➕ [WebSocket] Criando novo chat para ${phone} (${contactName})`
          );

          // Buscar sessão da instância para associar ao chat
          const session = await prisma.whatsAppSession.findFirst({
            where: {
              name: instanceName,
              tenantId
            }
          });

          chat = await prisma.chat.create({
            data: {
              phone: phone,
              contactName: contactName,
              tenantId,
              status: 'OPEN',
              sessionId: session?.id, // ✅ Associar sessão ao chat
              lastMessageAt: new Date()
            }
          });

          console.log(`✅ [WebSocket] Chat criado automaticamente: ${chat.id}`);
        }

        // Extrair conteúdo da mensagem
        let messageContent =
          message.message?.conversation ||
          message.message?.extendedTextMessage?.text ||
          message.message?.imageMessage?.caption ||
          message.message?.videoMessage?.caption ||
          '[Mídia]';

        console.log(`💬 [WebSocket] Conteúdo da mensagem: ${messageContent}`);

        // Determinar tipo da mensagem
        let messageType: any = 'TEXT';
        if (message.message?.imageMessage) messageType = 'IMAGE';
        else if (message.message?.videoMessage) messageType = 'VIDEO';
        else if (message.message?.audioMessage) messageType = 'AUDIO';
        else if (message.message?.documentMessage) messageType = 'DOCUMENT';

        // Extrair URL de mídia se houver
        let mediaUrl: string | null = null;
        let mediaFileName: string | null = null;

        // Processar mídia (URL ou Base64)
        if (message.message?.imageMessage) {
          const imageMsg = message.message.imageMessage;
          mediaFileName = imageMsg.fileName || 'imagem.jpg';

          // Se tiver Base64, converter e salvar
          if (imageMsg.base64) {
            console.log(
              `🖼️ [WebSocket] Imagem em Base64 recebida, convertendo...`
            );
            try {
              const savedFile = await mediaProcessingService.saveBase64AsFile(
                imageMsg.base64,
                imageMsg.mimetype || 'image/jpeg',
                mediaFileName || undefined
              );
              mediaUrl = savedFile.url;
              console.log(
                `✅ [WebSocket] Imagem salva localmente: ${mediaUrl}`
              );
            } catch (error) {
              console.error(
                '❌ [WebSocket] Erro ao salvar imagem Base64:',
                error
              );
            }
          }
          // Se não tiver Base64, a URL encriptada do WhatsApp é inútil
          else {
            console.warn(
              `⚠️ [WebSocket] Imagem sem Base64 - Configure webhook_base64: true na Evolution API`
            );
            console.warn(
              `⚠️ [WebSocket] URL encriptada do WhatsApp não pode ser usada: ${imageMsg.url || imageMsg.directPath}`
            );
          }
        } else if (message.message?.videoMessage) {
          const videoMsg = message.message.videoMessage;
          mediaFileName = videoMsg.fileName || 'video.mp4';

          if (videoMsg.base64) {
            console.log(
              `🎥 [WebSocket] Vídeo em Base64 recebido, convertendo...`
            );
            try {
              const savedFile = await mediaProcessingService.saveBase64AsFile(
                videoMsg.base64,
                videoMsg.mimetype || 'video/mp4',
                mediaFileName || undefined
              );
              mediaUrl = savedFile.url;
              console.log(`✅ [WebSocket] Vídeo salvo localmente: ${mediaUrl}`);
            } catch (error) {
              console.error(
                '❌ [WebSocket] Erro ao salvar vídeo Base64:',
                error
              );
            }
          } else {
            console.warn(
              `⚠️ [WebSocket] Vídeo sem Base64 - Configure webhook_base64: true na Evolution API`
            );
            console.warn(
              `⚠️ [WebSocket] URL encriptada do WhatsApp não pode ser usada: ${videoMsg.url || videoMsg.directPath}`
            );
          }
        } else if (message.message?.audioMessage) {
          const audioMsg = message.message.audioMessage;
          mediaFileName = audioMsg.fileName || 'audio.ogg';

          if (audioMsg.base64) {
            console.log(
              `🎵 [WebSocket] Áudio em Base64 recebido, convertendo...`
            );
            try {
              const savedFile = await mediaProcessingService.saveBase64AsFile(
                audioMsg.base64,
                audioMsg.mimetype || 'audio/ogg',
                mediaFileName || undefined
              );
              mediaUrl = savedFile.url;
              console.log(`✅ [WebSocket] Áudio salvo localmente: ${mediaUrl}`);
            } catch (error) {
              console.error(
                '❌ [WebSocket] Erro ao salvar áudio Base64:',
                error
              );
            }
          } else {
            console.warn(
              `⚠️ [WebSocket] Áudio sem Base64 - Configure webhook_base64: true na Evolution API`
            );
            console.warn(
              `⚠️ [WebSocket] URL encriptada do WhatsApp não pode ser usada: ${audioMsg.url || audioMsg.directPath}`
            );
          }
        } else if (message.message?.documentMessage) {
          const docMsg = message.message.documentMessage;
          mediaFileName = docMsg.fileName || docMsg.title || 'documento.pdf';

          if (docMsg.base64) {
            console.log(
              `📄 [WebSocket] Documento em Base64 recebido, convertendo...`
            );
            try {
              const savedFile = await mediaProcessingService.saveBase64AsFile(
                docMsg.base64,
                docMsg.mimetype || 'application/pdf',
                mediaFileName || undefined
              );
              mediaUrl = savedFile.url;
              console.log(`✅ [WebSocket] Documento salvo: ${mediaUrl}`);
            } catch (error) {
              console.error(
                '❌ [WebSocket] Erro ao salvar documento Base64:',
                error
              );
            }
          } else {
            console.warn(
              `⚠️ [WebSocket] Documento sem Base64 - Configure webhook_base64: true na Evolution API`
            );
            console.warn(
              `⚠️ [WebSocket] URL encriptada do WhatsApp não pode ser usada: ${docMsg.url || docMsg.directPath}`
            );
          }
        }

        // Se for mídia, ajustar conteúdo da mensagem
        if (mediaUrl && messageType !== 'TEXT') {
          messageContent = `[${messageType}] ${mediaFileName || 'Arquivo'}`;
        }

        // Timestamp da mensagem
        const timestamp = message.messageTimestamp
          ? new Date(message.messageTimestamp * 1000)
          : new Date();

        // ACK (status de entrega)
        let ack = 1; // Default: sent
        if (message.status === 'DELIVERY_ACK') ack = 2;
        if (message.status === 'READ') ack = 3;

        console.log(
          `📤 [WebSocket] Criando mensagem no banco: chatId=${chat.id}, fromMe=${fromMe}, type=${messageType}`
        );

        // Criar mensagem no banco
        const newMessage = await prisma.message.create({
          data: {
            chatId: chat.id,
            phone: phone,
            fromMe: fromMe,
            body: messageContent,
            mediaUrl: mediaUrl,
            type: messageType,
            timestamp: timestamp,
            ack: ack,
            messageId: messageId
          }
        });

        console.log(
          `✅ [WebSocket] Mensagem criada no banco: ${newMessage.id}`
        );

        // Atualizar última mensagem do chat e contador de não lidas
        const updatedChat = await prisma.chat.update({
          where: { id: chat.id },
          data: {
            lastMessage: messageContent,
            lastMessageAt: timestamp,
            unreadCount: fromMe ? chat.unreadCount : chat.unreadCount + 1
          }
        });

        console.log(
          `📊 [WebSocket] Chat atualizado: lastMessage="${messageContent}", unreadCount=${updatedChat.unreadCount}`
        );

        // Emitir para frontend
        websocketService.emitToTenant(tenantId, 'chat:message', {
          chatId: chat.id,
          message: newMessage,
          chat: updatedChat
        });

        console.log(
          `🚀 [WebSocket] Evento chat:message emitido para tenant ${tenantId}`
        );
      }
    } catch (error) {
      console.error(`❌ [WebSocket] Erro ao processar mensagem:`, error);
    }
  }

  /**
   * Processa atualização de mensagem (status, edição, etc)
   */
  private async handleMessageUpdate(
    data: any,
    instanceName: string,
    tenantId: string
  ): Promise<void> {
    try {
      const updates =
        data.updates || data.update || (Array.isArray(data) ? data : [data]);

      for (const update of Array.isArray(updates) ? updates : [updates]) {
        const messageId = update.key?.id;
        const status = update.update?.status;

        if (!messageId) continue;

        // Atualizar status da mensagem
        await prisma.message.updateMany({
          where: {
            whatsappMessageId: messageId,
            tenantId
          },
          data: {
            ...(status && { status: status.toUpperCase() })
          }
        });

        console.log(`✅ [WebSocket] Mensagem atualizada: ${messageId}`);
      }
    } catch (error) {
      console.error(`❌ [WebSocket] Erro ao atualizar mensagem:`, error);
    }
  }

  /**
   * Processa novo chat
   */
  private async handleChatUpsert(
    data: any,
    instanceName: string,
    tenantId: string
  ): Promise<void> {
    try {
      // ✅ Extrair dados corretos (Evolution envia { event, instance, data: {...} })
      const chatData = data.data || data;
      const chats =
        chatData.chats || (Array.isArray(chatData) ? chatData : [chatData]);

      for (const chat of chats) {
        const remoteJid = chat.id || chat.remoteJid;

        if (!remoteJid) continue;

        // Extrair phone correto
        const isGroup = remoteJid.includes('@g.us');
        const phone = isGroup
          ? remoteJid
          : remoteJid.replace('@s.whatsapp.net', '');

        // Verificar se chat já existe
        const existingChat = await prisma.chat.findFirst({
          where: {
            phone: phone,
            tenantId
          }
        });

        if (!existingChat) {
          // Buscar sessão da instância para associar ao chat
          const session = await prisma.whatsAppSession.findFirst({
            where: {
              name: instanceName,
              tenantId
            }
          });

          const newChat = await prisma.chat.create({
            data: {
              phone: phone,
              tenantId,
              status: 'OPEN',
              sessionId: session?.id, // ✅ Associar sessão ao chat
              lastMessageAt: new Date()
            }
          });

          // Emitir para frontend
          websocketService.emitToTenant(tenantId, 'chat:new', newChat);

          console.log(`✅ [WebSocket] Novo chat criado: ${phone}`);
        }
      }
    } catch (error) {
      console.error(`❌ [WebSocket] Erro ao processar novo chat:`, error);
    }
  }

  /**
   * Processa atualização de chat
   */
  private async handleChatUpdate(
    data: any,
    instanceName: string,
    tenantId: string
  ): Promise<void> {
    try {
      // ✅ Extrair dados corretos (Evolution envia { event, instance, data: {...} })
      const chatData = data.data || data;
      const chats =
        chatData.chats || (Array.isArray(chatData) ? chatData : [chatData]);

      for (const chat of chats) {
        const remoteJid = chat.id || chat.remoteJid;

        if (!remoteJid) continue;

        // Extrair phone correto
        const isGroup = remoteJid.includes('@g.us');
        const phone = isGroup
          ? remoteJid
          : remoteJid.replace('@s.whatsapp.net', '');

        // Atualizar chat
        await prisma.chat.updateMany({
          where: {
            phone: phone,
            tenantId
          },
          data: {
            ...(chat.unreadMessages !== undefined && {
              unreadCount: chat.unreadMessages
            })
          }
        });

        // Emitir para frontend
        websocketService.emitToTenant(tenantId, 'chat:update', {
          phone,
          updates: chat
        });

        console.log(`✅ [WebSocket] Chat atualizado: ${phone}`);
      }
    } catch (error) {
      console.error(`❌ [WebSocket] Erro ao atualizar chat:`, error);
    }
  }

  // =================================================================
  // GERENCIAMENTO DE CONEXÕES
  // =================================================================

  /**
   * Desconecta uma instância
   */
  disconnectInstance(instanceName: string): void {
    const socket = this.connections.get(instanceName);
    if (socket) {
      socket.disconnect();
      this.connections.delete(instanceName);
      this.reconnectAttempts.delete(instanceName);
      console.log(`✅ [WebSocket] Instância desconectada: ${instanceName}`);
    }
  }

  /**
   * Desconecta todas as instâncias
   */
  disconnectAll(): void {
    console.log(`🔌 [WebSocket] Desconectando todas as instâncias...`);
    this.connections.forEach((socket, instanceName) => {
      socket.disconnect();
      console.log(`✅ [WebSocket] Instância desconectada: ${instanceName}`);
    });
    this.connections.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Verifica se uma instância está conectada
   */
  isConnected(instanceName: string): boolean {
    const socket = this.connections.get(instanceName);
    return socket?.connected || false;
  }

  /**
   * Retorna lista de instâncias conectadas
   */
  getConnectedInstances(): string[] {
    return Array.from(this.connections.keys());
  }
}

export const evolutionWebSocketClient = new EvolutionWebSocketClient();
