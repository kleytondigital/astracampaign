# 🚨 CRÍTICO: Schema do Banco Desatualizado

## 🔴 Problema Identificado

As migrations foram **marcadas como aplicadas** mas as **tabelas não existem** no banco!

```
❌ The table `public.tenants` does not exist
❌ The table `public.alerts` does not exist
❌ The column `campaigns.tenant_id` does not exist
```

**Causa:** Você executou `migrate resolve --applied` mas isso apenas marca como aplicada **sem criar as tabelas**.

**Solução:** Precisamos aplicar as migrations DE VERDADE ou criar as tabelas manualmente.

---

## ✅ SOLUÇÃO 1: Reverter e Reaplicar Migrations (RECOMENDADO)

### Passo 1: Acessar Console do Backend

Easypanel → Backend → Console

### Passo 2: Desmarcar Migrations

```bash
# Desmarcar todas as migrations problemáticas
npx prisma migrate resolve --rolled-back 20250925000000_add_alerts_notifications
npx prisma migrate resolve --rolled-back 20250925120000_remove_tenant_domain  
npx prisma migrate resolve --rolled-back 20250930134500_add_categoria_to_contacts
npx prisma migrate resolve --rolled-back 20251001000000_add_display_name_to_sessions
npx prisma migrate resolve --rolled-back 20251001000000_add_user_tenant_many_to_many
```

### Passo 3: Aplicar Migrations de Verdade

```bash
npx prisma migrate deploy
```

**ATENÇÃO:** Isso vai tentar aplicar as migrations. Se der erro, vá para Solução 2.

---

## ✅ SOLUÇÃO 2: Aplicar SQL Manualmente (SE SOLUÇÃO 1 FALHAR)

### Via Console do Backend

```bash
# Gerar SQL completo do schema atual
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > schema.sql

# Ver o SQL gerado
cat schema.sql

# Aplicar no banco
npx prisma db push --skip-generate
```

---

## ✅ SOLUÇÃO 3: Reset do Schema (CUIDADO - APAGA DADOS!)

**⚠️ ATENÇÃO: Isso VAI APAGAR todos os dados do banco!**

Use apenas se for ambiente de desenvolvimento/teste.

```bash
# Fazer backup primeiro (se tiver dados importantes)
# ...

# Reset completo
npx prisma migrate reset --skip-seed

# Isso vai:
# 1. Dropar todas as tabelas
# 2. Aplicar todas as migrations do zero
# 3. Criar schema correto
```

---

## ✅ SOLUÇÃO 4: Criar Tabelas Manualmente via SQL

Se nada funcionar, podemos criar as tabelas diretamente:

### 1. Conectar ao PostgreSQL

```bash
# Via console do Easypanel no container do PostgreSQL
# ou
# Via ferramenta de administração (pgAdmin, DBeaver, etc)
```

### 2. Executar SQL

```sql
-- Criar tabela tenants (se não existir)
CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");

-- Criar ENUMs para alerts
DO $$ BEGIN
    CREATE TYPE "AlertType" AS ENUM (
        'QUOTA_WARNING', 'QUOTA_EXCEEDED', 'SYSTEM_ERROR', 
        'TENANT_INACTIVE', 'SESSION_FAILED', 'CAMPAIGN_FAILED', 
        'DATABASE_ERROR', 'API_ERROR', 'BACKUP_FAILED', 'SECURITY_ALERT'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationMethod" AS ENUM ('IN_APP', 'EMAIL', 'WEBHOOK');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar tabela alerts
CREATE TABLE IF NOT EXISTS "alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "metadata" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "alerts_tenant_id_idx" ON "alerts"("tenant_id");
CREATE INDEX IF NOT EXISTS "alerts_type_severity_idx" ON "alerts"("type", "severity");
CREATE INDEX IF NOT EXISTS "alerts_resolved_created_at_idx" ON "alerts"("resolved", "created_at");

-- Criar tabela notifications
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "alert_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "method" "NotificationMethod" NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "notifications_alert_id_idx" ON "notifications"("alert_id");

-- Adicionar coluna tenant_id em campaigns (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE "campaigns" ADD COLUMN "tenant_id" TEXT;
        CREATE INDEX "campaigns_tenant_id_idx" ON "campaigns"("tenant_id");
    END IF;
END $$;

-- Adicionar coluna display_name em whatsapp_sessions (se não existir)  
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'whatsapp_sessions' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE "whatsapp_sessions" ADD COLUMN "display_name" TEXT;
    END IF;
END $$;

-- Adicionar coluna categoria_id em contacts (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contacts' AND column_name = 'categoria_id'
    ) THEN
        ALTER TABLE "contacts" ADD COLUMN "categoria_id" TEXT;
    END IF;
END $$;

-- Criar tabela user_tenants (se não existir)
CREATE TABLE IF NOT EXISTS "user_tenants" (
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tenants_pkey" PRIMARY KEY ("user_id", "tenant_id")
);

-- Marcar migrations como aplicadas
-- (Execute isso após criar as tabelas manualmente)
```

### 3. Marcar Migrations como Aplicadas

Depois de criar as tabelas manualmente:

```bash
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many

npx prisma generate
```

---

## 🔄 Verificar se Funcionou

### 1. Status das Migrations

```bash
npx prisma migrate status
```

**Deve mostrar:** `Database schema is up to date!`

### 2. Testar Conexão

```bash
npx prisma db pull
```

Se funcionar sem erros, o schema está correto!

### 3. Restart do Backend

Sair do console e reiniciar o backend no Easypanel.

### 4. Verificar Logs

Os erros de "table does not exist" devem sumir!

---

## 📋 Recomendação

**MELHOR OPÇÃO:**

1. Tente **SOLUÇÃO 1** primeiro (desmarcar e reaplicar)
2. Se não funcionar, use **SOLUÇÃO 4** (SQL manual)
3. **NÃO use SOLUÇÃO 3** (reset) se tiver dados importantes!

---

## 🆘 Se Nada Funcionar

O problema pode ser que você está usando **dois bancos diferentes**:

- Banco local: `astra_campaign_dev`
- Banco produção: `b2x_crm`

Verifique qual banco o Easypanel está usando:

```bash
echo $DATABASE_URL
```

Deve ser: `postgres://...@n8n_banco_crm:5432/b2x_crm`

Se estiver apontando para outro banco, as migrations foram aplicadas no lugar errado!

---

**Comece pela SOLUÇÃO 1!** ⚡

