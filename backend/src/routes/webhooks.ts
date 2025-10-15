import { Router } from 'express';
import {
  handleWhatsAppWebhook,
  handleWhatsAppAck
} from '../controllers/webhooksController';

const router = Router();

// ============================================================================
// WEBHOOKS PÚBLICOS (sem autenticação)
// ============================================================================

// POST /api/webhooks/whatsapp - Receber mensagens de WAHA e Evolution
router.post('/whatsapp', handleWhatsAppWebhook);

// POST /api/webhooks/whatsapp/ack - Receber confirmações de entrega
router.post('/whatsapp/ack', handleWhatsAppAck);

export default router;






