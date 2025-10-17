# 🎯 Estratégia de Integração WhatsApp para Chat de Atendimento

## 📅 Data: 7 de outubro de 2025

---

## 🔍 **ANÁLISE DO SISTEMA EXISTENTE**

### ✅ **Infraestrutura Já Pronta:**

1. **Serviços de Envio (100% funcionais):**

   - ✅ `wahaApiService.ts` - Envio via WAHA API
   - ✅ `evolutionMessageService.ts` - Envio via Evolution API
   - ✅ Suporte a: TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT
   - ✅ Validação de números existentes
   - ✅ Normalização de telefones brasileiros

2. **Gerenciamento de Sessões:**

   - ✅ `WhatsAppSessionService` - Gestão de sessões no banco
   - ✅ `wahaSyncService.ts` - Sincronização com WAHA
   - ✅ `evolutionApiService.ts` - Gestão de instâncias Evolution
   - ✅ Suporte a QR Code
   - ✅ Multi-tenant (cada sessão vinculada a um tenant)

3. **Campanhas:**
   - ✅ Sistema completo de envio em massa
   - ✅ Fila de mensagens
   - ✅ Variáveis dinâmicas
   - ✅ Controle de status

---

## 🎯 **ESTRATÉGIA PARA CHAT DE ATENDIMENTO**

### **Opção 1: Webhooks (RECOMENDADO)** 🔥

**Como funciona:**

1. WAHA/Evolution envia webhook para nosso backend quando recebe mensagem
2. Backend processa, salva no banco e notifica frontend via WebSocket
3. Frontend atualiza chat em tempo real

**Vantagens:**

- ✅ Tempo real
- ✅ Eficiente (push, não pull)
- ✅ Escalável
- ✅ WAHA e Evolution suportam nativamente

**Implementação:**

```
WAHA/Evolution → Webhook → /api/webhooks/whatsapp
                              ↓
                        Salvar no banco (Chat + Message)
                              ↓
                    WebSocket → Frontend atualiza
```

---

### **Opção 2: Polling (Fallback)**

**Como funciona:**

1. Backend consulta API periodicamente (a cada X segundos)
2. Busca novas mensagens
3. Salva no banco
4. Notifica frontend

**Vantagens:**

- ✅ Não depende de webhook público
- ✅ Funciona em desenvolvimento local

**Desvantagens:**

- ⚠️ Delay de até X segundos
- ⚠️ Mais requisições à API

---

## 🚀 **IMPLEMENTAÇÃO PROPOSTA**

### **1. Criar Endpoint de Webhook** ✅

**Rota:** `POST /api/webhooks/whatsapp`

**Responsabilidades:**

- Receber mensagens de WAHA e Evolution
- Identificar tenant pela sessão
- Criar/atualizar Chat
- Salvar Message
- Criar Lead automaticamente (se novo número)
- Notificar via WebSocket

**Payload WAHA:**

```json
{
  "event": "message",
  "session": "session-001",
  "payload": {
    "id": "msg-123",
    "from": "5511999990001@c.us",
    "to": "session@c.us",
    "body": "Olá!",
    "fromMe": false,
    "timestamp": 1234567890,
    "type": "chat"
  }
}
```

**Payload Evolution:**

```json
{
  "event": "messages.upsert",
  "instance": "session-001",
  "data": {
    "key": {
      "remoteJid": "5511999990001@s.whatsapp.net",
      "fromMe": false,
      "id": "msg-123"
    },
    "message": {
      "conversation": "Olá!"
    },
    "messageTimestamp": 1234567890
  }
}
```

---

### **2. Reaproveitar Serviços de Envio** ✅

**No `chatsController.ts` → `sendMessage()`:**

```typescript
// Ao invés de TODO comentado, usar:
import { sendMessage as sendWAHA } from "../services/wahaApiService";
import { sendMessageViaEvolution } from "../services/evolutionMessageService";

// No controller:
const session = await prisma.whatsAppSession.findUnique({
  where: { id: chat.sessionId },
});

if (session.provider === "EVOLUTION") {
  await sendMessageViaEvolution(session.name, chat.phone, {
    text: body,
  });
} else {
  await sendWAHA(session.name, chat.phone, {
    text: body,
  });
}
```

---

### **3. WebSocket para Notificações** ✅

**Já existe:** `websocketService.ts`

**Usar para:**

- Notificar nova mensagem recebida
- Atualizar status de entrega (ack)
- Atualizar chat em tempo real

**Eventos:**

```typescript
// Quando receber mensagem via webhook:
websocketService.emit("chat:new-message", {
  tenantId: chat.tenantId,
  chatId: chat.id,
  message: newMessage,
});

// Frontend escuta:
socket.on("chat:new-message", (data) => {
  // Atualizar lista de conversas
  // Adicionar mensagem ao chat aberto
  // Tocar som de notificação
});
```

