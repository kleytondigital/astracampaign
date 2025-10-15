# 🚀 COMECE AQUI - Deploy Easypanel

## 👋 Bem-vindo!

Este projeto agora está **otimizado para deploy simplificado no Easypanel**!

---

## ⚡ Deploy Rápido (10 minutos)

```
1. Leia: QUICK-START-EASYPANEL.md
2. Execute: build-and-push.bat (Windows) ou build-and-push.sh (Linux/Mac)
3. Configure no Easypanel
4. Pronto! ✅
```

**[👉 Ir para Quick Start](./QUICK-START-EASYPANEL.md)**

---

## 📘 Deploy Completo (30-60 minutos)

```
1. Leia: DEPLOY-EASYPANEL-SIMPLIFICADO.md
2. Siga: DEPLOY-EASYPANEL-CHECKLIST.md
3. Configure no Easypanel
4. Pronto! ✅
```

**[👉 Ir para Guia Completo](./DEPLOY-EASYPANEL-SIMPLIFICADO.md)**

---

## 🎯 Escolha Seu Caminho

### Você é...

#### 🆕 Novo no Easypanel?
→ Leia: [Deploy Simplificado](./DEPLOY-EASYPANEL-SIMPLIFICADO.md)  
→ Use: [Checklist](./DEPLOY-EASYPANEL-CHECKLIST.md)  
→ Tempo: 30-60 minutos

#### ⚡ Tem pressa?
→ Leia: [Quick Start](./QUICK-START-EASYPANEL.md)  
→ Execute: `build-and-push.bat`  
→ Tempo: 10 minutos

#### 🤔 Quer entender como funciona?
→ Leia: [Arquitetura](./EASYPANEL-ARQUITETURA.md)  
→ Leia: [Conexões](./EASYPANEL-CONEXOES.md)  
→ Tempo: 20 minutos

