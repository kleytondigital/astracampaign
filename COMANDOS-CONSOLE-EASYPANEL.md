# 🚀 Comandos para Console do Easypanel

## 📝 Como usar

1. Acesse **Easypanel**
2. Vá em **Projeto** → **Backend** → **Console**
3. **Copie e cole** cada comando abaixo (um de cada vez)

---

## ✅ Comandos para Resolver Migrations

### 1️⃣ Verificar Status

```bash
npx prisma migrate status
```

Você verá algo como:
```
Error: P3009
migrate found failed migrations...
```

---

### 2️⃣ Resolver Migration 1

```bash
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
```

✅ **Resultado esperado:** `Migration marked as applied.`

---

### 3️⃣ Resolver Migration 2

```bash
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain
```

✅ **Resultado esperado:** `Migration marked as applied.`

---

### 4️⃣ Resolver Migration 3

```bash
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts
```

✅ **Resultado esperado:** `Migration marked as applied.`

---

### 5️⃣ Resolver Migration 4

```bash
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions
```

✅ **Resultado esperado:** `Migration marked as applied.`

---

### 6️⃣ Resolver Migration 5

```bash
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many
```

✅ **Resultado esperado:** `Migration marked as applied.`

---

### 7️⃣ Verificar Status Final

```bash
npx prisma migrate status
```

✅ **Resultado esperado:**
```
Database schema is up to date!
```

---

### 8️⃣ Gerar Prisma Client

```bash
npx prisma generate
```

✅ **Resultado esperado:**
```
✔ Generated Prisma Client
```

---

### 9️⃣ Sair do Console

```bash
exit
```

---

## 🔄 Reiniciar Backend

Após executar todos os comandos:

1. Vá em **Backend** → **Actions**
2. Clique em **"Restart"**
3. Aguarde o serviço reiniciar
4. Verifique os logs

---

## ✅ Verificar se Funcionou

### Backend Health Check

Abra no navegador:
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

No Easypanel:
- **Backend** → **Logs**
- Deve mostrar: `Server running on port 3001`
- **NÃO** deve ter erros de migration

---

## 🐛 Se Algo Der Errado

### Erro: "Migration already marked as applied"

✅ **Isso é NORMAL!** Significa que você já executou o comando antes. Continue com as próximas.

### Erro: "P3018 - Migration failed to apply"

Isso significa que está tentando aplicar ao invés de marcar como aplicada.

**Solução:**
```bash
# Use --applied (marca como aplicada)
# NÃO use --rolled-back (tentaria aplicar de novo)
npx prisma migrate resolve --applied NOME_DA_MIGRATION
```

### Erro persiste após restart

1. Verifique se `DATABASE_URL` está correto:
   ```bash
   echo $DATABASE_URL
   ```
   Deve mostrar: `postgres://...@n8n_banco_crm:5432/b2x_crm`

2. Teste conexão com o banco:
   ```bash
   npx prisma db pull
   ```

3. Verifique logs do backend no Easypanel

---

## 📋 Checklist

- [ ] Executei todos os 5 comandos `migrate resolve`
- [ ] `npx prisma migrate status` mostra "up to date"
- [ ] `npx prisma generate` executou com sucesso
- [ ] Reiniciei o backend
- [ ] Backend está rodando (logs sem erro)
- [ ] `/health` endpoint retorna OK

---

## 🎉 Pronto!

Após completar todos os passos, suas migrations estarão resolvidas e o backend funcionando! ✅

