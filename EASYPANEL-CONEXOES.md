# 🔌 Guia de Conexões no Easypanel

## 📊 Diagrama de Arquitetura

```
┌───────────────────────────────────────────────────────┐
│                 EASYPANEL SERVER                      │
├───────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │  PostgreSQL (postgres:5432)                     │ │
│  │  - Database: astra_campaign                     │ │
│  │  - User: astra                                  │ │
│  │  - Password: [configurado no Easypanel]         │ │
│  └─────────────────────────────────────────────────┘ │
│           ↑ Conexão Interna (postgres:5432)          │
│           │                                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Redis (redis:6379)                             │ │
│  │  - Port: 6379                                   │ │
│  │  - Password: [opcional]                         │ │
│  └─────────────────────────────────────────────────┘ │
│           ↑ Conexão Interna (redis:6379)             │
│           │                                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Backend Container                              │ │
│  │  - Node.js + Express                            │ │
│  │  - Port: 3001                                   │ │
│  │  - Domain: api.seudominio.com                   │ │
│  │                                                 │ │
│  │  Variáveis de Ambiente:                         │ │
│  │  DATABASE_URL=postgres://...@postgres:5432/...  │ │
│  │  REDIS_HOST=redis                               │ │
│  │  REDIS_PORT=6379                                │ │
│  └─────────────────────────────────────────────────┘ │
│           ↑ HTTPS (api.seudominio.com)               │
│           │                                           │
│  ┌─────────────────────────────────────────────────┐ │
│  │  Frontend Container                             │ │
│  │  - React + Nginx                                │ │
│  │  - Port: 80                                     │ │
│  │  - Domain: seudominio.com                       │ │
│  │                                                 │ │
│  │  Variáveis de Ambiente:                         │ │
│  │  VITE_API_URL=https://api.seudominio.com        │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└───────────────────────────────────────────────────────┘
         ↑ HTTPS (seudominio.com)
         │
    ┌────────┐
    │ USUÁRIO│
    └────────┘
```

---

## 🔑 Tipos de Conexão

### 1️⃣ **Conexões Internas (Dentro do Easypanel)**

Essas conexões usam nomes de serviços DNS internos:

| De | Para | Conexão | Exemplo |
|---|---|---|---|
| Backend | PostgreSQL | `postgres:5432` | `postgresql://astra:senha@postgres:5432/astra_campaign` |
| Backend | Redis | `redis:6379` | `REDIS_HOST=redis` |

⚠️ **Importante:** Use os nomes dos serviços (`postgres`, `redis`), NÃO use `localhost` ou IPs!

### 2️⃣ **Conexões Externas (Via Internet)**

Essas conexões usam domínios públicos:

| De | Para | Conexão | Exemplo |
|---|---|---|---|
| Usuário | Frontend | `https://seudominio.com` | Navegador → Frontend |
| Frontend | Backend | `https://api.seudominio.com` | Fetch/Axios → Backend |
| Usuário | Backend | `https://api.seudominio.com` | curl/Postman → API |

✅ **Importante:** Sempre use HTTPS em produção!

---

## 📝 Configuração por Serviço

### PostgreSQL (Serviço Gerenciado)

**Criação no Easypanel:**
```
+ Add Service → Database → PostgreSQL
Nome: postgres
Versão: 16
Database Name: astra_campaign
Username: astra
Password: [GERE UMA SENHA FORTE]
Port: 5432 (padrão)
```

**Após criar, anote:**
```
Host Interno: postgres
Port: 5432
Database: astra_campaign
User: astra
Password: [a senha que você definiu]
```

**String de Conexão:**
```
postgresql://astra:SENHA@postgres:5432/astra_campaign?schema=public
```

---

### Redis (Serviço Gerenciado)

**Criação no Easypanel:**
```
+ Add Service → Database → Redis
Nome: redis
Versão: 7
Port: 6379 (padrão)
Password: [opcional]
```

**Após criar, anote:**
```
Host Interno: redis
Port: 6379
Password: [vazio ou a senha definida]
```

**Variáveis para Backend:**
```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
```

---

### Backend (Container Docker)

**Criação no Easypanel:**
```
+ Add Service → App
Nome: backend
Source: Docker Image
Image: seu-usuario/astra-backend:latest
Port: 3001
Domain: api.seudominio.com
```

**Variáveis de Ambiente:**
```env
# Database (usa nome interno 'postgres')
DATABASE_URL=postgresql://astra:SUA_SENHA@postgres:5432/astra_campaign?schema=public

# Redis (usa nome interno 'redis')
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3001
NODE_ENV=production
BACKEND_URL=https://api.seudominio.com

# JWT
JWT_SECRET=gere-uma-chave-forte-de-32-caracteres

# CORS (domínio do frontend)
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Webhooks
WEBHOOK_BASE_URL=https://api.seudominio.com
```

**Volume Persistente:**
```
Source: /app/uploads
Type: Persistent Volume
```

**Health Check:**
```
Path: /health
Interval: 30s
Timeout: 10s
```

---

### Frontend (Container Docker)

**Criação no Easypanel:**
```
+ Add Service → App
Nome: frontend
Source: Docker Image
Image: seu-usuario/astra-frontend:latest
Port: 80
Domain: seudominio.com
```

