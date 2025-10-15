# 🔧 Solução Completa para Multi-Tenancy

## 📋 Problemas Identificados

### 1. **Token vs Banco de Dados**

```
❌ PROBLEMA: tenantId: aa135abc-56bf-400a-b980-cc2a38f0a2b4
```

- O sistema estava usando `decoded.tenantId` do JWT ao invés de buscar do banco de dados
- Tokens antigos podem ter dados desatualizados
- **Causa**: Linha 79 em `backend/src/middleware/auth.ts`

### 2. **TenantId Hardcoded**

```
❌ PROBLEMA: effectiveTenantId = 'aa135abc-56bf-400a-b980-cc2a38f0a2b4' (hardcoded)
```

- ID inexistente estava hardcoded no `settingsController.ts`
- **Causa**: Linha 109 em `backend/src/controllers/settingsController.ts`

### 3. **TenantId Undefined**

```
❌ PROBLEMA: ContactService.getContacts - tenantId: undefined
```

- TenantId não estava sendo propagado corretamente
- **Causa**: Uso incorreto do token ao invés do banco de dados

## ✅ Soluções Implementadas

### 1. **AuthMiddleware - Correção da Fonte de Dados**

**Arquivo**: `backend/src/middleware/auth.ts`

**ANTES:**

```typescript
req.user = {
  id: user.id,
  email: user.email,
  nome: user.nome,
  role: user.role,
  tenantId: decoded.tenantId, // ❌ ERRADO: usando token
};

let effectiveTenantId = decoded.tenantId; // ❌ ERRADO
```

**DEPOIS:**

```typescript
// CORREÇÃO: Usar tenantId do banco de dados, não do token
const userTenantId = user.tenantId;

// Log de debug para rastrear problemas
console.log("🔐 AuthMiddleware:", {
  userId: user.id,
  email: user.email,
  role: user.role,
  tenantIdFromDB: userTenantId,
  tenantIdFromToken: decoded.tenantId,
  match: userTenantId === decoded.tenantId,
});

req.user = {
  id: user.id,
  email: user.email,
  nome: user.nome,
  role: user.role,
  tenantId: userTenantId || undefined, // ✅ CORRETO: usando banco
};

let effectiveTenantId = userTenantId; // ✅ CORRETO
req.tenantId = effectiveTenantId || undefined; // ✅ CORRETO
```

**Motivo**: JWT tokens podem ficar desatualizados. O banco de dados é sempre a fonte da verdade.

### 2. **SettingsController - Remoção de Hardcoded ID**

**Arquivo**: `backend/src/controllers/settingsController.ts`

**ANTES:**

```typescript
let effectiveTenantId = req.tenantId;
if (req.user?.role === "SUPERADMIN") {
  effectiveTenantId =
    (req.query.tenantId as string) || "aa135abc-56bf-400a-b980-cc2a38f0a2b4"; // ❌ ERRADO
}
```

**DEPOIS:**

```typescript
let effectiveTenantId = req.tenantId;
if (req.user?.role === "SUPERADMIN") {
  // SUPERADMIN pode gerenciar configurações de qualquer tenant via query param
  // Se não fornecer tenantId, retorna apenas configurações globais
  effectiveTenantId = (req.query.tenantId as string) || undefined; // ✅ CORRETO
}

console.log("⚙️ SettingsController.getSettings:", {
  userRole: req.user?.role,
  userTenantId: req.user?.tenantId,
  reqTenantId: req.tenantId,
  effectiveTenantId,
  queryTenantId: req.query.tenantId,
});
```

**Motivo**: Nunca hardcodar IDs. SUPERADMIN deve poder acessar configurações globais sem tenant.

### 3. **TenantSettingsService - Tratamento Silencioso**

**Arquivo**: `backend/src/services/tenantSettingsService.ts`

**ANTES:**

```typescript
if (!tenant) {
  console.error("❌ Tenant não encontrado:", tenantId);
  throw new Error(`Tenant não encontrado: ${tenantId}`); // ❌ Lança erro
}
```

**DEPOIS:**

```typescript
if (!tenant) {
  console.warn("⚠️ Tenant não encontrado:", tenantId);
  return null; // ✅ Retorna null silenciosamente
}
```

**Motivo**: Tenant inválido não deve quebrar a aplicação. Retornar `null` e usar configurações globais é mais resiliente.

## 🔄 Fluxo de Autenticação Correto

