import { PrismaClient } from '@prisma/client';
import { sendMessage, checkContactExists } from './wahaApiService';
import { ContactService } from './contactService';
import { openaiService } from './openaiService';
import { groqService } from './groqService';

const prisma = new PrismaClient();

class CampaignSchedulerService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private campaignSessionIndexes: Map<string, number> = new Map(); // Rastrear índice atual de cada campanha

  start() {
    if (this.isRunning) {
      console.log('Campaign scheduler already running');
      return;
    }

    console.log('Starting campaign scheduler...');
    this.isRunning = true;

    // Verificar campanhas a cada 30 segundos
    this.intervalId = setInterval(async () => {
      await this.processCampaigns();
    }, 30000);

    // Executar imediatamente também
    this.processCampaigns();
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping campaign scheduler...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processCampaigns() {
    try {
      // Buscar campanhas que devem ser iniciadas
      const campaignsToStart = await prisma.campaign.findMany({
        where: {
          status: 'PENDING',
          OR: [
            { startImmediately: true },
            {
              AND: [
                { startImmediately: false },
                { scheduledFor: { lte: new Date() } }
              ]
            }
          ]
        },
        include: {
          session: true
        }
      });

      for (const campaign of campaignsToStart) {
        await this.startCampaign(campaign);
      }

      // Processar campanhas em execução
      const runningCampaigns = await prisma.campaign.findMany({
        where: { status: 'RUNNING' },
        include: {
          session: true,
          messages: {
            where: { status: 'PENDING' },
            orderBy: { criadoEm: 'asc' },
            take: 1 // Processar uma mensagem por vez
          }
        }
      });

      for (const campaign of runningCampaigns) {
        if (campaign.messages.length > 0) {
          await this.processNextMessage(campaign, campaign.messages[0]);
        } else {
          // Verificar se todas as mensagens foram processadas
          const pendingCount = await prisma.campaignMessage.count({
            where: {
              campaignId: campaign.id,
              status: 'PENDING'
            }
          });

          if (pendingCount === 0) {
            await this.completeCampaign(campaign.id);
          }
        }
      }
    } catch (error) {
      console.error('Error processing campaigns:', error);
    }
  }

  // Função para obter próxima sessão de forma sequencial (round-robin)
  private async getNextSequentialSession(campaignId: string, sessionNames: string[]): Promise<string | null> {
    try {
      // Buscar sessões ativas
      const activeSessions = await prisma.whatsAppSession.findMany({
        where: {
          name: { in: sessionNames },
          status: 'WORKING'
        },
        select: {
          name: true,
          status: true
        },
        orderBy: {
          name: 'asc' // Ordenar para manter consistência
        }
      });

      if (activeSessions.length === 0) {
        console.log(`❌ Nenhuma sessão ativa encontrada das selecionadas: ${sessionNames.join(', ')}`);
        return null;
      }

      // Obter índice atual da campanha (ou inicializar em 0)
      const currentIndex = this.campaignSessionIndexes.get(campaignId) || 0;

      // Selecionar sessão baseada no índice atual
      const selectedSession = activeSessions[currentIndex % activeSessions.length];

      // Incrementar índice para próxima mensagem
      this.campaignSessionIndexes.set(campaignId, currentIndex + 1);

      console.log(`🔄 Sessão sequencial: ${selectedSession.name} (índice ${currentIndex + 1}/${activeSessions.length} - sessões ativas: ${activeSessions.map(s => s.name).join(', ')})`);

      return selectedSession.name;
    } catch (error) {
      console.error('Erro ao buscar sessões ativas:', error);
      return null;
    }
  }

  private async startCampaign(campaign: any) {
    try {
      console.log(`Starting campaign: ${campaign.nome}`);

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          status: 'RUNNING',
          startedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`Error starting campaign ${campaign.id}:`, error);
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'FAILED' }
      });
    }
  }

  private async processNextMessage(campaign: any, message: any) {
    let selectedSession: string | null = null;

    try {
      // Obter sessões disponíveis para esta campanha
      const sessionNames = campaign.sessionNames ? JSON.parse(campaign.sessionNames) : [campaign.sessionName];

      // Escolher próxima sessão de forma sequencial (round-robin)
      selectedSession = await this.getNextSequentialSession(campaign.id, sessionNames);

      if (!selectedSession) {
        console.log(`❌ Nenhuma sessão ativa disponível para a campanha ${campaign.id}. Pausando campanha.`);
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'PAUSED' }
        });
        return;
      }

      console.log(`🚀 Distribuição sequencial - Usando sessão: ${selectedSession} para mensagem ${message.id}`);

      // Aplicar delay randomizado
      if (campaign.randomDelay > 0) {
        const randomDelay = Math.floor(Math.random() * campaign.randomDelay * 1000);
        console.log(`Applying random delay of ${randomDelay}ms for message ${message.id}`);
        await new Promise(resolve => setTimeout(resolve, randomDelay));
      }

      console.log(`🔍 DEBUGGING - Message ${message.id} for contact ${message.contactId}`);

      // Buscar dados do contato para variáveis dinâmicas usando ContactService
      const contactsResponse = await ContactService.getContacts();
      const contact = contactsResponse.contacts.find((c: any) => c.id === message.contactId);

      console.log(`🔍 CONTACT FOUND:`, contact);

      // Preparar conteúdo da mensagem
      const messageContent = JSON.parse(campaign.messageContent);

      console.log(`🔍 MESSAGE CONTENT:`, messageContent);

      // Aplicar variáveis dinâmicas se houver contato
      const processedContent = contact ? this.processVariables(messageContent, contact) : messageContent;

      console.log(`🔍 PROCESSED CONTENT:`, processedContent);

      // Verificar se o número existe no WhatsApp antes de enviar usando endpoint correto
      const contactCheck = await checkContactExists(selectedSession, message.contactPhone);

      if (!contactCheck.exists) {
        console.log(`❌ Contact ${message.contactPhone} does not exist on WhatsApp. Skipping message.`);

        // Marcar como falha por número inexistente
        await prisma.campaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Número não existe no WhatsApp'
          }
        });

        // Atualizar contador de falhas
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            failedCount: { increment: 1 }
          }
        });

        return;
      }

      console.log(`✅ Contact ${message.contactPhone} exists. Using chatId: ${contactCheck.chatId}`);

      // Enviar mensagem via WAHA usando chatId validado
      const result = await this.sendMessageViaWaha(
        selectedSession,
        message.contactPhone,
        campaign.messageType,
        processedContent,
        contactCheck.chatId,
        contact // Pass contact data for OpenAI
      );

      if (result.success) {
        // Atualizar status da mensagem
        await prisma.campaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            messageId: result.messageId,
            sessionName: selectedSession // Registrar qual sessão foi usada
          }
        });

        // Atualizar contador da campanha
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            sentCount: { increment: 1 }
          }
        });

        console.log(`Message sent successfully to ${message.contactPhone}`);
      } else {
        // Marcar como falha
        await prisma.campaignMessage.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            errorMessage: result.error,
            sessionName: selectedSession // Registrar qual sessão foi tentada
          }
        });

        // Atualizar contador de falhas
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            failedCount: { increment: 1 }
          }
        });

        console.error(`Failed to send message to ${message.contactPhone}: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);

      await prisma.campaignMessage.update({
        where: { id: message.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          sessionName: selectedSession || 'N/A' // Registrar a sessão se disponível
        }
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          failedCount: { increment: 1 }
        }
      });
    }
  }

  private processVariables(content: any, contact: any): any {
    console.log(`🔧 PROCESSING VARIABLES for contact:`, contact);

    const replaceVariables = (text: string): string => {
      if (typeof text !== 'string') return text;

      console.log(`🔧 Original text:`, text);

      let result = text;
      // Usar replace simples ao invés de regex
      result = result.replace(/\{\{nome\}\}/g, contact.nome || '');
      result = result.replace(/\{\{telefone\}\}/g, contact.telefone || '');
      result = result.replace(/\{\{email\}\}/g, contact.email || '');
      result = result.replace(/\{\{observacoes\}\}/g, contact.observacoes || '');
      result = result.replace(/\{\{categoria\}\}/g, ''); // Por enquanto vazio

      console.log(`🔧 Processed text:`, result);

      return result;
    };

    const processObject = (obj: any): any => {
      if (typeof obj === 'string') {
        return replaceVariables(obj);
      } else if (Array.isArray(obj)) {
        return obj.map(item => processObject(item));
      } else if (obj && typeof obj === 'object') {
        const processed: any = {};
        for (const [key, value] of Object.entries(obj)) {
          processed[key] = processObject(value);
        }
        return processed;
      }
      return obj;
    };

    return processObject(content);
  }

  private async sendMessageViaWaha(sessionName: string, phone: string, messageType: string, content: any, validatedChatId?: string, contactData?: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      let result;

      switch (messageType) {
        case 'text':
          result = await sendMessage(sessionName, phone, { text: content.text }, validatedChatId);
          break;

        case 'image':
          result = await sendMessage(sessionName, phone, {
            image: { url: content.url },
            caption: content.caption || ''
          }, validatedChatId);
          break;

        case 'video':
          result = await sendMessage(sessionName, phone, {
            video: { url: content.url },
            caption: content.caption || ''
          }, validatedChatId);
          break;

        case 'audio':
          result = await sendMessage(sessionName, phone, {
            audio: { url: content.url }
          }, validatedChatId);
          break;

        case 'document':
          result = await sendMessage(sessionName, phone, {
            document: { url: content.url },
            fileName: content.fileName || 'document'
          }, validatedChatId);
          break;

        case 'openai':
          // Gerar mensagem usando OpenAI
          console.log('🤖 Gerando mensagem com OpenAI...', content);

          const openaiResult = await openaiService.generateMessage(content, contactData);

          if (!openaiResult.success) {
            throw new Error(`OpenAI error: ${openaiResult.error}`);
          }

          console.log('✅ Mensagem gerada pela OpenAI:', openaiResult.message);

          // Enviar a mensagem gerada como texto
          result = await sendMessage(sessionName, phone, { text: openaiResult.message }, validatedChatId);
          break;

        case 'groq':
          // Gerar mensagem usando Groq
          console.log('⚡ Gerando mensagem com Groq...', content);

          const groqResult = await groqService.generateMessage(content, contactData);

          if (!groqResult.success) {
            throw new Error(`Groq error: ${groqResult.error}`);
          }

          console.log('✅ Mensagem gerada pela Groq:', groqResult.message);

          // Enviar a mensagem gerada como texto
          result = await sendMessage(sessionName, phone, { text: groqResult.message }, validatedChatId);
          break;

        case 'sequence':
          // Para sequência, enviar todos os itens com delay entre eles
          if (!content.sequence || content.sequence.length === 0) {
            throw new Error('Sequence is empty');
          }

          let lastResult;
          for (let i = 0; i < content.sequence.length; i++) {
            const item = content.sequence[i];
            lastResult = await this.sendMessageViaWaha(sessionName, phone, item.type, item.content, validatedChatId, contactData);

            if (!lastResult.success) {
              throw new Error(`Failed to send sequence item ${i + 1}: ${lastResult.error}`);
            }

            // Adicionar delay de 2-5 segundos entre mensagens da sequência para evitar spam
            if (i < content.sequence.length - 1) {
              const sequenceDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5 segundos
              await new Promise(resolve => setTimeout(resolve, sequenceDelay));
            }
          }
          result = lastResult;
          break;

        default:
          throw new Error(`Unsupported message type: ${messageType}`);
      }

      return {
        success: true,
        messageId: (result as any)?.id || null
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async completeCampaign(campaignId: string) {
    try {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Limpar índice da campanha do cache
      this.campaignSessionIndexes.delete(campaignId);

      console.log(`Campaign ${campaignId} completed`);
    } catch (error) {
      console.error(`Error completing campaign ${campaignId}:`, error);
    }
  }
}

// Criar instância singleton
const campaignScheduler = new CampaignSchedulerService();

// Iniciar automaticamente quando o módulo for carregado
campaignScheduler.start();

export default campaignScheduler;