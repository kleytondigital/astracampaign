# 📚 Índice de Documentação

## 🎯 Guia Rápido

Escolha o guia adequado para você:

| Situação | Guia Recomendado | Tempo Estimado |
|----------|------------------|----------------|
| 🚀 Quero fazer deploy rápido | [Quick Start](./QUICK-START-EASYPANEL.md) | 10 minutos |
| 📘 Primeira vez no Easypanel | [Deploy Simplificado](./DEPLOY-EASYPANEL-SIMPLIFICADO.md) | 30-60 minutos |
| ✅ Preciso de um checklist | [Checklist](./DEPLOY-EASYPANEL-CHECKLIST.md) | 20 minutos |
| 🔌 Dúvidas sobre conexões | [Conexões](./EASYPANEL-CONEXOES.md) | 15 minutos leitura |
| 📝 Ver todas as variáveis | [Variáveis de Ambiente](./VARIAVEIS-AMBIENTE.md) | 10 minutos leitura |

---

## 📖 Documentação Completa

### 🚀 Deploy e Instalação

#### **Easypanel (Recomendado para produção)**

| Documento | Descrição | Nível |
|-----------|-----------|-------|
| [DEPLOY-EASYPANEL-SIMPLIFICADO.md](./DEPLOY-EASYPANEL-SIMPLIFICADO.md) | Guia completo de deploy no Easypanel | Intermediário |
| [QUICK-START-EASYPANEL.md](./QUICK-START-EASYPANEL.md) | Deploy rápido em 10 minutos | Iniciante |
| [DEPLOY-EASYPANEL-CHECKLIST.md](./DEPLOY-EASYPANEL-CHECKLIST.md) | Checklist passo a passo | Iniciante |
| [EASYPANEL-CONEXOES.md](./EASYPANEL-CONEXOES.md) | Como os serviços se comunicam | Intermediário |
| [VARIAVEIS-AMBIENTE.md](./VARIAVEIS-AMBIENTE.md) | Todas as variáveis documentadas | Todos |

#### **Docker (Deploy tradicional)**

| Documento | Descrição | Nível |
|-----------|-----------|-------|
| [DEPLOY-EASYPANEL-GUIA-COMPLETO.md](./DEPLOY-EASYPANEL-GUIA-COMPLETO.md) | Guia completo com Docker Compose | Avançado |
| [docker-compose.dev.yml](./docker-compose.dev.yml) | Docker Compose para desenvolvimento | Todos |
| [docker-compose.production.yml](./docker-compose.production.yml) | Docker Compose para produção | Avançado |

---

### ⚙️ Configuração e Setup

| Documento | Descrição |
|-----------|-----------|
| [CONFIGURACAO-EVOLUTION-GLOBAL.md](./CONFIGURACAO-EVOLUTION-GLOBAL.md) | Configurar Evolution API |
| [WEBHOOK-AUTO-CONFIG-IMPLEMENTADO.md](./WEBHOOK-AUTO-CONFIG-IMPLEMENTADO.md) | Auto-configuração de webhooks |
| [CONFIGURACAO-NGROK-DESENVOLVIMENTO.md](./CONFIGURACAO-NGROK-DESENVOLVIMENTO.md) | Ngrok para desenvolvimento |

---

### 🛠️ Scripts Auxiliares

#### **Windows (PowerShell)**

| Script | Descrição | Uso |
|--------|-----------|-----|
| `build-and-push.bat` | Build e push de imagens Docker | `.\build-and-push.bat` |
| `dev-start.bat` | Iniciar desenvolvimento | `.\dev-start.bat` |
| `dev-restart.bat` | Reiniciar desenvolvimento | `.\dev-restart.bat` |
| `reset-db.bat` | Resetar banco de dados | `.\reset-db.bat` |
| `prisma-studio.bat` | Abrir Prisma Studio | `.\prisma-studio.bat` |
| `setup-env.bat` | Configurar ambiente | `.\setup-env.bat` |

#### **Linux/Mac (Bash)**

| Script | Descrição | Uso |
|--------|-----------|-----|
| `build-and-push.sh` | Build e push de imagens Docker | `./build-and-push.sh` |

---

### 📊 Funcionalidades Implementadas

#### **Chat e Atendimento**

