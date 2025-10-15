# 🚀 Guia Completo: Deploy no EasyPanel

## 📋 **VISÃO GERAL**

Este guia mostra como fazer deploy do **Astra Campaign CRM** no EasyPanel usando Docker e GitHub Actions.

---

## 🎯 **ARQUITETURA DO DEPLOY**

```
GitHub Repository
      ↓ (push to main)
GitHub Actions (CI/CD)
      ↓ (build images)
GitHub Container Registry
      ↓ (pull images)
EasyPanel
      ↓ (deploy)
Produção (containers rodando)
```

---

## 📦 **COMPONENTES**

### **1. Containers:**
- 🐘 **PostgreSQL 16** - Banco de dados
- 🔴 **Redis 7** - Cache e filas
- 🟢 **Backend** - API Node.js + Express + Prisma
- 🔵 **Frontend** - React + Vite + Nginx

### **2. Volumes Persistentes:**
- 📁 `postgres_data` - Dados do PostgreSQL
- 📁 `redis_data` - Dados do Redis
- 📁 `uploads_data` - Arquivos de upload (mídias)

### **3. Network:**
- 🌐 `astra-network` - Rede interna Docker

---

## 🔧 **PASSO 1: Preparar Repositório GitHub**

### **1.1 Criar Repositório**
```bash
# No GitHub, criar repositório privado:
# Nome: astra-campaign-crm
# Visibilidade: Private (ou Public)
```

### **1.2 Adicionar Secrets no GitHub**

Ir em: **Settings → Secrets and variables → Actions → New repository secret**

**Secrets Obrigatórios:**
```
POSTGRES_PASSWORD          → Senha forte do PostgreSQL
JWT_SECRET                 → Chave JWT (mín. 32 caracteres)
BACKEND_URL                → https://api.seudominio.com
ALLOWED_ORIGINS            → https://seudominio.com
EASYPANEL_WEBHOOK_URL      → URL do webhook do EasyPanel
```

**Secrets Opcionais (WhatsApp):**
```
WAHA_API_URL               → https://waha.seudominio.com
WAHA_API_KEY               → sua-api-key
EVOLUTION_API_URL          → https://evolution.seudominio.com
EVOLUTION_API_KEY          → sua-api-key
EVOLUTION_HOST             → https://evolution.seudominio.com
EVOLUTION_API_KEY_GLOBAL   → sua-api-key-global
```

**Secrets Opcionais (AI):**
```
OPENAI_API_KEY             → sk-proj-...
GROQ_API_KEY               → gsk_...
```

### **1.3 Push do Código**
```bash
git init
git add .
git commit -m "Initial commit: Astra Campaign CRM"
git branch -M main
git remote add origin https://github.com/seu-usuario/astra-campaign-crm.git
git push -u origin main
```

---

## 🌐 **PASSO 2: Configurar EasyPanel**

### **2.1 Acessar EasyPanel**
```
https://easypanel.seuservidor.com
```

### **2.2 Criar Novo Projeto**
1. Clicar em **"+ New Project"**
2. Nome: `astra-campaign`
3. Environment: `Production`

### **2.3 Adicionar Services**

#### **A) PostgreSQL**
```yaml
Service Type: Database
Database Type: PostgreSQL
Version: 16
Database Name: astra_campaign
Username: astra
Password: [usar senha forte]
Port: 5432
Volume: /var/lib/postgresql/data
```

#### **B) Redis**
```yaml
Service Type: Database
Database Type: Redis
Version: 7
Port: 6379
Volume: /data
```

#### **C) Backend**
```yaml
Service Type: App
Source: Docker Image
Image: ghcr.io/seu-usuario/astra-campaign-crm/backend:latest
Port: 3001
Domain: api.seudominio.com

Environment Variables:
  DATABASE_URL: postgresql://astra:PASSWORD@postgres:5432/astra_campaign
  REDIS_HOST: redis
  REDIS_PORT: 6379
  PORT: 3001
  NODE_ENV: production
  BACKEND_URL: https://api.seudominio.com
  JWT_SECRET: [copiar do GitHub Secrets]
  ALLOWED_ORIGINS: https://seudominio.com
  # ... adicionar outras variáveis

Volumes:
  /app/uploads → Persistent Volume (uploads-data)

Health Check:
  Path: /health
  Interval: 30s
  Timeout: 10s
```

#### **D) Frontend**
```yaml
Service Type: App
Source: Docker Image
Image: ghcr.io/seu-usuario/astra-campaign-crm/frontend:latest
Port: 80
Domain: seudominio.com

Environment Variables:
  VITE_API_URL: https://api.seudominio.com

Health Check:
  Path: /
  Interval: 30s
  Timeout: 3s
```

