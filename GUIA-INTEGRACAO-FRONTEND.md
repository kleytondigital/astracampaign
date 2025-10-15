# 🎨 Guia de Integração Frontend - Instance Management

## 📅 Data: 7 de outubro de 2025

---

## 🎯 **OBJETIVO**

Integrar as novas funcionalidades de gerenciamento de instâncias no painel WhatsApp do frontend.

---

## 📋 **FUNCIONALIDADES A IMPLEMENTAR**

1. ✅ Botão "Desconectar" (Logout)
2. ✅ Botão "Reiniciar" (Restart)
3. ✅ Botão "Configurar Webhook"
4. ✅ Botão "Configurar WebSocket"
5. ✅ Botão "Deletar" (Delete)

---

## 🔧 **PASSO A PASSO**

### **1. Adicionar Botões no Painel WhatsApp**

**Arquivo:** `frontend/src/pages/WhatsAppConnectionsPage.tsx`

Adicione os botões de ação para cada instância:

```tsx
// Na lista de instâncias, adicione os botões de ação
<div className="instance-actions flex gap-2">
  {/* Desconectar */}
  {session.status === "WORKING" && (
    <button
      onClick={() => handleLogout(session.name)}
      className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
      title="Desconectar instância"
    >
      🔌 Desconectar
    </button>
  )}

  {/* Reiniciar */}
  <button
    onClick={() => handleRestart(session.name)}
    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
    title="Reiniciar instância"
  >
    🔄 Reiniciar
  </button>

  {/* Configurar Webhook */}
  <button
    onClick={() => handleConfigureWebhook(session.name)}
    className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
    title="Configurar Webhook"
  >
    🔗 Webhook
  </button>

  {/* Configurar WebSocket */}
  {session.provider === "EVOLUTION" && (
    <button
      onClick={() => handleConfigureWebSocket(session.name)}
      className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
      title="Configurar WebSocket"
    >
      📡 WebSocket
    </button>
  )}

  {/* Deletar */}
  <button
    onClick={() => handleDelete(session.name)}
    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
    title="Deletar instância"
  >
    🗑️ Deletar
  </button>
</div>
```

---

### **2. Implementar Handlers**

Adicione as funções de handler no componente:

```tsx
import { toast } from "react-hot-toast";
import { apiService } from "../services/api";

// Handler para Logout
const handleLogout = async (instanceName: string) => {
  try {
    setLoading(true);

    await apiService.post(`/instance-management/logout/${instanceName}`);

    toast.success("Instância desconectada com sucesso!");

    // Atualizar lista
    await loadSessions();
  } catch (error: any) {
    console.error("Erro ao desconectar instância:", error);
    toast.error(error.response?.data?.error || "Erro ao desconectar instância");
  } finally {
    setLoading(false);
  }
};

// Handler para Restart
const handleRestart = async (instanceName: string) => {
  try {
    setLoading(true);

    await apiService.post(`/instance-management/restart/${instanceName}`);

    toast.success("Instância reiniciada! Aguarde o QR Code...");

    // Atualizar lista
    await loadSessions();
  } catch (error: any) {
    console.error("Erro ao reiniciar instância:", error);
    toast.error(error.response?.data?.error || "Erro ao reiniciar instância");
  } finally {
    setLoading(false);
  }
};

// Handler para Configurar Webhook
const handleConfigureWebhook = async (instanceName: string) => {
  try {
    setLoading(true);

    const webhookUrl = `${window.location.origin}/api/webhooks/whatsapp`;

    await apiService.post(`/webhook-management/evolution/${instanceName}`, {
      url: webhookUrl,
      webhookByEvents: false,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
    });

    toast.success("Webhook configurado com sucesso!");
  } catch (error: any) {
    console.error("Erro ao configurar webhook:", error);
    toast.error(error.response?.data?.error || "Erro ao configurar webhook");
  } finally {
    setLoading(false);
  }
};

// Handler para Configurar WebSocket
const handleConfigureWebSocket = async (instanceName: string) => {
  try {
    setLoading(true);

    await apiService.post(`/instance-management/websocket/${instanceName}`, {
      enabled: true,
      events: ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"],
    });

    toast.success("WebSocket configurado com sucesso!");
  } catch (error: any) {
    console.error("Erro ao configurar WebSocket:", error);
    toast.error(error.response?.data?.error || "Erro ao configurar WebSocket");
  } finally {
    setLoading(false);
  }
};

// Handler para Delete
const handleDelete = async (instanceName: string) => {
  // Confirmação
  const confirmed = window.confirm(
    `⚠️ ATENÇÃO!\n\nVocê está prestes a DELETAR a instância "${instanceName}".\n\n` +
      `Esta ação irá:\n` +
      `• Deletar a instância na Evolution API\n` +
      `• Remover todos os dados do banco de dados\n` +
      `• Esta ação NÃO PODE SER DESFEITA\n\n` +
      `Tem certeza que deseja continuar?`
  );

  if (!confirmed) return;

  try {
    setLoading(true);

    await apiService.delete(`/instance-management/delete/${instanceName}`);

    toast.success("Instância deletada com sucesso!");

    // Atualizar lista
    await loadSessions();
  } catch (error: any) {
    console.error("Erro ao deletar instância:", error);
    toast.error(error.response?.data?.error || "Erro ao deletar instância");
  } finally {
    setLoading(false);
  }
};
```

