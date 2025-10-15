# 🌐 Configuração Ngrok para Desenvolvimento

## 📅 Data: 8 de outubro de 2025

---

## 🎯 **PROBLEMA**

Em desenvolvimento local (`localhost`), a Evolution API não consegue:

- ❌ Acessar `http://localhost:3006/uploads/imagem.jpg`
- ❌ Baixar arquivos do nosso servidor local
- ❌ Receber webhooks no localhost

**Solução:** Usar **ngrok** para expor o localhost com URL pública válida

---

## ✅ **CONFIGURAÇÕES APLICADAS**

### **1. Frontend - Vite Config** ✅

**Arquivo:** `frontend/vite.config.ts`

**Adicionado `allowedHosts`:**

```typescript
export default defineConfig({
  server: {
    port: 3006,
    host: true,
    allowedHosts: [
      "localhost",
      "interjectural-woaded-shavonda.ngrok-free.dev", // Seu domínio ngrok
      ".ngrok-free.dev", // Qualquer subdomínio ngrok-free.dev
      ".ngrok.io", // Qualquer subdomínio ngrok.io
    ],
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

---

### **2. Backend - Variáveis de Ambiente** ✅

**Arquivo:** `backend/.env`

**Adicionado configurações ngrok:**

```env
# URL pública do backend via ngrok
BACKEND_URL=https://interjectural-woaded-shavonda.ngrok-free.dev

# Origens permitidas para CORS
ALLOWED_ORIGINS=https://interjectural-woaded-shavonda.ngrok-free.dev,http://localhost:3006,http://localhost:3000
```

---

### **3. Sistema de Conversão Base64** ✅

**Arquivo:** `backend/src/services/evolutionMessageService.ts`

**Lógica de detecção atualizada:**

```typescript
// Detecta URLs locais
const isLocalUrl =
  url.includes("localhost") ||
  url.startsWith("http://192.168.") ||
  url.startsWith("http://10.");

// Se local → converte para Base64
// Se público (ngrok) → usa URL diretamente
```

---

## 🚀 **COMO USAR**

### **1. Iniciar Ngrok:**

```bash
# Expor porta 3006 (frontend)
ngrok http 3006

# Ngrok retornará algo como:
# Forwarding: https://interjectural-woaded-shavonda.ngrok-free.dev -> http://localhost:3006
```

### **2. Atualizar Configurações:**

```bash
# Atualizar backend/.env com o domínio ngrok
BACKEND_URL=https://seu-dominio.ngrok-free.dev

# Atualizar frontend/vite.config.ts
allowedHosts: [
  'seu-dominio.ngrok-free.dev',
  '.ngrok-free.dev'
]
```

### **3. Reiniciar Serviços:**

```bash
# Backend
cd backend
npm run dev

# Frontend (nova janela)
cd frontend
npm run dev
```

### **4. Testar:**

```bash
# Acessar via ngrok
https://seu-dominio.ngrok-free.dev

# Fazer upload de imagem
# URL gerada: https://seu-dominio.ngrok-free.dev/uploads/imagem-123.jpg

# Evolution API consegue acessar! ✅
```

---

## 🔄 **FLUXO COM NGROK**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Upload de arquivo                                             │
│    URL: https://seu-dominio.ngrok-free.dev/uploads/imagem.jpg    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Sistema detecta: NÃO é localhost                             │
│    (contém ngrok, não localhost)                                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Envia URL diretamente para Evolution API                     │
│    { media: "https://seu-dominio.ngrok-free.dev/uploads/..." }  │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Evolution API acessa o ngrok                                  │
│    ngrok redireciona → localhost:3006                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Backend serve arquivo de /uploads                            │
│    ✅ Arquivo baixado com sucesso                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Evolution API envia via WhatsApp                              │
│    ✅ Mensagem enviada!                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 **CONFIGURAÇÃO EVOLUTION API**

### **Webhook URL:**

```typescript
// Configurar webhook para usar ngrok
await evolutionApiService.setInstanceWebhook(instanceName, {
  url: "https://seu-dominio.ngrok-free.dev/api/webhooks/evolution",
  webhook_base64: true, // Ainda recomendado para mídias recebidas
  events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE"],
});
```

### **Verificar Configuração:**

```bash
# Testar webhook
POST https://seu-dominio.ngrok-free.dev/api/webhooks/evolution
{
  "event": "messages.upsert",
  "instance": "teste",
  "data": { ... }
}

