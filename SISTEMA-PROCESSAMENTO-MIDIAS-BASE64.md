# 📁 Sistema de Processamento de Mídias - Base64 para Arquivo

## 📅 Data: 8 de outubro de 2025

---

## 🎯 **OBJETIVO**

Implementar um sistema robusto para processar mídias recebidas via WebSocket (Evolution/WAHA), que podem vir em **Base64** ou **URL**, e salvá-las localmente no sistema de uploads existente, reutilizando toda a infraestrutura já funcional das campanhas.

---

## ✅ **SOLUÇÃO IMPLEMENTADA**

### **1. Serviço de Processamento de Mídias** 📦

**Arquivo:** `backend/src/services/mediaProcessingService.ts`

**Funcionalidades:**

- ✅ **Converter Base64 em arquivo** e salvar no diretório de uploads
- ✅ **Converter Buffer em arquivo** para diferentes fontes de dados
- ✅ **Baixar mídia de URL** e salvar localmente (opcional)
- ✅ **Validar tamanho de arquivo** antes do processamento
- ✅ **Limpar arquivos antigos** automaticamente
- ✅ **Determinar tipo MIME** e extensão automaticamente

#### **Métodos Principais:**

```typescript
// 1. Salvar Base64 como arquivo
await mediaProcessingService.saveBase64AsFile(
  base64Data, // Base64 (com ou sem prefixo data:)
  mimeType, // 'image/jpeg', 'video/mp4', etc.
  originalFileName // Nome do arquivo (opcional)
);

// 2. Salvar Buffer como arquivo
await mediaProcessingService.saveBufferAsFile(
  buffer, // Buffer do arquivo
  mimeType, // Tipo MIME
  originalFileName // Nome do arquivo (opcional)
);

// 3. Baixar mídia de URL e salvar
await mediaProcessingService.downloadAndSaveMedia(
  url, // URL da mídia
  fileName // Nome do arquivo (opcional)
);

// 4. Validar tamanho do Base64
mediaProcessingService.validateBase64Size(
  base64Data, // Dados em Base64
  maxSizeMB // Tamanho máximo em MB (padrão: 50MB)
);

// 5. Limpar arquivos antigos
await mediaProcessingService.cleanOldFiles(
  olderThanDays // Arquivos mais antigos que X dias (padrão: 7)
);
```

#### **Retorno dos Métodos:**

```typescript
{
  filename: string; // Nome do arquivo salvo
  path: string; // Caminho completo no servidor
  url: string; // URL pública para acesso
  size: number; // Tamanho em bytes
  mimetype: string; // Tipo MIME
  mediaType: string; // IMAGE, VIDEO, AUDIO, DOCUMENT
}
```

---

### **2. Integração com WebSocket Evolution** 🔌

**Arquivo:** `backend/src/services/evolutionWebSocketClient.ts`

**Modificações:**

- ✅ **Detecta se mídia vem em Base64 ou URL**
- ✅ **Converte Base64 automaticamente** usando `mediaProcessingService`
- ✅ **Salva arquivo localmente** com nome único
- ✅ **Armazena URL pública** no banco de dados
- ✅ **Suporta todos os tipos de mídia** (imagem, vídeo, áudio, documento)

#### **Fluxo de Processamento:**

```typescript
// Exemplo para IMAGEM
if (message.message?.imageMessage) {
  const imageMsg = message.message.imageMessage;

  // 🔍 Verifica se tem Base64
  if (imageMsg.base64) {
    console.log("🖼️ Imagem em Base64 recebida, convertendo...");

    // 💾 Converte e salva
    const savedFile = await mediaProcessingService.saveBase64AsFile(
      imageMsg.base64,
      imageMsg.mimetype || "image/jpeg",
      imageMsg.fileName || "imagem.jpg"
    );

    // ✅ Usa URL local
    mediaUrl = savedFile.url;
    console.log("✅ Imagem salva:", mediaUrl);
  }
  // 🌐 Se tiver URL, usa diretamente
  else if (imageMsg.url || imageMsg.directPath) {
    mediaUrl = imageMsg.url || imageMsg.directPath;
    console.log("🖼️ Imagem em URL recebida:", mediaUrl);
  }
}
```

---

### **3. Reutilização do Sistema Existente** ♻️

**Sistema de Uploads Já Existente:**

- ✅ **Multer** - Upload de arquivos via formulário
- ✅ **Diretório `/uploads`** - Armazenamento local
- ✅ **Servir arquivos estáticos** - Express serve uploads publicamente
- ✅ **Validação de tipos** - Middleware de validação
- ✅ **Tipos suportados** - Imagens, vídeos, áudios, documentos

