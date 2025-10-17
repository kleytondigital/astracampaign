# 🧪 Guia de Teste - Sistema Webhook + WebSocket

## 📅 Data: 7 de outubro de 2025

---

## 🚀 **COMO TESTAR O SISTEMA**

### **Pré-requisitos**

```bash
# Certifique-se de que está no diretório do backend
cd E:\B2X-Disparo\campaign\backend

# Backend deve estar rodando
npm run dev
```

---

## 1️⃣ **TESTAR CONFIGURAÇÃO DE WEBHOOK (Evolution)**

### **Via REST API:**

```bash
# 1. Configurar webhook para uma instância
curl -X POST http://localhost:3001/api/webhook-management/evolution/minha-instancia \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3001/api/webhooks/whatsapp",
    "webhookByEvents": false,
    "events": ["MESSAGES_UPSERT", "CONNECTION_UPDATE", "QRCODE_UPDATED"]
  }'

# 2. Verificar configuração
curl -X GET http://localhost:3001/api/webhook-management/evolution/minha-instancia \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# 3. Listar eventos disponíveis
curl -X GET http://localhost:3001/api/webhook-management/evolution/events \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# 4. Remover webhook
curl -X DELETE http://localhost:3001/api/webhook-management/evolution/minha-instancia \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### **Via Código TypeScript:**

```typescript
import { evolutionApiService } from "./services/evolutionApiService";
import { EvolutionWebhookEvent } from "./types/webhook.types";

// Configurar webhook
const result = await evolutionApiService.setWebhook("minha-instancia", {
  url: "http://localhost:3001/api/webhooks/whatsapp",
  webhookByEvents: false,
  events: [
    EvolutionWebhookEvent.MESSAGES_UPSERT,
    EvolutionWebhookEvent.CONNECTION_UPDATE,
    EvolutionWebhookEvent.QRCODE_UPDATED,
  ],
});

console.log("✅ Webhook configurado:", result);

// Buscar configuração
const { webhook } = await evolutionApiService.getWebhook("minha-instancia");
console.log("📋 Configuração atual:", webhook);
```

---

## 2️⃣ **TESTAR CONFIGURAÇÃO DE WEBHOOK (WAHA)**

### **Via REST API:**

```bash
# 1. Configurar webhook para uma sessão
curl -X POST http://localhost:3001/api/webhook-management/waha/minha-sessao \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://localhost:3001/api/webhooks/whatsapp",
    "events": ["message", "message.ack"],
    "retries": 3
  }'

# 2. Verificar configuração
curl -X GET http://localhost:3001/api/webhook-management/waha/minha-sessao \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# 3. Listar eventos disponíveis
curl -X GET http://localhost:3001/api/webhook-management/waha/events \
  -H "Authorization: Bearer SEU_TOKEN_JWT"

# 4. Remover webhook
curl -X DELETE http://localhost:3001/api/webhook-management/waha/minha-sessao \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### **Via Código TypeScript:**

```typescript
import {
  setWebhook,
  getWebhook,
  deleteWebhook,
} from "./services/wahaApiService";
import { WahaWebhookEvent } from "./types/webhook.types";

// Configurar webhook
const result = await setWebhook("minha-sessao", {
  url: "http://localhost:3001/api/webhooks/whatsapp",
  events: [WahaWebhookEvent.MESSAGE, WahaWebhookEvent.MESSAGE_ACK],
  retries: 3,
  hmac: null,
});

console.log("✅ Webhook WAHA configurado:", result);

// Buscar configuração
const { webhook } = await getWebhook("minha-sessao");
console.log("📋 Configuração atual:", webhook);
```

---

## 3️⃣ **TESTAR WEBSOCKET (Frontend)**

### **Criar arquivo de teste HTML:**

```html
<!-- test-websocket.html -->
<!DOCTYPE html>
<html>
  <head>
    <title>Teste WebSocket WhatsApp</title>
    <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
  </head>
  <body>
    <h1>Teste WebSocket WhatsApp</h1>
    <div id="log"></div>

    <script>
      const socket = io("http://localhost:3001");

      const log = (msg) => {
        const div = document.getElementById("log");
        div.innerHTML += `<p>${new Date().toLocaleTimeString()}: ${msg}</p>`;
        console.log(msg);
      };

      // Conectar
      socket.on("connect", () => {
        log("✅ Conectado ao servidor WebSocket");

        // Autenticar
        socket.emit("authenticate", {
          token: "SEU_TOKEN_JWT",
          tenantId: "SEU_TENANT_ID",
        });

        // Inscrever em instância
        socket.emit("subscribe:instance", "minha-instancia");
        log("📡 Inscrito na instância: minha-instancia");
      });

      // Escutar eventos
      socket.on("whatsapp:connection_update", (payload) => {
        log(`📱 Conexão atualizada: ${payload.data.state}`);
        console.log("Payload completo:", payload);
      });

      socket.on("whatsapp:qrcode_updated", (payload) => {
        log("🔲 QR Code atualizado");
        console.log("QR Code:", payload.data.qr);
      });

      socket.on("whatsapp:message_received", (payload) => {
        log("📨 Nova mensagem recebida");
        console.log("Mensagem:", payload.data);
      });

      socket.on("whatsapp:message_ack", (payload) => {
        log(`✅ ACK recebido: ${payload.data.ack}`);
      });

      socket.on("whatsapp:status_instance", (payload) => {
        log(`📊 Status da instância: ${payload.data.status}`);
      });

      socket.on("disconnect", () => {
        log("❌ Desconectado do servidor");
      });
    </script>
  </body>
</html>
```

