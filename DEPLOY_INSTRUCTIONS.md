# 🚀 Instruções para Aplicar Migração no Easypanel

## ⚠️ O backend está com erro porque o banco de dados precisa ser atualizado

Execute os seguintes comandos **no terminal do container do backend** no Easypanel:

### 1️⃣ Acessar o terminal do backend no Easypanel
- Vá até o serviço `backend` no Easypanel
- Clique em "Terminal" ou "Console"

### 2️⃣ Executar os comandos de migração

```bash
# Gerar o Prisma Client com as novas mudanças
npx prisma generate

# Aplicar as mudanças no banco de dados (sem criar migration)
npx prisma db push

# Verificar se as mudanças foram aplicadas
npx prisma db pull
```

### 3️⃣ Reiniciar o backend
Após executar os comandos acima, reinicie o container do backend no Easypanel.

---

## 📋 O que será criado no banco de dados:

### Novas Tabelas:
- ✅ `departments` - Gerenciamento de departamentos
- ✅ `chat_assignments` - Histórico de atribuições de chats
- ✅ `chat_metrics` - Métricas de atendimento

### Novas Colunas:
- ✅ `users.department_id` - Departamento do usuário
- ✅ `chats.department_id` - Departamento responsável pelo chat
- ✅ `chats.service_status` - Status do atendimento (WAITING, ACTIVE, TRANSFERRED, CLOSED, PAUSED)
- ✅ `messages.sent_by` - ID do usuário que enviou a mensagem
- ✅ `messages.department_name` - Nome do departamento do usuário
- ✅ `messages.is_signed` - Se a mensagem foi assinada

### Novos Enums:
- ✅ `AssignmentStatus` - Status de atribuição (ACTIVE, TRANSFERRED, CLOSED, PAUSED)
- ✅ `ChatServiceStatus` - Status de serviço (WAITING, ACTIVE, TRANSFERRED, CLOSED, PAUSED)

---

## 🔍 Verificar se deu certo:

Após reiniciar o backend, os logs devem mostrar:
```
✅ Servidor backend rodando na porta 3001
🔌 WebSocket configurado
🗄️  Banco de dados conectado
```

E o erro `users.department_id does not exist` deve desaparecer.

---

## ⚙️ Alternativa: Se `db push` não funcionar

Se o `npx prisma db push` apresentar problemas, você pode criar uma migration manualmente:

```bash
# Criar uma nova migration
npx prisma migrate dev --name add_departments_system

# Aplicar a migration
npx prisma migrate deploy
```

---

## 🆘 Se ainda assim não funcionar:

Entre em contato e forneça os logs completos do comando executado.