**Integração:**

```typescript
// Sistema de campanhas usa upload direto
app.use('/api/media-upload', mediaUploadRoutes);

// WebSocket usa mediaProcessingService para converter Base64
await mediaProcessingService.saveBase64AsFile(...);

// Ambos salvam no mesmo diretório: /uploads
// Ambos geram URLs públicas: http://localhost:3006/uploads/filename
```

---

## 📊 **TIPOS DE MÍDIA SUPORTADOS**

### **1. Imagens** 🖼️

- **Formatos:** JPG, PNG, GIF, WebP
- **Base64:** ✅ Converte e salva
- **URL:** ✅ Usa diretamente (ou baixa localmente)
- **MIME Types:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`

### **2. Vídeos** 🎥

- **Formatos:** MP4, AVI, MOV, WebM
- **Base64:** ✅ Converte e salva
- **URL:** ✅ Usa diretamente
- **MIME Types:** `video/mp4`, `video/mpeg`, `video/quicktime`, `video/webm`

### **3. Áudios** 🎵

- **Formatos:** MP3, OGG, WAV, M4A
- **Base64:** ✅ Converte e salva
- **URL:** ✅ Usa diretamente
- **MIME Types:** `audio/mpeg`, `audio/ogg`, `audio/wav`, `audio/mp4`

### **4. Documentos** 📄

- **Formatos:** PDF, DOC, DOCX, XLS, XLSX, TXT, ZIP
- **Base64:** ✅ Converte e salva
- **URL:** ✅ Usa diretamente
- **MIME Types:** `application/pdf`, `application/msword`, etc.

---

## 🔄 **FLUXO COMPLETO**

### **Recebimento de Mídia via WebSocket:**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. WhatsApp envia mensagem com mídia                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Evolution API envia evento via WebSocket                     │
│    - Pode incluir Base64 (webhook_base64: true)                 │
│    - Pode incluir URL (webhook_base64: false)                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. evolutionWebSocketClient processa evento                     │
│    - Detecta tipo de mídia (IMAGE, VIDEO, AUDIO, DOCUMENT)      │
│    - Verifica se é Base64 ou URL                                │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4a. Se Base64:                                                   │
│     - mediaProcessingService.saveBase64AsFile()                  │
│     - Converte Base64 → Buffer                                   │
│     - Gera nome único                                            │
│     - Salva em /uploads                                          │
│     - Retorna URL local                                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4b. Se URL:                                                      │
│     - Usa URL diretamente                                        │
│     - (Opcional: baixar e salvar localmente)                     │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Salva mensagem no banco com mediaUrl                         │
│    - Chat: lastMessage, lastMessageAt, unreadCount              │
│    - Message: body, mediaUrl, type, timestamp                   │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Emite evento para frontend via WebSocket                     │
│    - websocketService.emitToTenant()                             │
│    - Evento: 'chat:message'                                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Frontend exibe mídia no chat                                 │
│    - MessageBubble renderiza mídia                               │
│    - Preview em modal (imagens/vídeos)                           │
│    - Player (áudios)                                             │
│    - Download (documentos)                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

### **Envio de Mídia (Reutiliza Sistema Existente):**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuário seleciona arquivo no frontend                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Upload via chatsService.uploadMedia()                        │
│    - POST /api/media-upload/upload                              │
│    - Multer processa arquivo                                    │
│    - Salva em /uploads                                           │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Envia via chatsService.sendMessage()                         │
│    - POST /api/chats/:chatId/messages                           │
│    - Reutiliza lógica das campanhas                             │
│    - sendMessageViaEvolution() ou sendWAHA()                     │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Evolution/WAHA envia via WhatsApp                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧪 **TESTANDO O SISTEMA**

### **1. Teste de Recebimento Base64:**

```bash
# Envie uma imagem para o WhatsApp conectado

# Logs esperados:
🖼️ [WebSocket] Imagem em Base64 recebida, convertendo...
✅ [MediaProcessing] Arquivo Base64 salvo: imagem-1759930702480.jpg (IMAGE)
✅ [WebSocket] Imagem salva: http://localhost:3006/uploads/imagem-1759930702480.jpg
📤 [WebSocket] Criando mensagem no banco: chatId=..., type=IMAGE
✅ [WebSocket] Mensagem criada no banco: ...
📡 Evento 'chat:message' enviado para tenant ...
```

### **2. Teste de Recebimento URL:**

```bash
# Se webhook_base64 = false

