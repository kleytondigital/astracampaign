# 🚀 Deploy Simplificado - Easypanel

## 📋 Visão Geral

Este guia mostra como fazer deploy do sistema usando **apenas Backend e Frontend** como containers Docker, enquanto **PostgreSQL e Redis** são serviços gerenciados pelo Easypanel.

---

## 🎯 Arquitetura Simplificada

```
┌─────────────────────────────────────┐
│         Easypanel Server            │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │   PostgreSQL 16              │  │
│  │   (Serviço Gerenciado)       │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Redis 7                    │  │
│  │   (Serviço Gerenciado)       │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Backend Container          │  │
│  │   (Node.js + Express)        │  │
│  │   Port: 3001                 │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │   Frontend Container         │  │
│  │   (React + Nginx)            │  │
│  │   Port: 80                   │  │
│  └──────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## 📦 Passo 1: Criar Serviços no Easypanel

### 1.1 Criar Novo Projeto

1. Acesse seu Easypanel
2. Clique em **"+ New Project"**
3. Nome: `astra-campaign` (ou o nome que preferir)
4. Environment: `Production`

### 1.2 Adicionar PostgreSQL

1. No projeto, clique em **"+ Add Service"**
2. Selecione **"Database"** → **"PostgreSQL"**
3. Configurações:
   ```
   Nome: postgres
   Versão: 16
   Database Name: astra_campaign
   Username: astra
   Password: [gerar senha forte]
   Port: 5432
   ```
4. Clique em **"Create"**
5. **Anote os dados de conexão** que aparecerem

### 1.3 Adicionar Redis

1. Clique em **"+ Add Service"**
2. Selecione **"Database"** → **"Redis"**
3. Configurações:
   ```
   Nome: redis
   Versão: 7
   Port: 6379
   Password: (opcional)
   ```
4. Clique em **"Create"**
5. **Anote o host e porta** do Redis

---

## 🔧 Passo 2: Build das Imagens Docker

### Opção A: Build Local e Push para Registry

#### 2.1 Backend

```bash
# Na pasta raiz do projeto
cd backend

# Build da imagem
docker build -t seu-registry/astra-backend:latest .

# Push para registry (Docker Hub, GHCR, etc)
docker push seu-registry/astra-backend:latest
```

#### 2.2 Frontend

```bash
# Voltar para raiz
cd ..
cd frontend

# Build da imagem
docker build -t seu-registry/astra-frontend:latest .

# Push para registry
docker push seu-registry/astra-frontend:latest
```

### Opção B: Build Direto no Easypanel (via GitHub) ⭐ RECOMENDADO

Configure o Easypanel para fazer build direto do repositório Git:
- Conecte seu repositório GitHub/GitLab
- Easypanel fará o build automaticamente
- Veja detalhes completos na seção **"Deploy com GitHub (Automático)"** abaixo

---

## 🐙 Deploy com GitHub (Automático) ⭐ MELHOR OPÇÃO

Esta é a forma **mais prática e recomendada** para fazer deploy. O Easypanel se conecta diretamente ao seu GitHub e faz build/deploy automático a cada push.

### Vantagens
- ✅ **Zero configuração** de Docker Registry
- ✅ **Auto-deploy** a cada push no GitHub
- ✅ **Build automático** no servidor
- ✅ **Rollback fácil** (redeploy de commits anteriores)
- ✅ **Sem custos** com registries externos
- ✅ **Logs de build** integrados

---

### 📁 Pré-requisitos

1. **Repositório GitHub** com o código do projeto
2. **Conta no Easypanel** com servidor rodando
3. **Dockerfiles** no projeto (backend e frontend)

**Estrutura esperada do repositório:**
```
seu-repo/
├── backend/
│   ├── Dockerfile          ← Importante!
│   ├── package.json
│   ├── src/
│   └── prisma/
├── frontend/
│   ├── Dockerfile          ← Importante!
│   ├── package.json
│   └── src/
└── README.md
```

---

### 🔗 Passo 1: Conectar GitHub ao Easypanel

#### 1.1 Gerar Token de Acesso do GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token (classic)"**
3. Configurações:
   ```
   Note: Easypanel Deploy
   Expiration: No expiration (ou 1 ano)
   
   Scopes (marcar):
   ✅ repo (Full control of private repositories)
      ✅ repo:status
      ✅ repo_deployment
      ✅ public_repo
   ✅ read:org (se repo estiver em organização)
   ```
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (você só verá uma vez!)

#### 1.2 Adicionar GitHub no Easypanel

1. Acesse Easypanel
2. Vá em **Settings** → **Git**
3. Clique em **"Add Git Provider"**
4. Escolha **"GitHub"**
5. Cole o token gerado
6. Clique em **"Save"**

---

### 🚀 Passo 2: Deploy do Backend

#### 2.1 Criar Serviço Backend

1. No projeto, clique em **"+ Add Service"**
2. Escolha **"App"**
3. Clique em **"Git Repository"**

#### 2.2 Configurar Source do Backend

```yaml
# Source Configuration
Provider: GitHub
Repository: seu-usuario/seu-repo
Branch: main (ou master)
Build Path: ./backend
Dockerfile Path: Dockerfile
```

#### 2.3 Configuração de Build

```yaml
# Build Settings
Build Context: ./backend
Dockerfile: Dockerfile
Build Args: (deixar vazio se não usar)
```

#### 2.4 Configuração do App

```yaml
# App Configuration
Service Name: backend
Container Port: 3001
Expose Port: 3001
```

#### 2.5 Variáveis de Ambiente

Adicione todas as variáveis (igual ao Passo 3.3 original):

```env
# Database
DATABASE_URL=postgresql://astra:SUA_SENHA@postgres:5432/astra_campaign?schema=public

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Server
PORT=3001
NODE_ENV=production
BACKEND_URL=https://api.seudominio.com

