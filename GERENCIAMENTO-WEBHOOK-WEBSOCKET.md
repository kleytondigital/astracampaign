# 🔄 Gerenciamento Webhook vs WebSocket - Evolution API

## 📅 Data: 8 de outubro de 2025

---

## 🎯 **OBJETIVO**

Implementar gerenciamento inteligente de conexões Evolution API com:

- ✅ **Exclusividade**: Webhook OU WebSocket (nunca os dois juntos)
- ✅ **Auto-desativação**: Ativar um desativa o outro automaticamente
- ✅ **Persistência**: Configurações salvas no banco de dados
- ✅ **Sincronização**: Toggles refletem estado real da Evolution API

---

## ✅ **IMPLEMENTADO**

### **1. Serviço de Gerenciamento** 📦

**Arquivo:** `backend/src/services/instanceConnectionManager.ts`

**Responsabilidades:**

- Gerencia ativação/desativação de Webhook e WebSocket
- Garante exclusividade (apenas um ativo por vez)
- Sincroniza estado com Evolution API
- Persiste configurações no banco de dados

**Métodos:**

```typescript
// 1. Ativar Webhook (desativa WebSocket)
await instanceConnectionManager.enableWebhook(instanceName, tenantId, {
  url: "https://backend.com/api/webhooks/evolution",
  webhook_base64: true,
  webhook_by_events: false,
  events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE"],
});

// 2. Ativar WebSocket (desativa Webhook)
await instanceConnectionManager.enableWebSocket(
  instanceName,
  tenantId,
  evolutionHost,
  apiKey
);

// 3. Desativar ambos
await instanceConnectionManager.disableBoth(instanceName);

// 4. Obter estado atual
const state = await instanceConnectionManager.getConnectionState(instanceName);
// Retorna: { webhookEnabled, websocketEnabled, webhookConfig }

// 5. Sincronizar estado
await instanceConnectionManager.syncState(instanceName, tenantId);
```

---

### **2. Schema do Banco de Dados** 💾

**Arquivo:** `backend/prisma/schema.prisma`

**Novos Campos em `WhatsAppSession`:**

```prisma
model WhatsAppSession {
  // ... campos existentes ...

  // Campos para gerenciar Webhook vs WebSocket
  webhookEnabled   Boolean    @default(false) @map("webhook_enabled")
  websocketEnabled Boolean    @default(false) @map("websocket_enabled")
  webhookUrl       String?    @map("webhook_url")
  webhookBase64    Boolean?   @map("webhook_base64")

  // ... relações ...
}
```

**Migração Aplicada:**

```bash
npx prisma db push
# ✅ Banco atualizado com novos campos
```

---

## 🔄 **FLUXO DE FUNCIONAMENTO**

### **Cenário 1: Ativar Webhook**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuário ativa toggle "Webhook" no frontend                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Frontend chama: POST /api/instance-management/webhook        │
│    { webhook_base64: true }                                     │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. instanceConnectionManager.enableWebhook()                    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Desconecta WebSocket (se ativo)                             │
│    evolutionWebSocketClient.disconnectInstance()                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Configura Webhook na Evolution API                           │
│    evolutionApiService.setInstanceWebhook()                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Atualiza banco de dados                                      │
│    webhookEnabled: true                                         │
│    websocketEnabled: false                                      │
│    webhookUrl: "https://..."                                    │
│    webhookBase64: true                                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Retorna sucesso para frontend                                │
│    Frontend atualiza toggles automaticamente                    │
└─────────────────────────────────────────────────────────────────┘
```

### **Cenário 2: Ativar WebSocket**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuário ativa toggle "WebSocket" no frontend                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Frontend chama: POST /api/instance-management/websocket      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. instanceConnectionManager.enableWebSocket()                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Remove Webhook da Evolution API                              │
│    evolutionApiService.deleteInstanceWebhook()                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Conecta WebSocket                                             │
│    evolutionWebSocketClient.connectInstance()                    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Atualiza banco de dados                                      │
│    webhookEnabled: false                                        │
│    websocketEnabled: true                                       │
│    webhookUrl: null                                             │
│    webhookBase64: null                                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Retorna sucesso para frontend                                │
│    Frontend atualiza toggles automaticamente                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ **INTEGRAÇÃO FRONTEND (A IMPLEMENTAR)**

### **1. Carregar Estado Atual**

```typescript
// Ao abrir modal de configuração
const response = await api.get(`/api/instance-management/state/${instanceName}`);

// Resposta:
{
  webhookEnabled: true,
  websocketEnabled: false,
  webhookConfig: {
    url: "https://...",
    webhook_base64: true,
    events: [...]
  }
}

