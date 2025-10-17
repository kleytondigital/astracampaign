# ✅ Checklist Deploy Easypanel

## 🎯 Passo a Passo Rápido

### 1️⃣ Preparação (Local)

```bash
# Build e Push das imagens
.\build-and-push.bat  # Windows
# ou
./build-and-push.sh   # Linux/Mac

# Anotar:
# - seu-usuario/astra-backend:latest
# - seu-usuario/astra-frontend:latest
```

- [ ] Imagens buildadas e enviadas para registry

---

### 2️⃣ Easypanel - PostgreSQL

```
+ Add Service → Database → PostgreSQL

Nome: postgres
Versão: 16
Database: astra_campaign
User: astra
Password: [SENHA FORTE - ANOTE!]
```

- [ ] PostgreSQL criado
- [ ] Senha anotada: `________________`

---

### 3️⃣ Easypanel - Redis

```
+ Add Service → Database → Redis

Nome: redis
Versão: 7
```

- [ ] Redis criado

---

### 4️⃣ Easypanel - Backend

```
+ Add Service → App

Nome: backend
Image: seu-usuario/astra-backend:latest
Port: 3001
Domain: api.seudominio.com
```

**Variáveis de Ambiente:**
```
DATABASE_URL=postgresql://astra:SENHA_AQUI@postgres:5432/astra_campaign?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
PORT=3001
NODE_ENV=production
BACKEND_URL=https://api.seudominio.com
JWT_SECRET=GERAR_SENHA_32_CHARS
ALLOWED_ORIGINS=https://seudominio.com
WEBHOOK_BASE_URL=https://api.seudominio.com
```

**Volume:**
```
/app/uploads → Persistent Volume
```

- [ ] Backend criado
- [ ] Variáveis configuradas
- [ ] Volume configurado
- [ ] Domínio configurado

---

### 5️⃣ Easypanel - Frontend

```
+ Add Service → App

Nome: frontend
Image: seu-usuario/astra-frontend:latest
Port: 80
Domain: seudominio.com
```

**Variáveis de Ambiente:**
```
VITE_API_URL=https://api.seudominio.com
```

- [ ] Frontend criado
- [ ] Variável configurada
- [ ] Domínio configurado

---

### 6️⃣ DNS

**No seu provedor de DNS:**

```
Tipo: A
Nome: api
Valor: [IP DO EASYPANEL]

Tipo: A
Nome: @
Valor: [IP DO EASYPANEL]

Tipo: CNAME
Nome: www
Valor: seudominio.com
```

- [ ] DNS configurado
- [ ] Aguardar propagação (5-30 minutos)

---

### 7️⃣ Verificação

```bash
# Backend
curl https://api.seudominio.com/health
# Esperado: {"status":"ok","database":"connected","redis":"connected"}

# Frontend (navegador)
https://seudominio.com
# Esperado: Página de login carrega
```

- [ ] Backend responde
- [ ] Frontend carrega
- [ ] Login funciona
- [ ] SSL/HTTPS ativo

---

## 🔐 Senhas a Gerar

### PostgreSQL Password (24 caracteres)
```powershell
# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_})
```
**Anote aqui:** `________________________`

### JWT Secret (32 caracteres)
```powershell
# Windows PowerShell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```
**Anote aqui:** `________________________________`

---

## 📋 Informações do Deploy

**Data do Deploy:** ___/___/______

**Dados do Servidor:**
- IP: `_______________`
- Easypanel URL: `___________________________`

**Dados do PostgreSQL:**
- Host interno: `postgres`
- Port: `5432`
- Database: `astra_campaign`
- User: `astra`
- Password: `________________________`

**Dados do Redis:**
- Host interno: `redis`
- Port: `6379`

**Domínios:**
- Frontend: `https://________________________`
- Backend: `https://________________________`

**Registry:**
- Backend Image: `________________________`
- Frontend Image: `________________________`

---

## 🚨 Em Caso de Erro

### Erro: Backend não inicia

```bash
# Ver logs
Easypanel → backend → Logs

# Verificar se DATABASE_URL está correto
# Verificar se PostgreSQL está rodando
```

### Erro: CORS

```bash
# Verificar ALLOWED_ORIGINS no backend
# Deve ser: https://seudominio.com (sem barra no final)
```

### Erro: Frontend não carrega

```bash
# Verificar se VITE_API_URL está correto
# Rebuild se necessário
```

---

## 🎉 Deploy Completo!

- [ ] Sistema funcionando
- [ ] Backup configurado (Easypanel → Settings → Backups)
- [ ] Primeiro usuário criado
- [ ] Primeiro tenant criado
- [ ] WhatsApp conectado (opcional)

---

## 📞 Suporte

**Documentação:**
- [Guia Completo](./DEPLOY-EASYPANEL-SIMPLIFICADO.md)
- [Variáveis de Ambiente](./VARIAVEIS-AMBIENTE.md)
- [Conexões](./EASYPANEL-CONEXOES.md)

**Comunidade:**
- [Grupo WhatsApp](https://chat.whatsapp.com/LMa44csoeoS9gMjamMpbOK)
- [GitHub Issues](https://github.com/AstraOnlineWeb/astracampaign/issues)

---

**Checklist completo!** ✅🚀




