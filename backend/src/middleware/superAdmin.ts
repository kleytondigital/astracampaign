import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from './auth';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
    tenantId?: string;
  };
}

/**
 * Middleware para verificar se o usuário é SuperAdmin
 * Inclui autenticação automática
 */
export const superAdminMiddleware = [
  authMiddleware,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // authMiddleware já garantiu que req.user existe
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Verificar se é SuperAdmin
      if (req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({ 
          error: 'Acesso negado. Apenas Super Admin pode acessar esta funcionalidade.' 
        });
      }

      next();
    } catch (error) {
      console.error('❌ Erro no middleware SuperAdmin:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
];