---

### **3. Adicionar Estado de Loading**

```tsx
const [loading, setLoading] = useState(false);

// No JSX, desabilitar botões durante loading
<button
  onClick={() => handleLogout(session.name)}
  disabled={loading}
  className={`px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 ${
    loading ? "opacity-50 cursor-not-allowed" : ""
  }`}
>
  {loading ? "⏳" : "🔌"} Desconectar
</button>;
```

---

### **4. Adicionar Modal de Confirmação (Opcional)**

Para uma UX melhor, crie um modal de confirmação:

```tsx
const [deleteModal, setDeleteModal] = useState<{
  show: boolean;
  instanceName: string;
}>({ show: false, instanceName: "" });

// Abrir modal
const openDeleteModal = (instanceName: string) => {
  setDeleteModal({ show: true, instanceName });
};

// Confirmar delete
const confirmDelete = async () => {
  await handleDelete(deleteModal.instanceName);
  setDeleteModal({ show: false, instanceName: "" });
};

// JSX do Modal
{
  deleteModal.show && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md">
        <h3 className="text-xl font-bold mb-4 text-red-600">
          ⚠️ Confirmar Exclusão
        </h3>
        <p className="mb-4">
          Você está prestes a deletar a instância{" "}
          <strong>{deleteModal.instanceName}</strong>.
        </p>
        <p className="mb-4 text-sm text-gray-600">Esta ação irá:</p>
        <ul className="list-disc list-inside mb-4 text-sm text-gray-600">
          <li>Deletar a instância na Evolution API</li>
          <li>Remover todos os dados do banco</li>
          <li>Esta ação NÃO PODE SER DESFEITA</li>
        </ul>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDeleteModal({ show: false, instanceName: "" })}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Sim, Deletar
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

### **5. Adicionar Indicadores Visuais**

Adicione badges para mostrar o status de webhook/websocket:

```tsx
<div className="instance-status flex gap-2">
  {/* Status da Conexão */}
  <span
    className={`px-2 py-1 rounded text-xs ${
      session.status === "WORKING"
        ? "bg-green-100 text-green-800"
        : session.status === "SCAN_QR_CODE"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800"
    }`}
  >
    {session.status === "WORKING"
      ? "✅ Conectado"
      : session.status === "SCAN_QR_CODE"
      ? "🔲 Aguardando QR"
      : "❌ Desconectado"}
  </span>

  {/* Webhook Configurado */}
  {session.config?.webhookConfigured && (
    <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
      🔗 Webhook
    </span>
  )}

  {/* WebSocket Configurado */}
  {session.config?.websocketConfigured && (
    <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
      📡 WebSocket
    </span>
  )}
</div>
```

---

## 📊 **LAYOUT SUGERIDO**

```
┌─────────────────────────────────────────────────────────┐
│ Instância: vendas-2024                                  │
│ Provider: Evolution API                                 │
│ Status: ✅ Conectado  🔗 Webhook  📡 WebSocket         │
│                                                         │
│ [🔌 Desconectar] [🔄 Reiniciar] [🔗 Webhook]          │
│ [📡 WebSocket] [🗑️ Deletar]                           │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO**

- [ ] Adicionar botões de ação
- [ ] Implementar handlers
- [ ] Adicionar estado de loading
- [ ] Adicionar confirmação de delete
- [ ] Adicionar feedback visual (toasts)
- [ ] Adicionar badges de status
- [ ] Testar todas as funcionalidades
- [ ] Adicionar tratamento de erros
- [ ] Adicionar logs de auditoria (opcional)

---

## 🧪 **COMO TESTAR**

1. **Testar Logout:**

   - Conectar uma instância
   - Clicar em "Desconectar"
   - Verificar se status muda para "STOPPED"

2. **Testar Restart:**

   - Clicar em "Reiniciar"
   - Verificar se novo QR Code aparece

3. **Testar Webhook:**

   - Clicar em "Configurar Webhook"
   - Verificar toast de sucesso
   - Verificar badge "🔗 Webhook"

4. **Testar WebSocket:**

   - Clicar em "Configurar WebSocket"
   - Verificar toast de sucesso
   - Verificar badge "📡 WebSocket"

5. **Testar Delete:**
   - Clicar em "Deletar"
   - Confirmar no modal
   - Verificar se instância some da lista

---

## 🎨 **ESTILOS SUGERIDOS (Tailwind CSS)**

```tsx
// Botão Primário
className =
  "px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors";

// Botão Secundário
className =
  "px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors";

// Botão Perigo
className =
  "px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors";

// Botão Desabilitado
className =
  "px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed opacity-50";

// Badge Status
className = "px-2 py-1 rounded-full text-xs font-medium";

// Modal Overlay
className =
  "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";

// Modal Content
className = "bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4";
```

---

## 🚀 **RESULTADO ESPERADO**

Após a implementação, o painel WhatsApp terá:

1. ✅ Botões de ação para cada instância
2. ✅ Confirmação antes de deletar
3. ✅ Feedback visual (toasts)
4. ✅ Loading states
5. ✅ Badges de status
6. ✅ UX profissional

---

**✅ Guia completo para integração frontend!**

**Próximo passo:** Implementar no código do frontend seguindo este guia.



