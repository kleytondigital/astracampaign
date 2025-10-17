# 🔧 Configuração do Facebook App para Meta Ads

## 📋 **Passo a Passo Completo**

### **1. Acessar o Facebook Developers**
1. ✅ Acesse: https://developers.facebook.com/apps
2. ✅ Faça login com sua conta Facebook
3. ✅ Selecione seu app ou crie um novo

---

## 🌐 **2. Configurar Domínios do App**

### **2.1. Acessar Configurações Básicas**
```
Painel do App → Configurações → Básico (Settings → Basic)
```

### **2.2. Adicionar Domínio**
No campo **"App Domains"**, adicione:
```
crm.aoseudispor.com.br
```

**⚠️ IMPORTANTE:**
- ❌ NÃO adicione `backendcrm.aoseudispor.com.br`
- ✅ Adicione APENAS `crm.aoseudispor.com.br`
- ❌ NÃO adicione `http://` ou `https://`
- ✅ Apenas o domínio puro

### **Exemplo Correto:**
```
App Domains: crm.aoseudispor.com.br
```

### **Exemplo Errado:**
```
❌ https://crm.aoseudispor.com.br
❌ backendcrm.aoseudispor.com.br
❌ crm.aoseudispor.com.br/api
```

---

## 🔐 **3. Configurar Facebook Login**

### **3.1. Adicionar Produto**
Se ainda não tem Facebook Login:
```
Painel do App → Adicionar Produtos → Facebook Login → Configurar
```

### **3.2. Configurar URLs de Redirecionamento**
```
Facebook Login → Configurações (Settings)
```

No campo **"Valid OAuth Redirect URIs"**, adicione:
```
https://crm.aoseudispor.com.br/api/meta/callback
```

**⚠️ IMPORTANTE:**
- ✅ Usar `https://` (com SSL)
- ✅ Incluir `/api/meta/callback` no final
- ✅ Usar o domínio do FRONTEND (não backend)

### **Screenshot do Campo:**
```
┌────────────────────────────────────────────────────────┐
│ Valid OAuth Redirect URIs                              │
├────────────────────────────────────────────────────────┤
│ https://crm.aoseudispor.com.br/api/meta/callback      │
│                                                        │
│ [+ Adicionar URI]                                     │
└────────────────────────────────────────────────────────┘
```

---

## 📊 **4. Configurar Versão da API**

### **4.1. Graph API Version**
No painel do app, verifique qual versão está sendo usada:
```
Configurações → Avançado → Graph API Version
```

**Versões Suportadas pelo CRM:**
- ✅ v19.0
- ✅ v20.0
- ✅ v21.0 (padrão)
- ✅ v22.0
- ✅ v23.0
- ✅ v24.0 (recomendada)

### **4.2. Atualizar no CRM**
1. Acesse: `/meta-settings` (como SuperAdmin)
2. Selecione a versão: **v24.0**
3. Salve as configurações

---

## 🔑 **5. Obter Credenciais**

### **5.1. App ID**
```
Configurações → Básico → App ID
```
- Copie o número (ex: 1234567890123456)

### **5.2. App Secret**
```
Configurações → Básico → App Secret → Mostrar
```
- ⚠️ **NUNCA compartilhe o App Secret**
- Copie o valor completo

### **5.3. Configurar no CRM**
1. Acesse: `https://crm.aoseudispor.com.br/meta-settings`
2. Cole o **App ID**
3. Cole o **App Secret**
4. Selecione **API Version: v24.0**
5. Clique em **Salvar**

**A URL de callback será gerada automaticamente:**
```
https://crm.aoseudispor.com.br/api/meta/callback
```

---

## ✅ **6. Verificar Configurações**

### **Checklist Completo:**
```
Facebook App:
  [✓] App Domains: crm.aoseudispor.com.br
  [✓] Facebook Login configurado
  [✓] Redirect URI: https://crm.aoseudispor.com.br/api/meta/callback
  [✓] API Version: v24.0 (ou sua preferência)
  [✓] App ID copiado
  [✓] App Secret copiado

CRM (SuperAdmin):
  [✓] App ID configurado
  [✓] App Secret configurado
  [✓] API Version selecionada: v24.0
  [✓] Configurações salvas

Tenant:
  [✓] Acesso à página: /meta-integration
  [✓] Botão "Conectar com Meta" visível
```

---

## 🧪 **7. Testar Conexão**

