# ⚡ AÇÃO IMEDIATA - Situação Crítica Atualizada

## 🔴 PROBLEMAS IDENTIFICADOS (2 críticos!)

### Problema 1: Tabelas Não Existem no Banco ❌
```
The table `public.tenants` does not exist
The table `public.alerts` does not exist  
The column `campaigns.tenant_id` does not exist
```

**Causa:** Migrations foram marcadas como "aplicadas" mas **não criaram as tabelas**!

### Problema 2: Frontend com Nginx Antigo ❌
```
nginx: [emerg] host not found in upstream "backend"
```

**Causa:** Frontend ainda não foi atualizado com o nginx.conf corrigido.

---

## ✅ SOLUÇÃO RÁPIDA (20 minutos)

### ⚡ PARTE 1: Corrigir Banco de Dados (10 min)

#### 1. Acessar Console do Backend

Easypanel → Backend → Console

#### 2. Desmarcar Migrations

```bash
npx prisma migrate resolve --rolled-back 20250925000000_add_alerts_notifications
npx prisma migrate resolve --rolled-back 20250925120000_remove_tenant_domain
npx prisma migrate resolve --rolled-back 20250930134500_add_categoria_to_contacts
npx prisma migrate resolve --rolled-back 20251001000000_add_display_name_to_sessions
npx prisma migrate resolve --rolled-back 20251001000000_add_user_tenant_many_to_many
```

#### 3. Aplicar Migrations DE VERDADE

```bash
npx prisma migrate deploy
```

**Se der erro,** use `npx prisma db push --skip-generate`

#### 4. Verificar

```bash
npx prisma migrate status
```

**Deve mostrar:** `Database schema is up to date!`

#### 5. Gerar Client

```bash
npx prisma generate
exit
```

#### 6. Restart Backend

Easypanel → Backend → Restart

---

### ⚡ PARTE 2: Corrigir Frontend (10 min)

#### 1. Commit nginx.conf Corrigido

```bash
cd E:\B2X-Disparo\campaign

git add frontend/nginx.conf backend/Dockerfile
git commit -m "fix: update nginx config and fix backups permissions"
git push origin main
```

#### 2. Rebuild Frontend

Easypanel → Frontend → Redeploy (aguarde 3 min)

#### 3. Rebuild Backend

Easypanel → Backend → Redeploy (aguarde 3 min)

---

## ✅ Verificar se Funcionou

### Backend

```
https://n8n-back-crm.h3ag2x.easypanel.host/health
```

**Deve retornar:**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### Logs do Backend

**NÃO deve ter:**
- ❌ "table does not exist"
- ❌ "column does not exist"
- ❌ "EACCES permission denied"

**Deve ter:**
- ✅ "Server running on port 3001"
- ✅ "Serviço de monitoramento iniciado"

### Frontend

**NÃO deve ter:**
- ❌ "host not found in upstream backend"

**Deve ter:**
- ✅ "nginx/1.29.2"
- ✅ "start worker processes"

---

## 🆘 Se PARTE 1 Não Funcionar

Se `migrate deploy` continuar dando erro, use SQL manual:

### Opção B: Aplicar Schema Manualmente

```bash
# No console do backend
npx prisma db push --skip-generate --accept-data-loss

# Depois marcar como aplicadas
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many

npx prisma generate
```

---

## 📋 Checklist Completo

### Banco de Dados
- [ ] Migrations desmarcadas (rolled-back)
- [ ] Migrations aplicadas (deploy ou db push)
- [ ] `migrate status` retorna "up to date"
- [ ] `prisma generate` executado
- [ ] Backend reiniciado
- [ ] Logs SEM erros de "table does not exist"

### Frontend
- [ ] nginx.conf commitado e pushed
- [ ] Frontend rebuild
- [ ] Backend rebuild (com Dockerfile atualizado)
- [ ] Logs SEM erros de "upstream backend"
- [ ] Nginx iniciando corretamente

### Funcional
- [ ] `/health` retorna 200 OK
- [ ] Sem crashes no backend
- [ ] Frontend carrega
- [ ] Login funciona

---

## 🎯 Ordem de Execução

```
1. Backend Console → Desmarcar migrations (2 min)
2. Backend Console → Aplicar migrations (3 min)
3. Backend Console → Gerar client (1 min)
4. Backend → Restart (1 min)
5. Local → Git commit + push (2 min)
6. Frontend → Rebuild (3 min)
7. Backend → Rebuild (3 min)  
8. Verificar tudo funcionando (5 min)

TOTAL: ~20 minutos
```

---

## 💡 Por que Isso Aconteceu?

1. **`migrate resolve --applied`** apenas marca no controle de migrations
2. **NÃO cria as tabelas** no banco
3. Código espera tabelas que não existem
4. Backend crashava por isso

**Solução correta:**
- `migrate deploy` → Aplica o SQL E marca como aplicada
- `db push` → Força sincronização do schema

---

## 📚 Documentação

Se precisar de mais detalhes:
- **RESOLVER-SCHEMA-DESATUALIZADO.md** - Problema do banco
- **RESOLVER-ERROS-EASYPANEL.md** - Problema do nginx

---

**COMECE AGORA PELA PARTE 1!** ⚡

O banco é crítico - sem ele nada funciona!

