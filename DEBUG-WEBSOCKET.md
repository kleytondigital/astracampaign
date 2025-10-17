# 🐛 DEBUG - WebSocket e Sincronização

## 📅 Data: 7 de outubro de 2025, 02:45

---

## 🎯 **PROBLEMA RELATADO**

- Sincronização de chats não está funcionando
- Tempo real (WebSocket) não está recebendo eventos

---

## 🔍 **LOGS ADICIONADOS**

### **1. Controller de Sincronização** (`chatsController.ts`)

**Logs adicionados:**

- ✅ Início da sincronização com todos os parâmetros
- ✅ Busca de sessão no banco
- ✅ Validação de provider
- ✅ Resultado do `findChats()`
- ✅ Loop de sincronização (cada chat)
- ✅ Verificação se chat existe
- ✅ Criação de novo chat
- ✅ Total sincronizado

**Como visualizar:**

```bash
# No terminal do backend, você verá:
🔄 [SYNC] ========== INICIANDO SINCRONIZAÇÃO ==========
🔄 [SYNC] Instância: oficina_e9f2ed4d
🔄 [SYNC] Tenant ID: xxx-xxx-xxx
🔄 [SYNC] User Role: ADMIN
```

---

### **2. WebSocket Client** (`evolutionWebSocketClient.ts`)

**Logs já existentes:**

- ✅ Conexão ao WebSocket
- ✅ Socket ID
- ✅ Todos os eventos recebidos
- ✅ Processamento de mensagens
- ✅ Criação de chats automática

**Como visualizar:**

```bash
# No terminal do backend:
🔌 [WebSocket] Conectando à instância: oficina_e9f2ed4d
✅ [WebSocket] Conectado: oficina_e9f2ed4d
📨 [WebSocket] MESSAGES_UPSERT: { ... }
```

---

### **3. Inicialização do Servidor** (`server.ts`)

**Logs já existentes:**

```bash
🔌 [Evolution WebSocket] Buscando instâncias ativas...
📡 [Evolution WebSocket] Encontradas X instâncias ativas
```

---

## 🧪 **PASSOS PARA DEBUG**

### **Passo 1: Verificar se backend está rodando**

```bash
cd E:\B2X-Disparo\campaign\backend
npm run dev
```

**O que procurar:**

- ✅ `Server running on port 3001`
- ✅ `🔌 [Evolution WebSocket] Buscando instâncias ativas...`
- ✅ Sem erros de compilação

---

### **Passo 2: Testar sincronização manual**

**No frontend:**

1. Acesse: `http://localhost:3006/atendimento`
2. Digite: `oficina_e9f2ed4d` (nome da instância)
3. Clique em "🔄 Sync"

**No terminal do backend, procure:**

```bash
🔄 [SYNC] ========== INICIANDO SINCRONIZAÇÃO ==========
🔄 [SYNC] Instância: oficina_e9f2ed4d
🔍 [SYNC] Buscando sessão WhatsApp...
✅ [SYNC] Sessão encontrada: { ... }
📡 [SYNC] Chamando evolutionApiService.findChats()...
```

**Possíveis problemas:**

- ❌ `Sessão não encontrada` → Verificar se instância existe no banco
- ❌ `Provider inválido` → Verificar se provider é `EVOLUTION`
- ❌ `Nenhum chat encontrado` → Verificar se Evolution API retornou chats

---

### **Passo 3: Verificar Evolution API diretamente**

**Teste com curl:**

```bash
curl --location --request POST 'https://evo.usezap.com.br/chat/findChats/oficina_e9f2ed4d' \
--header 'apikey: wtwHLYfFxI9n1zDR8zFFqNq8kVaWqdD2oLpcjVmXxX'
```

**Resposta esperada:**

```json
[
  {
    "id": "cmgh6dhy21905v7iu7rjq3dbx",
    "remoteJid": "556295473360@s.whatsapp.net",
    "name": "Oficina Da Tv",
    "unreadMessages": 3,
    ...
  }
]
```

**Se não retornar chats:**

- ❌ Instância não tem conversas ativas
- ❌ API Key incorreta
- ❌ Nome da instância incorreto

---

### **Passo 4: Verificar WebSocket**

**No terminal do backend, procure:**

```bash
🔌 [WebSocket] Conectando à instância: oficina_e9f2ed4d
📡 [WebSocket] Host: https://evo.usezap.com.br
✅ [WebSocket] Conectado: oficina_e9f2ed4d
🆔 [WebSocket] Socket ID: abc123xyz
```

**Se NÃO aparecer:**

1. Verificar `.env`:

   ```bash
   EVOLUTION_HOST=https://evo.usezap.com.br
   EVOLUTION_API_KEY=wtwHLYfFxI9n1zDR8zFFqNq8kVaWqdD2oLpcjVmXxX
   ```