### **2.4 Configurar Webhook (Opcional)**
Para deploy automático via GitHub Actions:

1. Em **Settings → Webhooks**
2. Copiar URL do webhook
3. Adicionar como Secret `EASYPANEL_WEBHOOK_URL` no GitHub

---

## 🔄 **PASSO 3: Configurar CI/CD**

### **3.1 Workflow GitHub Actions**

O arquivo `.github/workflows/deploy.yml` já está criado!

**Gatilhos:**
- ✅ Push na branch `main` ou `production`
- ✅ Manual via GitHub Actions UI

**Fluxo:**
```
1. Checkout código
   ↓
2. Build imagem Backend (multi-stage)
   ↓
3. Build imagem Frontend (multi-stage)
   ↓
4. Push para GitHub Container Registry
   ↓
5. Trigger webhook do EasyPanel
   ↓
6. EasyPanel puxa novas imagens
   ↓
7. Deploy com zero downtime
```

### **3.2 Habilitar GitHub Container Registry**

1. Ir em **Settings → Packages**
2. Mudar visibilidade para **Public** (ou manter Private)
3. Gerar **Personal Access Token (PAT)**:
   - Ir em **Settings → Developer settings → Personal access tokens → Tokens (classic)**
   - Scopes: `write:packages`, `read:packages`, `delete:packages`
   - Adicionar como Secret `GHCR_TOKEN` (se necessário)

---

## 🗄️ **PASSO 4: Migração de Banco de Dados**

### **4.1 Primeira Vez (Deploy Inicial)**

O backend executa automaticamente:
```bash
npx prisma migrate deploy
```

### **4.2 Executar Migrations Manualmente (se necessário)**

Via EasyPanel Console:
```bash
# Conectar ao container backend
docker exec -it astra-backend sh

# Executar migration
npx prisma migrate deploy

# Verificar status
npx prisma migrate status

# Seed (opcional)
npm run seed:crm
```

---

## 🔐 **PASSO 5: Variáveis de Ambiente**

### **Criar arquivo `.env` no EasyPanel:**

**Backend:**
```env
# Database
DATABASE_URL=postgresql://astra:PASSWORD@postgres:5432/astra_campaign

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Server
PORT=3001
NODE_ENV=production
BACKEND_URL=https://api.seudominio.com

# JWT
JWT_SECRET=sua-chave-secreta-muito-forte-min-32-chars

# CORS
ALLOWED_ORIGINS=https://seudominio.com,https://www.seudominio.com

# WhatsApp (opcional)
WAHA_API_URL=https://waha.seudominio.com
WAHA_API_KEY=sua-api-key
EVOLUTION_API_URL=https://evolution.seudominio.com
EVOLUTION_API_KEY=sua-api-key

# AI (opcional)
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
```

**Frontend:**
```env
VITE_API_URL=https://api.seudominio.com
```

---

## 🌍 **PASSO 6: Configurar Domínios**

### **6.1 DNS Records**

Adicionar no seu provedor de DNS (Cloudflare, Route53, etc):

```
Type: A
Name: api
Value: [IP do EasyPanel]
TTL: Auto

Type: A
Name: @
Value: [IP do EasyPanel]
TTL: Auto

Type: CNAME
Name: www
Value: seudominio.com
TTL: Auto
```

### **6.2 SSL/TLS**

EasyPanel configura automaticamente via **Let's Encrypt**!

---

## 🚀 **PASSO 7: Deploy**

### **Método 1: Via GitHub Actions (Recomendado)**

```bash
# Fazer qualquer alteração
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# GitHub Actions vai:
# 1. Build das imagens
# 2. Push para GHCR
# 3. Trigger deploy no EasyPanel
# 4. Deploy automático!
```

### **Método 2: Deploy Manual no EasyPanel**

1. Ir no projeto no EasyPanel
2. Clicar em **"Deploy"**
3. Selecionar serviço (Backend/Frontend)
4. Clicar em **"Redeploy"**
5. Aguardar conclusão

---

## 📊 **PASSO 8: Monitoramento**

### **8.1 Logs no EasyPanel**

```
EasyPanel → Projeto → Service → Logs (Real-time)
```

### **8.2 Health Checks**

**Backend:**
```bash
curl https://api.seudominio.com/health
# Resposta esperada: { "status": "ok" }
```

**Frontend:**
```bash
curl https://seudominio.com
# Resposta esperada: 200 OK
```

