# 📝 Variáveis de Ambiente - Documentação Completa

## 📋 Índice

1. [Backend](#backend)
2. [Frontend](#frontend)
3. [Exemplos por Ambiente](#exemplos-por-ambiente)
4. [Geração de Senhas](#geração-de-senhas)

---

## 🟢 BACKEND

### Database (PostgreSQL)

| Variável | Descrição | Exemplo Desenvolvimento | Exemplo Produção (Easypanel) |
|----------|-----------|------------------------|------------------------------|
| `DATABASE_URL` | URL completa de conexão com PostgreSQL | `postgresql://astra:senha123@localhost:5432/astra_campaign?schema=public` | `postgresql://astra:SENHA_FORTE@postgres:5432/astra_campaign?schema=public` |
| `POSTGRES_USER` | Usuário do banco (opcional, usado em docker-compose) | `astra` | `astra` |
| `POSTGRES_PASSWORD` | Senha do banco (opcional, usado em docker-compose) | `senha123` | `SenhaForte123!` |
| `POSTGRES_DB` | Nome do banco (opcional, usado em docker-compose) | `astra_campaign` | `astra_campaign` |

### Redis

| Variável | Descrição | Exemplo Desenvolvimento | Exemplo Produção (Easypanel) |
|----------|-----------|------------------------|------------------------------|
| `REDIS_HOST` | Host do Redis | `localhost` | `redis` |
| `REDIS_PORT` | Porta do Redis | `6379` | `6379` |
| `REDIS_PASSWORD` | Senha do Redis (opcional) | _(vazio)_ | _(vazio ou senha)_ |

### Server

| Variável | Descrição | Exemplo Desenvolvimento | Exemplo Produção (Easypanel) |
|----------|-----------|------------------------|------------------------------|
| `PORT` | Porta do servidor backend | `3001` | `3001` |
| `NODE_ENV` | Ambiente de execução | `development` | `production` |
| `BACKEND_URL` | URL pública do backend | `http://localhost:3001` | `https://api.seudominio.com` |

### JWT (Autenticação)

| Variável | Descrição | Exemplo | Observações |
|----------|-----------|---------|-------------|
| `JWT_SECRET` | Chave secreta para JWT | `abc123def456ghi789jkl012mno345pqr` | Mínimo 32 caracteres |

### CORS

| Variável | Descrição | Exemplo Desenvolvimento | Exemplo Produção (Easypanel) |
|----------|-----------|------------------------|------------------------------|
| `ALLOWED_ORIGINS` | URLs permitidas (separadas por vírgula) | `http://localhost:5173,http://localhost:3000` | `https://seudominio.com,https://www.seudominio.com` |

### Webhooks

| Variável | Descrição | Exemplo Desenvolvimento | Exemplo Produção (Easypanel) |
|----------|-----------|------------------------|------------------------------|
| `WEBHOOK_BASE_URL` | URL base para webhooks | `http://localhost:3001` | `https://api.seudominio.com` |

### WhatsApp - WAHA (Opcional)

| Variável | Descrição | Exemplo | Observações |
|----------|-----------|---------|-------------|
| `WAHA_API_URL` | URL da API WAHA | `https://waha.seudominio.com` | Deixe vazio se não usar |
| `WAHA_API_KEY` | Chave de API WAHA | `sua-api-key` | Deixe vazio se não usar |

### WhatsApp - Evolution API (Opcional)

| Variável | Descrição | Exemplo | Observações |
|----------|-----------|---------|-------------|
| `EVOLUTION_API_URL` | URL da API Evolution | `https://evolution.seudominio.com` | Deixe vazio se não usar |
| `EVOLUTION_API_KEY` | Chave de API Evolution | `sua-api-key` | Deixe vazio se não usar |
| `EVOLUTION_HOST` | Host da Evolution | `https://evolution.seudominio.com` | Deixe vazio se não usar |
| `EVOLUTION_API_KEY_GLOBAL` | Chave global da Evolution | `sua-api-key-global` | Deixe vazio se não usar |

### Inteligência Artificial (Opcional)

| Variável | Descrição | Exemplo | Observações |
|----------|-----------|---------|-------------|
| `OPENAI_API_KEY` | Chave da OpenAI | `sk-proj-abc123...` | Para GPT-3.5/4 |
| `GROQ_API_KEY` | Chave da Groq | `gsk_abc123...` | Alternativa rápida e gratuita |

---

## 🔵 FRONTEND

| Variável | Descrição | Exemplo Desenvolvimento | Exemplo Produção (Easypanel) |
|----------|-----------|------------------------|------------------------------|
| `VITE_API_URL` | URL da API do backend | `http://localhost:3001` | `https://api.seudominio.com` |

---

## 📋 Exemplos por Ambiente

### Desenvolvimento Local (Windows)

Crie um arquivo `.env` na pasta `backend`:

```env
# Database
DATABASE_URL=postgresql://astra:senha123@localhost:5432/astra_campaign?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3001
NODE_ENV=development
BACKEND_URL=http://localhost:3001

# JWT
JWT_SECRET=desenvolvimento-local-nao-use-em-producao-32chars

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Webhooks
WEBHOOK_BASE_URL=http://localhost:3001

# WhatsApp (deixe vazio se não usar)
WAHA_API_URL=
WAHA_API_KEY=
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_HOST=
EVOLUTION_API_KEY_GLOBAL=

# AI (deixe vazio se não usar)
OPENAI_API_KEY=
GROQ_API_KEY=
```

Crie um arquivo `.env` na pasta `frontend`:

```env
VITE_API_URL=http://localhost:3001
```

---

### Produção no Easypanel

**Backend** - Adicione estas variáveis no serviço Backend do Easypanel:

```env
# Database (ajuste conforme seus dados do PostgreSQL do Easypanel)
DATABASE_URL=postgresql://astra:SuaSenhaForte123!@postgres:5432/astra_campaign?schema=public

# Redis (ajuste conforme seus dados do Redis do Easypanel)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3001
NODE_ENV=production
BACKEND_URL=https://api.seudominio.com

# JWT (GERE UMA SENHA FORTE!)
JWT_SECRET=gere-uma-chave-aleatoria-forte-de-32-caracteres

# CORS
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# Webhooks
WEBHOOK_BASE_URL=https://api.seudominio.com

# WhatsApp (configure se usar)
WAHA_API_URL=https://waha.seudominio.com
WAHA_API_KEY=sua-chave-se-tiver
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua-chave-se-tiver
EVOLUTION_HOST=https://evolution.seudominio.com
EVOLUTION_API_KEY_GLOBAL=sua-chave-global-se-tiver

# AI (configure se usar)
OPENAI_API_KEY=sk-proj-sua-chave-aqui
GROQ_API_KEY=gsk_sua-chave-aqui
```

**Frontend** - Adicione esta variável no serviço Frontend do Easypanel:

```env
VITE_API_URL=https://api.seudominio.com
```

---

## 🔐 Geração de Senhas

### Windows (PowerShell)

```powershell
# JWT Secret (32 caracteres)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Database Password (24 caracteres)
-join ((65..90) + (97..122) + (48..57) + (33,35,37,38,42,43,45,61) | Get-Random -Count 24 | ForEach-Object {[char]$_})

# Exemplo de saída:
# JWT: abc123XYZ789def456GHI012jkl345
# Password: P@ssw0rd!2024#Strong
```

### Linux/Mac (Terminal)

```bash
# JWT Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24

# Exemplo de saída:
# JWT: Ym9keSBsaWtlIGEgYmFja3JvYWQgdGVtcGxhdGU=
# Password: cGFzc3dvcmQgbGlrZSBzdHJvbmc=
```

### Geradores Online (Use com cuidado)

- https://generate-random.org/api-token-generator
- https://passwordsgenerator.net/

**⚠️ IMPORTANTE:** Nunca use senhas fracas ou exemplos em produção!

---

## ✅ Checklist de Variáveis

### Antes do Deploy:

- [ ] `DATABASE_URL` configurada corretamente
- [ ] `REDIS_HOST` e `REDIS_PORT` corretos
- [ ] `JWT_SECRET` forte (32+ caracteres)
- [ ] `BACKEND_URL` com HTTPS em produção
- [ ] `ALLOWED_ORIGINS` apenas com domínios confiáveis
- [ ] `VITE_API_URL` apontando para backend correto
- [ ] Senhas de banco fortes (16+ caracteres)

### Segurança:

- [ ] **NUNCA** commitar arquivos `.env` para Git
- [ ] **NUNCA** usar senhas de exemplo em produção
- [ ] **SEMPRE** usar HTTPS em produção
- [ ] **SEMPRE** gerar `JWT_SECRET` aleatório
- [ ] **SEMPRE** usar senhas diferentes por ambiente

---

## 🎯 Resumo Rápido

| Ambiente | Database Host | Redis Host | Backend URL | Frontend API URL |
|----------|---------------|------------|-------------|------------------|
| **Desenvolvimento** | `localhost` | `localhost` | `http://localhost:3001` | `http://localhost:3001` |
| **Produção (Easypanel)** | `postgres` | `redis` | `https://api.seudominio.com` | `https://api.seudominio.com` |

---

## 📞 Conexões no Easypanel

No Easypanel, os serviços se comunicam pelos nomes:

```
Backend → PostgreSQL:  postgres:5432
Backend → Redis:       redis:6379
Frontend → Backend:    https://api.seudominio.com (via internet)
```

**Importante:** Backend usa nomes internos (`postgres`, `redis`), mas Frontend usa URL pública!

---

**Documentação completa de variáveis de ambiente!** 🔐✨



