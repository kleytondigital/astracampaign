# ⚡ Quick Start - Deploy Easypanel

## 🚀 Deploy em 10 Minutos

Este guia mostra os passos essenciais para fazer deploy no Easypanel de forma rápida.

---

## 📦 1. Preparar Imagens Docker

### Backend

```bash
cd backend
docker build -t seu-usuario/astra-backend:latest .
docker push seu-usuario/astra-backend:latest
```

### Frontend

```bash
cd frontend
docker build -t seu-usuario/astra-frontend:latest .
docker push seu-usuario/astra-frontend:latest
```

---

## 🗄️ 2. Criar Serviços no Easypanel

### PostgreSQL

```
+ Add Service → Database → PostgreSQL
Nome: postgres
Versão: 16
Database: astra_campaign
User: astra
Password: [gerar senha forte]
```

### Redis

```
+ Add Service → Database → Redis
Nome: redis
Versão: 7
```

### Backend

```
+ Add Service → App
Nome: backend
Image: seu-usuario/astra-backend:latest
Port: 3001
Domain: api.seudominio.com

Environment Variables:
DATABASE_URL=postgresql://astra:SENHA@postgres:5432/astra_campaign?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
PORT=3001
NODE_ENV=production
BACKEND_URL=https://api.seudominio.com
JWT_SECRET=[gerar com: openssl rand -base64 32]
ALLOWED_ORIGINS=https://seudominio.com

Volume:
/app/uploads → Persistent Volume
```

### Frontend

```
+ Add Service → App
Nome: frontend
Image: seu-usuario/astra-frontend:latest
Port: 80
Domain: seudominio.com

Environment Variables:
VITE_API_URL=https://api.seudominio.com
```

---

## 🌍 3. Configurar DNS

No seu provedor de DNS:

```
Tipo A:     api    →  [IP do Easypanel]
Tipo A:     @      →  [IP do Easypanel]
Tipo CNAME: www    →  seudominio.com
```

---

## ✅ 4. Verificar

```bash
# Backend
curl https://api.seudominio.com/health

# Frontend
https://seudominio.com (no navegador)
```

---

## 🎉 Pronto!

Sistema rodando em produção! 🚀

---

## 📚 Próximos Passos

1. Acessar frontend
2. Criar primeiro usuário
3. Criar primeiro tenant
4. Configurar WhatsApp (opcional)
5. Configurar backups

---

## 🔗 Links Úteis

- **Guia Completo:** [DEPLOY-EASYPANEL-SIMPLIFICADO.md](./DEPLOY-EASYPANEL-SIMPLIFICADO.md)
- **Variáveis de Ambiente:** [VARIAVEIS-AMBIENTE.md](./VARIAVEIS-AMBIENTE.md)

---

**Deploy rápido concluído!** ⚡✨



