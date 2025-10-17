# 🚀 Aplicar Migração Meta Ads

Este documento contém instruções para aplicar a migração do banco de dados para o módulo Meta Ads.

---

## 📋 **Pré-requisitos**

- Acesso SSH ao container do backend no Easypanel
- Backup do banco de dados (recomendado)
- Acesso ao Easypanel para reiniciar o container

---

## 🔧 **Passo 1: Acessar o Container Backend**

### **Via Easypanel:**
1. Acesse o Easypanel
2. Vá em **Services** → **backend**
3. Clique na aba **Terminal** ou **Console**

### **Via SSH direto (se disponível):**
```bash
ssh user@seu-servidor
docker exec -it nome-do-container bash
```

---

## 📝 **Passo 2: Aplicar a Migração**

### **Opção A: Usando o script automatizado** (Recomendado)
```bash
cd /app
chmod +x backend/apply-meta-migration.sh
./backend/apply-meta-migration.sh
```

### **Opção B: Comandos manuais**
```bash
cd /app

# 1. Aplicar mudanças no banco de dados
npx prisma db push --accept-data-loss

# 2. Regenerar o Prisma Client
npx prisma generate
```

---

## ⏸️ **Passo 3: Reiniciar o Container Backend**

Após aplicar a migração, é **OBRIGATÓRIO** reiniciar o container:

1. No Easypanel, vá em **Services** → **backend**
2. Clique no botão **Restart**
3. Aguarde o container reiniciar (30-60 segundos)

---

## ✅ **Passo 4: Verificar se Funcionou**

### **1. Verificar logs do backend:**
```bash
# No terminal do container
tail -f /app/logs/app.log
```

### **2. Testar a API:**
```bash
# Listar tabelas criadas
npx prisma db execute --stdin <<< "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'meta_%';"
```

Deve retornar:
- `meta_global_settings`
- `meta_tenant_connections`
- `meta_accounts`
- `meta_campaigns`
- `meta_ad_sets`
- `meta_ads`
- `meta_insights`
- `meta_logs`

### **3. Acessar a interface:**
1. Faça login como **SUPERADMIN**
2. Acesse `/meta-settings`
3. Não deve mais aparecer o erro de tabela não encontrada

---

## 🔒 **Passo 5: Configurar Variável de Ambiente (IMPORTANTE)**

Adicione a variável de ambiente `ENCRYPTION_KEY` no Easypanel:

1. Vá em **Services** → **backend** → **Environment**
2. Adicione:
   ```
   ENCRYPTION_KEY=sua_chave_secreta_de_32_caracteres_aqui
   ```
   
**Para gerar uma chave segura:**
```bash
# No terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

3. **Reinicie o container** após adicionar a variável

---

## ⚠️ **Problemas Comuns**

### **Erro: "The table does not exist"**
- **Solução**: Execute `npx prisma db push` novamente e reinicie o container

### **Erro: "P2021: The table already exists"**
- **Solução**: Execute `npx prisma generate` e reinicie o container

### **Erro: "Cannot read property 'split' of undefined"**
- **Solução**: Verifique se a variável `ENCRYPTION_KEY` está configurada

### **Erro: "Falha na criptografia/descriptografia"**
- **Solução**: Verifique se `ENCRYPTION_KEY` tem exatamente 32 caracteres (64 em hex)

---

## 🗑️ **Rollback (Se necessário)**

Se algo der errado e você precisar reverter:

```bash
# 1. Restaurar backup do banco de dados
psql $DATABASE_URL < backup.sql

# 2. Reverter o schema do Prisma (git)
git checkout HEAD~1 backend/prisma/schema.prisma

# 3. Aplicar schema antigo
npx prisma db push

# 4. Regenerar Prisma Client
npx prisma generate

# 5. Reiniciar container
```

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique os logs do backend
2. Verifique se o Prisma Client foi regenerado
3. Verifique se o container foi reiniciado
4. Verifique se a variável `ENCRYPTION_KEY` está configurada

---

## ✅ **Checklist de Verificação**

- [ ] Backup do banco de dados realizado
- [ ] Migração executada com sucesso (`npx prisma db push`)
- [ ] Prisma Client regenerado (`npx prisma generate`)
- [ ] Container backend reiniciado
- [ ] Variável `ENCRYPTION_KEY` configurada
- [ ] Tabelas Meta criadas no banco
- [ ] Interface `/meta-settings` carregando sem erros
- [ ] Logs do backend sem erros

---

## 🎯 **Resultado Esperado**

Após seguir todos os passos, você deve conseguir:
1. ✅ Acessar `/meta-settings` sem erros
2. ✅ Ver o formulário de configuração do Meta Ads
3. ✅ Configurar App ID e App Secret
4. ✅ Conectar contas Meta Ads

**Boa sorte! 🚀**

