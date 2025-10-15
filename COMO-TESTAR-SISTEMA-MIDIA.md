# 🧪 Como Testar o Sistema de Mídia do Chat

## 📋 **Checklist de Testes**

---

## 🚀 **1. PREPARAÇÃO**

### **1.1. Iniciar Serviços**

```bash
# Terminal 1 - Backend
cd backend
npm install  # Se não fez ainda
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **1.2. Verificar Pasta de Uploads**

```bash
# Verificar se a pasta foi criada
cd backend
ls -la uploads/  # Linux/Mac
dir uploads      # Windows
```

### **1.3. Login no Sistema**

1. Acesse `http://localhost:5173`
2. Faça login com suas credenciais
3. Navegue até **Atendimento**

---

## 📷 **2. TESTE DE ENVIO DE IMAGEM**

### **Passos:**

1. Selecione um chat da lista (ou crie um novo via sincronização)
2. Clique no botão **📷** (Enviar imagem)
3. Selecione uma imagem do seu computador (JPG, PNG, GIF, WebP)
4. Aguarde o toast "Fazendo upload..." → "Upload concluído! Enviando..."
5. Aguarde o toast "Mídia enviada com sucesso!"

### **Verificações:**

- [ ] Arquivo foi aceito
- [ ] Toast de progresso apareceu
- [ ] Mensagem apareceu no chat com a imagem
- [ ] Imagem está visível e carregou corretamente
- [ ] Ao clicar na imagem, abre modal de preview
- [ ] Modal permite zoom (botões + e -)
- [ ] Modal permite fechar (X ou ESC)
- [ ] Modal permite download

### **Console Backend (esperado):**

```
✅ Arquivo enviado com sucesso: imagem-123456789.jpg (IMAGE)
📤 Enviando mídia via Evolution API: image para 5562999999999
✅ Mídia enviada com sucesso via Evolution API
```

---

## 🎥 **3. TESTE DE ENVIO DE VÍDEO**

### **Passos:**

1. Clique no botão **🎥** (Enviar vídeo)
2. Selecione um vídeo (MP4, MOV, AVI, WebM)
3. Aguarde upload e envio

### **Verificações:**

- [ ] Vídeo foi aceito
- [ ] Mensagem apareceu com player de vídeo
- [ ] Player tem controles (play, pause, volume)
- [ ] Vídeo toca corretamente
- [ ] Modal de preview funciona
- [ ] Download funciona

---

## 🎤 **4. TESTE DE ENVIO DE ÁUDIO**

### **Passos:**

1. Clique no botão **🎤** (Enviar áudio)
2. Selecione um arquivo de áudio (MP3, OGG, WAV, M4A)
3. Aguarde upload e envio

### **Verificações:**

- [ ] Áudio foi aceito
- [ ] Mensagem apareceu com player de áudio
- [ ] Player funciona (play, pause, controle de tempo)
- [ ] Áudio toca corretamente

---

## 📄 **5. TESTE DE ENVIO DE DOCUMENTO**

### **Passos:**

1. Clique no botão **📄** (Enviar documento)
2. Selecione um documento (PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP)
3. Aguarde upload e envio

### **Verificações:**

- [ ] Documento foi aceito
- [ ] Mensagem apareceu com ícone de documento
- [ ] Nome do arquivo está visível
- [ ] Botão de download funciona
- [ ] Arquivo baixa corretamente

---

## 📥 **6. TESTE DE RECEBIMENTO DE MÍDIA**

### **Preparação:**

1. Conecte uma instância do WhatsApp (WAHA ou Evolution)
2. De outro número, envie:
   - Uma imagem
   - Um vídeo
   - Um áudio
   - Um documento

### **Verificações:**

- [ ] Mensagem apareceu automaticamente no chat (via WebSocket)
- [ ] Toast de notificação "Nova mensagem de..." apareceu
- [ ] Som de notificação tocou
- [ ] Mídia está visível corretamente
- [ ] Tipo de mensagem está correto (IMAGE, VIDEO, AUDIO, DOCUMENT)
- [ ] URL da mídia está acessível

