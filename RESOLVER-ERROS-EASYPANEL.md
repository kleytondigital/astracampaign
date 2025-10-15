# 🔧 Resolver Erros no Easypanel

## 🎯 Problemas Identificados

### 1. ❌ Frontend (Nginx): `host not found in upstream "backend"`
**Causa:** O `nginx.conf` está tentando fazer proxy para `http://backend:3001` que não existe no Easypanel.

### 2. ❌ Backend: Migration P3009 falhada no banco `b2x_crm`
**Causa:** Mesmo problema que resolvemos localmente, mas no banco de produção.

---

## ✅ Solução 1: Corrigir nginx.conf do Frontend

### Problema
O arquivo `frontend/nginx.conf` tem estas linhas:

```nginx
location /api {
    proxy_pass http://backend:3001;  # ❌ Isso não funciona no Easypanel!
}

location /socket.io {
    proxy_pass http://backend:3001;  # ❌ Não existe "backend" como hostname!
}

location /uploads {
    proxy_pass http://backend:3001;  # ❌ Erro!
}
```

### Por que não funciona?

No Easypanel, **frontend e backend são serviços separados** com seus próprios domínios:
- Frontend: `https://crm.aoseudispor.com.br`
- Backend: `https://n8n-back-crm.h3ag2x.easypanel.host`

O nginx **NÃO pode** fazer proxy para `backend:3001` porque:
- ❌ Não existe um host chamado "backend" na rede
- ❌ Os containers não estão na mesma rede Docker
- ❌ O frontend deve chamar o backend via URL pública

### Solução: Usar nginx.conf simplificado

O frontend React já tem a URL do backend configurada via `VITE_API_URL`. O nginx só precisa servir os arquivos estáticos.

**Arquivo corrigido:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Compressão Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache de assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - todas as rotas vão para index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**O que foi removido:**
- ❌ `location /api` (proxy para backend)
- ❌ `location /socket.io` (proxy para backend)
- ❌ `location /uploads` (proxy para backend)