| Documento | Descrição |
|-----------|-----------|
| [CHAT-ATENDIMENTO-100-CONCLUIDO.md](./CHAT-ATENDIMENTO-100-CONCLUIDO.md) | Sistema de chat completo |
| [SISTEMA-CHAT-TEMPO-REAL-COMPLETO.md](./SISTEMA-CHAT-TEMPO-REAL-COMPLETO.md) | Chat em tempo real |
| [FRONTEND-CHAT-CONCLUIDO.md](./FRONTEND-CHAT-CONCLUIDO.md) | Frontend do chat |
| [RESUMO-BACKEND-CHAT-CONCLUIDO.md](./RESUMO-BACKEND-CHAT-CONCLUIDO.md) | Backend do chat |

#### **CRM e Pipeline**

| Documento | Descrição |
|-----------|-----------|
| [CRM-IMPLEMENTACAO-COMPLETA.md](./CRM-IMPLEMENTACAO-COMPLETA.md) | Sistema CRM completo |
| [PIPELINE-KANBAN-IMPLEMENTADO.md](./PIPELINE-KANBAN-IMPLEMENTADO.md) | Kanban de vendas |

#### **Campanhas e Mídias**

| Documento | Descrição |
|-----------|-----------|
| [SISTEMA-COMPLETO-MIDIAS-FINAL.md](./SISTEMA-COMPLETO-MIDIAS-FINAL.md) | Sistema de mídias |
| [IMPLEMENTACAO-PREVIEW-CAPTION-WHATSAPP.md](./IMPLEMENTACAO-PREVIEW-CAPTION-WHATSAPP.md) | Preview de mensagens |
| [ANALISE-SISTEMA-ENVIO-MIDIAS-CAMPANHAS.md](./ANALISE-SISTEMA-ENVIO-MIDIAS-CAMPANHAS.md) | Análise do sistema |

#### **WebSocket e Real-time**

| Documento | Descrição |
|-----------|-----------|
| [EVOLUTION-WEBSOCKET-IMPLEMENTADO.md](./EVOLUTION-WEBSOCKET-IMPLEMENTADO.md) | WebSocket Evolution API |
| [WEBHOOK-WEBSOCKET-COMPLETO.md](./WEBHOOK-WEBSOCKET-COMPLETO.md) | Sistema completo |
| [SINCRONIZACAO-CHATS-WEBSOCKET.md](./SINCRONIZACAO-CHATS-WEBSOCKET.md) | Sincronização de chats |

---

### 🐛 Troubleshooting e Correções

#### **Correções Gerais**

| Documento | Descrição |
|-----------|-----------|
| [CORRECOES-CRITICAS-FINAIS.md](./CORRECOES-CRITICAS-FINAIS.md) | Correções críticas |
| [CORRECOES-FINAIS-WEBHOOK-RESTART.md](./CORRECOES-FINAIS-WEBHOOK-RESTART.md) | Correções webhook |
| [CORRECOES-WEBSOCKET-E-PROVIDERS.md](./CORRECOES-WEBSOCKET-E-PROVIDERS.md) | Correções WebSocket |

#### **Correções Específicas**

| Documento | Descrição |
|-----------|-----------|
| [CORRECAO-AUTH-WEBSOCKET.md](./CORRECAO-AUTH-WEBSOCKET.md) | Autenticação WebSocket |
| [CORRECAO-DRAG-DROP-KANBAN.md](./CORRECAO-DRAG-DROP-KANBAN.md) | Drag & Drop Kanban |
| [CORRECAO-LOOP-INFINITO.md](./CORRECAO-LOOP-INFINITO.md) | Loop infinito de requests |
| [CORRECAO-MENSAGENS-DUPLICADAS.md](./CORRECAO-MENSAGENS-DUPLICADAS.md) | Mensagens duplicadas |
| [CORRECAO-UPLOAD-MIDIA-REUTILIZACAO.md](./CORRECAO-UPLOAD-MIDIA-REUTILIZACAO.md) | Upload de mídias |

---

### 📝 Guias de Teste

| Documento | Descrição |
|-----------|-----------|
| [GUIA-TESTE-CHAT-WHATSAPP.md](./GUIA-TESTE-CHAT-WHATSAPP.md) | Testar chat WhatsApp |
| [GUIA-TESTE-WEBHOOK.md](./GUIA-TESTE-WEBHOOK.md) | Testar webhooks |
| [COMO-TESTAR-SISTEMA-MIDIA.md](./COMO-TESTAR-SISTEMA-MIDIA.md) | Testar sistema de mídias |

---

### 🗺️ Planejamento e Roadmap