---

### **4. Criação Automática de Leads** ✅

**Lógica no webhook:**

```typescript
// Se receber mensagem de número desconhecido:
let chat = await prisma.chat.findUnique({
  where: { tenantId_phone: { tenantId, phone } },
});

if (!chat) {
  // Criar Lead automaticamente
  const lead = await prisma.lead.create({
    data: {
      tenantId,
      firstName: "Lead",
      lastName: phone.slice(-4), // Últimos 4 dígitos
      email: `${phone}@whatsapp.com`,
      phone,
      source: "WHATSAPP_CAMPAIGN",
      status: "NEW",
      score: 50,
    },
  });

  // Criar Chat vinculado ao Lead
  chat = await prisma.chat.create({
    data: {
      tenantId,
      phone,
      leadId: lead.id,
      status: "OPEN",
      sessionId: session.id,
    },
  });

  // Notificar admin sobre novo lead
  await prisma.cRMNotification.create({
    data: {
      tenantId,
      userId: adminId,
      type: "NEW_MESSAGE",
      title: `Nova mensagem de ${phone}`,
      message: "Lead criado automaticamente",
      link: `/atendimento?chat=${chat.id}`,
    },
  });
}
```

---

### **5. Configurar Webhooks nas APIs** ✅

**WAHA:**

```bash
POST {WAHA_HOST}/api/{session}/webhooks
{
  "url": "https://seu-dominio.com/api/webhooks/whatsapp",
  "events": ["message", "message.ack"]
}
```

**Evolution:**

```bash
POST {EVOLUTION_HOST}/webhook/set/{instance}
{
  "url": "https://seu-dominio.com/api/webhooks/whatsapp",
  "events": ["messages.upsert", "messages.update"]
}
```

---

## 📋 **PLANO DE IMPLEMENTAÇÃO**

### **Etapa 1: Backend - Webhook Handler** (1-2h)

1. ✅ Criar `webhooksController.ts`
2. ✅ Criar rota `POST /api/webhooks/whatsapp`
3. ✅ Parser para WAHA e Evolution
4. ✅ Salvar Chat + Message
5. ✅ Criar Lead automaticamente
6. ✅ Notificar via WebSocket

### **Etapa 2: Backend - Integrar Envio** (0.5h)

1. ✅ Atualizar `chatsController.sendMessage()`
2. ✅ Usar `wahaApiService` e `evolutionMessageService`
3. ✅ Atualizar status ACK ao receber confirmação

### **Etapa 3: Backend - WebSocket** (0.5h)

1. ✅ Criar eventos específicos do chat
2. ✅ Implementar autenticação por tenant
3. ✅ Emitir eventos de nova mensagem

### **Etapa 4: Frontend - Página de Atendimento** (5-7h)

1. ✅ Layout 3 colunas
2. ✅ Lista de conversas
3. ✅ Área de chat
4. ✅ Painel lateral
5. ✅ WebSocket integration
6. ✅ Botões rápidos CRM

---

## 🔐 **SEGURANÇA**

### **Webhook:**

- ✅ Validar API Key
- ✅ Verificar assinatura (se disponível)
- ✅ Rate limiting
- ✅ Validar tenant pela sessão

### **WebSocket:**

- ✅ Autenticação JWT
- ✅ Emitir apenas para tenant correto
- ✅ Validar permissões (USER vê só seus chats)

---

## 📊 **FLUXO COMPLETO**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE ENVIA MENSAGEM                   │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
                    ┌───────────────┐
                    │ WAHA/Evolution│
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │   WEBHOOK     │ POST /api/webhooks/whatsapp
                    └───────┬───────┘
                            ↓
            ┌───────────────────────────────┐
            │  1. Identificar Tenant        │
            │  2. Criar/Buscar Chat         │
            │  3. Salvar Message            │
            │  4. Criar Lead (se novo)      │
            │  5. Notificar via WebSocket   │
            └───────┬───────────────────────┘
                    ↓
        ┌───────────────────────────┐
        │  Frontend recebe via WS   │
        │  - Atualiza lista         │
        │  - Adiciona mensagem      │
        │  - Toca notificação       │
        └───────────────────────────┘
```

---

## 🎯 **PRÓXIMOS PASSOS**

1. ✅ **Criar webhooksController.ts**
2. ✅ **Atualizar chatsController com envio real**
3. ✅ **Implementar WebSocket events**
4. ✅ **Frontend: Página /atendimento**
5. ✅ **Testes end-to-end**

---

**Tempo estimado total:** ~8-10 horas

**Diferencial:** Sistema 100% integrado com WhatsApp real, criação automática de leads e notificações em tempo real! 🚀