```
┌─────────────────────────────────────────────────────────────┐
│ 1. LOGIN                                                     │
│    POST /api/auth/login                                     │
│    - Busca user no banco                                    │
│    - Gera JWT com: userId, email, role, tenantId           │
│    - Retorna token + dados do user                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. REQUISIÇÃO AUTENTICADA                                   │
│    GET /api/opportunities                                   │
│    Header: Authorization: Bearer <token>                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. AUTH MIDDLEWARE                                          │
│    - Verifica JWT                                           │
│    - Busca user atualizado do BANCO ✅                     │
│    - Extrai tenantId do user (NÃO do token) ✅            │
│    - Adiciona req.user e req.tenantId                      │
│    - Log de debug para rastreamento                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CONTROLLER                                               │
│    - Usa req.tenantId (vem do banco) ✅                    │
│    - Filtra dados por tenant                               │
│    - SUPERADMIN vê todos se tenantId = undefined          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Casos de Uso

### Caso 1: Usuário Normal (ADMIN/USER)

```javascript
// User no banco:
{
  id: "xxx",
  email: "admin@empresa-teste.com",
  role: "ADMIN",
  tenantId: "63e58078-2371-45be-ba1f-3b8814027b94"
}

// Após authMiddleware:
req.user.tenantId = "63e58078-2371-45be-ba1f-3b8814027b94"
req.tenantId = "63e58078-2371-45be-ba1f-3b8814027b94"

// Controller filtra:
where: { tenantId: "63e58078-2371-45be-ba1f-3b8814027b94" }
```

### Caso 2: SUPERADMIN sem Tenant

```javascript
// User no banco:
{
  id: "yyy",
  email: "superadmin@astraonline.com.br",
  role: "SUPERADMIN",
  tenantId: null
}

// Após authMiddleware:
req.user.tenantId = undefined
req.tenantId = undefined

// Controller:
if (tenantId) {
  where.tenantId = tenantId;
}
// Se undefined, retorna TODOS os dados (SUPERADMIN)
```

### Caso 3: SUPERADMIN com Override

```javascript
// Header: X-Tenant-Id: "63e58078-2371-45be-ba1f-3b8814027b94"

// Após authMiddleware:
req.user.tenantId = undefined; // do banco
req.tenantId = "63e58078-2371-45be-ba1f-3b8814027b94"; // do header

// Controller filtra específico:
where: {
  tenantId: "63e58078-2371-45be-ba1f-3b8814027b94";
}
```

## 🔍 Logs de Debug

Com as correções implementadas, você verá logs informativos:

```
🔐 AuthMiddleware: {
  userId: '0aead140-33c0-41e7-8d55-b5a8b04040ed',
  email: 'admin@empresa-teste.com',
  role: 'ADMIN',
  tenantIdFromDB: '63e58078-2371-45be-ba1f-3b8814027b94',
  tenantIdFromToken: '63e58078-2371-45be-ba1f-3b8814027b94',
  match: true ✅
}

⚙️ SettingsController.getSettings: {
  userRole: 'ADMIN',
  userTenantId: '63e58078-2371-45be-ba1f-3b8814027b94',
  reqTenantId: '63e58078-2371-45be-ba1f-3b8814027b94',
  effectiveTenantId: '63e58078-2371-45be-ba1f-3b8814027b94',
  queryTenantId: undefined
}

📋 ContactService.getContacts - tenantId: 63e58078-2371-45be-ba1f-3b8814027b94 ✅
```

## 🚨 Como Resolver Tokens Antigos

### Opção 1: Limpar Sessão (Recomendado)

```
http://localhost:3006/clear-session.html
```

### Opção 2: Console do Navegador

```javascript
localStorage.clear();
location.reload();
```

### Opção 3: DevTools

1. F12 → Application → Local Storage
2. Limpar `auth_token`
3. Recarregar página

## ✅ Checklist de Verificação

- [x] `authMiddleware` usa `user.tenantId` do banco
- [x] `settingsController` não tem IDs hardcoded
- [x] `tenantSettingsService` retorna `null` para tenants inválidos
- [x] Logs de debug adicionados
- [x] SUPERADMIN pode acessar sem tenant
- [x] Usuários normais têm tenant propagado corretamente

## 📝 Arquivos Modificados

1. ✅ `backend/src/middleware/auth.ts`

   - Usa `user.tenantId` do banco ao invés do token
   - Adiciona logs de debug
   - Melhor tratamento de `undefined`

2. ✅ `backend/src/controllers/settingsController.ts`

   - Remove ID hardcoded
   - Adiciona logs de debug
   - SUPERADMIN retorna apenas configurações globais se sem tenant

3. ✅ `backend/src/services/tenantSettingsService.ts`
   - Retorna `null` ao invés de lançar erro
   - Usa `console.warn` ao invés de `console.error`

## 🎉 Resultado

Após implementar essas correções:

- ✅ Tenant correto propagado do login até os serviços
- ✅ SUPERADMIN pode acessar dados globais
- ✅ Tokens antigos não causam mais problemas
- ✅ Logs detalhados para troubleshooting
- ✅ Sistema robusto contra IDs inválidos

---

**Data**: 2025-10-07
**Autor**: AI Assistant
**Status**: ✅ Implementado e Testado



