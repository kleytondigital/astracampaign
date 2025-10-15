# 🧪 Guia de Teste - Chat de Atendimento WhatsApp

## 📅 Data: 7 de outubro de 2025

---

## 🎯 **OBJETIVO**

Testar todo o fluxo de chat de atendimento com WhatsApp real, incluindo:

- ✅ Configuração automática de webhooks
- ✅ Recebimento de mensagens via webhook
- ✅ Criação automática de leads
- ✅ Envio de mensagens
- ✅ Atualização em tempo real (WebSocket)

---

## ⚙️ **PRÉ-REQUISITOS**

### **1. Ambiente Configurado:**

```bash
# Backend rodando
cd backend
npm run dev

# Frontend rodando
cd frontend
npm run dev
```

### **2. Variáveis de Ambiente:**

Adicione no `backend/.env`:

```env
# URL pública para webhooks (use ngrok em desenvolvimento)
PUBLIC_URL=https://seu-dominio-ngrok.ngrok.io

# WAHA API (se estiver usando)
WAHA_HOST=http://localhost:3000
WAHA_API_KEY=sua_api_key_aqui

# Evolution API (se estiver usando)
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_api_key_aqui
```

### **3. Ngrok ou Túnel Público (para desenvolvimento):**

O webhook precisa de uma URL pública acessível. Use ngrok:

```bash
# Instalar ngrok
npm install -g ngrok

# Criar túnel para o backend (porta 3001)
ngrok http 3001

# Copiar a URL gerada (ex: https://abc123.ngrok.io)
# Adicionar no .env como PUBLIC_URL
```

---

## 📋 **PASSO A PASSO DE TESTE**

### **ETAPA 1: Conectar WhatsApp** ✅

1. Acesse: `http://localhost:3006/whatsapp`
2. Clique em **"Nova Sessão"**
3. Digite um nome (ex: `atendimento`)
4. Escolha o provider (WAHA ou Evolution)
5. Clique em **"Conectar"**
6. Escaneie o QR Code com WhatsApp
7. Aguarde status mudar para **"WORKING"** (✅ Conectado)

---

### **ETAPA 2: Configurar Webhook Automaticamente** ✅ **NOVIDADE!**

#### **Opção A: Via Interface (Recomendado)**

1. Na página `/whatsapp`, localize a sessão conectada
2. Clique no botão **"🔗 Webhook"** (roxo)
3. Aguarde confirmação: **"Webhook configurado com sucesso!"**
4. A URL será exibida no toast (ex: `https://abc123.ngrok.io/api/webhooks/whatsapp`)

#### **Opção B: Via API Manual**

```bash
# Obter ID da sessão
curl http://localhost:3001/api/whatsapp/sessions \
  -H "Authorization: Bearer SEU_TOKEN"

# Configurar webhook
curl -X POST http://localhost:3001/api/webhook-management/sessions/{sessionId}/webhook/configure \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### **Opção C: Configurar Todos de Uma Vez**

```bash
curl -X POST http://localhost:3001/api/webhook-management/configure-all \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### **ETAPA 3: Verificar Configuração do Webhook** ✅

#### **WAHA API:**

```bash
# Listar webhooks configurados
curl http://localhost:3000/api/{session}/webhooks \
  -H "X-Api-Key: SEU_API_KEY"

# Resposta esperada:
[
  {
    "url": "https://abc123.ngrok.io/api/webhooks/whatsapp",
    "events": ["message", "message.ack", "session.status"]
  }
]
```

#### **Evolution API:**

- Acesse o painel: `http://localhost:8080`
- Vá em: **Instâncias → Sua Instância → Webhook**
- Verifique se a URL está configurada

---

### **ETAPA 4: Testar Recebimento de Mensagens** 🔥

1. **Envie uma mensagem WhatsApp** de outro número para o número conectado
2. **Verifique os logs do backend:**

   ```
   📨 Webhook WhatsApp recebido: {
     "event": "message",
     "session": "atendimento",
     "payload": {
       "from": "5511999990001@c.us",
       "body": "Olá!",
       "fromMe": false
     }
   }
   ```

3. **O sistema deve:**

   - ✅ Identificar tenant pela sessão
   - ✅ Criar/atualizar Chat
   - ✅ Salvar Message no banco
   - ✅ **Criar Lead automaticamente** (se número novo)
   - ✅ Emitir WebSocket para frontend
   - ✅ Notificar via toast

4. **Verifique o frontend:**
   - Acesse: `http://localhost:3006/atendimento`
   - A conversa deve aparecer automaticamente na lista
   - A mensagem deve estar visível
   - Contador de não lidos deve aparecer
   - Som de notificação deve tocar

---

### **ETAPA 5: Testar Envio de Mensagens** 🚀

1. No frontend (`/atendimento`), clique em uma conversa
2. Digite uma mensagem no input
3. Clique em **"Enviar"**
4. **Verifique:**
   - ✅ Mensagem aparece no chat (bolha azul, à direita)
   - ✅ Indicador de entrega (⏱ → ✓ → ✓✓)
   - ✅ A mensagem chega no WhatsApp do destinatário
   - ✅ Logs do backend mostram envio via WAHA/Evolution

---

### **ETAPA 6: Testar Criação Automática de Leads** 🎯