### **7.1. Iniciar OAuth**
1. Acesse: `https://crm.aoseudispor.com.br/meta-integration`
2. Clique em **"Conectar com Meta Ads"**
3. Será redirecionado para Facebook

### **7.2. URL Esperada**
```
https://www.facebook.com/v24.0/dialog/oauth?
  client_id=SEU_APP_ID&
  redirect_uri=https%3A%2F%2Fcrm.aoseudispor.com.br%2Fapi%2Fmeta%2Fcallback&
  scope=ads_read,ads_management,business_management,pages_show_list&
  response_type=code&
  state=BASE64_STATE
```

**Verificar:**
- ✅ URL inicia com `https://www.facebook.com/v24.0/` (versão correta)
- ✅ `redirect_uri` contém `crm.aoseudispor.com.br`
- ✅ Não aparece erro "domínio não incluído"

### **7.3. Callback Esperado**
Após autorizar, você será redirecionado para:
```
https://crm.aoseudispor.com.br/api/meta/callback?
  code=AUTHORIZATION_CODE&
  state=BASE64_STATE
```

E então redirecionado para:
```
https://crm.aoseudispor.com.br/meta-integration?
  success=true&
  step=accounts
```

---

## 🚨 **Troubleshooting**

### **Erro: "Domínio não incluído nos domínios do app"**

**Causa:** Domínio não configurado no Facebook App

**Solução:**
1. ✅ Vá em Configurações → Básico
2. ✅ Em "App Domains", adicione: `crm.aoseudispor.com.br`
3. ✅ Salve as alterações
4. ✅ Aguarde 1-2 minutos para propagar
5. ✅ Tente conectar novamente

---

### **Erro: "Redirect URI não corresponde"**

**Causa:** URL de redirecionamento não configurada

**Solução:**
1. ✅ Vá em Facebook Login → Configurações
2. ✅ Em "Valid OAuth Redirect URIs", adicione:
   ```
   https://crm.aoseudispor.com.br/api/meta/callback
   ```
3. ✅ Salve as alterações
4. ✅ Tente conectar novamente

---

### **Erro: "Versão da API não suportada"**

**Causa:** Versão configurada no CRM não existe no Facebook

**Solução:**
1. ✅ Acesse `/meta-settings` no CRM
2. ✅ Selecione uma versão válida: v21.0, v22.0, v23.0 ou v24.0
3. ✅ Salve as configurações
4. ✅ Tente conectar novamente

---

### **Erro: "State inválido ou expirado"**

**Causa:** State CSRF expirou (válido por 10 minutos)

**Solução:**
1. ✅ Volte para `/meta-integration`
2. ✅ Clique em "Conectar com Meta Ads" novamente
3. ✅ Autorize mais rapidamente (não demore)

---

## 📝 **Logs Úteis para Debug**

### **Backend:**
```javascript
// Ao clicar em "Conectar"
🔧 Configurações Meta para OAuth: {
  appId: '1234567890123456',
  redirectUri: 'https://crm.aoseudispor.com.br/api/meta/callback',
  apiVersion: 'v24.0',
  scopes: 'ads_read,ads_management,business_management,pages_show_list'
}

// URL gerada
🔗 URL de autorização gerada com v24.0: https://www.facebook.com/v24.0/dialog/oauth?...

// Callback recebido
🔄 Meta OAuth Callback recebido: { hasCode: true, hasState: true }
```

### **Frontend:**
```javascript
// Ao clicar em "Conectar"
🔗 Iniciando conexão com Meta Ads... { tenantId: '...' }
📡 Chamando startOAuthFlow...
✅ OAuth flow iniciado: { authUrl: 'https://www.facebook.com/v24.0/...' }

// Após callback
🔍 Parâmetros URL detectados: { success: 'true', step: 'accounts' }
✅ OAuth bem-sucedido, carregando contas...
```

---

## 🔗 **Links Úteis**

- **Facebook Developers:** https://developers.facebook.com/apps
- **Graph API Explorer:** https://developers.facebook.com/tools/explorer
- **Documentação OAuth:** https://developers.facebook.com/docs/facebook-login/web
- **Documentação Meta Ads API:** https://developers.facebook.com/docs/marketing-apis

---

## ✅ **Configuração Completa!**

Após seguir todos os passos:
1. ✅ Domínio configurado no Facebook
2. ✅ Redirect URI configurado
3. ✅ Credenciais no CRM
4. ✅ Versão v24.0 configurada
5. ✅ Teste de conexão bem-sucedido

**Agora você pode conectar contas Meta Ads e começar a sincronizar campanhas!** 🎉

