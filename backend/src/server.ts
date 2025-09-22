import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as fs from 'fs';
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
import { authMiddleware } from './middleware/auth';
import './services/campaignSchedulerService'; // Inicializar scheduler

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar para confiar no proxy (nginx/traefik)
app.set('trust proxy', true);

// Criar diretório para uploads temporários
const uploadDir = '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// CORS configurado de forma segura
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
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

// Rate limiting para proteger contra ataques
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

app.use(generalLimiter);

// Middleware para todas as rotas exceto upload
app.use((req, res, next) => {
  if (req.path.includes('/media/upload')) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

app.use((req, res, next) => {
  if (req.path.includes('/media/upload')) {
    return next();
  }
  express.urlencoded({ limit: '50mb', extended: true })(req, res, next);
});

// Rotas públicas (autenticação) com rate limiting específico
app.use('/api/auth', authLimiter, authRoutes);

// Rota pública para configurações (favicon e título)
app.use('/api/settings', settingsRoutes);

// Health check público
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Servir uploads estaticamente (público)
app.use('/api/uploads', express.static('/app/uploads'));

// Rotas protegidas (requerem autenticação)
app.use('/api/contatos', authMiddleware, contactRoutes);
app.use('/api/categorias', authMiddleware, categoryRoutes);
app.use('/api/csv', authMiddleware, csvImportRoutes);
app.use('/api/waha', authMiddleware, wahaRoutes);
app.use('/api/campaigns', authMiddleware, aiLimiter, campaignRoutes);
app.use('/api/users', usersRoutes); // Já tem authMiddleware + adminMiddleware
app.use('/api/media', mediaRoutes); // Upload de arquivos de mídia
app.use('/api', authMiddleware, mockRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});