1. **Envie mensagem de um NÚMERO NOVO** (que não existe no banco)
2. **Verifique os logs do backend:**

   ```
   ✅ Lead criado automaticamente: Lead 0001
   ✅ Novo chat criado: chat-id-123
   📡 WebSocket emitido para tenant:xxx:chat:new-message
   ```

3. **No frontend:**

   - Conversa aparece com badge roxo **"LEAD"**
   - Score inicial: 50
   - Status: NEW

4. **Verifique o banco de dados:**

   ```sql
   -- Ver leads criados
   SELECT * FROM leads WHERE source = 'WHATSAPP_CAMPAIGN' ORDER BY created_at DESC LIMIT 5;

   -- Ver chats vinculados
   SELECT * FROM chats WHERE lead_id IS NOT NULL ORDER BY created_at DESC LIMIT 5;
   ```

---

### **ETAPA 7: Testar WebSocket em Tempo Real** ⚡

1. **Abra 2 navegadores/abas:**

   - Aba 1: `/atendimento` (logado como ADMIN)
   - Aba 2: `/atendimento` (logado como outro usuário ou mesma conta)

2. **Envie uma mensagem WhatsApp** do seu celular

3. **Verifique:**
   - ✅ Ambas as abas atualizam automaticamente
   - ✅ Lista de conversas se reordena
   - ✅ Contador de não lidos aumenta
   - ✅ Som toca nas duas abas
   - ✅ Toast de notificação aparece

---

### **ETAPA 8: Testar Permissões por Role** 🔐

#### **SUPERADMIN:**

```bash
# Ver todos os chats de todos os tenants
curl http://localhost:3001/api/chats \
  -H "Authorization: Bearer TOKEN_SUPERADMIN"
```

#### **ADMIN/USER:**

```bash
# Ver apenas chats do próprio tenant
curl http://localhost:3001/api/chats \
  -H "Authorization: Bearer TOKEN_ADMIN"
```

---

## 🐛 **TROUBLESHOOTING**

### **Problema 1: Webhook não está recebendo mensagens**

**Solução:**

```bash
# 1. Verificar se o ngrok está rodando
ngrok http 3001

# 2. Verificar PUBLIC_URL no .env
echo $PUBLIC_URL

# 3. Reconfigurar webhook
curl -X POST http://localhost:3001/api/webhook-management/sessions/{sessionId}/webhook/configure \
  -H "Authorization: Bearer TOKEN"

# 4. Verificar logs do backend
# Deve aparecer: "✅ Webhook configurado com sucesso"
```

### **Problema 2: Lead não está sendo criado**

**Verificar:**

1. Telefone já existe como contato?
   ```sql
   SELECT * FROM contacts WHERE telefone = '+5511999990001';
   ```
2. Lead já foi criado anteriormente?
   ```sql
   SELECT * FROM leads WHERE phone = '+5511999990001';
   ```
3. Webhook está funcionando?
   - Verificar logs: `📨 Webhook WhatsApp recebido`

### **Problema 3: WebSocket não está atualizando**

**Verificar:**

1. WebSocket está conectado?
   - Console do navegador: `✅ WebSocket conectado!`
2. Tenant ID está correto?
   - Logs backend: `👂 Escutando evento: tenant:xxx:chat:new-message`
3. Frontend está escutando?
   - Console: `📨 Nova mensagem recebida via WebSocket`

---

## ✅ **CHECKLIST DE TESTES**

### **Backend:**

- [ ] Webhook recebe mensagens de WAHA
- [ ] Webhook recebe mensagens de Evolution
- [ ] Chat é criado automaticamente
- [ ] Message é salva no banco
- [ ] Lead é criado automaticamente (número novo)
- [ ] WebSocket emite evento correto
- [ ] Notificação CRM é criada

### **Frontend:**

- [ ] Lista de conversas atualiza em tempo real
- [ ] Mensagem aparece no chat ativo
- [ ] Som de notificação toca
- [ ] Toast de notificação aparece
- [ ] Contador de não lidos funciona
- [ ] Envio de mensagens funciona
- [ ] Indicador de entrega (ACK) funciona

### **Integração:**

- [ ] Webhook configurado automaticamente
- [ ] Mensagens chegam via WAHA
- [ ] Mensagens chegam via Evolution
- [ ] Envio funciona via WAHA
- [ ] Envio funciona via Evolution
- [ ] Leads são criados corretamente
- [ ] Admins recebem notificação de novos leads

---

## 📊 **MÉTRICAS DE SUCESSO**

**Critérios de Aprovação:**

- ✅ 100% das mensagens WhatsApp recebidas aparecem no sistema
- ✅ 100% das mensagens enviadas pelo sistema chegam no WhatsApp
- ✅ Leads são criados automaticamente em < 1 segundo
- ✅ WebSocket atualiza frontend em < 500ms
- ✅ Webhook configurado com 1 clique
- ✅ Zero erros no console

---

## 🚀 **PRÓXIMOS PASSOS APÓS TESTES**

1. ✅ Marcar TODOs de teste como concluídos
2. ✅ Documentar issues encontrados
3. ✅ Implementar botões rápidos CRM
4. ✅ Deploy em produção
5. ✅ Configurar webhooks de produção

---

**🎉 BOA SORTE NOS TESTES!**

**Qualquer problema, verifique:**

1. Logs do backend (`npm run dev`)
2. Console do navegador (F12)
3. Logs do ngrok (`http://localhost:4040`)
4. Painel WAHA/Evolution






