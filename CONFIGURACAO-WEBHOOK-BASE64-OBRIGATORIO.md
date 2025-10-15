# ⚙️ Configuração OBRIGATÓRIA - Webhook Base64

## 📅 Data: 8 de outubro de 2025

---

## ⚠️ **IMPORTANTE: URLs DO WHATSAPP NÃO FUNCIONAM**

As URLs que o WhatsApp envia via webhook são **encriptadas** e **temporárias**:

```
❌ NÃO FUNCIONA:
https://mmg.whatsapp.net/v/t62.7118-24/561077498_1306552497591775_5625185873659176423_n.enc?ccb=11-4&oh=01_Q5Aa2wH9...
```

Estas URLs:

- ✖️ São encriptadas (`.enc`)
- ✖️ Expiram rapidamente
- ✖️ Não podem ser acessadas diretamente
- ✖️ Não funcionam fora do WhatsApp

---

## ✅ **SOLUÇÃO: ATIVAR BASE64 NO WEBHOOK**

Para que o sistema funcione corretamente, você **DEVE** configurar a Evolution API para enviar mídias em **Base64**.

### **Por que Base64?**

- ✅ Conversão automática → arquivo local
- ✅ Armazenamento permanente no nosso bucket
- ✅ URL pública válida gerada
- ✅ Sem dependência de URLs externas

---

## 🔧 **COMO CONFIGURAR**

### **1. Via Frontend (Painel de Conexões):**

No painel de Conexões WhatsApp:

1. Selecione a conexão Evolution
2. Clique em "Configurar Webhook"
3. **Ative a opção:** `webhook_base64: true`
4. Salve

### **2. Via API (Backend):**

```typescript
import { evolutionApiService } from "./services/evolutionApiService";

await evolutionApiService.setInstanceWebhook(instanceName, {
  url: "https://seu-backend.com/api/webhooks/evolution",
  webhook_by_events: false,
  webhook_base64: true, // ✅ OBRIGATÓRIO!
  events: [
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
  ],
});
```

### **3. Verificar Configuração:**

```bash
# GET /instance/webhook/:instanceName
curl -X GET "https://evolution-api.com/instance/webhook/sua-instancia" \
  -H "apikey: SUA_API_KEY"

# Resposta esperada:
{
  "url": "https://seu-backend.com/api/webhooks/evolution",
  "webhook_by_events": false,
  "webhook_base64": true,  // ✅ DEVE ESTAR true
  "events": [...]
}
```

---

## 📊 **FLUXO COM BASE64**

### **Com `webhook_base64: true` (✅ CORRETO):**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Cliente envia imagem via WhatsApp                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Evolution API baixa a imagem do WhatsApp                     │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Evolution converte para Base64                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Envia via webhook com Base64 incluído                        │
│    { imageMessage: { base64: "iVBORw0KGgo...", ... } }          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. nosso backend recebe Base64                                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. mediaProcessingService converte Base64 → Arquivo             │
│    Salva em: /uploads/imagem-1759930702480.jpg                  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Gera URL pública válida                                      │
│    http://localhost:3006/uploads/imagem-1759930702480.jpg       │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Salva no banco de dados                                      │
│    Message { mediaUrl: "http://...", type: "IMAGE" }            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. Frontend exibe imagem corretamente                           │
│    <img src="http://localhost:3006/uploads/..." />              │
└─────────────────────────────────────────────────────────────────┘
```

### **Sem `webhook_base64: true` (❌ NÃO FUNCIONA):**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Cliente envia imagem via WhatsApp                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Evolution envia apenas URL encriptada                        │
│    { imageMessage: {                                            │
│      url: "https://mmg.whatsapp.net/.../n.enc?...",             │
│      directPath: "/v/..."                                       │
│    } }                                                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Nosso backend recebe URL encriptada                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ❌ ERRO: URL encriptada não pode ser usada                   │
│    ⚠️ [WebSocket] URL encriptada do WhatsApp não pode ser usada │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ❌ Mídia NÃO é salva                                         │
│    ❌ Frontend NÃO exibe a imagem                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔍 **LOGS DO SISTEMA**

### **✅ Com Base64 (CORRETO):**

```bash
🖼️ [WebSocket] Imagem em Base64 recebida, convertendo...
✅ [MediaProcessing] Arquivo Base64 salvo: imagem-1759930702480.jpg (IMAGE)
✅ [WebSocket] Imagem salva localmente: http://localhost:3006/uploads/imagem-1759930702480.jpg
📤 [WebSocket] Criando mensagem no banco: chatId=..., type=IMAGE
✅ [WebSocket] Mensagem criada no banco: ...
📡 Evento 'chat:message' enviado para tenant ...
```

### **❌ Sem Base64 (INCORRETO):**

```bash
⚠️ [WebSocket] Imagem sem Base64 - Configure webhook_base64: true na Evolution API
⚠️ [WebSocket] URL encriptada do WhatsApp não pode ser usada: https://mmg.whatsapp.net/v/t62.7118-24/561077498_13065524975...
❌ Mídia não será salva no sistema
```

---

## 🛠️ **TROUBLESHOOTING**

### **Problema: Mídias não aparecem no chat**

**Verificar:**

1. ✅ `webhook_base64: true` está ativado?
2. ✅ Webhook está configurado corretamente?
3. ✅ Evolution API está recebendo as mensagens?
4. ✅ Backend está processando os webhooks?

**Solução:**

```bash
# 1. Verificar configuração do webhook
GET /instance/webhook/:instanceName