### **8.3 Métricas**

EasyPanel mostra:
- 📊 CPU usage
- 💾 Memory usage
- 📈 Network I/O
- 🔄 Uptime

---

## 🔄 **PASSO 9: Atualizações**

### **9.1 Atualização Automática (GitHub Actions)**

```bash
# Fazer alterações
git add .
git commit -m "fix: correção de bug"
git push origin main

# Deploy automático em ~5 minutos!
```

### **9.2 Rollback (se necessário)**

```bash
# Via EasyPanel:
1. Ir em Deployments
2. Selecionar versão anterior
3. Clicar em "Redeploy"

# Via GitHub:
git revert HEAD
git push origin main
```

---

## 🛡️ **PASSO 10: Backup**

### **10.1 Backup Automático do PostgreSQL**

Criar cronjob no EasyPanel:
```bash
# Diário às 2h da manhã
0 2 * * * docker exec astra-postgres pg_dump -U astra astra_campaign > /backups/backup-$(date +\%Y\%m\%d).sql
```

### **10.2 Backup dos Uploads**

```bash
# Semanal
0 3 * * 0 tar -czf /backups/uploads-$(date +\%Y\%m\%d).tar.gz /app/uploads
```

---

## 📋 **CHECKLIST DE DEPLOY**

### **Pré-Deploy:**
- [ ] Repositório GitHub criado
- [ ] Secrets configurados no GitHub
- [ ] Conta EasyPanel ativa
- [ ] Domínios apontando para EasyPanel
- [ ] `.env` configurado

### **Durante Deploy:**
- [ ] PostgreSQL container rodando
- [ ] Redis container rodando
- [ ] Backend container rodando
- [ ] Frontend container rodando
- [ ] Migrations executadas
- [ ] Health checks OK

### **Pós-Deploy:**
- [ ] Acesso ao frontend: `https://seudominio.com`
- [ ] Acesso ao backend: `https://api.seudominio.com/health`
- [ ] Login funcionando
- [ ] Criação de tenant funcionando
- [ ] WhatsApp conectando (se configurado)
- [ ] Backups configurados
- [ ] Monitoramento ativo

---

## 🎯 **CUSTO ESTIMADO**

### **EasyPanel (VPS):**
- **Nano:** $5/mês (1 CPU, 1GB RAM) - Teste
- **Micro:** $10/mês (1 CPU, 2GB RAM) - Pequeno
- **Small:** $20/mês (2 CPU, 4GB RAM) - **Recomendado**
- **Medium:** $40/mês (4 CPU, 8GB RAM) - Grande

