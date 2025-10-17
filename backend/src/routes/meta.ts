import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { superAdminMiddleware } from '../middleware/superAdmin';
import {
  getGlobalSettings,
  setGlobalSettings,
  testGlobalConnection,
  getGlobalStats
} from '../controllers/metaGlobalController';
import {
  tenantRedirect,
  oauthCallback,
  listAccounts,
  linkAccount,
  getConnectionStatus,
  disconnect
} from '../controllers/metaTenantController';

const router = Router();

// ============================================================================
// ROTAS GLOBAIS (SUPERADMIN)
// ============================================================================

// Configurações globais Meta (apenas SuperAdmin)
router.get('/admin/global', superAdminMiddleware, getGlobalSettings);
router.post('/admin/global', superAdminMiddleware, setGlobalSettings);
router.get('/admin/test-connection', superAdminMiddleware, testGlobalConnection);
router.get('/admin/stats', superAdminMiddleware, getGlobalStats);

// ============================================================================
// ROTAS POR TENANT (AUTENTICADAS)
// ============================================================================

// Iniciar fluxo OAuth para tenant
router.get('/tenant/:tenantId/redirect', authMiddleware, tenantRedirect);

// Callback OAuth (público - Meta redireciona para cá)
router.get('/callback', oauthCallback);

// Gerenciar conexão Meta do tenant
router.get('/tenant/:tenantId/status', authMiddleware, getConnectionStatus);
router.delete('/tenant/:tenantId/disconnect', authMiddleware, disconnect);

// Gerenciar contas Meta do tenant
router.get('/tenant/:tenantId/accounts', authMiddleware, listAccounts);
router.post('/tenant/:tenantId/link-account', authMiddleware, linkAccount);

export default router;