# JWT
JWT_SECRET=sua-chave-forte-aqui

# CORS
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com
```

#### 2.6 Volume para Uploads

```yaml
Volumes:
  /app/uploads → Persistent Volume
```

#### 2.7 Domínio

```
Domain: api.seudominio.com
SSL: Auto (Let's Encrypt)
```

#### 2.8 Deploy

1. Clique em **"Deploy"**
2. Easypanel irá:
   - ✅ Clonar o repositório
   - ✅ Fazer build da imagem Docker
   - ✅ Iniciar o container
   - ✅ Configurar SSL/HTTPS

---

### 🎨 Passo 3: Deploy do Frontend

#### 3.1 Criar Serviço Frontend

1. Clique em **"+ Add Service"**
2. Escolha **"App"**
3. Clique em **"Git Repository"**

#### 3.2 Configurar Source do Frontend

```yaml
# Source Configuration
Provider: GitHub
Repository: seu-usuario/seu-repo
Branch: main
Build Path: ./frontend
Dockerfile Path: Dockerfile
```

#### 3.3 Configuração de Build

```yaml
# Build Settings
Build Context: ./frontend
Dockerfile: Dockerfile

# Build Args (importante para o Vite!)
VITE_API_URL=https://api.seudominio.com
```

**IMPORTANTE:** O frontend precisa da variável `VITE_API_URL` em **build time**, não em runtime!

#### 3.4 Configuração do App

```yaml
# App Configuration
Service Name: frontend
Container Port: 80
Expose Port: 80
```

#### 3.5 Domínio

```
Domain: seudominio.com
SSL: Auto (Let's Encrypt)
```

#### 3.6 Deploy

1. Clique em **"Deploy"**
2. Aguarde o build e deploy automático

---

### 🔄 Passo 4: Configurar Auto-Deploy

#### 4.1 Habilitar Webhooks

No Easypanel, em cada serviço:

1. **Backend** → **Settings** → **Git**
   - ✅ Enable Auto Deploy
   - Branch: `main`
   
2. **Frontend** → **Settings** → **Git**
   - ✅ Enable Auto Deploy
   - Branch: `main`

#### 4.2 Como Funciona

Agora, a cada push no GitHub:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main
```

O Easypanel irá **automaticamente**:
1. Detectar o push via webhook
2. Clonar a nova versão
3. Fazer rebuild da imagem
4. Redeploy do container
5. Manter zero downtime

---

### 📊 Passo 5: Verificar Deploy

#### 5.1 Acompanhar Build

```
Easypanel → Projeto → Backend → Logs
```

Você verá:
```
[Build] Cloning repository...
[Build] Building Docker image...
[Build] Step 1/10 : FROM node:20-alpine
[Build] Step 2/10 : WORKDIR /app
...
[Build] Successfully built
[Deploy] Container starting...
[Deploy] Container started successfully
```

#### 5.2 Testar Backend

```bash
curl https://api.seudominio.com/health
```

#### 5.3 Testar Frontend

Abra no navegador:
```
https://seudominio.com
```

---

### 🐛 Troubleshooting GitHub Deploy

#### Problema: Build falhou - "Error cloning repository"

**Solução:**
```
1. Verificar se o token GitHub está correto
2. Ir em Settings → Git → Regenerar token
3. Verificar permissões do token (deve ter repo:full)
```

#### Problema: Build falhou - "Dockerfile not found"

**Solução:**
```
1. Verificar se Dockerfile existe em ./backend/Dockerfile
2. Verificar se Build Path está como ./backend
3. Verificar se Dockerfile Path está como Dockerfile (relativo ao Build Path)
```

#### Problema: Frontend não encontra variável VITE_API_URL

**Solução:**
```
1. Adicionar VITE_API_URL nos Build Args (não em Environment Variables)
2. Rebuild da imagem
3. Verificar se está usando ARG no Dockerfile:
   
   ARG VITE_API_URL
   ENV VITE_API_URL=$VITE_API_URL
```

#### Problema: Auto-deploy não está funcionando

**Solução:**
```
1. Verificar webhook no GitHub:
   Settings → Webhooks → Deve ter webhook do Easypanel
   
2. No Easypanel:
   Service → Settings → Git → Enable Auto Deploy deve estar ✅
   
3. Verificar branch configurada (main vs master)
```

#### Problema: Build muito lento

**Solução:**
```
1. Usar .dockerignore para excluir node_modules, .git, etc
2. Usar multi-stage builds
3. Aproveitar cache de layers do Docker
```

---

### 📝 Exemplo de Dockerfile Otimizado

#### Backend (./backend/Dockerfile)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
```

#### Frontend (./frontend/Dockerfile)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Build Args
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
dist
build
*.md
.vscode
.idea
coverage
.DS_Store
```

---

### 🔐 Exemplo de .env.example

Crie no repositório para documentar variáveis:

```env
# ===== DATABASE =====
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public

# ===== REDIS =====
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ===== SERVER =====
PORT=3001
NODE_ENV=development
BACKEND_URL=http://localhost:3001

# ===== JWT =====
JWT_SECRET=change-me-in-production

# ===== CORS =====
ALLOWED_ORIGINS=http://localhost:5173
```

---

### 🎯 Fluxo Completo de Desenvolvimento

```bash
# 1. Desenvolver localmente
git checkout -b feature/nova-funcionalidade
# ... fazer alterações ...

# 2. Testar localmente
npm run dev

# 3. Commit
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 4. Push para branch
git push origin feature/nova-funcionalidade

# 5. Criar Pull Request no GitHub
# ... code review ...

# 6. Merge para main
# GitHub: Merge Pull Request

# 7. Auto-deploy automático! 🚀
# Easypanel detecta push em main e faz deploy automaticamente
```

---

### 📈 Vantagens desta Abordagem

| Característica | Com GitHub | Com Docker Registry |
|----------------|------------|---------------------|
| **Setup Inicial** | ⭐⭐⭐⭐⭐ Simples | ⭐⭐ Complexo |
| **Auto-Deploy** | ✅ Automático | ❌ Manual |
| **Custo** | 🆓 Grátis | 💰 Registry pago |
| **Rollback** | ⭐⭐⭐⭐⭐ 1 clique | ⭐⭐ Manual |
| **CI/CD** | ✅ Integrado | ⚙️ Precisa configurar |
| **Logs de Build** | ✅ No Easypanel | ❌ Separado |

---

### ✅ Checklist Deploy GitHub

- [ ] Token GitHub criado com permissões corretas
- [ ] GitHub conectado no Easypanel (Settings → Git)
- [ ] Dockerfiles criados (backend + frontend)
- [ ] .dockerignore configurado
- [ ] PostgreSQL criado no Easypanel
- [ ] Redis criado no Easypanel
- [ ] Backend deployado via GitHub
- [ ] Frontend deployado via GitHub
- [ ] Auto-deploy habilitado em ambos
- [ ] Domínios configurados
- [ ] SSL ativo
- [ ] Webhooks funcionando
- [ ] Teste de push → auto deploy

---

## 🎉 Pronto!

Agora você tem um **pipeline de deploy totalmente automatizado**:

```
Código → GitHub → Push → Webhook → Easypanel → Build → Deploy → Online!
```

**Próximo deploy:** Apenas `git push` 🚀

---

## 🚀 Passo 3: Deploy Backend

### 3.1 Adicionar Serviço Backend

1. No projeto Easypanel, clique em **"+ Add Service"**
2. Selecione **"App"**
3. Source: **"Docker Image"** ou **"Git Repository"**

### 3.2 Configuração Backend

```yaml
# Configurações Básicas
Nome: backend
Port: 3001
Image: seu-registry/astra-backend:latest
# ou
Git Repository: https://github.com/seu-usuario/seu-repo
Build Path: ./backend
Dockerfile: Dockerfile
```

### 3.3 Variáveis de Ambiente Backend

No Easypanel, adicione as seguintes variáveis de ambiente:

```env
# ===== DATABASE =====
DATABASE_URL=postgresql://astra:SUA_SENHA@postgres:5432/astra_campaign?schema=public

# ===== REDIS =====
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# ===== SERVER =====
PORT=3001
NODE_ENV=production
BACKEND_URL=https://api.seudominio.com

# ===== JWT =====
JWT_SECRET=gere-uma-chave-forte-de-32-caracteres-aqui

# ===== CORS =====
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# ===== WHATSAPP - WAHA (Opcional) =====
WAHA_API_URL=https://waha.seudominio.com
WAHA_API_KEY=

# ===== WHATSAPP - EVOLUTION (Opcional) =====
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=
EVOLUTION_HOST=https://evolution.seudominio.com
EVOLUTION_API_KEY_GLOBAL=

# ===== AI (Opcional) =====
OPENAI_API_KEY=
GROQ_API_KEY=

# ===== WEBHOOKS =====
WEBHOOK_BASE_URL=https://api.seudominio.com
```

### 3.4 Configurar Volume para Uploads

```yaml
Volumes:
  Source: /app/uploads
  Mount Path: /app/uploads
  Type: Persistent Volume
```

### 3.5 Configurar Domínio Backend

```
Domain: api.seudominio.com
SSL: Habilitado (Let's Encrypt automático)
```

### 3.6 Health Check Backend

```yaml
Path: /health
Interval: 30s
Timeout: 10s
Retries: 3
```

---

## 🎨 Passo 4: Deploy Frontend

### 4.1 Adicionar Serviço Frontend

1. Clique em **"+ Add Service"**
2. Selecione **"App"**
3. Source: **"Docker Image"** ou **"Git Repository"**

### 4.2 Configuração Frontend

```yaml
# Configurações Básicas
Nome: frontend
Port: 80
Image: seu-registry/astra-frontend:latest
# ou
Git Repository: https://github.com/seu-usuario/seu-repo
Build Path: ./frontend
Dockerfile: Dockerfile
```

### 4.3 Variáveis de Ambiente Frontend

```env
VITE_API_URL=https://api.seudominio.com
```

### 4.4 Configurar Domínio Frontend

```
Domain: seudominio.com
SSL: Habilitado (Let's Encrypt automático)
```

### 4.5 Health Check Frontend

```yaml
Path: /
Interval: 30s
Timeout: 3s
Retries: 3
```

---

## 🌍 Passo 5: Configurar DNS

No seu provedor de DNS (Cloudflare, Namecheap, etc):

```
Tipo: A
Nome: api
Valor: [IP do seu servidor Easypanel]
TTL: Auto

Tipo: A
Nome: @
Valor: [IP do seu servidor Easypanel]
TTL: Auto

Tipo: CNAME
Nome: www
Valor: seudominio.com
TTL: Auto
```

---

## ✅ Passo 6: Verificar Deploy

### 6.1 Verificar Backend

```bash
# Health check
curl https://api.seudominio.com/health

# Deve retornar:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected"
}
```

### 6.2 Verificar Frontend

```bash
# Acessar no navegador
https://seudominio.com

# Deve carregar a aplicação
```

### 6.3 Verificar Logs

No Easypanel:
```
Projeto → Backend → Logs
Projeto → Frontend → Logs
```

---

## 🔐 Gerando Senhas Fortes

### No Windows (PowerShell):

```powershell
# JWT Secret (32 caracteres)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Database Password (24 caracteres)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_})
```

### No Linux/Mac:

```bash
# JWT Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24
```

---

## 🔄 Atualizando a Aplicação

### Método 1: Rebuild Manual

1. Faça suas alterações no código
2. Build nova imagem:
   ```bash
   docker build -t seu-registry/astra-backend:latest ./backend
   docker push seu-registry/astra-backend:latest
   ```
3. No Easypanel: **Projeto → Backend → Redeploy**

### Método 2: Auto-Deploy (Git)

Se configurou via Git Repository:
1. Faça commit das alterações
2. Push para o repositório
3. Easypanel detectará automaticamente e fará redeploy

---

## 🗄️ Migrations do Banco de Dados

### Primeira Vez (Deploy Inicial)

O backend executa automaticamente no startup:
```bash
npx prisma migrate deploy
```

### Executar Manualmente (se necessário)

No Easypanel:
1. **Projeto → Backend → Console**
2. Execute:
   ```bash
   npx prisma migrate deploy
   
   # Verificar status
   npx prisma migrate status
   
   # Seed (opcional)
   npm run seed:crm
   ```

---

## 📊 Monitoramento

### Logs em Tempo Real

```
Easypanel → Projeto → Serviço → Logs
```

### Métricas

```
Easypanel → Projeto → Serviço → Metrics
- CPU Usage
- Memory Usage
- Network I/O
- Uptime
```

### Alertas (Recomendado)

Configure alertas no Easypanel:
- CPU > 80%
- Memory > 90%
- Service Down

---

## 🛡️ Backup

### PostgreSQL

No Easypanel, configure backup automático do PostgreSQL:
```
Settings → Backups → PostgreSQL
Frequência: Diária
Retenção: 7 dias
```

### Uploads (Mídias)

Usar volume persistente do Easypanel (já configurado)

---

## 🐛 Troubleshooting

### Problema: Backend não conecta no PostgreSQL

**Solução:**
```
1. Verificar se DATABASE_URL está correto
2. Verificar se PostgreSQL está rodando
3. Testar conexão: Projeto → Backend → Console
   → npx prisma db pull
```

### Problema: Frontend não encontra Backend

**Solução:**
```
1. Verificar VITE_API_URL no frontend
2. Deve ser: https://api.seudominio.com
3. NÃO deve ser: http://localhost:3001
4. Rebuild frontend após alterar
```

### Problema: Erro de CORS

**Solução:**
```
1. Verificar ALLOWED_ORIGINS no backend
2. Deve incluir: https://seudominio.com
3. Sem barra no final!
```

### Problema: Uploads não funcionam

**Solução:**
```
1. Verificar se volume está montado: /app/uploads
2. Verificar permissões no container
3. Logs do backend para mais detalhes
```

---

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Conta Easypanel criada
- [ ] Domínios registrados
- [ ] Senhas fortes geradas

### Deploy
- [ ] PostgreSQL criado no Easypanel
- [ ] Redis criado no Easypanel
- [ ] Backend deployado
- [ ] Frontend deployado
- [ ] DNS configurado
- [ ] SSL/HTTPS ativo

### Pós-Deploy
- [ ] Health check backend: OK
- [ ] Health check frontend: OK
- [ ] Login funcionando
- [ ] Criar primeiro tenant
- [ ] Backups configurados

---

## 💰 Custo Estimado

| Recurso | Custo |
|---------|-------|
| **VPS Easypanel** | $10-40/mês |
| **Domínio** | ~$12/ano |
| **SSL** | Grátis (Let's Encrypt) |
| **Backups** | Incluído |
| **TOTAL** | **~$11-41/mês** |

---

## 🎯 Resumo das Conexões

```
Frontend (porta 80)
    ↓ HTTPS
Backend (porta 3001)
    ↓ TCP 5432
PostgreSQL (porta 5432)
    ↓ TCP 6379
Redis (porta 6379)
```

**Comunicação Interna (dentro do Easypanel):**
- Backend → PostgreSQL: `postgres:5432`
- Backend → Redis: `redis:6379`
- Frontend → Backend: `https://api.seudominio.com`

---

## 📚 Próximos Passos

Após deploy bem-sucedido:

1. ✅ Criar primeiro usuário admin
2. ✅ Criar primeiro tenant
3. ✅ Configurar WhatsApp (se necessário)
4. ✅ Testar envio de mensagens
5. ✅ Configurar backups automáticos
6. ✅ Monitorar logs e métricas

---

## 🎉 Deploy Completo!

Seu sistema está rodando em produção de forma simplificada:
- ✅ PostgreSQL e Redis gerenciados pelo Easypanel
- ✅ Apenas Backend e Frontend containerizados
- ✅ SSL/HTTPS automático
- ✅ Fácil de atualizar e escalar

**Dúvidas?** Consulte os logs do Easypanel ou a documentação oficial.

---

**Deploy simplificado e pronto para uso!** 🚀✨



