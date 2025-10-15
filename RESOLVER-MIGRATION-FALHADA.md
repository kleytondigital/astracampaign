# 🔧 Resolver Migration Falhada no Prisma

## ❌ Problema Identificado

```
Error: P3009
migrate found failed migrations in the target database
Migration: 20250925000000_add_alerts_notifications
Status: FAILED (started at 2025-10-15 18:57:31.435896 UTC)
```

---

## 🎯 Soluções (Escolha UMA)

### ✅ Solução 1: Marcar Migration como Resolvida (RECOMENDADO)

Use esta solução se **as mudanças da migration já foram aplicadas manualmente** ou se você quer **pular esta migration**.

#### Passo 1: Verificar o que a migration fazia

```bash
# Ver o SQL da migration falhada
cat prisma/migrations/20250925000000_add_alerts_notifications/migration.sql
```

#### Passo 2: Verificar se as tabelas/colunas já existem no banco

```bash
# Conectar ao PostgreSQL
docker exec -it n8n_banco_crm psql -U postgres -d b2x_crm

# No PostgreSQL, verificar:
\dt                           # Listar todas as tabelas
\d+ nome_da_tabela           # Ver estrutura de uma tabela específica

# Sair do PostgreSQL
\q
```

#### Passo 3A: Se as mudanças JÁ existem no banco

Marque a migration como resolvida:

```bash
# Na pasta backend
cd backend

# Marcar migration como aplicada (resolve o erro)
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications

# Verificar status
npx prisma migrate status
```

#### Passo 3B: Se as mudanças NÃO existem no banco

Marque como rollback e depois reaplique:

```bash
# Marcar como rolled back
npx prisma migrate resolve --rolled-back 20250925000000_add_alerts_notifications

# Aplicar migrations novamente
npx prisma migrate deploy
```

---

### 🔄 Solução 2: Reset Manual da Tabela de Migrations

Use se você quer **forçar** a reaplicação.

#### ⚠️ ATENÇÃO: Isso NÃO apaga dados, apenas reseta o controle de migrations

```bash
# Conectar ao banco
docker exec -it n8n_banco_crm psql -U postgres -d b2x_crm

# No PostgreSQL:
# Ver migrations que falharam
SELECT * FROM "_prisma_migrations" WHERE finished_at IS NULL OR failed_at IS NOT NULL;

# Deletar APENAS a migration falhada
DELETE FROM "_prisma_migrations" WHERE migration_name = '20250925000000_add_alerts_notifications';

# Sair
\q

# Agora aplicar migrations
cd backend
npx prisma migrate deploy
```

---

### 🔨 Solução 3: Aplicar Mudanças Manualmente + Marcar como Resolvida

Se a migration tem SQL complexo que precisa ser ajustado:

#### Passo 1: Extrair o SQL

```bash
cat backend/prisma/migrations/20250925000000_add_alerts_notifications/migration.sql
```

#### Passo 2: Aplicar manualmente (com ajustes se necessário)

```bash
# Conectar ao banco
docker exec -it n8n_banco_crm psql -U postgres -d b2x_crm

# Copiar e colar o SQL da migration (com ajustes se necessário)
# Exemplo:
-- CREATE TABLE "Alert" (...);
-- ALTER TABLE "User" ADD COLUMN ...;

\q
```

#### Passo 3: Marcar como resolvida

```bash
cd backend
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
```

---

### 🗑️ Solução 4: Deletar Migration Problemática (DESENVOLVIMENTO APENAS)

**⚠️ USE APENAS EM AMBIENTE DE DESENVOLVIMENTO!**

```bash
# OPÇÃO A: Se você não precisa desta migration
rm -rf backend/prisma/migrations/20250925000000_add_alerts_notifications

# OPÇÃO B: Se você quer recriar
# 1. Deletar a pasta da migration
rm -rf backend/prisma/migrations/20250925000000_add_alerts_notifications

# 2. Deletar do banco
docker exec -it n8n_banco_crm psql -U postgres -d b2x_crm -c "DELETE FROM \"_prisma_migrations\" WHERE migration_name = '20250925000000_add_alerts_notifications';"

# 3. Criar migration novamente (se necessário)
cd backend
npx prisma migrate dev --name add_alerts_notifications
```

