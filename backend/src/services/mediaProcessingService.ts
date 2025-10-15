import fs from 'fs';
import path from 'path';
import { getMediaType } from '../middleware/upload';

/**
 * Serviço para processar mídias em Base64 e convertê-las em arquivos
 */
export class MediaProcessingService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');

    // Criar diretório se não existir
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Converte Base64 em arquivo e salva no sistema
   * @param base64Data - Dados em Base64 (com ou sem prefixo data:)
   * @param mimeType - Tipo MIME do arquivo
   * @param originalFileName - Nome original do arquivo (opcional)
   * @returns Informações do arquivo salvo
   */
  async saveBase64AsFile(
    base64Data: string,
    mimeType: string,
    originalFileName?: string
  ): Promise<{
    filename: string;
    path: string;
    url: string;
    size: number;
    mimetype: string;
    mediaType: string;
  }> {
    try {
      // Remover prefixo data: se existir
      let base64Content = base64Data;
      if (base64Data.includes('base64,')) {
        base64Content = base64Data.split('base64,')[1];
      } else if (base64Data.startsWith('data:')) {
        // Se tiver prefixo data: mas sem base64, extrair
        base64Content = base64Data.split(',')[1] || base64Data;
      }

      // Converter Base64 para Buffer
      const buffer = Buffer.from(base64Content, 'base64');

      // Determinar extensão do arquivo
      const extension = this.getExtensionFromMimeType(mimeType);

      // Gerar nome único para o arquivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      let baseName = originalFileName
        ? path.basename(originalFileName, path.extname(originalFileName))
        : 'media';

      // ✅ Limpar nome do arquivo (remover espaços e caracteres especiais)
      baseName = baseName
        .replace(/\s+/g, '-') // Espaços → hífen
        .replace(/[^\w\-]/g, '') // Remover caracteres especiais
        .replace(/\-+/g, '-') // Múltiplos hífens → único
        .toLowerCase(); // Lowercase

      const filename = `${baseName}-${uniqueSuffix}${extension}`;

      // Caminho completo do arquivo
      const filePath = path.join(this.uploadDir, filename);

      // Salvar arquivo
      fs.writeFileSync(filePath, buffer);

      // Determinar tipo de mídia
      const mediaType = getMediaType(mimeType);

      // URL do arquivo - SEMPRE usar BACKEND_URL do .env
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3006';
      const fileUrl = `${backendUrl}/uploads/${filename}`;

      console.log(
        `✅ [MediaProcessing] Arquivo Base64 salvo: ${filename} (${mediaType})`
      );
      console.log(`🔗 [MediaProcessing] URL gerada: ${fileUrl}`);

      return {
        filename,
        path: filePath,
        url: fileUrl,
        size: buffer.length,
        mimetype: mimeType,
        mediaType
      };
    } catch (error: any) {
      console.error('❌ [MediaProcessing] Erro ao salvar Base64:', error);
      throw new Error(`Erro ao processar mídia: ${error.message}`);
    }
  }

  /**
   * Converte Buffer em arquivo e salva no sistema
   * @param buffer - Buffer do arquivo
   * @param mimeType - Tipo MIME do arquivo
   * @param originalFileName - Nome original do arquivo (opcional)
   * @returns Informações do arquivo salvo
   */
  async saveBufferAsFile(
    buffer: Buffer,
    mimeType: string,
    originalFileName?: string
  ): Promise<{
    filename: string;
    path: string;
    url: string;
    size: number;
    mimetype: string;
    mediaType: string;
  }> {
    try {
      // Determinar extensão do arquivo
      const extension = this.getExtensionFromMimeType(mimeType);

      // Gerar nome único para o arquivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const baseName = originalFileName
        ? path.basename(originalFileName, path.extname(originalFileName))
        : 'media';
      const filename = `${baseName}-${uniqueSuffix}${extension}`;

      // Caminho completo do arquivo
      const filePath = path.join(this.uploadDir, filename);

      // Salvar arquivo
      fs.writeFileSync(filePath, buffer);

      // Determinar tipo de mídia
      const mediaType = getMediaType(mimeType);

      // URL do arquivo
      const fileUrl = `${
        process.env.BACKEND_URL || 'http://localhost:3006'
      }/uploads/${filename}`;

      console.log(
        `✅ [MediaProcessing] Arquivo Buffer salvo: ${filename} (${mediaType})`
      );

      return {
        filename,
        path: filePath,
        url: fileUrl,
        size: buffer.length,
        mimetype: mimeType,
        mediaType
      };
    } catch (error: any) {
      console.error('❌ [MediaProcessing] Erro ao salvar Buffer:', error);
      throw new Error(`Erro ao processar mídia: ${error.message}`);
    }
  }

  /**
   * Baixa mídia de URL e salva no sistema
   * @param url - URL da mídia
   * @param fileName - Nome do arquivo (opcional)
   * @returns Informações do arquivo salvo
   */
  async downloadAndSaveMedia(
    url: string,
    fileName?: string
  ): Promise<{
    filename: string;
    path: string;
    url: string;
    size: number;
    mimetype: string;
    mediaType: string;
  }> {
    try {
      console.log(`📥 [MediaProcessing] Baixando mídia: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Erro ao baixar mídia: ${response.status} ${response.statusText}`
        );
      }

      // Obter buffer da resposta
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Determinar MIME type
      const contentType =
        response.headers.get('content-type') || 'application/octet-stream';

      // Usar nome do arquivo da URL ou gerar um
      const urlFileName = fileName || path.basename(new URL(url).pathname);

      return await this.saveBufferAsFile(buffer, contentType, urlFileName);
    } catch (error: any) {
      console.error('❌ [MediaProcessing] Erro ao baixar mídia:', error);
      throw new Error(`Erro ao baixar mídia: ${error.message}`);
    }
  }

  /**
   * Determina a extensão do arquivo baseado no MIME type
   * @param mimeType - Tipo MIME
   * @returns Extensão do arquivo (ex: .jpg, .mp4)
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExtension: { [key: string]: string } = {
      // Imagens
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      // Vídeos
      'video/mp4': '.mp4',
      'video/mpeg': '.mpeg',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'video/webm': '.webm',
      // Áudios
      'audio/mpeg': '.mp3',
      'audio/ogg': '.ogg',
      'audio/wav': '.wav',
      'audio/webm': '.webm',
      'audio/mp4': '.m4a',
      'audio/x-m4a': '.m4a',
      // Documentos
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        '.xlsx',
      'text/plain': '.txt',
      'application/zip': '.zip',
      'application/x-zip-compressed': '.zip'
    };

    return mimeToExtension[mimeType] || '.bin';
  }

  /**
   * Limpa arquivos antigos do diretório de uploads
   * @param olderThanDays - Limpar arquivos mais antigos que X dias
   */
  async cleanOldFiles(olderThanDays: number = 7): Promise<number> {
    try {
      const now = Date.now();
      const maxAge = olderThanDays * 24 * 60 * 60 * 1000; // dias em milissegundos

      const files = fs.readdirSync(this.uploadDir);
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);

        // Verificar se o arquivo é mais antigo que o limite
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ [MediaProcessing] Arquivo antigo deletado: ${file}`);
        }
      }

      console.log(
        `✅ [MediaProcessing] ${deletedCount} arquivos antigos limpos`
      );
      return deletedCount;
    } catch (error: any) {
      console.error('❌ [MediaProcessing] Erro ao limpar arquivos:', error);
      throw new Error(`Erro ao limpar arquivos: ${error.message}`);
    }
  }

  /**
   * Valida se o arquivo Base64 não excede o tamanho máximo
   * @param base64Data - Dados em Base64
   * @param maxSizeMB - Tamanho máximo em MB
   * @returns true se válido, false caso contrário
   */
  validateBase64Size(base64Data: string, maxSizeMB: number = 50): boolean {
    const base64Content = base64Data.includes('base64,')
      ? base64Data.split('base64,')[1]
      : base64Data;

    const sizeInBytes = (base64Content.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    return sizeInMB <= maxSizeMB;
  }
}

// Exportar instância singleton
export const mediaProcessingService = new MediaProcessingService();