**Variáveis de Ambiente:**
```env
# URL do backend (usa domínio público)
VITE_API_URL=https://api.seudominio.com
```

⚠️ **Importante:** Frontend usa URL pública do backend, não nome interno!

**Health Check:**
```
Path: /
Interval: 30s
Timeout: 3s
```

---

## 🔐 Conexões Detalhadas

### Backend → PostgreSQL

**Como funciona:**
1. Backend lê `DATABASE_URL` das variáveis de ambiente
2. Usa o nome DNS interno `postgres` (resolvido pelo Docker)
3. Conecta na porta `5432`

**String completa:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
           ↓       ↓            ↓        ↓          ↓
postgresql://astra:SenhaForte@postgres:5432/astra_campaign?schema=public
```

**Testando a conexão:**
```bash
# No console do backend (Easypanel)
npx prisma db pull
# ou
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('Conectado!')).catch(e => console.error(e))"
```

---

### Backend → Redis

**Como funciona:**
1. Backend lê `REDIS_HOST` e `REDIS_PORT`
2. Usa o nome DNS interno `redis`
3. Conecta na porta `6379`

**Variáveis:**
```env
REDIS_HOST=redis        # Nome do serviço
REDIS_PORT=6379         # Porta padrão
REDIS_PASSWORD=         # Vazio se não configurou senha
```

**Testando a conexão:**
```bash
# No console do backend
redis-cli -h redis -p 6379 ping
# Deve retornar: PONG
```

---

### Frontend → Backend

**Como funciona:**
1. Frontend lê `VITE_API_URL` (injetado no build)
2. Faz requisições HTTPS para o domínio público
3. Passa pelo SSL/HTTPS do Easypanel

**Exemplo de código React:**
```typescript
// frontend/src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL; // https://api.seudominio.com

export const api = {
  login: (credentials) => 
    fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })
}
```

---

## 🐛 Troubleshooting Comum

### ❌ Erro: "getaddrinfo ENOTFOUND localhost"

**Causa:** Backend tentando usar `localhost` ao invés de nome do serviço

**Solução:**
```diff
- DATABASE_URL=postgresql://astra:senha@localhost:5432/astra_campaign
+ DATABASE_URL=postgresql://astra:senha@postgres:5432/astra_campaign

- REDIS_HOST=localhost
+ REDIS_HOST=redis
```

---

### ❌ Erro: "CORS policy"

**Causa:** Backend não está permitindo requisições do frontend

**Solução:**
```env
# Backend: ALLOWED_ORIGINS deve incluir domínio do frontend
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

---

### ❌ Erro: "connect ETIMEDOUT"

**Causa:** Firewall ou serviço não está rodando

**Checklist:**
1. ✅ PostgreSQL está rodando? `Easypanel → postgres → Status`
2. ✅ Redis está rodando? `Easypanel → redis → Status`
3. ✅ Backend consegue resolver DNS? `docker exec backend ping postgres`

---

### ❌ Frontend não conecta no Backend

**Causa:** `VITE_API_URL` incorreto ou não definido

**Solução:**
```bash
# Verificar no browser (F12 Console):
console.log(import.meta.env.VITE_API_URL)
# Deve retornar: https://api.seudominio.com

# Se estiver undefined, rebuild o frontend com a variável correta:
VITE_API_URL=https://api.seudominio.com npm run build
docker build -t seu-usuario/astra-frontend:latest .
docker push seu-usuario/astra-frontend:latest
```

---

## ✅ Checklist de Verificação

### Antes do Deploy:

- [ ] PostgreSQL criado com senha forte
- [ ] Redis criado
- [ ] Anotei host/port/database do PostgreSQL
- [ ] Anotei host/port do Redis
- [ ] Domínios DNS apontados para servidor Easypanel

### Variáveis Backend:

- [ ] `DATABASE_URL` usa `postgres:5432`
- [ ] `REDIS_HOST` usa `redis`
- [ ] `BACKEND_URL` usa domínio público (https://)
- [ ] `ALLOWED_ORIGINS` inclui domínio do frontend
- [ ] `JWT_SECRET` tem 32+ caracteres

### Variáveis Frontend:

- [ ] `VITE_API_URL` usa domínio público do backend (https://)
- [ ] NÃO usa `localhost`

### Após Deploy:

- [ ] Backend health: `curl https://api.seudominio.com/health`
- [ ] Frontend carrega: `https://seudominio.com`
- [ ] Login funciona
- [ ] Não há erros de CORS no console

---

## 📚 Resumo Rápido

| Serviço | Host Interno | Host Externo | Porta |
|---------|--------------|--------------|-------|
| **PostgreSQL** | `postgres` | N/A | 5432 |
| **Redis** | `redis` | N/A | 6379 |
| **Backend** | `backend` | `api.seudominio.com` | 3001 |
| **Frontend** | `frontend` | `seudominio.com` | 80 |

**Regra de ouro:**
- ✅ Backend → Database/Redis: usa **nomes internos** (`postgres`, `redis`)
- ✅ Frontend → Backend: usa **domínio público** (`https://api.seudominio.com`)
- ✅ Usuário → Frontend: usa **domínio público** (`https://seudominio.com`)

---

**Guia de conexões completo!** 🔌✨