#### 🐛 Está com problemas?
→ Consulte: [Conexões - Troubleshooting](./EASYPANEL-CONEXOES.md#-troubleshooting-comum)  
→ Verifique: [Variáveis de Ambiente](./VARIAVEIS-AMBIENTE.md)

---

## 📚 Todos os Guias

| Guia | O que você vai aprender | Tempo |
|------|------------------------|-------|
| [Quick Start](./QUICK-START-EASYPANEL.md) | Deploy em passos rápidos | 10min |
| [Deploy Simplificado](./DEPLOY-EASYPANEL-SIMPLIFICADO.md) | Deploy completo passo a passo | 60min |
| [Checklist](./DEPLOY-EASYPANEL-CHECKLIST.md) | Lista de verificação prática | 5min |
| [Conexões](./EASYPANEL-CONEXOES.md) | Como os serviços se conectam | 15min |
| [Arquitetura](./EASYPANEL-ARQUITETURA.md) | Entender a arquitetura | 20min |
| [Variáveis](./VARIAVEIS-AMBIENTE.md) | Todas as variáveis documentadas | 10min |
| [Índice](./DOCS-INDEX.md) | Navegar toda documentação | 5min |

---

## 🔨 Scripts Disponíveis

### Windows
```powershell
# Build e push das imagens
.\build-and-push.bat
```

### Linux/Mac
```bash
# Dar permissão de execução
chmod +x build-and-push.sh

# Build e push das imagens
./build-and-push.sh
```

---

## ✨ Por Que Easypanel?

### ✅ Mais Simples
- PostgreSQL e Redis **gerenciados**
- Apenas **2 containers** para você gerenciar
- SSL/HTTPS **automático**

### ✅ Mais Rápido
- Deploy em **10 minutos**
- Backups **automáticos**
- Updates **automáticos**

### ✅ Mais Barato
- Economia de **$240/mês**
- Menos tempo de **manutenção**
- Sem custos **escondidos**

**[👉 Ver Comparação Completa](./EASYPANEL-ARQUITETURA.md#-comparação-de-custos)**

---

## 🎯 O Que Você Vai Precisar

### Requisitos

- [ ] Conta no Easypanel
- [ ] Domínio registrado
- [ ] Docker instalado localmente (para build)
- [ ] Conta em registry (Docker Hub, GHCR, etc)

### Informações para Preparar

- [ ] Nome do seu registry: `_____________`
- [ ] Domínio frontend: `_____________`
- [ ] Domínio backend (API): `_____________`
- [ ] Senha PostgreSQL: `_____________` (gerar)
- [ ] JWT Secret: `_____________` (gerar)

---

## 🚀 Passo a Passo Resumido

### 1️⃣ Build Local
```bash
.\build-and-push.bat  # Windows
./build-and-push.sh   # Linux/Mac
```

### 2️⃣ No Easypanel

**Criar:**
- PostgreSQL (gerenciado)
- Redis (gerenciado)
- Backend (sua imagem)
- Frontend (sua imagem)

**Configurar:**
- Variáveis de ambiente
- Domínios
- SSL/HTTPS (automático)

### 3️⃣ DNS

**Apontar:**
- `api.seudominio.com` → IP Easypanel
- `seudominio.com` → IP Easypanel

### 4️⃣ Verificar

```bash
# Backend
curl https://api.seudominio.com/health

# Frontend
https://seudominio.com (navegador)
```

---

## 💡 Dicas Rápidas

### ✅ Faça
- Use senhas fortes (32+ caracteres)
- Siga o checklist
- Verifique logs após deploy

### ❌ Evite
- Não use `localhost` em produção
- Não coloque `/` no final das URLs
- Não use senhas de exemplo

---

## 🆘 Precisa de Ajuda?

### Documentação
- 📖 [Índice Completo](./DOCS-INDEX.md)
- 🔌 [Troubleshooting](./EASYPANEL-CONEXOES.md#-troubleshooting-comum)
- 📝 [Variáveis](./VARIAVEIS-AMBIENTE.md)

### Comunidade
- 💬 [Grupo WhatsApp](https://chat.whatsapp.com/LMa44csoeoS9gMjamMpbOK)
- 🐛 [GitHub Issues](https://github.com/AstraOnlineWeb/astracampaign/issues)

### Suporte Profissional
- 📱 WhatsApp: [+55 61 9 9687-8959](https://wa.me/5561996878959)

---

## 📊 Estrutura da Documentação

```
📚 Documentação/
│
├── 🚀 Deploy
│   ├── COMECE-AQUI.md (você está aqui)
│   ├── QUICK-START-EASYPANEL.md
│   ├── DEPLOY-EASYPANEL-SIMPLIFICADO.md
│   └── DEPLOY-EASYPANEL-CHECKLIST.md
│
├── 📖 Referência
│   ├── EASYPANEL-CONEXOES.md
│   ├── EASYPANEL-ARQUITETURA.md
│   └── VARIAVEIS-AMBIENTE.md
│
├── 🔨 Scripts
│   ├── build-and-push.bat
│   └── build-and-push.sh
│
└── 📚 Navegação
    ├── DOCS-INDEX.md
    └── DEPLOY-RESUMO-FINAL.md
```

---

## 🎯 Próximo Passo

### Escolha:

1. **⚡ Rápido (10min)**  
   [👉 Quick Start](./QUICK-START-EASYPANEL.md)

2. **📘 Completo (60min)**  
   [👉 Guia Simplificado](./DEPLOY-EASYPANEL-SIMPLIFICADO.md)

3. **🤔 Entender Primeiro**  
   [👉 Arquitetura](./EASYPANEL-ARQUITETURA.md)

---

## ✅ Checklist Antes de Começar

- [ ] Li este arquivo
- [ ] Escolhi qual guia seguir
- [ ] Tenho conta no Easypanel
- [ ] Tenho domínio registrado
- [ ] Docker instalado
- [ ] Conta em registry Docker
- [ ] **Estou pronto para começar!** 🚀

---

**[👉 COMEÇAR AGORA](./QUICK-START-EASYPANEL.md)** 🚀

---

<div align="center">

**Feito com ❤️ para simplificar seu deploy!**

⭐ Se este guia ajudou, dê uma estrela no GitHub! ⭐

</div>