2. Verificar status da instância no banco:

   ```sql
   SELECT name, status, provider FROM "WhatsAppSession"
   WHERE name = 'oficina_e9f2ed4d';
   ```

3. Status deve ser `WORKING` ou `INITIALIZING`

---

### **Passo 5: Testar recepção de mensagem**

**Envie uma mensagem pelo WhatsApp para o número da instância**

**No terminal do backend, procure:**

```bash
📨 [WebSocket] MESSAGES_UPSERT: {
  "messages": [{
    "key": {
      "remoteJid": "556295473360@s.whatsapp.net",
      ...
    },
    "message": {
      "conversation": "teste"
    }
  }]
}
✅ [WebSocket] Chat criado automaticamente: 556295473360@s.whatsapp.net
✅ [WebSocket] Mensagem sincronizada: MSG_ID
```

**Se NÃO aparecer:**

- ❌ WebSocket não está conectado
- ❌ Webhook da Evolution não está configurado
- ❌ Eventos não estão chegando ao WebSocket

---

### **Passo 6: Verificar no banco de dados**

```sql
-- Ver chats criados
SELECT * FROM "Chat"
WHERE "tenantId" = 'seu-tenant-id'
ORDER BY "lastMessageAt" DESC
LIMIT 10;

-- Ver mensagens
SELECT * FROM "Message"
WHERE "tenantId" = 'seu-tenant-id'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Ver sessões WhatsApp
SELECT name, provider, status, "tenantId"
FROM "WhatsAppSession";
```

---

## ❓ **TROUBLESHOOTING**

### **Problema 1: Sincronização não cria chats**

**Possíveis causas:**

1. Evolution API não retorna chats
2. TenantId não corresponde
3. Chats já existem no banco

**Verificar:**

```bash
# Logs devem mostrar:
📊 [SYNC] Resultado findChats: { success: true, totalChats: 5 }
➡️  [SYNC] Processando chat: 556295473360@s.whatsapp.net
📝 [SYNC] Criando novo chat: { ... }
✅ [SYNC] Chat criado com sucesso! ID: xxx
```

---

### **Problema 2: WebSocket não conecta**

**Possíveis causas:**

1. `.env` não configurado
2. Instância não está `WORKING`
3. Host/API Key incorretos

**Verificar:**

```bash
# Backend deve mostrar:
🔌 [Evolution WebSocket] Buscando instâncias ativas...
📡 [Evolution WebSocket] Encontradas 1 instâncias ativas
✅ [WebSocket] Conectado: oficina_e9f2ed4d
```

---

### **Problema 3: Mensagens não chegam em tempo real**

**Possíveis causas:**

1. WebSocket não está conectado
2. Eventos não estão configurados
3. Frontend não está escutando Socket.IO

**Verificar:**

```bash
# Envie mensagem e verifique logs:
📨 [WebSocket] MESSAGES_UPSERT: { ... }
✅ [WebSocket] Mensagem sincronizada: MSG_ID
```

---

## 📊 **CHECKLIST DE VERIFICAÇÃO**

- [ ] Backend rodando na porta 3001
- [ ] `.env` com `EVOLUTION_HOST` e `EVOLUTION_API_KEY`
- [ ] Instância existe no banco e está `WORKING`
- [ ] Evolution API retorna chats no curl
- [ ] Logs de sincronização aparecem ao clicar "Sync"
- [ ] WebSocket conecta ao iniciar backend
- [ ] Logs de eventos aparecem ao receber mensagem
- [ ] Chats são criados no banco de dados
- [ ] Frontend mostra chats na lista

---

## 🔧 **COMANDOS ÚTEIS**

### **Reiniciar Backend:**

```bash
# Parar (Ctrl+C)
# Iniciar novamente
cd E:\B2X-Disparo\campaign\backend
npm run dev
```

### **Limpar Console:**

```bash
# Windows PowerShell
cls

# Bash/Linux
clear
```

### **Ver Logs em Tempo Real:**

```bash
# Backend já mostra logs no console
# Não é necessário configuração adicional
```

---

## 📝 **PRÓXIMOS PASSOS APÓS DEBUG**

1. **Se sincronização funciona mas tempo real não:**

   - Verificar configuração de WebSocket
   - Verificar eventos da Evolution
   - Testar com mensagem real

2. **Se nada funciona:**

   - Compartilhar logs completos
   - Verificar credenciais Evolution
   - Testar Evolution API diretamente

3. **Se tudo funciona:**
   - Remover logs excessivos (opcional)
   - Implementar frontend em tempo real
   - Adicionar notificações

---

**Implementado por:** AI Assistant  
**Data:** 7 de outubro de 2025, 02:45  
**Status:** ✅ LOGS ADICIONADOS  
**Aguardando:** Testes do usuário

---

**🐛 DEBUG LOGS IMPLEMENTADOS! AGUARDANDO TESTES... 🔍**