# Deve retornar 200 OK
```

---

## ⚙️ **ALTERNATIVAS AO NGROK**

### **1. Localtunnel:**

```bash
npm install -g localtunnel
lt --port 3006

# URL: https://random-name.loca.lt
```

### **2. Serveo:**

```bash
ssh -R 80:localhost:3006 serveo.net

# URL: https://random.serveo.net
```

### **3. Cloudflare Tunnel:**

```bash
cloudflared tunnel --url http://localhost:3006

# URL: https://random.trycloudflare.com
```

---

## 🎯 **CENÁRIOS DE USO**

### **Desenvolvimento Local (sem ngrok):**

```
Backend: http://localhost:3001
Frontend: http://localhost:3006
Upload URL: http://localhost:3006/uploads/...

❌ Evolution API NÃO consegue acessar
✅ Sistema converte para Base64 automaticamente
```

### **Desenvolvimento com Ngrok:**

```
Backend: http://localhost:3001
Frontend: https://seu-dominio.ngrok-free.dev
Upload URL: https://seu-dominio.ngrok-free.dev/uploads/...

✅ Evolution API consegue acessar diretamente
✅ Sem necessidade de conversão Base64
✅ Mais rápido e eficiente
```

### **Produção:**

```
Backend: https://api.seusite.com
Frontend: https://app.seusite.com
Upload URL: https://api.seusite.com/uploads/...

✅ Evolution API acessa normalmente
✅ URLs públicas permanentes
```

---

## 📊 **VANTAGENS DO NGROK EM DESENVOLVIMENTO**

### **Para Desenvolvimento:**

- ✅ **Testa com URLs reais** - Mesmo comportamento da produção
- ✅ **Webhooks funcionam** - Evolution pode enviar webhooks
- ✅ **Sem conversão Base64** - Mais rápido para testar
- ✅ **HTTPS gratuito** - Certificado SSL automático

### **Para Testes:**

- ✅ **Compartilhar com time** - Outros podem acessar
- ✅ **Testar em mobile** - Acesso de qualquer dispositivo
- ✅ **Debug remoto** - Logs em tempo real

---

## ⚠️ **LIMITAÇÕES DO NGROK FREE**

- ⚠️ **URL muda** a cada reinício (a menos que tenha conta paga)
- ⚠️ **Limite de requisições** por minuto
- ⚠️ **Tela de aviso** na primeira visita
- ⚠️ **Não persistente** - Precisa manter o processo rodando

**Solução:** Ngrok pago ou usar para testes apenas

---

## ✨ **RESULTADO FINAL**

**Sistema configurado para usar ngrok em desenvolvimento!** 🚀

### **Configurações Aplicadas:**

- ✅ **Vite** aceita domínio ngrok
- ✅ **BACKEND_URL** configurado com ngrok
- ✅ **CORS** permite acesso do ngrok
- ✅ **Conversão Base64** como fallback
- ✅ **URLs públicas** geradas com ngrok

### **Teste Agora:**

1. 🌐 Inicie ngrok: `ngrok http 3006`
2. ⚙️ Configure `BACKEND_URL` com o domínio ngrok
3. 🔄 Reinicie backend e frontend
4. 📤 Teste upload de imagem
5. ✅ Deve funcionar sem conversão Base64!

**Sistema funcionando com URLs públicas válidas!** 🎯



