# 🚀 Astra Campaign - Sistema Completo de Campanhas WhatsApp

<div align="center">

![Logo](https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Sistema profissional para campanhas de WhatsApp em massa com inteligência artificial integrada**

[🎯 Recursos](#-recursos-principais) • [🛠️ Instalação](#️-instalação) • [📚 Documentação](#-documentação) • [🤝 Contribuição](#-contribuindo)

</div>

---

## 📋 Sobre o Projeto

O **Astra Campaign** é uma plataforma completa e open-source para gerenciamento e execução de campanhas de WhatsApp em massa. Desenvolvido com tecnologias modernas, oferece recursos avançados como inteligência artificial para geração de mensagens personalizadas, multi-sessão com failover automático e interface intuitiva para gerenciamento de contatos e campanhas.

> 🔥 **Open Source**: Este projeto é totalmente gratuito e sem ligação alguma com o WhatsApp oficial. Utiliza a API [WAHA](https://waha.devlike.pro/) para integração.

### ✨ Principais Diferenciais

- 🤖 **IA Integrada**: OpenAI e Groq para mensagens personalizadas
- 🔄 **Multi-Sessão com Failover**: Distribuição inteligente de envios
- 📊 **Analytics Completo**: Relatórios detalhados com exportação CSV
- 🎨 **Interface Moderna**: React com Tailwind CSS responsivo
- 🐳 **Deploy Simplificado**: Docker Swarm com Traefik

---

## 🎯 Recursos Principais

### 👥 **Gerenciamento de Contatos**
- ✅ CRUD completo de contatos
- ✅ Importação em massa via CSV
- ✅ Sistema de categorização com tags
- ✅ Validação de números telefônicos (formato E.164)
- ✅ Busca avançada e filtros inteligentes
- ✅ Paginação otimizada

### 📱 **Conexões WhatsApp**
- ✅ Múltiplas sessões simultâneas
- ✅ QR Code automático com expiração
- ✅ Status em tempo real das conexões
- ✅ Gerenciamento simplificado de sessões
- ✅ Reconnect automático em falhas

### 🎯 **Campanhas Inteligentes**
- ✅ **Tipos de Mensagem**: Texto, Imagem, Vídeo, Áudio, Documentos
- ✅ **Sequências Complexas**: Múltiplas mensagens em ordem
- ✅ **IA Generativa**: OpenAI e Groq para personalização
- ✅ **Variáveis Dinâmicas**: `{{nome}}`, `{{telefone}}`, `{{email}}`, `{{categoria}}`, `{{observacoes}}`
- ✅ **Multi-Sessão**: Distribuição automática entre conexões
- ✅ **Agendamento**: Execução imediata ou programada
- ✅ **Controles**: Pausar, retomar, cancelar campanhas
- ✅ **Rate Limiting**: Delays configuráveis para evitar bloqueios

### 📊 **Relatórios e Analytics**
- ✅ Dashboard em tempo real
- ✅ Estatísticas detalhadas (enviadas, falharam, pendentes)
- ✅ Distribuição por sessão WhatsApp
- ✅ Análise de erros categorizada
- ✅ Exportação completa em CSV
- ✅ Timeline de execução

### 👤 **Sistema de Usuários**
- ✅ Autenticação JWT segura
- ✅ Controle de acesso por roles
- ✅ Gerenciamento de usuários admin
- ✅ Hash bcrypt para senhas

### ⚙️ **Configurações do Sistema**
- ✅ Integração WAHA configurável
- ✅ Personalização visual (logo, favicon, títulos)
- ✅ Chaves de API para IA (OpenAI/Groq)
- ✅ Configuração via interface web

---

## 🛠️ Tecnologias Utilizadas

### 🎨 **Frontend**
- **React 18** - Framework JavaScript moderno
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool ultra-rápida
- **Tailwind CSS** - Framework CSS utilitário
- **React Hook Form + Zod** - Validação de formulários
- **React Hot Toast** - Notificações elegantes
- **React Router Dom** - Roteamento SPA

### ⚡ **Backend**
- **Node.js 20** - Runtime JavaScript
- **Express** - Framework web minimalista
- **TypeScript** - Tipagem estática
- **Prisma ORM** - Object-Relational Mapping
- **bcryptjs** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT
- **express-validator** - Validação de dados
- **libphonenumber-js** - Normalização de telefones

### 🗄️ **Banco de Dados**
- **PostgreSQL 16** - Banco de dados relacional
- **Prisma** - ORM com type-safety

### 🐳 **Infraestrutura**
- **Docker & Docker Swarm** - Containerização e orquestração
- **Traefik v2** - Proxy reverso e SSL automático
- **Nginx** - Servidor web para frontend
- **Docker Hub** - Imagens oficiais pré-construídas

### 🔌 **Integrações**
- **WAHA API** - Interface WhatsApp Web
- **OpenAI API** - GPT para geração de conteúdo
- **Groq API** - IA ultra-rápida

---

## 🚀 Instalação

### 📋 **Pré-requisitos**
- Docker 20.10+
- Docker Compose/Swarm
- Traefik configurado (para produção)
- Instância WAHA rodando

### 🐳 **Instalação via Docker (Recomendado)**

1. **Clone o repositório**
```bash
git clone https://github.com/AstraOnlineWeb/astracampaign.git
cd astracampaign
```

2. **Baixe as imagens oficiais**
```bash
# Imagens pré-construídas no Docker Hub
docker pull astraonline/astracampaignbackend:latest
docker pull astraonline/astracampaignfrontend:latest
```

3. **Configure as variáveis de ambiente**
```bash
# Edite o docker-stack.yml com suas configurações
nano docker-stack.yml
```

4. **Deploy no Docker Swarm**
```bash
# Para produção
docker stack deploy -c docker-stack.yml astra-campaign

# Para desenvolvimento local
docker-compose up -d
```

### 🛠️ **Desenvolvimento Local**

1. **Backend**
```bash
cd backend
npm install
npm run migrate:prod  # Rodar migrações e seed
npm run dev          # Servidor de desenvolvimento
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev          # Servidor de desenvolvimento (porta 3000)
```

### ⚙️ **Configuração Inicial**

1. **Acesse o sistema**: `http://localhost:3000`
2. **Login padrão**: `admin@astra.com.br` / `Admin123!`
3. **Configure WAHA**: Vá em Configurações e adicione host/API key
4. **Crie uma sessão WhatsApp**: Na página de Conexões
5. **Importe contatos**: Via CSV ou manualmente
6. **Crie sua primeira campanha**: Na página de Campanhas

---

## 📚 Documentação

### 🔗 **Endpoints da API**

#### **Autenticação**
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/logout` - Logout do usuário

#### **Contatos**
- `GET /api/contatos` - Listar contatos (com paginação/busca)
- `POST /api/contatos` - Criar contato
- `PUT /api/contatos/:id` - Atualizar contato
- `DELETE /api/contatos/:id` - Excluir contato
- `POST /api/contatos/import` - Importar CSV

#### **Campanhas**
- `GET /api/campaigns` - Listar campanhas
- `POST /api/campaigns` - Criar campanha
- `PATCH /api/campaigns/:id/toggle` - Pausar/Retomar
- `DELETE /api/campaigns/:id` - Excluir campanha
- `GET /api/campaigns/:id/report` - Relatório detalhado

#### **Sessões WhatsApp**
- `GET /api/waha/sessions` - Listar sessões
- `POST /api/waha/sessions` - Criar sessão
- `DELETE /api/waha/sessions/:name` - Remover sessão
- `POST /api/waha/sessions/:name/restart` - Reiniciar

### 📊 **Modelo de Dados**

```typescript
// Contato
interface Contact {
  id: string;
  nome: string;
  telefone: string; // E.164 format
  email?: string;
  tags: string[];
  observacoes?: string;
}

// Campanha
interface Campaign {
  id: string;
  nome: string;
  targetTags: string[];
  sessionNames: string[];
  messageType: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sequence';
  messageContent: MessageContent;
  randomDelay: number;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'PAUSED' | 'FAILED';
}
```

## 🔧 Configuração Avançada

### 🔐 **Variáveis de Ambiente**

```env
# Backend (.env)
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=sua-chave-secreta-muito-segura
JWT_EXPIRES_IN=24h
DEFAULT_WAHA_HOST=http://waha:3000
DEFAULT_WAHA_API_KEY=sua-api-key
```

### 🐳 **Docker Swarm Labels**

```yaml
# Traefik Labels para Produção
labels:
  - traefik.enable=true
  - traefik.http.routers.app.rule=Host(`seu-dominio.com`)
  - traefik.http.routers.app.tls.certresolver=letsencrypt
```

### 📝 **Formato CSV para Importação**

```csv
nome,telefone,email,tags,observacoes
João Silva,+5511999999999,joao@email.com,cliente;vip,Cliente preferencial
Maria Santos,+5511888888888,maria@email.com,prospect,Interessada em produto X
```

---

## 🚀 Deploy em Produção

### 🔧 **Build das Imagens**

```bash
# Usar imagens oficiais do Docker Hub
docker pull astraonline/astracampaignbackend:latest
docker pull astraonline/astracampaignfrontend:latest

# Ou fazer build personalizado (opcional)
cd backend
docker build -t astraonline/astracampaignbackend:latest .

cd ../frontend
docker build -t astraonline/astracampaignfrontend:latest .
```

### 📊 **Monitoramento**

```bash
# Status dos serviços
docker service ls

# Logs em tempo real
docker service logs -f astra-campaign_backend
docker service logs -f astra-campaign_frontend

# Restart de serviços
docker service update --force astra-campaign_backend
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Este é um projeto open-source mantido pela comunidade.

### 🛠️ **Como Contribuir**

1. **Fork** o repositório
2. **Crie** uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. **Push** para a branch (`git push origin feature/nova-feature`)
5. **Abra** um Pull Request

### 📝 **Reportar Bugs**

- Use o sistema de [Issues](https://github.com/AstraOnlineWeb/astracampaign/issues)
- Descreva o problema detalhadamente
- Inclua logs relevantes
- Especifique ambiente (OS, Docker version, etc.)

### 💡 **Sugerir Features**

- Abra uma [Issue](https://github.com/AstraOnlineWeb/astracampaign/issues) com o label `enhancement`
- Descreva a funcionalidade desejada
- Explique o caso de uso

---

## 📄 Licença

Este projeto está licenciado sob a **GNU Affero General Public License v3.0 (AGPLv3)** - veja o arquivo [LICENSE](LICENSE) para detalhes.

### ⚖️ **Termos de Uso**

- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ✅ Uso em rede/web permitido
- ⚠️ **Copyleft forte**: Modificações devem ser disponibilizadas sob a mesma licença
- ⚠️ **Divulgação de código**: Serviços web baseados no projeto devem disponibilizar o código fonte
- ❌ Sem garantias
- ❌ Sem responsabilidade dos autores

> **Importante**: A licença AGPLv3 requer que qualquer versão modificada do software, incluindo aquelas usadas para fornecer serviços através de uma rede, tenha seu código fonte disponibilizado publicamente.

---

## ⚠️ Disclaimer

> **IMPORTANTE**: Este projeto é independente e não possui ligação alguma com o WhatsApp oficial, Meta ou Facebook. Use por sua própria conta e risco, respeitando os termos de serviço do WhatsApp.

### 🔒 **Recomendações de Uso**

- ✅ Respeite os limites do WhatsApp
- ✅ Use delays apropriados entre mensagens
- ✅ Não envie spam
- ✅ Obtenha consentimento dos destinatários
- ✅ Mantenha o sistema atualizado

---

## 🙏 Agradecimentos

- **[WAHA](https://waha.devlike.pro/)** - API WhatsApp Web
- **[Prisma](https://prisma.io/)** - ORM TypeScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS
- **[React](https://reactjs.org/)** - Biblioteca JavaScript
- **Comunidade Open Source** - Por tornar projetos como este possíveis

---

## 📞 Suporte

### 💬 **Comunidade**
- 💬 [Grupo WhatsApp](https://chat.whatsapp.com/LMa44csoeoS9gMjamMpbOK) - **Comunidade aberta para discussões**
- 💬 [Discussions](https://github.com/AstraOnlineWeb/astracampaign/discussions) - Discussões técnicas no GitHub
- 🐛 [Issues](https://github.com/AstraOnlineWeb/astracampaign/issues) - Bugs e features

### 🛠️ **Suporte Profissional**
**Precisa de ajuda para melhorar, customizar ou implementar o projeto?**

📱 **WhatsApp**: [+55 61 9 9687-8959](https://wa.me/5561996878959)

💼 Temos uma equipe especializada para:
- ✅ Customizações e melhorias
- ✅ Implementação e deploy
- ✅ Integração com outras APIs
- ✅ Desenvolvimento de features específicas
- ✅ Suporte técnico dedicado
- ✅ Consultoria em automação WhatsApp

### 📚 **Recursos Úteis**
- 📖 [Documentação WAHA](https://waha.devlike.pro/docs/)
- 📖 [Documentação Prisma](https://www.prisma.io/docs/)
- 📖 [Documentação React](https://reactjs.org/docs/)
- 🐳 [Docker Hub - Backend](https://hub.docker.com/r/astraonline/astracampaignbackend)
- 🐳 [Docker Hub - Frontend](https://hub.docker.com/r/astraonline/astracampaignfrontend)

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub! ⭐**

Feito com ❤️ pela comunidade open-source

![GitHub stars](https://img.shields.io/github/stars/AstraOnlineWeb/astracampaign?style=social)
![GitHub forks](https://img.shields.io/github/forks/AstraOnlineWeb/astracampaign?style=social)
![GitHub issues](https://img.shields.io/github/issues/AstraOnlineWeb/astracampaign)
![GitHub license](https://img.shields.io/github/license/AstraOnlineWeb/astracampaign)
![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)

</div>
