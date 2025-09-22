import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { ContactService } from '../services/contactService';
import { CategoryService } from '../services/categoryService';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Validation rules
export const campaignValidation = [
  body('nome').notEmpty().withMessage('Nome da campanha é obrigatório'),
  body('targetTags').isArray().withMessage('Tags dos contatos devem ser um array'),
  body('sessionNames').isArray({ min: 1 }).withMessage('Pelo menos uma sessão WhatsApp deve ser selecionada'),
  body('messageType').isIn(['text', 'image', 'video', 'audio', 'document', 'sequence', 'openai', 'groq']).withMessage('Tipo de mensagem inválido'),
  body('messageContent').notEmpty().withMessage('Conteúdo da mensagem é obrigatório'),
  body('randomDelay').isInt({ min: 0 }).withMessage('Delay deve ser um número positivo'),
  body('startImmediately').isBoolean().withMessage('StartImmediately deve ser boolean'),
  body('scheduledFor').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Data de agendamento deve ser válida')
];

// List all campaigns
export const listCampaigns = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where = search
      ? {
          nome: {
            contains: String(search)
          }
        }
      : {};

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: {
          session: {
            select: {
              name: true,
              status: true,
              mePushName: true
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          criadoEm: 'desc'
        },
        skip,
        take: Number(limit)
      }),
      prisma.campaign.count({ where })
    ]);

    // Parse JSON fields
    const campaignsWithParsedData = campaigns.map(campaign => ({
      ...campaign,
      targetTags: JSON.parse(campaign.targetTags),
      sessionNames: campaign.sessionNames ? JSON.parse(campaign.sessionNames) : [],
      messageContent: JSON.parse(campaign.messageContent)
    }));

    res.json({
      campaigns: campaignsWithParsedData,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    console.error('Erro ao listar campanhas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get campaign by ID
export const getCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        session: {
          select: {
            name: true,
            status: true,
            mePushName: true
          }
        },
        messages: {
          orderBy: {
            criadoEm: 'desc'
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // Parse JSON fields
    const campaignWithParsedData = {
      ...campaign,
      targetTags: JSON.parse(campaign.targetTags),
      sessionNames: campaign.sessionNames ? JSON.parse(campaign.sessionNames) : [],
      messageContent: JSON.parse(campaign.messageContent)
    };

    res.json(campaignWithParsedData);
  } catch (error) {
    console.error('Erro ao buscar campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Create new campaign
export const createCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      nome,
      targetTags,
      sessionNames,
      messageType,
      messageContent,
      randomDelay,
      startImmediately,
      scheduledFor
    } = req.body;

    // Verificar se todas as sessões existem e estão ativas
    const sessions = await prisma.whatsAppSession.findMany({
      where: {
        name: { in: sessionNames },
        status: 'WORKING'
      }
    });

    if (sessions.length === 0) {
      return res.status(400).json({ error: 'Nenhuma sessão WhatsApp ativa encontrada nas selecionadas' });
    }

    if (sessions.length < sessionNames.length) {
      const activeSessions = sessions.map(s => s.name);
      const inactiveSessions = sessionNames.filter((name: string) => !activeSessions.includes(name));
      return res.status(400).json({
        error: `As seguintes sessões não estão ativas: ${inactiveSessions.join(', ')}`
      });
    }

    // Buscar contatos usando ContactService
    const contactsResponse = await ContactService.getContacts();
    const allContacts = contactsResponse.contacts;

    // Filtrar contatos que têm pelo menos uma tag que corresponde às tags solicitadas
    const filteredContacts = allContacts.filter((contact: any) => {
      // Verificar se a categoriaId está nas tags solicitadas
      if (!contact.categoriaId) {
        return false;
      }
      return targetTags.includes(contact.categoriaId);
    });

    if (filteredContacts.length === 0) {
      return res.status(400).json({ error: 'Nenhum contato encontrado com as tags selecionadas' });
    }

    // Criar campanha
    const campaign = await prisma.campaign.create({
      data: {
        nome,
        targetTags: JSON.stringify(targetTags),
        sessionNames: JSON.stringify(sessionNames),
        sessionName: sessionNames[0], // Para compatibilidade
        messageType,
        messageContent: JSON.stringify(messageContent),
        randomDelay,
        startImmediately,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        totalContacts: filteredContacts.length,
        status: startImmediately ? 'RUNNING' : 'PENDING',
        startedAt: startImmediately ? new Date() : null,
        createdBy: req.user?.id,
        createdByName: req.user?.nome
      }
    });

    // Criar mensagens para cada contato
    const campaignMessages = filteredContacts.map((contact: any) => ({
      campaignId: campaign.id,
      contactId: contact.id,
      contactPhone: contact.telefone,
      contactName: contact.nome
    }));

    await prisma.campaignMessage.createMany({
      data: campaignMessages
    });

    res.status(201).json({
      message: 'Campanha criada com sucesso',
      campaign: {
        ...campaign,
        targetTags: JSON.parse(campaign.targetTags),
        sessionNames: campaign.sessionNames ? JSON.parse(campaign.sessionNames) : [],
        messageContent: JSON.parse(campaign.messageContent)
      }
    });
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Update campaign
export const updateCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Se há targetTags, converter para JSON
    if (updateData.targetTags) {
      updateData.targetTags = JSON.stringify(updateData.targetTags);
    }

    // Se há sessionNames, converter para JSON
    if (updateData.sessionNames) {
      updateData.sessionNames = JSON.stringify(updateData.sessionNames);
    }

    // Se há messageContent, converter para JSON
    if (updateData.messageContent) {
      updateData.messageContent = JSON.stringify(updateData.messageContent);
    }

    // Se há scheduledFor, converter para Date
    if (updateData.scheduledFor) {
      updateData.scheduledFor = new Date(updateData.scheduledFor);
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Campanha atualizada com sucesso',
      campaign: {
        ...campaign,
        targetTags: JSON.parse(campaign.targetTags),
        sessionNames: campaign.sessionNames ? JSON.parse(campaign.sessionNames) : [],
        messageContent: JSON.parse(campaign.messageContent)
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Delete campaign
export const deleteCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.campaign.delete({
      where: { id }
    });

    res.json({ message: 'Campanha removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Pause/Resume campaign
export const toggleCampaign = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'pause' or 'resume'

    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    const newStatus = action === 'pause' ? 'PAUSED' : 'RUNNING';

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        status: newStatus,
        startedAt: action === 'resume' && !campaign.startedAt ? new Date() : campaign.startedAt
      }
    });

    res.json({
      message: `Campanha ${action === 'pause' ? 'pausada' : 'retomada'} com sucesso`,
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('Erro ao alterar status da campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get campaign report
export const getCampaignReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar campanha com todas as mensagens e estatísticas
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { criadoEm: 'asc' },
          select: {
            id: true,
            contactId: true,
            contactPhone: true,
            contactName: true,
            status: true,
            sentAt: true,
            errorMessage: true,
            sessionName: true,
            criadoEm: true
          }
        },
        session: {
          select: {
            name: true,
            mePushName: true,
            status: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campanha não encontrada' });
    }

    // Estatísticas detalhadas
    const stats = {
      total: campaign.messages.length,
      sent: campaign.messages.filter(m => m.status === 'SENT').length,
      failed: campaign.messages.filter(m => m.status === 'FAILED').length,
      pending: campaign.messages.filter(m => m.status === 'PENDING').length
    };

    // Agrupar por status
    const messagesByStatus = {
      sent: campaign.messages.filter(m => m.status === 'SENT'),
      failed: campaign.messages.filter(m => m.status === 'FAILED'),
      pending: campaign.messages.filter(m => m.status === 'PENDING')
    };

    // Agrupar por sessão utilizada
    const messagesBySession = campaign.messages.reduce((acc: any, message) => {
      const session = message.sessionName || 'N/A';
      if (!acc[session]) {
        acc[session] = [];
      }
      acc[session].push(message);
      return acc;
    }, {});

    // Parse JSON fields
    const campaignWithParsedData = {
      ...campaign,
      targetTags: JSON.parse(campaign.targetTags),
      sessionNames: campaign.sessionNames ? JSON.parse(campaign.sessionNames) : [],
      messageContent: JSON.parse(campaign.messageContent)
    };

    const report = {
      campaign: campaignWithParsedData,
      stats,
      messagesByStatus,
      messagesBySession,
      generatedAt: new Date().toISOString()
    };

    res.json(report);
  } catch (error) {
    console.error('Erro ao gerar relatório da campanha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get available contact tags (categories)
export const getContactTags = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Buscar categorias usando CategoryService
    const categoriesResponse = await CategoryService.getCategories();

    // Retornar array com id e nome das categorias
    const tags = categoriesResponse.categories.map((categoria: any) => ({
      id: categoria.id,
      nome: categoria.nome
    }));

    res.json(tags);
  } catch (error) {
    console.error('Erro ao buscar tags:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get active WhatsApp sessions
export const getActiveSessions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const sessions = await prisma.whatsAppSession.findMany({
      where: {
        status: 'WORKING'
      },
      select: {
        name: true,
        mePushName: true,
        meId: true
      }
    });

    res.json(sessions);
  } catch (error) {
    console.error('Erro ao buscar sessões ativas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};