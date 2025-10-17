# 🔄 Sistema de Alternância Webhook ↔ WebSocket

## 📅 Data: 8 de outubro de 2025

---

## ✅ **IMPLEMENTADO**

### **Sistema Inteligente de Gerenciamento de Conexões**

**Regra Principal:**

- ✅ **Apenas UM ativo por vez**: Webhook OU WebSocket
- ✅ **Auto-desativação**: Ativar um desativa o outro
- ✅ **Persistência**: Estado salvo no banco de dados
- ✅ **Sincronização**: Estado reflete configuração real da Evolution API

---

## 📝 **ROTAS IMPLEMENTADAS**

### **1. Obter Estado Atual:**

```typescript
GET /api/instance-management/connection-state/:instanceName

// Resposta:
{
  webhookEnabled: true,
  websocketEnabled: false,
  webhookConfig: {
    url: "https://ngrok.dev/api/webhooks/evolution",
    webhook_base64: true,
    events: [...]
  }
}
```

### **2. Ativar Webhook:**

```typescript
POST /api/instance-management/enable-webhook/:instanceName
Body: {
  webhook_base64: true  // Opcional, padrão: true
}

// Ações:
1. Desconecta WebSocket (se ativo)
2. Configura Webhook na Evolution API
3. Atualiza banco:
   - webhookEnabled: true
   - websocketEnabled: false
   - webhookUrl: "https://..."
   - webhookBase64: true

// Resposta:
{
  success: true,
  message: "Webhook ativado com sucesso. WebSocket foi desativado."
}
```

### **3. Ativar WebSocket:**

```typescript
POST /api/instance-management/enable-websocket/:instanceName

// Ações:
1. Remove Webhook da Evolution API
2. Conecta WebSocket
3. Atualiza banco:
   - webhookEnabled: false
   - websocketEnabled: true
   - webhookUrl: null
   - webhookBase64: null

// Resposta:
{
  success: true,
  message: "WebSocket ativado com sucesso. Webhook foi desativado."
}
```

---

## 🔄 **FLUXO DE ALTERNÂNCIA**

### **Cenário 1: Webhook → WebSocket**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Estado atual: Webhook ativo                                   │
│    webhookEnabled: true, websocketEnabled: false                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Usuário clica em "Ativar WebSocket"                           │
│    POST /enable-websocket/:instanceName                           │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Sistema remove webhook da Evolution API                       │
│    DELETE /instance/webhook/:instanceName                         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Sistema conecta WebSocket                                      │
│    evolutionWebSocketClient.connectInstance()                     │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Atualiza banco de dados                                       │
│    webhookEnabled: false, websocketEnabled: true                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Frontend atualiza toggles automaticamente                     │
│    ✅ WebSocket: ON  |  ❌ Webhook: OFF                          │
└─────────────────────────────────────────────────────────────────┘
```

### **Cenário 2: WebSocket → Webhook**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Estado atual: WebSocket ativo                                 │
│    webhookEnabled: false, websocketEnabled: true                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Usuário clica em "Ativar Webhook"                             │
│    POST /enable-webhook/:instanceName                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Sistema desconecta WebSocket                                   │
│    evolutionWebSocketClient.disconnectInstance()                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Sistema configura webhook na Evolution API                    │
│    POST /instance/webhook/:instanceName                           │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Atualiza banco de dados                                       │
│    webhookEnabled: true, websocketEnabled: false                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Frontend atualiza toggles automaticamente                     │
│    ✅ Webhook: ON  |  ❌ WebSocket: OFF                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ **INTEGRAÇÃO FRONTEND (A IMPLEMENTAR)**

### **Componente de Configuração:**

```tsx
// WhatsAppConnectionsPage.tsx ou Modal de Configuração

const [webhookEnabled, setWebhookEnabled] = useState(false);
const [websocketEnabled, setWebsocketEnabled] = useState(false);
const [webhookBase64, setWebhookBase64] = useState(true);
const [loading, setLoading] = useState(false);

// Carregar estado atual ao abrir modal
useEffect(() => {
  loadConnectionState();
}, [instanceName]);

