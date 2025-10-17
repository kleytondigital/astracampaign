import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
// import rateLimit from 'express-rate-limit'; // Temporariamente desabilitado
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { contactRoutes } from './routes/contactRoutes';
import { categoryRoutes } from './routes/categoryRoutes';
import { mockRoutes } from './routes/mockRoutes';
import { csvImportRoutes } from './routes/csvImportRoutes';
import wahaRoutes from './routes/waha';
import campaignRoutes from './routes/campaigns';
import settingsRoutes from './routes/settingsRoutes';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import mediaRoutes from './routes/mediaRoutes';
import mediaUploadRoutes from './routes/media';
import tenantRoutes from './routes/tenants';
import userTenantsRoutes from './routes/userTenants';
import backupRoutes from './routes/backup';
import { systemRoutes } from './routes/system';
import alertsRoutes from './routes/alerts';
import analyticsRoutes from './routes/analytics';
import notificationsRoutes from './routes/notifications';
import messageTemplatesRoutes from './routes/messageTemplates';
import reportsRoutes from './routes/reports';
import automationRoutes from './routes/automation';
import opportunitiesRoutes from './routes/opportunities';
import activitiesRoutes from './routes/activities';
import companiesRoutes from './routes/companies';
import leadsRoutes from './routes/leads';
import chatsRoutes from './routes/chats';
import departmentsRoutes from './routes/departments';
import chatAssignmentsRoutes from './routes/chatAssignments';
import metricsRoutes from './routes/metrics';
import dataSourcesRoutes from './routes/dataSources';
import reportsRoutes from './routes/reports';
import webhooksRoutes from './routes/webhooks';
import webhookManagementRoutes from './routes/webhookManagement';
import instanceManagementRoutes from './routes/instanceManagement';
import preRegisteredMediaRoutes from './routes/preRegisteredMedia';
import metaRoutes from './routes/meta'; // Meta Ads integration
// import integrationsRoutes from './routes/integrations';
// import cacheRoutes from './routes/cache';
import { authMiddleware } from './middleware/auth';
import './services/campaignSchedulerService'; // Inicializar scheduler
import { initializeAlertsMonitoring } from './services/alertsMonitoringService'; // Inicializar monitoramento de alertas
import { initializeBackupService } from './services/backupService'; // Inicializar serviço de backup
import { websocketService } from './services/websocketService'; // Inicializar WebSocket
import { automationService } from './services/automationService'; // Inicializar automação
// import { whatsappWebSocketService } from './services/whatsappWebSocketService'; // WhatsApp WebSocket - Desabilitado (conflito com websocketService)
import { evolutionWebSocketClient } from './services/evolutionWebSocketClient'; // Evolution WebSocket Client

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Configurar para confiar no proxy (nginx/traefik) - apenas no primeiro proxy
app.set('trust proxy', 1);

// Criar diretório para uploads de mídia
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Criar diretório para branding público
const brandingDir = './uploads/branding';
if (!fs.existsSync(brandingDir)) {
  fs.mkdirSync(brandingDir, { recursive: true });
}

// Criar diretório para uploads privados
const privateDir = './uploads/private';
if (!fs.existsSync(privateDir)) {
  fs.mkdirSync(privateDir, { recursive: true });
}

// Criar diretório para uploads temporários
const tempUploadDir = '/tmp/uploads';
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

// CORS configurado de forma segura
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Se ALLOWED_ORIGINS for "*", permitir todas as origens
    if (process.env.ALLOWED_ORIGINS === '*') {
      return callback(null, true);
    }

    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3006',
      'https://localhost:3000'
    ];

    // Permitir requests sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Rate limiting temporariamente desabilitado devido a problemas com trust proxy
/*
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // limite de 1000 requests por IP por janela de tempo
  message: {
    error: 'Muitas requisições deste IP, tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // limite de 10 tentativas de login por IP
  message: {
    error: 'Muitas tentativas de login, tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 20, // limite de 20 requisições IA por minuto
  message: {
    error: 'Muitas requisições para IA, tente novamente em 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
*/

// Temporariamente desabilitado devido a problemas com trust proxy
// app.use(generalLimiter);