### **Extras:**
- **Domínio:** ~$12/ano
- **SSL:** Grátis (Let's Encrypt)
- **Backups:** Incluído

**Total Recomendado:** ~$20/mês + domínio

---

## 🚀 **DEPLOY RÁPIDO (Quick Start)**

### **Opção 1: Via EasyPanel UI (Mais Simples)**

```bash
# 1. Fazer push do código
git push origin main

# 2. No EasyPanel:
- Criar novo projeto
- Adicionar PostgreSQL
- Adicionar Redis
- Adicionar Backend (Docker Image)
  → Image: ghcr.io/seu-usuario/astra-campaign-crm/backend:latest
- Adicionar Frontend (Docker Image)
  → Image: ghcr.io/seu-usuario/astra-campaign-crm/frontend:latest
- Configurar domínios
- Deploy!

# Pronto em 10 minutos! ✅
```

### **Opção 2: Via Docker Compose (Avançado)**

```bash
# 1. No EasyPanel, criar projeto vazio
# 2. Fazer upload do docker-compose.production.yml
# 3. Configurar variáveis de ambiente
# 4. Deploy!
```

---

## 🔐 **SEGURANÇA**

### **Recomendações:**

1. **Usar HTTPS** (Let's Encrypt automático)
2. **JWT Secret forte** (32+ caracteres aleatórios)
3. **Database password forte** (16+ caracteres)
4. **Firewall:** Apenas portas 80/443 abertas
5. **Rate Limiting:** Já configurado no backend
6. **CORS:** Restrito aos domínios configurados
7. **Environment Variables:** Nunca commitar `.env`

### **Gerar Secrets Fortes:**

```bash
# JWT Secret
openssl rand -base64 32

# Database Password
openssl rand -base64 24

# Session Secret
openssl rand -hex 32
```

---

## 📊 **MONITORAMENTO**

### **1. Logs em Tempo Real**
```
EasyPanel → Logs → Select Service
```

### **2. Métricas**
```
EasyPanel → Metrics
- CPU: < 70%
- Memory: < 80%
- Disk: < 90%
```

### **3. Alertas (Configurar)**
```
EasyPanel → Alerts
- CPU > 80% → Email
- Memory > 90% → Email
- Service Down → Email
```

---

## 🔄 **WORKFLOW DE DESENVOLVIMENTO**

### **Desenvolvimento Local:**
```bash
# Usar docker-compose.dev.yml (já existe)
docker-compose -f docker-compose.dev.yml up
```

### **Staging (Opcional):**
```bash
# Branch: staging
git push origin staging

# Deploy automático em ambiente de staging
```

### **Produção:**
```bash
# Branch: main
git push origin main

# Deploy automático em produção
```

---

## 🐛 **TROUBLESHOOTING**

### **Problema: Container não inicia**
```bash
# Ver logs
docker logs astra-backend --tail 100

# Verificar variáveis
docker exec astra-backend env | grep DATABASE
```

### **Problema: Migrations falham**
```bash
# Conectar ao container
docker exec -it astra-backend sh

# Verificar conexão com banco
npx prisma db pull

# Executar migration manualmente
npx prisma migrate deploy --schema=./prisma/schema.prisma
```

### **Problema: Frontend não conecta no Backend**
```bash
# Verificar VITE_API_URL
# Deve ser: https://api.seudominio.com
# NÃO deve ser: http://localhost:3001
```

### **Problema: CORS Error**
```bash
# Verificar ALLOWED_ORIGINS no backend
# Deve incluir: https://seudominio.com
```

---

## 📈 **ESCALABILIDADE**

### **1. Escalar Horizontalmente (Múltiplas Instâncias)**

No EasyPanel:
```
Backend → Scaling → Replicas: 2-5
```

### **2. Banco de Dados**

Para > 10.000 usuários:
```
- Migrar para PostgreSQL Managed (AWS RDS, Digital Ocean)
- Habilitar conexões pooling
- Adicionar read replicas
```

### **3. Redis**

Para cache distribuído:
```
- Migrar para Redis Managed (AWS ElastiCache, Upstash)
```

### **4. CDN**

Para assets estáticos:
```
- Cloudflare (grátis!)
- AWS CloudFront
```

---

## 💰 **CUSTOS MENSAIS (Estimado)**

| Componente | Desenvolvimento | Produção (Pequeno) | Produção (Grande) |
|------------|----------------|-------------------|-------------------|
| **VPS EasyPanel** | $5 | $20 | $80 |
| **Domínio** | $1 | $1 | $1 |
| **SSL** | Grátis | Grátis | Grátis |
| **Backups** | Incluído | Incluído | $5 |
| **CDN** | Grátis | Grátis | $10 |
| **Monitoring** | Grátis | Grátis | $10 |
| **TOTAL** | **$6/mês** | **$21/mês** | **$106/mês** |

**vs CRM Comercial:** HubSpot = $1.200/mês 💰

---

## 🎯 **RECOMENDAÇÕES FINAIS**

### **Para Começar:**
1. ✅ Use **EasyPanel Small** ($20/mês)
2. ✅ Configure **backups automáticos**
3. ✅ Monitore **métricas diárias**
4. ✅ Use **GitHub Actions** para CI/CD

### **Para Escalar:**
1. ✅ Adicione **réplicas do backend**
2. ✅ Migre para **DB managed**
3. ✅ Use **CDN** (Cloudflare)
4. ✅ Adicione **monitoring** (Sentry, DataDog)

### **Para Produção:**
1. ✅ SSL/TLS obrigatório
2. ✅ Backups diários
3. ✅ Alertas configurados
4. ✅ Health checks ativos

---

## 🎉 **RESULTADO ESPERADO**

Após seguir este guia:

- ✅ Sistema rodando em produção
- ✅ Deploy automático via GitHub
- ✅ Zero downtime deployments
- ✅ SSL/HTTPS automático
- ✅ Backups configurados
- ✅ Monitoramento ativo
- ✅ Escalável e profissional

**Tempo total:** ~2 horas (primeira vez) ou ~30 minutos (próximas vezes)

---

## 📚 **RECURSOS ÚTEIS**

- **EasyPanel Docs:** https://easypanel.io/docs
- **Docker Docs:** https://docs.docker.com
- **GitHub Actions:** https://docs.github.com/actions
- **Prisma Migrations:** https://www.prisma.io/docs/guides/migrate

---

**Deploy configurado e pronto para produção!** 🚀✨