### **Console Backend (esperado):**

```
📨 [WebSocket] handleMessageUpsert recebido
📝 [WebSocket] Processando mensagem: ABC123 de 5562999999999
📱 [WebSocket] Phone extraído: 5562999999999
✅ [WebSocket] Mensagem criada no banco: uuid-da-mensagem
📊 [WebSocket] Chat atualizado: lastMessage="[Mídia]", unreadCount=1
🚀 [WebSocket] Evento chat:message emitido para tenant uuid-do-tenant
```

---

## 🛡️ **7. TESTE DE VALIDAÇÕES**

### **7.1. Arquivo Muito Grande**

**Teste:**

1. Tente enviar uma imagem > 10 MB
2. Tente enviar um vídeo > 50 MB

**Esperado:**

- [ ] Upload é rejeitado
- [ ] Toast de erro aparece: "Arquivo muito grande para o tipo especificado"

### **7.2. Tipo de Arquivo Inválido**

**Teste:**

1. Tente enviar um `.exe`, `.bat`, ou `.sh`

**Esperado:**

- [ ] Upload é rejeitado
- [ ] Toast de erro aparece: "Tipo de arquivo não suportado"

### **7.3. Envio sem Chat Selecionado**

**Teste:**

1. Sem selecionar um chat, clique em um botão de mídia
2. Selecione um arquivo

**Esperado:**

- [ ] Nada acontece (função retorna early)

---

## 🎨 **8. TESTE DE UI/UX**

### **8.1. Ordenação de Mensagens**

**Verificar:**

- [ ] Mensagens ordenadas do mais antigo (topo) para o mais recente (final)
- [ ] Novas mensagens aparecem no final
- [ ] Scroll automático ao enviar/receber

### **8.2. Indicadores de Status**

**Verificar (apenas mensagens enviadas):**

- [ ] ✓ - Mensagem enviada (ack=1)
- [ ] ✓✓ - Mensagem entregue (ack=2)
- [ ] ✓✓ (azul) - Mensagem lida (ack=3)

### **8.3. Diferenciação Visual**

**Verificar:**

- [ ] Mensagens enviadas: fundo azul, alinhadas à direita
- [ ] Mensagens recebidas: fundo branco, alinhadas à esquerda

### **8.4. Responsividade**

**Verificar:**

- [ ] Layout se adapta a diferentes tamanhos de tela
- [ ] Imagens não ultrapassam container
- [ ] Modal de preview funciona em mobile

---

## 🔍 **9. TESTE DE INTEGRAÇÃO**

### **9.1. Evolution API**

**Verificar:**

1. Enviar imagem via painel
2. Verificar no WhatsApp se chegou
3. Enviar imagem do WhatsApp
4. Verificar se apareceu no painel

**Esperado:**

- [ ] Mensagem enviada pelo painel chega no WhatsApp
- [ ] Mensagem enviada pelo WhatsApp aparece no painel
- [ ] Mídia é exibida corretamente em ambos os lados

### **9.2. Sincronização de Chats**

**Verificar:**

1. Clicar em "Sincronizar Chats"
2. Verificar se chats com mídia são importados corretamente

**Esperado:**

- [ ] Chats sincronizados
- [ ] Última mensagem exibida corretamente (mesmo que seja mídia)
- [ ] Contador de não lidas funciona

---

## 🐛 **10. TESTE DE ERROS**

### **10.1. Sem Conexão**

**Teste:**

1. Desconectar internet
2. Tentar enviar mídia

**Esperado:**

- [ ] Toast de erro aparece
- [ ] Mensagem não é enviada
- [ ] Sistema não quebra

### **10.2. Sessão Expirada**

**Teste:**

1. Deixar token expirar
2. Tentar enviar mídia

**Esperado:**

- [ ] Redirecionado para login
- [ ] Dados não são perdidos (se possível)

### **10.3. Arquivo Corrompido**

**Teste:**