// Middleware para todas as rotas exceto upload
app.use((req, res, next) => {
  if (req.path.includes('/media/upload') || 
      req.path.includes('/settings/logo') || 
      req.path.includes('/settings/favicon') || 
      req.path.includes('/settings/icon')) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.includes('/media/upload') || 
      req.path.includes('/settings/logo') || 
      req.path.includes('/settings/favicon') || 
      req.path.includes('/settings/icon')) {
    return next();
  }
  express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
});

// Servir arquivos estáticos de uploads (acesso público aos arquivos)
app.use('/uploads', express.static('uploads'));

// Servir arquivos de branding público (SEM autenticação)
app.use('/branding', express.static('uploads/branding'));

// Rotas públicas (autenticação) - rate limiting temporariamente desabilitado
app.use('/api/auth', authRoutes);

// Rota pública para configurações (favicon e título)
app.use('/api/settings', settingsRoutes);

// Health check público
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Servir uploads estaticamente (público)
app.use('/api/uploads', express.static('uploads'));

// Rotas protegidas (requerem autenticação)
app.use('/api/contatos', authMiddleware, contactRoutes);
app.use('/api/categorias', authMiddleware, categoryRoutes);
app.use('/api/csv', authMiddleware, csvImportRoutes);
app.use('/api/waha', authMiddleware, wahaRoutes);
app.use('/api/campaigns', authMiddleware, campaignRoutes);
app.use('/api/users', authMiddleware, usersRoutes);
app.use('/api/tenants', authMiddleware, tenantRoutes); // SUPERADMIN only
app.use('/api/user-tenants', authMiddleware, userTenantsRoutes);
app.use('/api/backup', authMiddleware, backupRoutes); // Backup management
app.use('/api/system', authMiddleware, systemRoutes); // SUPERADMIN only - System stats and monitoring
app.use('/api/alerts', authMiddleware, alertsRoutes); // Alerts management
app.use('/api/analytics', authMiddleware, analyticsRoutes); // Analytics and reporting per tenant
app.use('/api/notifications', authMiddleware, notificationsRoutes); // User notifications
app.use('/api/templates', authMiddleware, messageTemplatesRoutes); // Message templates system
app.use('/api/reports', authMiddleware, reportsRoutes); // Advanced reporting system
app.use('/api/automation', authMiddleware, automationRoutes); // Automation and workflow system
app.use('/api/opportunities', authMiddleware, opportunitiesRoutes); // CRM Opportunities system
app.use('/api/activities', authMiddleware, activitiesRoutes); // CRM Activities system
app.use('/api/companies', authMiddleware, companiesRoutes); // CRM Companies system
app.use('/api/leads', authMiddleware, leadsRoutes); // CRM Leads system
app.use('/api/chats', authMiddleware, chatsRoutes); // Chat/Atendimento WhatsApp system
app.use('/api/departments', authMiddleware, departmentsRoutes); // Department management system
app.use('/api/chat-assignments', authMiddleware, chatAssignmentsRoutes); // Chat assignment system
app.use('/api/metrics', authMiddleware, metricsRoutes); // Metrics and analytics system
app.use('/api/data-sources', authMiddleware, dataSourcesRoutes); // Data sources management (Google Sheets, etc)
app.use('/api/reports', authMiddleware, reportsRoutes); // Reports and dashboards system
app.use('/api/meta', metaRoutes); // Meta Ads integration (mixed auth - some public, some protected)
app.use('/api/webhooks', webhooksRoutes); // Webhooks públicos (WAHA, Evolution, etc) - SEM autenticação
app.use('/api/webhook-management', authMiddleware, webhookManagementRoutes); // Gerenciamento de webhooks - COM autenticação
app.use('/api/instance-management', authMiddleware, instanceManagementRoutes); // Gerenciamento de instâncias (logout, delete, restart, websocket) - COM autenticação
app.use('/api/pre-registered-media', preRegisteredMediaRoutes); // Mídias pré-cadastradas para CRM - COM autenticação
// app.use('/api/integrations', integrationsRoutes); // External API integrations system
// app.use('/api/cache', cacheRoutes); // Cache management and monitoring
app.use('/api/media', authMiddleware, mediaRoutes); // Template de mensagens multimídia
app.use('/api/media-upload', mediaUploadRoutes); // Upload de arquivos (já tem authMiddleware dentro)
app.use('/api', authMiddleware, mockRoutes);

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);



  // Initialize WebSocket service (Socket.IO para frontend)
  websocketService.initialize(server);

  // WhatsApp WebSocket service comentado temporariamente para evitar conflito
  // O websocketService já lida com os eventos de chat
  // whatsappWebSocketService.initialize(server);

  // Initialize alerts monitoring service
  initializeAlertsMonitoring();

  // Initialize backup service
  initializeBackupService();

  // Initialize Evolution WebSocket connections para instâncias ativas
  try {
    const prisma = new PrismaClient();
    console.log('🔌 [Evolution WebSocket] Buscando configurações globais...');

    // Buscar configurações globais do sistema
    const globalSettings = await prisma.globalSettings.findFirst({
      where: { singleton: true } // Configurações globais únicas
    });

    let evolutionHost =
      globalSettings?.evolutionHost || process.env.EVOLUTION_HOST || '';
    let evolutionApiKey =
      globalSettings?.evolutionApiKey || process.env.EVOLUTION_API_KEY || '';

    // Converter HTTPS para WSS se necessário
    if (evolutionHost && evolutionHost.startsWith('https://')) {
      const originalHost = evolutionHost;
      evolutionHost = evolutionHost.replace('https://', 'wss://');
      console.log(`🔄 [Evolution WebSocket] Convertendo HTTPS → WSS:`);
      console.log(`   HTTPS: ${originalHost}`);
      console.log(`   WSS:   ${evolutionHost}`);
    } else if (evolutionHost && evolutionHost.startsWith('http://')) {
      const originalHost = evolutionHost;
      evolutionHost = evolutionHost.replace('http://', 'ws://');
      console.log(`🔄 [Evolution WebSocket] Convertendo HTTP → WS:`);
      console.log(`   HTTP: ${originalHost}`);
      console.log(`   WS:   ${evolutionHost}`);
    }

    if (evolutionHost && evolutionApiKey) {
      console.log('✅ [Evolution WebSocket] Configurações encontradas:');
      console.log(`   Host: ${evolutionHost}`);
      console.log(`   API Key: ${evolutionApiKey.substring(0, 10)}...`);
      console.log('🔌 [Evolution WebSocket] Buscando instâncias ativas...');

      const activeSessions = await prisma.whatsAppSession.findMany({
        where: {
          provider: 'EVOLUTION',
          status: {
            in: ['WORKING', 'INITIALIZING']
          },
          websocketEnabled: true // ✅ Apenas instâncias com WebSocket ATIVO
        }
      });

      console.log(
        `📡 [Evolution WebSocket] Encontradas ${activeSessions.length} instâncias ativas`
      );

      for (const session of activeSessions) {
        try {
          if (!session.tenantId) {
            console.warn(
              `⚠️ [Evolution WebSocket] Sessão ${session.name} sem tenantId, pulando...`
            );
            continue;
          }

          console.log(
            `🔌 [Evolution WebSocket] Conectando: ${session.name}...`
          );
          await evolutionWebSocketClient.connectInstance(
            session.name,
            session.tenantId,
            evolutionHost,
            evolutionApiKey
          );
        } catch (error) {
          console.error(
            `❌ [Evolution WebSocket] Erro ao conectar ${session.name}:`,
            error
          );
        }
      }
    } else {
      console.warn('⚠️ [Evolution WebSocket] Configurações não encontradas');
      console.warn('   Para configurar:');
      console.warn('   1. Acesse as Configurações do Sistema');
      console.warn('   2. Configure Evolution Host e API Key');
      console.warn('   3. Ou adicione no .env:');
      console.warn('      EVOLUTION_HOST=https://evo.usezap.com.br');
      console.warn('      EVOLUTION_API_KEY=sua-api-key');
    }
  } catch (error) {
    console.error(
      '❌ [Evolution WebSocket] Erro ao inicializar conexões:',
      error
    );
  } finally {
    // Não desconectar o Prisma aqui pois ele será usado durante toda a execução
  }
});