**Por que isso funciona:**
- ✅ O frontend React faz chamadas direto para `VITE_API_URL` (https://n8n-back-crm.h3ag2x.easypanel.host)
- ✅ Não precisa de proxy no nginx
- ✅ CORS está configurado no backend (`ALLOWED_ORIGINS=*`)

---

## ✅ Solução 2: Resolver Migrations no Banco de Produção

### Problema
O backend no Easypanel está conectado ao banco `b2x_crm` no container `n8n_banco_crm`, e tem a mesma migration falhada.

### Solução via Console do Easypanel

#### Opção A: Via Console do Backend no Easypanel

1. **Acesse Easypanel** → Projeto → **Backend** → **Console**

2. Execute os comandos:

```bash
# Verificar status
npx prisma migrate status

# Marcar migration falhada como aplicada (se as tabelas já existem)
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications

# Verificar outras migrations
npx prisma migrate status

# Se houver mais migrations com erro, repita:
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many

# Verificar se está OK
npx prisma migrate status
# Deve mostrar: "Database schema is up to date!"

# Gerar Prisma Client
npx prisma generate

# Reiniciar o serviço
exit
```

3. **Reiniciar o backend** no Easypanel (botão "Restart")

#### Opção B: Via SSH no Servidor Easypanel

Se você tem acesso SSH ao servidor:

```bash
# Conectar ao container do backend
docker exec -it <nome_do_container_backend> sh

# Dentro do container, executar os mesmos comandos acima
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
# ... etc
```

#### Opção C: Deletar Registro de Migration Falhada

Se as opções acima não funcionarem:

```bash
# Conectar ao PostgreSQL
docker exec -it n8n_banco_crm psql -U postgres -d b2x_crm

# Verificar migration falhada
SELECT migration_name, started_at, finished_at, failed_at 
FROM "_prisma_migrations" 
WHERE migration_name = '20250925000000_add_alerts_notifications';

# Se finished_at é NULL e failed_at tem valor, deletar:
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20250925000000_add_alerts_notifications';

# Sair
\q

# Agora no backend, marcar como aplicada
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
```

---

## 🚀 Passo a Passo Completo

### 1️⃣ Corrigir nginx.conf

```bash
# No seu computador local
cd e:\B2X-Disparo\campaign\frontend

# Editar nginx.conf (remover as proxies para backend)
# Use o arquivo corrigido acima
```

### 2️⃣ Commitar e Push

```bash
cd e:\B2X-Disparo\campaign

git add frontend/nginx.conf
git commit -m "fix: remove nginx proxy to backend for Easypanel deployment"
git push origin main
```

### 3️⃣ Rebuild Frontend no Easypanel

1. Acesse Easypanel → Projeto → **Frontend**
2. Clique em **"Redeploy"** ou **"Rebuild"**
3. Aguarde o build terminar

### 4️⃣ Resolver Migrations no Backend

1. Acesse Easypanel → Projeto → **Backend** → **Console**
2. Execute:

```bash
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many

npx prisma migrate status
npx prisma generate
```

3. Sair do console e **Restart** o backend

### 5️⃣ Verificar

1. **Frontend**: https://crm.aoseudispor.com.br
   - Deve carregar sem erro de nginx
   
2. **Backend**: https://n8n-back-crm.h3ag2x.easypanel.host/health
   - Deve retornar status OK

---

## 📝 Verificar Configurações

### Frontend - Build Args no Easypanel

Certifique-se que o frontend tem a variável **em Build Args** (não Environment):

```
VITE_API_URL=https://n8n-back-crm.h3ag2x.easypanel.host
```

### Backend - Environment Variables

Verifique se estão corretas:

```env
DATABASE_URL=postgres://postgres:Placar083133@G@n8n_banco_crm:5432/b2x_crm?sslmode=disable
REDIS_URL=redis://default:placar083133@G@n8n_redis_crm:6379
BACKEND_URL=https://n8n-back-crm.h3ag2x.easypanel.host
ALLOWED_ORIGINS=https://crm.aoseudispor.com.br,https://n8n-front-crm.h3ag2x.easypanel.host
```

⚠️ **IMPORTANTE:** Remova a duplicação de `ALLOWED_ORIGINS` (está aparecendo 2x nas suas variáveis)

---

## 🐛 Troubleshooting

### Erro persiste: "host not found in upstream backend"

**Causa:** nginx.conf ainda tem as proxies

**Solução:**
1. Verificar se o commit foi feito
2. Verificar se o redeploy pegou a nova versão
3. Ver logs do frontend no Easypanel

### Backend continua com erro de migration

**Causa:** Migrations não foram resolvidas no banco correto

**Solução:**
1. Verificar se `DATABASE_URL` está apontando para `b2x_crm`
2. Executar os comandos `migrate resolve` novamente
3. Verificar no PostgreSQL:
   ```sql
   SELECT * FROM "_prisma_migrations" WHERE finished_at IS NULL;
   ```

### CORS error no frontend

**Causa:** `ALLOWED_ORIGINS` não está correto

**Solução:**
```env
# Certifique-se que inclui o domínio do frontend
ALLOWED_ORIGINS=https://crm.aoseudispor.com.br,https://n8n-front-crm.h3ag2x.easypanel.host
```

---

## ✅ Checklist Final

- [ ] nginx.conf corrigido (sem proxies)
- [ ] Commit e push do nginx.conf
- [ ] Frontend redeploy no Easypanel
- [ ] Migrations resolvidas no backend
- [ ] Backend reiniciado
- [ ] Frontend carrega sem erro
- [ ] Backend /health retorna OK
- [ ] Login funciona
- [ ] API calls funcionam

---

## 📚 Arquitetura Correta no Easypanel

```
┌─────────────────────────────────────────┐
│          Usuário (Navegador)            │
└────────────┬───────────────┬────────────┘
             │               │
             │               │
             ▼               ▼
┌────────────────────┐  ┌──────────────────────┐
│    Frontend        │  │     Backend          │
│ (Nginx + React)    │  │  (Node.js + Prisma)  │
│                    │  │                      │
│ crm.aoseudispor... │  │ n8n-back-crm...      │
│                    │  │                      │
│ - Serve HTML/JS    │  │ - API REST           │
│ - Sem proxy        │  │ - WebSocket          │
│                    │  │ - Uploads            │
└────────────────────┘  └──────────┬───────────┘
                                   │
                                   ▼
                        ┌──────────────────┐
                        │   PostgreSQL     │
                        │   n8n_banco_crm  │
                        │   db: b2x_crm    │
                        └──────────────────┘
```

**Comunicação:**
- Frontend → Backend: Via HTTPS público (VITE_API_URL)
- Backend → Database: Via rede Docker interna
- Nginx: Apenas serve arquivos estáticos do React

---

**Agora sim ficará funcionando!** 🚀✨

