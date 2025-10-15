# 🔧 Correção: Permissões do Diretório /app/backups

## 🔴 Problema Identificado

```
Error: EACCES: permission denied, mkdir '/app/backups'
```

**Causa:** O Dockerfile cria o usuário `nodejs` (não-root) e muda para ele antes do servidor iniciar. O código tenta criar `/app/backups` em runtime, mas o usuário `nodejs` não tem permissão para criar diretórios em `/app`.

---

## ✅ SOLUÇÃO

### O que foi corrigido

**Arquivo:** `backend/Dockerfile` (linha 51)

**ANTES:**
```dockerfile
# Criar diretório de uploads
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads
```

**DEPOIS:**
```dockerfile
# Criar diretórios necessários com permissões corretas
RUN mkdir -p uploads backups && chown -R nodejs:nodejs uploads backups
```

Agora o diretório `backups` é criado **antes** de mudar para o usuário não-root, com as permissões corretas.

---

## 🚀 Como Aplicar a Correção

### 1. Commit e Push

```bash
cd E:\B2X-Disparo\campaign

git add backend/Dockerfile
git commit -m "fix: create backups directory with correct permissions"
git push origin main
```

### 2. Rebuild no Easypanel

1. Easypanel → **Backend** → **Redeploy**
2. Aguarde o build (2-3 minutos)
3. Verifique os logs

**Agora o container deve iniciar sem erro de permissão!** ✅

---

## ✅ Verificar se Funcionou

### 1. Logs do Backend

Easypanel → Backend → Logs

**Deve mostrar:**
```
✅ Serviço de monitoramento iniciado
Server running on port 3001
```

**NÃO deve mostrar:**
```
Error: EACCES: permission denied, mkdir '/app/backups'
```

### 2. Health Check

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

---

## 🎯 Status das Migrations

Sobre a mensagem que você viu:

```
Error: P3008
The migration `20251001000000_add_display_name_to_sessions` is already recorded as applied
```

**Isso é NORMAL e ESPERADO!** ✅

P3008 significa que a migration **já foi aplicada**. Como você executou alguns comandos `migrate resolve` antes, algumas migrations já foram marcadas.

### Continue resolvendo as outras migrations

Se você ainda não executou todos os 5 comandos, continue:

```bash
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many
```

Se algum retornar P3008 ("already recorded as applied"), tudo bem! Continue com os outros.

### Verificar Status Final

```bash
npx prisma migrate status
```

**Deve mostrar:**
```
Database schema is up to date!
```

---

## 📋 Checklist Atualizado

- [x] Dockerfile corrigido (backups directory)
- [ ] Commit e push da correção
- [ ] Rebuild backend no Easypanel
- [ ] Container inicia sem erro de permissão
- [ ] Todas as 5 migrations resolvidas
- [ ] `migrate status` retorna "up to date"
- [ ] `prisma generate` executado
- [ ] `/health` retorna OK

---

## 🔄 Próximos Passos

### Após o Container Iniciar

1. **Acessar Console** (Easypanel → Backend → Console)

2. **Resolver migrations restantes** (se necessário)
   ```bash
   npx prisma migrate status
   ```
   
   Se houver migrations pendentes:
   ```bash
   npx prisma migrate resolve --applied NOME_DA_MIGRATION
   ```

3. **Gerar Prisma Client**
   ```bash
   npx prisma generate
   ```

4. **Sair do console**
   ```bash
   exit
   ```

5. **Reverter Dockerfile** (remover `|| true`)
   - Editar linha 66
   - Mudar de: `npx prisma migrate deploy || true && npm run dev`
   - Para: `npx prisma migrate deploy && npm run dev`
   - Commit, push, rebuild

---

## 💡 Por que isso aconteceu?

### Segurança vs Permissões

O Dockerfile usa um **usuário não-root** (`nodejs`) por segurança - isso é uma boa prática! Mas significa que:

1. ✅ O container é mais seguro (não roda como root)
2. ⚠️ Precisamos criar diretórios ANTES de mudar de usuário
3. ✅ Ou criar com as permissões corretas

### Ordem de Execução no Dockerfile

```dockerfile
# 1. Como root (usuário padrão)
RUN mkdir -p backups        # ✅ Pode criar diretórios

# 2. Mudar para não-root
USER nodejs

# 3. Executar aplicação
CMD [...]                   # ❌ NÃO pode criar diretórios em /app
```

### Solução

Criar todos os diretórios necessários **antes** de mudar para usuário não-root:

```dockerfile
# Como root
RUN mkdir -p uploads backups && chown -R nodejs:nodejs uploads backups

# Agora pode mudar de usuário
USER nodejs
```

---

## ✅ Correção Aplicada

O Dockerfile agora cria:
- ✅ `/app/uploads` - para arquivos enviados
- ✅ `/app/backups` - para backups do sistema

Ambos com permissões corretas para o usuário `nodejs`.

---

**Pronto para continuar!** Faça o commit e rebuild! 🚀