// Atualizar toggles
setWebhookEnabled(response.webhookEnabled);
setWebsocketEnabled(response.websocketEnabled);
setWebhookBase64(response.webhookConfig?.webhook_base64 || false);
```

### **2. Ativar/Desativar Webhook**

```typescript
const handleWebhookToggle = async (enabled: boolean) => {
  if (enabled) {
    // Ativar webhook
    await api.post(`/api/instance-management/webhook/${instanceName}`, {
      webhook_base64: webhookBase64,
      events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE"],
    });

    toast.success("Webhook ativado! WebSocket foi desativado.");
  } else {
    // Desativar webhook
    await api.delete(`/api/instance-management/webhook/${instanceName}`);

    toast.success("Webhook desativado!");
  }

  // Recarregar estado
  await loadState();
};
```

### **3. Ativar/Desativar WebSocket**

```typescript
const handleWebSocketToggle = async (enabled: boolean) => {
  if (enabled) {
    // Ativar websocket
    await api.post(`/api/instance-management/websocket/${instanceName}`);

    toast.success("WebSocket ativado! Webhook foi desativado.");
  } else {
    // Desativar websocket
    await api.delete(`/api/instance-management/websocket/${instanceName}`);

    toast.success("WebSocket desativado!");
  }

  // Recarregar estado
  await loadState();
};
```

---

## 🎨 **UI/UX Sugerida**

```jsx
<Modal title="Configurar Conexão - {instanceName}">
  <div className="space-y-4">
    {/* Aviso */}
    <Alert variant="info">
      ⚠️ Webhook e WebSocket não podem estar ativos ao mesmo tempo. Ativar um
      desativa o outro automaticamente.
    </Alert>

    {/* Toggle Webhook */}
    <div className="flex items-center justify-between p-4 border rounded">
      <div>
        <h3 className="font-semibold">Webhook</h3>
        <p className="text-sm text-gray-500">Recebe mensagens via HTTP POST</p>
      </div>
      <Toggle
        checked={webhookEnabled}
        onChange={handleWebhookToggle}
        disabled={loading}
      />
    </div>

    {/* Configurações do Webhook (se ativo) */}
    {webhookEnabled && (
      <div className="ml-4 space-y-2 border-l-2 pl-4">
        <Toggle
          checked={webhookBase64}
          onChange={setWebhookBase64}
          label="Receber mídias em Base64"
        />
        <p className="text-xs text-gray-500">
          ✅ Recomendado: Converte mídias automaticamente
        </p>
      </div>
    )}

    {/* Toggle WebSocket */}
    <div className="flex items-center justify-between p-4 border rounded">
      <div>
        <h3 className="font-semibold">WebSocket</h3>
        <p className="text-sm text-gray-500">
          Recebe mensagens em tempo real via WS
        </p>
      </div>
      <Toggle
        checked={websocketEnabled}
        onChange={handleWebSocketToggle}
        disabled={loading}
      />
    </div>

    {/* Status Atual */}
    <div className="p-4 bg-gray-50 rounded">
      <h4 className="font-semibold mb-2">Estado Atual:</h4>
      {webhookEnabled && (
        <div className="text-sm">
          ✅ Webhook ativo com Base64: {webhookBase64 ? "Sim" : "Não"}
        </div>
      )}
      {websocketEnabled && (
        <div className="text-sm">✅ WebSocket conectado</div>
      )}
      {!webhookEnabled && !websocketEnabled && (
        <div className="text-sm text-yellow-600">
          ⚠️ Nenhuma conexão ativa - mensagens não serão recebidas
        </div>
      )}
    </div>
  </div>
</Modal>
```

---

## 📝 **ROTAS DA API (A CRIAR)**

```typescript
// backend/src/routes/instanceManagement.ts

import { Router } from "express";
import { instanceConnectionManager } from "../services/instanceConnectionManager";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Obter estado atual
router.get("/state/:instanceName", authMiddleware, async (req, res) => {
  const { instanceName } = req.params;
  const state = await instanceConnectionManager.getConnectionState(
    instanceName
  );
  res.json(state);
});

// Ativar Webhook
router.post("/webhook/:instanceName", authMiddleware, async (req, res) => {
  const { instanceName } = req.params;
  const { webhook_base64, events } = req.body;
  const tenantId = req.user!.tenantId!;

  const result = await instanceConnectionManager.enableWebhook(
    instanceName,
    tenantId,
    {
      url: `${process.env.BACKEND_URL}/api/webhooks/evolution`,
      webhook_base64: webhook_base64 ?? true,
      webhook_by_events: false,
      events: events || ["MESSAGES_UPSERT", "MESSAGES_UPDATE"],
    }
  );

  res.json(result);
});

// Desativar Webhook
router.delete("/webhook/:instanceName", authMiddleware, async (req, res) => {
  const { instanceName } = req.params;
  await instanceConnectionManager.disableBoth(instanceName);
  res.json({ success: true, message: "Webhook desativado" });
});

// Ativar WebSocket
router.post("/websocket/:instanceName", authMiddleware, async (req, res) => {
  const { instanceName } = req.params;
  const tenantId = req.user!.tenantId!;

  // Buscar configurações globais
  const settings = await prisma.globalSettings.findFirst();

  const result = await instanceConnectionManager.enableWebSocket(
    instanceName,
    tenantId,
    settings!.evolutionHost,
    settings!.evolutionApiKey
  );

  res.json(result);
});

// Desativar WebSocket
router.delete("/websocket/:instanceName", authMiddleware, async (req, res) => {
  const { instanceName } = req.params;
  await instanceConnectionManager.disableBoth(instanceName);
  res.json({ success: true, message: "WebSocket desativado" });
});

export default router;
```

---

## ✨ **BENEFÍCIOS**

### **Para o Sistema:**

- ✅ **Exclusividade garantida** - Sem conflitos entre Webhook e WebSocket
- ✅ **Estado consistente** - Banco sincronizado com Evolution API
- ✅ **Toggles corretos** - Refletem estado real sempre
- ✅ **Gerenciamento centralizado** - Toda lógica em um serviço

### **Para os Usuários:**

- ✅ **UI clara** - Sabe exatamente qual conexão está ativa
- ✅ **Troca fácil** - Um clique para alternar
- ✅ **Feedback imediato** - Avisos de ativação/desativação
- ✅ **Sem erros** - Sistema previne configurações inválidas

---

## 🚀 **PRÓXIMOS PASSOS**

1. ✅ **Schema atualizado** - Campos adicionados ao banco
2. ✅ **Serviço criado** - `instanceConnectionManager.ts`
3. ⏳ **Rotas da API** - Criar endpoints REST
4. ⏳ **Frontend** - Integrar toggles e modais
5. ⏳ **Testes** - Validar exclusividade e sincronização

**Sistema pronto para gerenciar Webhook vs WebSocket de forma inteligente!** 🎯