# Logs esperados:
🖼️ [WebSocket] Imagem em URL recebida: https://evolution.api.com/media/...
📤 [WebSocket] Criando mensagem no banco: chatId=..., type=IMAGE
✅ [WebSocket] Mensagem criada no banco: ...
📡 Evento 'chat:message' enviado para tenant ...
```

### **3. Teste de Envio:**

```bash
# Upload de arquivo
POST /api/media-upload/upload
FormData: { file: <arquivo.jpg> }

# Resposta:
{
  "success": true,
  "data": {
    "filename": "arquivo-1759930702480.jpg",
    "url": "http://localhost:3006/uploads/arquivo-1759930702480.jpg",
    "mediaType": "IMAGE"
  }
}

# Envio via chat
POST /api/chats/:chatId/messages
{
  "body": "Veja esta imagem",
  "type": "IMAGE",
  "mediaUrl": "http://localhost:3006/uploads/arquivo-1759930702480.jpg"
}
```

---

## ⚙️ **CONFIGURAÇÕES**

### **Webhook Base64 (Evolution API):**

```typescript
// Ativar recebimento de mídia em Base64
await evolutionApiService.setInstanceWebhook(instanceName, {
  url: "https://seu-backend.com/api/webhooks/evolution",
  webhook_by_events: false,
  webhook_base64: true, // ✅ Ativar Base64
  events: [
    "QRCODE_UPDATED",
    "CONNECTION_UPDATE",
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
  ],
});
```

### **Limpeza Automática de Arquivos:**

```typescript
// Agendar limpeza diária de arquivos com mais de 7 dias
import cron from "node-cron";
import { mediaProcessingService } from "./services/mediaProcessingService";

// Executar todo dia às 3h da manhã
cron.schedule("0 3 * * *", async () => {
  try {
    const deletedCount = await mediaProcessingService.cleanOldFiles(7);
    console.log(`🗑️ Limpeza automática: ${deletedCount} arquivos removidos`);
  } catch (error) {
    console.error("❌ Erro na limpeza automática:", error);
  }
});
```

---

## 📊 **BENEFÍCIOS DA SOLUÇÃO**

### **Para o Sistema:**

- ✅ **Reutiliza infraestrutura** - Mesmo diretório e lógica das campanhas
- ✅ **Suporta Base64 e URL** - Flexibilidade total
- ✅ **Armazenamento local** - Controle total sobre os arquivos
- ✅ **Validação robusta** - Tipos e tamanhos validados
- ✅ **Limpeza automática** - Evita acúmulo de arquivos

### **Para os Desenvolvedores:**

- ✅ **Código reutilizável** - Serviço independente e modular
- ✅ **Fácil manutenção** - Código organizado e documentado
- ✅ **Logs detalhados** - Debug facilitado
- ✅ **TypeScript** - Tipagem forte

### **Para os Usuários:**

- ✅ **Mídias sempre disponíveis** - Armazenadas localmente
- ✅ **Preview rápido** - Arquivos servidos pelo próprio backend
- ✅ **Sem dependência externa** - Não depende de URLs externas

---

## 🚀 **PRÓXIMOS PASSOS (Opcional)**

### **1. Integração com S3/CDN:**

```typescript
// Modificar mediaProcessingService para salvar em S3
await s3.upload({
  Bucket: "meu-bucket",
  Key: filename,
  Body: buffer,
  ContentType: mimeType,
});
```

### **2. Compressão de Imagens:**

```typescript
// Adicionar sharp para otimizar imagens
import sharp from "sharp";

const optimizedBuffer = await sharp(buffer)
  .resize(1920, 1080, { fit: "inside" })
  .jpeg({ quality: 85 })
  .toBuffer();
```

### **3. Thumbnails para Vídeos:**

```typescript
// Gerar thumbnails usando ffmpeg
import ffmpeg from "fluent-ffmpeg";

ffmpeg(videoPath).screenshots({
  count: 1,
  folder: thumbnailsDir,
  filename: `${filename}-thumb.jpg`,
});
```

---

## ✨ **RESULTADO FINAL**

**Sistema completo de processamento de mídias Base64!** 🚀

**Funcionalidades implementadas:**

- ✅ **Conversão Base64 → Arquivo** automática
- ✅ **Suporte a todos os tipos de mídia** (IMAGE, VIDEO, AUDIO, DOCUMENT)
- ✅ **Reutilização da infraestrutura** das campanhas
- ✅ **Armazenamento local** em `/uploads`
- ✅ **URLs públicas** geradas automaticamente
- ✅ **Validação de tipos e tamanhos**
- ✅ **Limpeza automática** de arquivos antigos
- ✅ **Logs detalhados** para debug

**Pronto para receber mídias em Base64 via WebSocket e armazená-las localmente!** 🎯