1. Tentar abrir uma imagem corrompida

**Esperado:**

- [ ] Mensagem "Erro ao carregar imagem" aparece
- [ ] Link alternativo "Abrir em nova aba" funciona
- [ ] Sistema não quebra

---

## 📊 **11. VERIFICAÇÃO NO BANCO DE DADOS**

### **SQL para verificar mensagens de mídia:**

```sql
-- Ver todas as mensagens de mídia
SELECT
  id,
  type,
  body,
  media_url,
  from_me,
  created_at
FROM messages
WHERE media_url IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

### **Verificações:**

- [ ] `type` está correto (IMAGE, VIDEO, AUDIO, DOCUMENT)
- [ ] `media_url` está preenchida
- [ ] `media_url` é acessível via navegador
- [ ] `body` contém caption (se houver)

---

## 🎯 **12. TESTE DE PERFORMANCE**

### **12.1. Múltiplos Uploads**

**Teste:**

1. Enviar 5 imagens seguidas
2. Verificar se todas são processadas

**Esperado:**

- [ ] Todas as imagens são enviadas
- [ ] Não há travamento
- [ ] Toast de cada upload funciona

### **12.2. Arquivo Grande**

**Teste:**

1. Enviar um vídeo de ~40 MB

**Esperado:**

- [ ] Upload leva tempo mas funciona
- [ ] Progress é indicado via toast
- [ ] Vídeo é enviado corretamente

---

## ✅ **CHECKLIST FINAL**

### **Funcionalidades Core:**

- [ ] Envio de imagem
- [ ] Envio de vídeo
- [ ] Envio de áudio
- [ ] Envio de documento
- [ ] Recebimento de mídia via WebSocket
- [ ] Exibição correta por tipo
- [ ] Modal de preview
- [ ] Download de mídia

### **Validações:**

- [ ] Tamanho máximo por tipo
- [ ] Tipos de arquivo permitidos
- [ ] Tratamento de erros

### **UI/UX:**

- [ ] Botões de mídia visíveis e funcionais
- [ ] Feedback visual (toasts, loading)
- [ ] Ordenação cronológica
- [ ] Indicadores de status
- [ ] Responsividade

### **Integração:**

- [ ] Evolution API funcionando
- [ ] WebSocket recebendo eventos
- [ ] Banco de dados salvando corretamente
- [ ] Arquivos acessíveis via URL

---

## 🎉 **RESULTADO ESPERADO**

Ao final dos testes, você deve ser capaz de:

1. ✅ Enviar qualquer tipo de mídia (imagem, vídeo, áudio, documento)
2. ✅ Receber mídias automaticamente via WhatsApp
3. ✅ Visualizar mídias corretamente no chat
4. ✅ Abrir preview em tela cheia
5. ✅ Baixar qualquer mídia
6. ✅ Ver indicadores de status de entrega

---

## 🆘 **TROUBLESHOOTING**

### **Problema: Upload não funciona**

**Verificar:**

1. Pasta `backend/uploads/` existe?
2. Permissões da pasta estão corretas?
3. Multer está instalado? (`npm list multer`)
4. Rota `/api/media-upload/upload` está registrada?

### **Problema: Mídia não aparece**

**Verificar:**

1. WebSocket está conectado? (ver console: "🔌 Conectando ao WebSocket...")
2. Evolution API está configurada corretamente?
3. `EVOLUTION_HOST` e `EVOLUTION_API_KEY` estão no banco ou `.env`?
4. Instância Evolution está `CONNECTED`/`WORKING`?

### **Problema: Erro 404 ao acessar mídia**

**Verificar:**

1. Servidor Express está servindo `/uploads`? (ver `server.ts`)
2. Arquivo existe em `backend/uploads/`?
3. `BACKEND_URL` está correto no `.env`?

---

**Boa sorte com os testes!** 🚀

Se encontrar algum problema, verifique:

1. Console do navegador (erros JS)
2. Console do backend (erros Node)
3. Logs do banco de dados
4. Logs da Evolution API