# 2. Se webhook_base64 = false, atualizar:
POST /instance/webhook/:instanceName
{
  "url": "https://seu-backend.com/api/webhooks/evolution",
  "webhook_base64": true
}

# 3. Reiniciar a instância (opcional)
PUT /instance/restart/:instanceName
```

---

### **Problema: "URL encriptada não pode ser usada"**

**Causa:** `webhook_base64: false` ou não configurado

**Solução:**

```typescript
// Ativar Base64
await evolutionApiService.setInstanceWebhook(instanceName, {
  url: "https://seu-backend.com/api/webhooks/evolution",
  webhook_base64: true, // ✅ Ativar!
});
```

---

### **Problema: Base64 muito grande (erro de timeout)**

**Causa:** Vídeos grandes podem gerar Base64 > 50MB

**Solução 1: Aumentar limite no backend**

```typescript
// backend/src/server.ts
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
```

**Solução 2: Configurar compressão na Evolution**

```typescript
// Configurações da instância
{
  "webhook_base64": true,
  "reject_call": true,
  "msg_call": "",
  "groups_ignore": true,
  "always_online": false,
  "read_messages": false,
  "read_status": false,
  "sync_full_history": false,
  "webhook_compress": true  // ✅ Ativar compressão
}
```

---

## 📊 **BENEFÍCIOS DO BASE64**

### **Para o Sistema:**

- ✅ **Armazenamento permanente** - Arquivos não expiram
- ✅ **Controle total** - Gerenciamos os arquivos
- ✅ **Backup fácil** - Todos os arquivos em `/uploads`
- ✅ **Sem dependências** - Não depende de URLs externas

### **Para os Usuários:**

- ✅ **Mídias sempre disponíveis** - Funcionam sempre
- ✅ **Preview rápido** - Carregamento local
- ✅ **Sem erros** - URLs sempre válidas
- ✅ **Histórico completo** - Todas as mídias salvas

---

## 🚀 **PRÓXIMOS PASSOS**

### **1. Verificar Todas as Conexões:**

```sql
-- Verificar quais instâncias têm Base64 ativado
SELECT
  name,
  status,
  provider
FROM whatsapp_sessions
WHERE provider = 'EVOLUTION'
  AND status = 'CONNECTED';
```

### **2. Configurar Todas as Instâncias:**

```typescript
// Script para configurar todas as instâncias
const instances = await prisma.whatsAppSession.findMany({
  where: {
    provider: "EVOLUTION",
    status: "CONNECTED",
  },
});

for (const instance of instances) {
  await evolutionApiService.setInstanceWebhook(instance.name, {
    url: `${process.env.BACKEND_URL}/api/webhooks/evolution`,
    webhook_base64: true,
    webhook_by_events: false,
    events: [
      "QRCODE_UPDATED",
      "CONNECTION_UPDATE",
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE",
    ],
  });

  console.log(`✅ Webhook configurado para: ${instance.name}`);
}
```

### **3. Monitorar Logs:**

```bash
# Verificar se mídias estão sendo salvas corretamente
tail -f logs/backend.log | grep "MediaProcessing"

# Deve mostrar:
# ✅ [MediaProcessing] Arquivo Base64 salvo: imagem-123.jpg (IMAGE)
# ✅ [MediaProcessing] Arquivo Base64 salvo: audio-456.ogg (AUDIO)
```

---

## ✨ **RESULTADO FINAL**

**Com `webhook_base64: true` configurado:**

✅ **Todas as mídias são convertidas automaticamente**
✅ **Arquivos salvos permanentemente em `/uploads`**
✅ **URLs públicas válidas geradas**
✅ **Sistema 100% funcional**
✅ **Preview de mídias no chat**
✅ **Sem erros de URLs encriptadas**

**Sistema pronto para produção!** 🎯






