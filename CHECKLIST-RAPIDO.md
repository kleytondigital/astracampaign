# ✅ Checklist Rápido - Copy & Paste

## 🚀 Passo 1: Git

```bash
cd E:\B2X-Disparo\campaign
git add frontend/nginx.conf backend/Dockerfile
git commit -m "fix: resolve nginx proxy and migrations startup issues"
git push origin main
```

---

## 🚀 Passo 2: Rebuild Easypanel

- [ ] Easypanel → Frontend → Redeploy (aguarde 3 min)
- [ ] Easypanel → Backend → Redeploy (aguarde 3 min)

---

## 🚀 Passo 3: Console Backend

Easypanel → Backend → Console

```bash
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many
npx prisma migrate status
npx prisma generate
exit
```

---

## 🚀 Passo 4A: Editar Dockerfile

`backend/Dockerfile` linha 66:

**REMOVA `|| true`:**

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
```

---

## 🚀 Passo 4B: Git Final

```bash
cd E:\B2X-Disparo\campaign
git add backend/Dockerfile
git commit -m "fix: restore normal migration behavior"
git push origin main
```

---

## 🚀 Passo 4C: Rebuild Final

- [ ] Easypanel → Backend → Redeploy (aguarde 3 min)

---

## 🚀 Passo 4D: Variáveis

Easypanel → Backend → Environment

**REMOVER:**
```
ALLOWED_ORIGINS="*"
```

**MANTER:**
```
ALLOWED_ORIGINS=https://crm.aoseudispor.com.br,https://n8n-front-crm.h3ag2x.easypanel.host
```

Save → Restart

---

## ✅ Verificar

### Frontend
```
https://crm.aoseudispor.com.br
```
✅ Deve carregar

### Backend
```
https://n8n-back-crm.h3ag2x.easypanel.host/health
```
✅ Deve retornar `{"status":"ok"}`

---

## 🎉 PRONTO!

Tempo total: ~24 minutos

