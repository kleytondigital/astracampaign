import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Criar diretório de uploads se não existir
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuração de armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único: timestamp-randomstring-filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);

    // ✅ Remover espaços e caracteres especiais do nome
    const cleanName = name
      .replace(/\s+/g, '-') // Substituir espaços por hífen
      .replace(/[^\w\-]/g, '') // Remover caracteres especiais
      .replace(/\-+/g, '-') // Múltiplos hífens → um único
      .toLowerCase(); // Lowercase para consistência

    cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
  }
});

// Validação de tipos de arquivo
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Tipos permitidos
  const allowedMimes = [
    // Imagens
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Vídeos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    // Áudios
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/mp4',
    'audio/x-m4a',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo não suportado: ${file.mimetype}`));
  }
};

// Limites de tamanho por tipo
const limits = {
  fileSize: 50 * 1024 * 1024 // 50MB (máximo geral)
};

// Middleware de upload
export const upload = multer({
  storage,
  fileFilter,
  limits
});

// Função auxiliar para determinar o tipo de mídia
export function getMediaType(
  mimetype: string
): 'IMAGE' | 'VIDEO' | 'AUDIO' | 'VOICE' | 'DOCUMENT' {
  if (mimetype.startsWith('image/')) return 'IMAGE';
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.startsWith('audio/')) {
    // Diferenciar áudio de voz (pode ser refinado depois)
    return 'AUDIO';
  }
  return 'DOCUMENT';
}

// Função para validar tamanho específico por tipo
export function validateFileSize(mimetype: string, size: number): boolean {
  const limits: Record<string, number> = {
    image: 10 * 1024 * 1024, // 10MB
    video: 50 * 1024 * 1024, // 50MB
    audio: 20 * 1024 * 1024, // 20MB
    document: 25 * 1024 * 1024 // 25MB
  };

  if (mimetype.startsWith('image/')) return size <= limits.image;
  if (mimetype.startsWith('video/')) return size <= limits.video;
  if (mimetype.startsWith('audio/')) return size <= limits.audio;
  return size <= limits.document;
}
