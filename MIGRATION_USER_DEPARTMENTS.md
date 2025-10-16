# 🚀 Migração: Sistema N:N User-Department

## ⚠️ Mudanças Críticas no Banco de Dados

Esta migração implementa o relacionamento **N:N entre User e Department**, permitindo que:
- ✅ Usuários participem de **múltiplos departamentos**
- ✅ Admins sejam **automaticamente membros de todos os departamentos**
- ✅ Cada departamento **sempre tenha pelo menos um admin**

---

## 📋 O que será feito:

### 1. **Nova Tabela:**
- `user_departments` - Tabela intermediária para relacionamento N:N

### 2. **Campo Removido:**
- `users.department_id` - Este campo será removido do modelo User

### 3. **Migração de Dados:**
- Usuários que já tinham `department_id` serão migrados para `user_departments`
- Admins serão adicionados automaticamente a todos os departamentos existentes

---

## 🔧 Executar no Terminal do Backend (Easypanel):

### Opção 1: Usar `db push` (mais simples, mas pode perder dados)
```bash
cd /app
npx prisma db push
```

### Opção 2: Criar migration manual (recomendado)
```bash
cd /app

# 1. Criar a nova tabela user_departments
npx prisma migrate dev --name add_user_departments_table --create-only

# 2. Editar a migration para incluir a migração de dados (opcional)
# ... adicione SQL customizado se necessário ...

# 3. Aplicar a migration
npx prisma migrate deploy
```

---

## 📝 SQL para Migração de Dados (se necessário):

Se você tinha dados na coluna `users.department_id`, execute este SQL após o `db push`:

```sql
-- Migrar usuários que já tinham departamento
INSERT INTO user_departments (id, user_id, department_id, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  id,
  department_id,
  true, -- Marcar como departamento padrão
  NOW(),
  NOW()
FROM users
WHERE department_id IS NOT NULL
ON CONFLICT (user_id, department_id) DO NOTHING;

-- Adicionar admins a TODOS os departamentos existentes
INSERT INTO user_departments (id, user_id, department_id, is_default, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  d.id,
  false,
  NOW(),
  NOW()
FROM users u
CROSS JOIN departments d
WHERE u.role IN ('ADMIN', 'SUPERADMIN')
  AND u.tenant_id = d.tenant_id
  AND u.ativo = true
ON CONFLICT (user_id, department_id) DO NOTHING;

-- Remover a coluna department_id (se o db push não fizer automaticamente)
-- ALTER TABLE users DROP COLUMN IF EXISTS department_id;
```

---

## ✅ Verificar se Funcionou:

Execute no terminal do backend:

```bash
# Verificar estrutura da tabela
npx prisma db pull

# Verificar dados
npx prisma studio
```

Ou verifique diretamente no PostgreSQL:

```sql
-- Ver usuários e seus departamentos
SELECT 
  u.nome AS usuario,
  u.role,
  d.name AS departamento,
  ud.is_default
FROM user_departments ud
JOIN users u ON ud.user_id = u.id
JOIN departments d ON ud.department_id = d.id
ORDER BY u.nome, d.name;

-- Verificar se admins estão em todos os departamentos
SELECT 
  u.nome AS admin,
  COUNT(ud.id) AS qtd_departamentos
FROM users u
LEFT JOIN user_departments ud ON u.id = ud.user_id
WHERE u.role IN ('ADMIN', 'SUPERADMIN')
GROUP BY u.id, u.nome
ORDER BY u.nome;
```

---

## 🆘 Em Caso de Erro:

Se algo der errado:

1. **Backup:** Se possível, faça backup do banco antes
2. **Reverter:** Use `npx prisma migrate resolve --rolled-back <migration_name>`
3. **Recriar:** Delete a migration e rode novamente

---

## 🎯 Novas Funcionalidades Disponíveis:

Após a migração, estarão disponíveis:

1. **POST /api/departments/:id/users** - Adicionar usuário ao departamento
2. **DELETE /api/departments/:id/users/:userId** - Remover usuário do departamento
3. **GET /api/departments/:id/available-users** - Listar usuários disponíveis
4. **GET /api/departments/:id/users** - Listar usuários do departamento (atualizado)

---

## 📌 Importante:

- ⚠️ **Admins não podem ser removidos** de departamentos (são adicionados automaticamente)
- ✅ **Novos departamentos** receberão automaticamente todos os admins
- ✅ **Usuários comuns** podem estar em múltiplos departamentos
- ✅ **isDefault** marca o departamento padrão do usuário

---

## 🔄 Reiniciar Backend:

Após executar a migração, **reinicie o container do backend** no Easypanel.

