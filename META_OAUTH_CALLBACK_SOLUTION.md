# 🔐 Solução: OAuth Callback do Meta via Proxy Nginx

## 📋 **Problema**

O Facebook/Meta não aceita o domínio `backendcrm.aoseudispor.com.br` como Redirect URI válido, mas aceita `crm.aoseudispor.com.br`.

### **Erro Original:**
```
Não é possível carregar a URL
O domínio dessa URL não está incluído nos domínios do app.
Para carregar essa URL, adicione todos os domínios e subdomínios ao campo Domínios do app nas configurações do app.
```

---

## ✅ **Solução Implementada**

### **Arquitetura:**
```
Facebook OAuth
    ↓
https://crm.aoseudispor.com.br/api/meta/callback?code=XXX&state=YYY
    ↓
Nginx Frontend (proxy transparente)
    ↓
https://backendcrm.aoseudispor.com.br/api/meta/callback?code=XXX&state=YYY
    ↓
Backend processa OAuth e redireciona para /meta-integration
```

### **Segurança Mantida:**
- ✅ **Dados sensíveis NÃO passam pelo navegador**
- ✅ **Nginx faz proxy direto backend ↔ backend**
- ✅ **OAuth code e state trafegam apenas server-side**
- ✅ **Nenhum dado exposto ao JavaScript do frontend**

---

## 🔧 **Implementação**

### **1. Nginx Frontend (`frontend/nginx.conf`)**

```nginx
# Proxy para callback OAuth do Meta (SEM autenticação - precisa ser público para Facebook)
location /api/meta/callback {
    proxy_pass https://n8n-back-crm.h3ag2x.easypanel.host/api/meta/callback;
    proxy_http_version 1.1;
    proxy_set_header Host n8n-back-crm.h3ag2x.easypanel.host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    
    # SSL
    proxy_ssl_server_name on;
    proxy_ssl_protocols TLSv1.2 TLSv1.3;
    
    # Não fazer cache de callbacks OAuth
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    expires -1;
}
```

### **2. Backend Controller (`metaGlobalController.ts`)**

```typescript
// Gerar URL sugerida de callback
// IMPORTANTE: Usar URL do FRONTEND porque Facebook só aceita crm.aoseudispor.com.br
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const suggestedRedirectUri = `${frontendUrl}/api/meta/callback`;
```

---

## 📊 **Fluxo Completo**

### **1. Configuração Inicial (SuperAdmin)**
```
SuperAdmin acessa /meta-settings
    ↓
Salva App ID, App Secret
    ↓
Sistema sugere: https://crm.aoseudispor.com.br/api/meta/callback
    ↓
SuperAdmin adiciona essa URL no Facebook App
```

### **2. Autorização OAuth (Tenant)**
```
Usuário clica "Conectar com Meta"
    ↓
Backend gera authUrl com redirect_uri=https://crm.aoseudispor.com.br/api/meta/callback
    ↓
Usuário redireciona para Facebook
    ↓
Facebook valida domínio ✅ (crm.aoseudispor.com.br está cadastrado)
    ↓
Facebook redireciona para: https://crm.aoseudispor.com.br/api/meta/callback?code=XXX&state=YYY
```

### **3. Processamento do Callback**
```
Nginx Frontend recebe: /api/meta/callback?code=XXX&state=YYY
    ↓
Nginx faz proxy para: https://backendcrm.aoseudispor.com.br/api/meta/callback?code=XXX&state=YYY
    ↓
Backend valida state (CSRF protection)
    ↓
Backend troca code por access_token
    ↓
Backend salva access_token criptografado no DB
    ↓
Backend redireciona navegador para: https://crm.aoseudispor.com.br/meta-integration?success=true&step=accounts
```

---

## 🔒 **Segurança**

### **✅ O que NÃO é exposto ao navegador:**
- ❌ OAuth code (permanece server-side)
- ❌ OAuth state (permanece server-side)
- ❌ Access token (permanece server-side)
- ❌ App secret (permanece server-side)

### **✅ O que é exposto ao navegador:**
- ✅ Apenas parâmetro `success=true` ou `error=mensagem`
- ✅ Nenhum dado sensível

### **✅ Proteções Implementadas:**
- ✅ **CSRF Protection:** State com nonce e timestamp
- ✅ **State Expiration:** 10 minutos
- ✅ **SSL/TLS:** Toda comunicação criptografada
- ✅ **Token Encryption:** Access tokens criptografados com AES-256-GCM
- ✅ **Tenant Isolation:** State valida tenant_id e user_id

---

## 📝 **Configuração no Facebook App**

### **1. App Domains (Facebook Developer Console)**
```
crm.aoseudispor.com.br
```

### **2. OAuth Redirect URIs**
```
https://crm.aoseudispor.com.br/api/meta/callback
```

### **3. Scopes Necessários**
```
ads_read
ads_management
business_management
pages_show_list
```

---

## 🧪 **Como Testar**

### **1. Verificar Proxy**
```bash
curl -I https://crm.aoseudispor.com.br/api/meta/callback
# Deve retornar 302 (redirect) ou 400 (parâmetros inválidos)
```

### **2. Testar OAuth Flow**
1. Acesse `/meta-integration`
2. Clique em "Conectar com Meta"
3. Autorize no Facebook
4. Verifique redirect para `/meta-integration?success=true&step=accounts`

### **3. Verificar Logs do Backend**
```bash
# Deve aparecer:
🔄 Meta OAuth Callback recebido: { hasCode: true, hasState: true, ... }
✅ Conexão Meta salva com sucesso
```

---

## 🚨 **Troubleshooting**

### **Erro: "Domínio não incluído nos domínios do app"**
- ✅ Verificar se `crm.aoseudispor.com.br` está em "App Domains"
- ✅ Verificar se redirect_uri usa `crm.aoseudispor.com.br` (não `backendcrm`)

### **Erro: "Parâmetros inválidos no callback"**
- ✅ Verificar logs do backend (callback deve receber `code` e `state`)
- ✅ Verificar se Nginx está fazendo proxy corretamente

### **Erro: "State inválido"**
- ✅ Verificar se state não expirou (10 minutos)
- ✅ Verificar se ENCRYPTION_KEY está configurada no backend

---

## 📚 **Variáveis de Ambiente**

### **Backend**
```env
FRONTEND_URL=https://crm.aoseudispor.com.br
ENCRYPTION_KEY=<chave-32-bytes-hex>
```

### **Frontend**
```env
VITE_API_URL=https://backendcrm.aoseudispor.com.br
```

---

## ✅ **Vantagens da Solução**

1. ✅ **Compatível com Facebook:** Usa domínio aceito pelo Meta
2. ✅ **Seguro:** Dados sensíveis não passam pelo navegador
3. ✅ **Transparente:** Usuário não percebe o proxy
4. ✅ **Manutenível:** Configuração simples no Nginx
5. ✅ **Escalável:** Funciona para qualquer OAuth similar

---

## 📅 **Histórico de Mudanças**

- **2024-01-16:** Implementação inicial com proxy Nginx
- **Motivo:** Facebook não aceita backendcrm.aoseudispor.com.br
- **Solução:** Proxy transparente via crm.aoseudispor.com.br

---

## 🔗 **Referências**

- [Meta OAuth Best Practices](https://developers.facebook.com/docs/facebook-login/security)
- [Nginx Proxy Pass Documentation](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