### **Abrir no navegador:**

```bash
# Abrir o arquivo no navegador
start test-websocket.html
```

---

## 4️⃣ **TESTAR RECEBIMENTO DE WEBHOOK**

### **Simular webhook Evolution:**

```bash
# Enviar webhook simulado
curl -X POST http://localhost:3001/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "minha-instancia",
    "data": {
      "key": {
        "remoteJid": "5511999999999@s.whatsapp.net",
        "fromMe": false,
        "id": "3EB0123456789"
      },
      "message": {
        "conversation": "Olá, teste de webhook!"
      },
      "messageType": "conversation",
      "messageTimestamp": 1696723200
    }
  }'
```

### **Simular webhook WAHA:**

```bash
# Enviar webhook simulado
curl -X POST http://localhost:3001/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message",
    "session": "minha-sessao",
    "payload": {
      "id": "true_5511999999999@c.us_3EB0123456789",
      "timestamp": 1696723200,
      "from": "5511999999999@c.us",
      "fromMe": false,
      "body": "Olá, teste de webhook WAHA!",
      "type": "chat"
    }
  }'
```

---

## 5️⃣ **VERIFICAR LOGS DO SERVIDOR**

### **Console do backend deve mostrar:**

```
✅ WhatsApp WebSocket Service inicializado
📨 Webhook WhatsApp recebido:
{
  "event": "messages.upsert",
  "instance": "minha-instancia",
  ...
}
📞 Telefone normalizado: +5511999999999
✅ Chat existente encontrado: abc123
✅ Mensagem salva no chat abc123
📡 WebSocket emitido para tenant:tenant-id:chat:new-message
📨 Nova mensagem recebida - minha-instancia
```

---

## 6️⃣ **VERIFICAR ESTATÍSTICAS**

### **Via código TypeScript:**

```typescript
import { whatsappWebSocketService } from "./services/whatsappWebSocketService";

const stats = whatsappWebSocketService.getStats();

console.log("📊 Estatísticas:");
console.log("- Clientes conectados:", stats.connectedClients);
console.log("- Eventos na fila:", stats.queuedEvents);
console.log("- Conexões ativas:", stats.activeConnections);
```

---

## 7️⃣ **CENÁRIOS DE TESTE**

### **Cenário 1: Criar instância com webhook**

```typescript
const instance = await evolutionApiService.createInstanceWithWebhook(
  "teste-webhook",
  {
    url: "http://localhost:3001/api/webhooks/whatsapp",
    webhookByEvents: false,
  }
);

console.log("✅ Instância criada:", instance.instance.instanceName);
```

### **Cenário 2: Receber QR Code atualizado**

1. Criar instância
2. Conectar frontend WebSocket
3. Aguardar evento `whatsapp:qrcode_updated`
4. Exibir QR Code na tela

### **Cenário 3: Receber mensagem**

1. Enviar mensagem para o WhatsApp
2. Verificar webhook recebido no console
3. Verificar evento WebSocket emitido
4. Frontend deve receber `whatsapp:message_received`

### **Cenário 4: Reconexão automática**

1. Conectar WebSocket
2. Forçar desconexão (parar servidor)
3. Reiniciar servidor
4. Verificar reconexão automática

---

## 🔍 **CHECKLIST DE TESTE**

- [ ] Configurar webhook Evolution via REST API
- [ ] Configurar webhook WAHA via REST API
- [ ] Buscar configuração de webhook
- [ ] Listar eventos disponíveis
- [ ] Remover webhook
- [ ] Conectar WebSocket frontend
- [ ] Autenticar WebSocket
- [ ] Inscrever em instância
- [ ] Simular webhook Evolution
- [ ] Simular webhook WAHA
- [ ] Verificar logs do servidor
- [ ] Verificar eventos recebidos no frontend
- [ ] Verificar estatísticas do serviço
- [ ] Testar reconexão automática
- [ ] Criar instância com webhook automático

---

## ✅ **RESULTADO ESPERADO**

Ao seguir todos os passos acima, você deve:

1. ✅ Configurar webhooks com sucesso
2. ✅ Receber confirmação via REST API
3. ✅ Conectar WebSocket no frontend
4. ✅ Receber eventos em tempo real
5. ✅ Ver logs detalhados no console
6. ✅ Verificar estatísticas do serviço

---

## 🐛 **TROUBLESHOOTING**

### **Erro: "Tenant não identificado"**

- Certifique-se de enviar token JWT válido
- Verifique se o usuário tem `tenantId`

### **Erro: "Sessão não encontrada"**

- Certifique-se de que a sessão existe no banco
- Verifique o nome da sessão/instância

### **WebSocket não conecta**

- Verifique se o servidor está rodando
- Verifique CORS no `server.ts`
- Verifique URL de conexão

### **Webhook não é recebido**

- Verifique URL configurada
- Verifique se Evolution/WAHA está enviando
- Verifique logs do servidor

---

**✅ Sistema pronto para testes!**

**Próximo passo:** Execute os testes acima e verifique se tudo funciona conforme esperado.