| Documento | Descrição |
|-----------|-----------|
| [ROADMAP-MELHORIAS.md](./ROADMAP-MELHORIAS.md) | Roadmap de melhorias |
| [PLANO-IMPLEMENTACAO-COMPLETO.md](./PLANO-IMPLEMENTACAO-COMPLETO.md) | Plano de implementação |
| [MVP-FASES-1-E-2-IMPLEMENTADAS.md](./MVP-FASES-1-E-2-IMPLEMENTADAS.md) | MVP implementado |

---

### 📊 Status e Resumos

| Documento | Descrição |
|-----------|-----------|
| [STATUS-SISTEMA.md](./STATUS-SISTEMA.md) | Status atual do sistema |
| [RESUMO-COMPLETO-IMPLEMENTACAO.md](./RESUMO-COMPLETO-IMPLEMENTACAO.md) | Resumo completo |
| [IMPLEMENTACOES-CONCLUIDAS.md](./IMPLEMENTACOES-CONCLUIDAS.md) | Implementações concluídas |

---

## 🎯 Fluxos Comuns

### 🚀 Deploy pela Primeira Vez

```
1. Leia: Quick Start (10min)
   ↓
2. Siga: Deploy Simplificado (30-60min)
   ↓
3. Verifique: Checklist (5min)
   ↓
4. Em caso de dúvida: Conexões ou Troubleshooting
```

### 🔧 Desenvolvimento Local

```
1. Clone o repositório
   ↓
2. Execute: setup-env.bat
   ↓
3. Execute: dev-start.bat
   ↓
4. Acesse: http://localhost:3000
```

### 📦 Build e Deploy de Atualizações

```
1. Faça suas alterações
   ↓
2. Execute: build-and-push.bat
   ↓
3. No Easypanel: Redeploy dos serviços
   ↓
4. Verifique: Health checks
```

---

## 🆘 Ajuda Rápida

### Problema: Erro no Deploy

1. Consulte: [EASYPANEL-CONEXOES.md](./EASYPANEL-CONEXOES.md)
2. Verifique: Seção "Troubleshooting"
3. Consulte: [CORRECOES-CRITICAS-FINAIS.md](./CORRECOES-CRITICAS-FINAIS.md)

### Problema: Dúvidas sobre Variáveis

1. Consulte: [VARIAVEIS-AMBIENTE.md](./VARIAVEIS-AMBIENTE.md)
2. Compare com: [DEPLOY-EASYPANEL-CHECKLIST.md](./DEPLOY-EASYPANEL-CHECKLIST.md)

### Problema: Erro de Conexão

1. Consulte: [EASYPANEL-CONEXOES.md](./EASYPANEL-CONEXOES.md)
2. Seção: "Troubleshooting Comum"
3. Verifique: Logs no Easypanel

---

## 📞 Suporte

### Comunidade
- 💬 [Grupo WhatsApp](https://chat.whatsapp.com/LMa44csoeoS9gMjamMpbOK)
- 🐛 [GitHub Issues](https://github.com/AstraOnlineWeb/astracampaign/issues)
- 💬 [GitHub Discussions](https://github.com/AstraOnlineWeb/astracampaign/discussions)

### Suporte Profissional
- 📱 WhatsApp: [+55 61 9 9687-8959](https://wa.me/5561996878959)

---

## 🔍 Busca Rápida

### Por Assunto

- **Deploy:** [DEPLOY-EASYPANEL-SIMPLIFICADO.md](./DEPLOY-EASYPANEL-SIMPLIFICADO.md)
- **Variáveis:** [VARIAVEIS-AMBIENTE.md](./VARIAVEIS-AMBIENTE.md)
- **Conexões:** [EASYPANEL-CONEXOES.md](./EASYPANEL-CONEXOES.md)
- **Chat:** [CHAT-ATENDIMENTO-100-CONCLUIDO.md](./CHAT-ATENDIMENTO-100-CONCLUIDO.md)
- **CRM:** [CRM-IMPLEMENTACAO-COMPLETA.md](./CRM-IMPLEMENTACAO-COMPLETA.md)
- **Mídias:** [SISTEMA-COMPLETO-MIDIAS-FINAL.md](./SISTEMA-COMPLETO-MIDIAS-FINAL.md)
- **WebSocket:** [EVOLUTION-WEBSOCKET-IMPLEMENTADO.md](./EVOLUTION-WEBSOCKET-IMPLEMENTADO.md)

### Por Nível

- **Iniciante:** Quick Start, Checklist
- **Intermediário:** Deploy Simplificado, Conexões, Variáveis
- **Avançado:** Guia Completo, Configurações Avançadas, Correções

---

**Documentação organizada e fácil de navegar!** 📚✨




