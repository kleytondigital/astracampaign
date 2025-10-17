# 🔄 Instruções para Reiniciar Backend no Easypanel

## 📋 **Quando Reiniciar**

Você precisa reiniciar o backend quando:
- ✅ Adicionar novas rotas (ex: `/api/superadmin`)
- ✅ Modificar arquivos `.ts` do backend
- ✅ Adicionar novos controllers
- ✅ Modificar variáveis de ambiente
- ✅ Após aplicar migrações do Prisma

---

## 🚀 **Como Reiniciar no Easypanel**

### **Opção 1: Via Dashboard (Recomendado)**

1. ✅ Acesse: https://app.easypanel.io/
2. ✅ Login com suas credenciais
3. ✅ Selecione seu projeto
4. ✅ Vá em **Services** → **backend**
5. ✅ Clique em **"Restart"** ou **"Redeploy"**
6. ✅ Aguarde 2-3 minutos

### **Opção 2: Via Git Push (Auto-Deploy)**

Se você tem auto-deploy configurado:
```bash
# O deploy já foi feito automaticamente ao fazer git push
# Apenas aguarde 2-3 minutos para o container reiniciar
```

### **Opção 3: Forçar Rebuild**

Se mudou dependências ou Dockerfile:
1. ✅ Acesse Easypanel → Backend Service
2. ✅ Clique em **"Settings"**
3. ✅ Clique em **"Rebuild"**
4. ✅ Aguarde 5-10 minutos (rebuild completo)

---

## ✅ **Verificar se Reiniciou**

### **1. Verificar Logs**
```
Easypanel → Backend → Logs
```

**Logs esperados:**
```
🚀 Servidor iniciado na porta 3001
✅ Conectado ao banco de dados
📡 WebSocket server iniciado
```

### **2. Testar Rota**
```bash
curl https://backendcrm.aoseudispor.com.br/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-17T...",
  "uptime": 123
}
```

### **3. Testar Nova Rota SUPERADMIN**
```bash
curl -H "Authorization: Bearer SEU_TOKEN" \
     https://backendcrm.aoseudispor.com.br/api/superadmin/tenants
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": [ ... ]
}
```

---

## ⏱️ **Tempo de Reinicialização**

| Ação | Tempo Estimado |
|------|----------------|
| Restart | 1-2 minutos |
| Redeploy | 2-3 minutos |
| Rebuild | 5-10 minutos |

---

## 🔴 **Status do Backend Atual**

### **Problema:**
```
GET /api/superadmin/tenants → 404 Not Found
```

**Causa:** 
- Código foi commitado e está no GitHub
- Mas o container do backend ainda não reiniciou
- Easypanel precisa fazer redeploy

### **Solução:**
1. ✅ Acesse Easypanel
2. ✅ Backend Service → **Restart** ou **Redeploy**
3. ✅ Aguarde 2-3 minutos
4. ✅ Teste novamente

---

## 🧪 **Como Confirmar que Funcionou**

### **No Frontend:**
1. ✅ Acesse: `https://crm.aoseudispor.com.br/empresas`
2. ✅ Abra DevTools → Network
3. ✅ Deve fazer: `GET /api/superadmin/tenants`
4. ✅ Deve retornar: `200 OK` (não 404)

### **No Backend (Logs):**
```
🔧 Rotas carregadas:
  - /api/superadmin (SuperAdmin management) ✅
```

---

## 📝 **Checklist Pós-Reinicialização**

```
[ ] Backend reiniciado no Easypanel
[ ] Logs mostram "Servidor iniciado"
[ ] Health check retorna OK
[ ] GET /api/superadmin/tenants retorna 200
[ ] Frontend carrega lista de tenants
[ ] SUPERADMIN consegue criar novo tenant
```

---

## 🚨 **Troubleshooting**

### **Erro: 404 persiste após reiniciar**
- Verificar se o código está na branch `main`
- Verificar se Easypanel está olhando a branch correta
- Fazer rebuild ao invés de restart

### **Erro: Backend não inicia**
- Verificar logs no Easypanel
- Procurar por erros de compilação TypeScript
- Verificar se todas as dependências estão instaladas

### **Erro: "Prisma Client not generated"**
- Fazer rebuild (não apenas restart)
- Verificar se `npx prisma generate` roda no Dockerfile

---

## 🔗 **Links Úteis**

- **Easypanel Dashboard:** https://app.easypanel.io/
- **Backend URL:** https://backendcrm.aoseudispor.com.br
- **Frontend URL:** https://crm.aoseudispor.com.br
- **GitHub Repo:** https://github.com/kleytondigital/astracampaign

---

## ✅ **Próximos Passos**

Após reiniciar o backend:
1. ✅ Acesse `/empresas` como SUPERADMIN
2. ✅ Crie um tenant de teste
3. ✅ Faça login como admin do tenant criado
4. ✅ Verifique isolamento de dados

**O sistema está pronto! Só falta reiniciar o backend.** 🎉

