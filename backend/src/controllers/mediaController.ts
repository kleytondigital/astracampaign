import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getMediaType, validateFileSize } from '../middleware/upload';
import path from 'path';

/**
 * Upload de arquivo de mídia
 */
export const uploadMedia = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo foi enviado'
      });
    }

    const { mimetype, size, filename, originalname } = req.file;

    // Validar tamanho do arquivo
    if (!validateFileSize(mimetype, size)) {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande para o tipo especificado'
      });
    }

    // Determinar tipo de mídia
    const mediaType = getMediaType(mimetype);

    // URL do arquivo - SEMPRE usar BACKEND_URL do .env
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3006';
    const fileUrl = `${backendUrl}/uploads/${filename}`;

    console.log(`✅ Arquivo enviado com sucesso: ${filename} (${mediaType})`);
    console.log(`🔗 URL gerada: ${fileUrl}`);

    return res.status(200).json({
      success: true,
      message: 'Arquivo enviado com sucesso',
      data: {
        filename,
        originalname,
        originalName: originalname, // Alias para compatibilidade
        mimetype,
        size,
        mediaType,
        url: fileUrl,
        fileUrl: fileUrl // Alias para compatibilidade com campanhas
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao fazer upload de mídia:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload de mídia',
      error: error.message
    });
  }
};
