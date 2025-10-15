import { Router } from 'express';
import {
  configureSessionWebhook,
  configureAllWebhooks,
  listSessionWebhooks,
  removeSessionWebhook,
  testWebhook
} from '../controllers/webhookManagementController';
import {
  setEvolutionWebhook,
  getEvolutionWebhook,
  deleteEvolutionWebhook,
  setWahaWebhook,
  getWahaWebhook,
  deleteWahaWebhook,
  listEvolutionEvents,
  listWahaEvents
} from '../controllers/webhookController';

const router = Router();

// ============================================================================
// ROTAS LEGADAS (Compatibilidade)
// ============================================================================

// Configurar webhook para sessão específica
router.post('/sessions/:sessionId/webhook/configure', configureSessionWebhook);

// Configurar webhooks para todas as sessões ativas
router.post('/configure-all', configureAllWebhooks);

// Listar webhooks de uma sessão
router.get('/sessions/:sessionId/webhook', listSessionWebhooks);

// Remover webhook de uma sessão
router.delete('/sessions/:sessionId/webhook', removeSessionWebhook);

// Testar webhook
router.post('/sessions/:sessionId/webhook/test', testWebhook);

// ============================================================================
// ROTAS NOVAS (Evolution API)
// ============================================================================

// Listar eventos disponíveis
router.get('/evolution/events', listEvolutionEvents);

// Configurar webhook Evolution
router.post('/evolution/:instanceName', setEvolutionWebhook);

// Buscar configuração de webhook Evolution
router.get('/evolution/:instanceName', getEvolutionWebhook);

// Remover webhook Evolution
router.delete('/evolution/:instanceName', deleteEvolutionWebhook);

// ============================================================================
// ROTAS NOVAS (WAHA API)
// ============================================================================

// Listar eventos disponíveis
router.get('/waha/events', listWahaEvents);

// Configurar webhook WAHA
router.post('/waha/:sessionName', setWahaWebhook);

// Buscar configuração de webhook WAHA
router.get('/waha/:sessionName', getWahaWebhook);

// Remover webhook WAHA
router.delete('/waha/:sessionName', deleteWahaWebhook);

export default router;