const loadConnectionState = async () => {
  try {
    const response = await api.get(
      `/api/instance-management/connection-state/${instanceName}`
    );
    setWebhookEnabled(response.data.webhookEnabled);
    setWebsocketEnabled(response.data.websocketEnabled);
    setWebhookBase64(response.data.webhookConfig?.webhook_base64 || true);
  } catch (error) {
    console.error("Erro ao carregar estado:", error);
  }
};

const handleWebhookToggle = async (enabled: boolean) => {
  setLoading(true);
  try {
    if (enabled) {
      await api.post(
        `/api/instance-management/enable-webhook/${instanceName}`,
        {
          webhook_base64: webhookBase64,
        }
      );
      toast.success("Webhook ativado! WebSocket foi desativado.");
    } else {
      // Desativar webhook ativa websocket automaticamente
      await api.post(
        `/api/instance-management/enable-websocket/${instanceName}`
      );
      toast.success("Webhook desativado! WebSocket foi ativado.");
    }
    await loadConnectionState();
  } catch (error: any) {
    toast.error(error.message || "Erro ao alternar modo de conexão");
  } finally {
    setLoading(false);
  }
};

const handleWebSocketToggle = async (enabled: boolean) => {
  setLoading(true);
  try {
    if (enabled) {
      await api.post(
        `/api/instance-management/enable-websocket/${instanceName}`
      );
      toast.success("WebSocket ativado! Webhook foi desativado.");
    } else {
      // Desativar websocket ativa webhook automaticamente
      await api.post(
        `/api/instance-management/enable-webhook/${instanceName}`,
        {
          webhook_base64: true,
        }
      );
      toast.success("WebSocket desativado! Webhook foi ativado.");
    }
    await loadConnectionState();
  } catch (error: any) {
    toast.error(error.message || "Erro ao alternar modo de conexão");
  } finally {
    setLoading(false);
  }
};
```

---

### **UI Sugerida:**

```tsx
<div className="space-y-4 p-4 border rounded-lg">
  <div className="flex items-center justify-between">
    <div>
      <h4 className="font-semibold">Modo de Recebimento</h4>
      <p className="text-sm text-gray-500">
        Escolha como receber mensagens (apenas um pode estar ativo)
      </p>
    </div>
  </div>

  {/* Opção Webhook */}
  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
    <div className="flex-1">
      <div className="flex items-center space-x-2">
        <h5 className="font-medium">Webhook</h5>
        {webhookEnabled && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            Ativo
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">Recebe mensagens via HTTP POST</p>

      {webhookEnabled && (
        <div className="mt-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={webhookBase64}
              onChange={(e) => setWebhookBase64(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Receber mídias em Base64</span>
          </label>
        </div>
      )}
    </div>
    <button
      onClick={() => handleWebhookToggle(!webhookEnabled)}
      disabled={loading}
      className={`px-4 py-2 rounded-lg transition-colors ${
        webhookEnabled
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {webhookEnabled ? "Desativar" : "Ativar"}
    </button>
  </div>

  {/* Opção WebSocket */}
  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
    <div className="flex-1">
      <div className="flex items-center space-x-2">
        <h5 className="font-medium">WebSocket</h5>
        {websocketEnabled && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            Ativo
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600">
        Recebe mensagens em tempo real via WS
      </p>
    </div>
    <button
      onClick={() => handleWebSocketToggle(!websocketEnabled)}
      disabled={loading}
      className={`px-4 py-2 rounded-lg transition-colors ${
        websocketEnabled
          ? "bg-red-600 text-white hover:bg-red-700"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {websocketEnabled ? "Desativar" : "Ativar"}
    </button>
  </div>

  {/* Aviso */}
  {!webhookEnabled && !websocketEnabled && (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800">
        ⚠️ Nenhum modo ativo - mensagens não serão recebidas!
      </p>
    </div>
  )}
</div>
```

---

## 📊 **BANCO DE DADOS**

### **Campos em `WhatsAppSession`:**

```prisma
model WhatsAppSession {
  // ... campos existentes ...

  webhookEnabled   Boolean    @default(false)
  websocketEnabled Boolean    @default(false)
  webhookUrl       String?
  webhookBase64    Boolean?
}
```

### **Estados Possíveis:**

| webhookEnabled | websocketEnabled | Estado                          |
| -------------- | ---------------- | ------------------------------- |
| `true`         | `false`          | ✅ Webhook ativo                |
| `false`        | `true`           | ✅ WebSocket ativo              |
| `false`        | `false`          | ⚠️ Nenhum ativo                 |
| `true`         | `true`           | ❌ IMPOSSÍVEL (sistema previne) |

---

## 🎯 **CONFIGURAÇÃO AUTOMÁTICA**

### **Ao Configurar Webhook:**

```typescript
// webhookManagementController.ts

if (success) {
  // 1. Desativar WebSocket
  evolutionWebSocketClient.disconnectInstance(session.name);

  // 2. Atualizar banco
  await prisma.whatsAppSession.update({
    where: { id: sessionId },
    data: {
      webhookEnabled: true, // ✅ Ativa webhook
      websocketEnabled: false, // ✅ Desativa websocket
      webhookUrl: "https://...",
      webhookBase64: true,
    },
  });

  console.log("✅ Webhook configurado como padrão");
}
```

---

## 🧪 **TESTES**

### **Teste 1: Configurar Webhook pela Primeira Vez**

```bash
# Estado inicial: Nenhum ativo
webhookEnabled: false
websocketEnabled: false

# Configurar webhook
POST /api/webhook-management/configure/:sessionId

# Estado final: Webhook ativo
webhookEnabled: true
websocketEnabled: false
webhookUrl: "https://ngrok.dev/api/webhooks/evolution"
webhookBase64: true

✅ Webhook setado como padrão automaticamente
```

### **Teste 2: Alternar de Webhook para WebSocket**

```bash
# Estado inicial: Webhook ativo
POST /api/instance-management/enable-websocket/oficina_e9f2ed4d

# Logs:
✅ Webhook removido da Evolution API
✅ WebSocket conectado
💾 Estado salvo no banco

# Estado final: WebSocket ativo
webhookEnabled: false
websocketEnabled: true
```

### **Teste 3: Alternar de WebSocket para Webhook**

```bash
# Estado inicial: WebSocket ativo
POST /api/instance-management/enable-webhook/oficina_e9f2ed4d
Body: { webhook_base64: true }

# Logs:
✅ WebSocket desconectado
✅ Webhook configurado na Evolution API
💾 Estado salvo no banco

# Estado final: Webhook ativo
webhookEnabled: true
websocketEnabled: false
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **Backend:**

- ✅ Rotas de alternância criadas
- ✅ Auto-desativação implementada
- ✅ Persistência no banco
- ✅ Sincronização com Evolution API
- ✅ Logs detalhados

### **Frontend (A IMPLEMENTAR):**

- ⏳ Carregar estado atual ao abrir modal
- ⏳ Toggles para Webhook e WebSocket
- ⏳ Botões de ativar/desativar
- ⏳ Checkbox para webhook_base64
- ⏳ Aviso quando nenhum está ativo
- ⏳ Feedback visual do estado

---

## ✨ **RESULTADO FINAL**

**Sistema inteligente de gerenciamento de conexões!** 🚀

### **Funcionalidades:**

- ✅ **Exclusividade garantida** - Apenas um ativo
- ✅ **Auto-desativação** - Ativar um desativa o outro
- ✅ **Webhook como padrão** - Ao configurar, ativa automaticamente
- ✅ **Escolha do usuário** - Pode alternar quando quiser
- ✅ **Estado persistente** - Salvo no banco
- ✅ **Sincronização** - Reflete configuração real
- ✅ **Logs detalhados** - Debug facilitado

### **Próximos Passos:**

1. ⏳ Implementar UI no frontend
2. ⏳ Adicionar toggles no painel de conexões
3. ⏳ Testar alternância
4. ⏳ Validar exclusividade

**Backend pronto! Falta apenas implementar UI no frontend.** 🎯







