# 🔄 Regenerar Prisma Client no Backend

## ⚠️ IMPORTANTE: Execute isto no terminal do backend no Easypanel

O Prisma Client está usando um schema antigo que ainda tem o campo `department` no User.
Precisamos regenerar o Client com o novo schema.

---

## 🚀 Opção 1: Usar o Script Automatizado

```bash
cd /app
chmod +x regenerate-prisma.sh
./regenerate-prisma.sh
```

Depois **reinicie o container do backend**.

---

## 🛠️ Opção 2: Executar Manualmente

```bash
cd /app

# 1. Limpar cache do Prisma
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client

# 2. Regenerar Prisma Client
npx prisma generate

# 3. Validar schema
npx prisma validate

# 4. Verificar se funcionou
npx prisma db pull
```

Depois **reinicie o container do backend**.

---

## 📋 O que isso resolve:

- ❌ **Erro:** `Unknown field 'department' for include statement on model 'User'`
- ❌ **Erro:** `Unknown argument 'departmentId' for User`
- ✅ **Novo schema:** User agora tem `departments` (relacionamento N:N via UserDepartment)

---

## ✅ Como verificar se funcionou:

Após reiniciar, o backend deve:
- ✅ Iniciar sem erros
- ✅ Aceitar queries com `user.departments`
- ✅ Rejeitar queries com `user.department` ou `user.departmentId`

Os logs devem mostrar:
```
✅ Servidor backend rodando na porta 3001
🔌 WebSocket configurado
```

E não deve mais aparecer:
```
❌ Unknown field 'department' for include statement on model 'User'
```

---

## 🆘 Se o problema persistir:

Execute no terminal do backend:

```bash
# Forçar rebuild completo
npm install --force
npx prisma generate --force
```

Depois reinicie o container.

