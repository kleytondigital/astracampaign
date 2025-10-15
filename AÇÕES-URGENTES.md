# 🚨 AÇÕES URGENTES - Resolver Erros no Easypanel

## 📊 Status Atual

### ❌ Problemas Ativos

1. **Frontend**: `nginx: [emerg] host not found in upstream "backend"`
2. **Backend**: `Error: P3009 - migrate found failed migrations`

---

## ✅ SOLUÇÃO RÁPIDA (Passo a Passo)

### 🔧 PARTE 1: Corrigir Frontend (5 minutos)

#### 1. Commitar nginx.conf corrigido

O arquivo `frontend/nginx.conf` já foi corrigido! Agora faça:

```bash
# No terminal do Windows (PowerShell)
cd E:\B2X-Disparo\campaign

# Add e commit
git add frontend/nginx.conf
git commit -m "fix: remove nginx proxy to backend for Easypanel"

# Push para GitHub
git push origin main
```

#### 2. Rebuild Frontend no Easypanel

1. Acesse: https://easypanel.io
2. Login no seu projeto
3. Vá em **Frontend** (serviço)
4. Clique em **"Redeploy"** ou **"Rebuild"**
5. Aguarde 2-3 minutos para build terminar

✅ **Frontend corrigido!** O erro de nginx sumirá.

---

### 🔧 PARTE 2: Corrigir Backend (10 minutos)

#### 1. Acessar Console do Backend

1. No Easypanel, vá em **Backend** (serviço)
2. Clique em **"Console"**
3. Aguarde terminal abrir

#### 2. Executar Comandos

**Cole cada comando abaixo (um de cada vez) e pressione ENTER:**

```bash
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
```

```bash
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain
```

```bash
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts
```

```bash
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions
```

```bash
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many
```

#### 3. Verificar Status

```bash
npx prisma migrate status
```

**Deve mostrar:** `Database schema is up to date!` ✅

#### 4. Gerar Prisma Client

```bash
npx prisma generate
```

#### 5. Sair

```bash
exit
```

#### 6. Reiniciar Backend

1. No Easypanel, vá em **Backend**
2. Clique em **"Restart"** (ou **Actions** → **Restart**)
3. Aguarde reiniciar (30-60 segundos)

✅ **Backend corrigido!**

---

### 🔧 PARTE 3: Corrigir Variáveis de Ambiente

#### Problema Detectado

Você tem **ALLOWED_ORIGINS duplicado** nas variáveis do backend:

```env
ALLOWED_ORIGINS="*"                                                    # ❌ Linha duplicada
BACKEND_URL=https://n8n-back-crm.h3ag2x.easypanel.host
ALLOWED_ORIGINS=https://crm.aoseudispor.com.br,https://n8n-front-crm... # ❌ Linha duplicada
```

#### Solução

1. No Easypanel, vá em **Backend** → **Environment**
2. **REMOVA** a linha `ALLOWED_ORIGINS="*"`
3. **MANTENHA** apenas:
   ```env
   ALLOWED_ORIGINS=https://crm.aoseudispor.com.br,https://n8n-front-crm.h3ag2x.easypanel.host
   ```
4. Clique em **"Save"**
5. **Restart** o backend

---

## 🎯 Verificação Final

### ✅ Frontend OK

Abra: https://crm.aoseudispor.com.br

**Deve:**
- ✅ Carregar a página de login
- ✅ **NÃO** mostrar erro de nginx nos logs

### ✅ Backend OK

Abra: https://n8n-back-crm.h3ag2x.easypanel.host/health

**Deve retornar:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### ✅ Login OK

1. Acesse: https://crm.aoseudispor.com.br
2. Faça login
3. **Deve funcionar!**

---

## 📋 Checklist Completo

### Frontend
- [x] nginx.conf corrigido (já feito!)
- [ ] Commit e push do nginx.conf
- [ ] Redeploy no Easypanel
- [ ] Verificar que não há erro de nginx nos logs

### Backend
- [ ] 5 comandos `migrate resolve` executados
- [ ] `migrate status` retorna "up to date"
- [ ] `prisma generate` executado
- [ ] Backend reiniciado
- [ ] `/health` retorna OK
- [ ] Sem erros nos logs

### Variáveis
- [ ] `ALLOWED_ORIGINS` duplicado removido
- [ ] Apenas um `ALLOWED_ORIGINS` com os 2 domínios
- [ ] Backend reiniciado após mudança

---

## 📚 Documentação Criada

Foram criados os seguintes guias:

1. **RESOLVER-ERROS-EASYPANEL.md** - Explicação completa dos problemas
2. **COMANDOS-CONSOLE-EASYPANEL.md** - Guia passo a passo dos comandos
3. **COMANDOS-CONSOLE-EASYPANEL.sh** - Script com todos os comandos
4. **AÇÕES-URGENTES.md** - Este arquivo (resumo rápido)

---

## ⏱️ Tempo Total Estimado

- **Parte 1** (Frontend): ~5 minutos
- **Parte 2** (Backend): ~10 minutos
- **Parte 3** (Variáveis): ~2 minutos

**TOTAL: ~17 minutos** ⏰

---

## 🆘 Se Precisar de Ajuda

### Erro no Frontend Persiste

Veja os logs do frontend:
- Easypanel → Frontend → Logs

Se ainda mostrar erro de "backend" no nginx:
- Verifique se o commit foi feito
- Verifique se fez redeploy
- Force rebuild: Frontend → Settings → Clear cache

### Erro no Backend Persiste

Veja os logs do backend:
- Easypanel → Backend → Logs

Se ainda mostrar erro P3009:
- Verifique se executou TODOS os 5 comandos
- Execute `npx prisma migrate status` novamente
- Consulte **RESOLVER-ERROS-EASYPANEL.md**

---

## 🎉 Após Resolver

Seu sistema estará **100% funcional**:

✅ Frontend carregando  
✅ Backend rodando  
✅ Migrations OK  
✅ Banco conectado  
✅ Redis conectado  
✅ Login funcionando  

**Tudo pronto para uso em produção!** 🚀