---

## 🔍 Comandos Úteis para Diagnóstico

### Ver Status de Todas as Migrations

```bash
cd backend
npx prisma migrate status
```

### Ver Migrations no Banco de Dados

```bash
docker exec -it n8n_banco_crm psql -U postgres -d b2x_crm -c "SELECT migration_name, finished_at, failed_at FROM \"_prisma_migrations\" ORDER BY started_at;"
```

### Ver Detalhes da Migration Falhada

```bash
docker exec -it n8n_banco_crm psql -U postgres -d b2x_crm -c "SELECT * FROM \"_prisma_migrations\" WHERE migration_name = '20250925000000_add_alerts_notifications';"
```

### Verificar Schema Atual do Banco

```bash
cd backend
npx prisma db pull
# Isso vai mostrar se há diferenças entre o banco e o schema.prisma
```

---

## 📋 Passo a Passo Recomendado (Para Maioria dos Casos)

### 1️⃣ Diagnosticar

```bash
cd backend

# Ver status
npx prisma migrate status

# Ver o que a migration fazia
cat prisma/migrations/20250925000000_add_alerts_notifications/migration.sql
```

### 2️⃣ Verificar Banco

```bash
# Ver migrations no banco
docker exec -it n8n_banco_crm psql -U postgres -d b2x_crm -c "SELECT migration_name, finished_at, failed_at FROM \"_prisma_migrations\" WHERE migration_name = '20250925000000_add_alerts_notifications';"
```

### 3️⃣ Resolver

```bash
# Se as mudanças JÁ existem no banco:
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications

# OU se as mudanças NÃO existem:
npx prisma migrate resolve --rolled-back 20250925000000_add_alerts_notifications
npx prisma migrate deploy
```

### 4️⃣ Verificar

```bash
# Status deve estar OK agora
npx prisma migrate status

# Deve mostrar: Database schema is up to date!
```

### 5️⃣ Gerar Client Prisma

```bash
npx prisma generate
```

---

## 🚨 Troubleshooting

### Erro: "Migration has already been applied"

Significa que a migration já está no banco. Apenas marque como resolvida:

```bash
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
```

### Erro: "Relation already exists" ao reaplicar

A tabela já existe. Opções:

1. Marcar como aplicada (não tentar aplicar de novo)
2. Ou deletar a migration da tabela `_prisma_migrations` e marcar como aplicada

### Erro: "Column already exists"

Mesma situação acima - a mudança já foi aplicada parcialmente.

```bash
# Marcar como aplicada
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
```

---

## ✅ Após Resolver

1. **Verificar que não há mais migrations pendentes:**
   ```bash
   npx prisma migrate status
   ```

2. **Garantir que o schema está sincronizado:**
   ```bash
   npx prisma generate
   ```

3. **Testar a aplicação:**
   ```bash
   npm run dev
   ```

4. **Fazer backup do banco** (importante!):
   ```bash
   docker exec -it n8n_banco_crm pg_dump -U postgres b2x_crm > backup_apos_fix_$(date +%Y%m%d_%H%M%S).sql
   ```

---

## 🎯 Próximos Passos

Após resolver o problema de migration:

- [ ] Testar a aplicação localmente
- [ ] Verificar se todas as funcionalidades estão OK
- [ ] Se estiver em produção, fazer backup antes de qualquer mudança
- [ ] Documentar o que causou o problema para evitar no futuro

---

## 📚 Links Úteis

- [Prisma - Troubleshooting Migrations](https://www.prisma.io/docs/guides/database/production-troubleshooting)
- [Prisma - migrate resolve](https://www.prisma.io/docs/reference/api-reference/command-reference#migrate-resolve)
- [Erro P3009](https://www.prisma.io/docs/reference/api-reference/error-reference#p3009)

---

**💡 Dica:** Em produção, sempre faça backup antes de mexer em migrations!

