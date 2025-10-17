# 🔧 Solução - Ngrok Deve Apontar para o Backend

## 📅 Data: 8 de outubro de 2025

---

## ❌ **PROBLEMA**

### **Ngrok está apontando para a porta errada:**

```bash
# ❌ ERRADO - Ngrok aponta para frontend
ngrok http 3006

# Quando Evolution tenta acessar:
https://interjectural-woaded-shavonda.ngrok-free.dev/uploads/imagem.jpg
  ↓
Redireciona para: http://localhost:3006/uploads/...  # Frontend (Vite)
  ↓
❌ Vite pede autenticação
❌ Arquivo não é servido
```

---

## ✅ **SOLUÇÃO CORRETA**

### **Ngrok DEVE apontar para o BACKEND:**

```bash
# ✅ CORRETO - Ngrok aponta para backend
ngrok http 3001

# Quando Evolution tenta acessar:
https://seu-dominio.ngrok-free.dev/uploads/imagem.jpg
  ↓
Redireciona para: http://localhost:3001/uploads/...  # Backend (Express)
  ↓
✅ Express serve arquivos estáticos
✅ Arquivo baixado com sucesso
```

---

## 📝 **CONFIGURAÇÃO CORRETA**

### **1. Iniciar Ngrok Apontando para Backend:**

```bash
# ✅ Porta 3001 (backend)
ngrok http 3001

# Resultado:
Forwarding: https://seu-dominio.ngrok-free.dev -> http://localhost:3001
```

### **2. Atualizar .env do Backend:**

```env
# backend/.env

# ✅ URL do ngrok
BACKEND_URL=https://seu-dominio.ngrok-free.dev

# CORS - permitir frontend local e ngrok
ALLOWED_ORIGINS=https://seu-dominio.ngrok-free.dev,http://localhost:3006,http://localhost:3000
```

### **3. Frontend Continua em localhost:3006:**

```bash
# Frontend NÃO precisa de ngrok
cd frontend
npm run dev

# Acessa em:
http://localhost:3006
```

### **4. Acessar Sistema:**

```bash
# ✅ Frontend (local)
http://localhost:3006

# ✅ Backend via ngrok (público)
https://seu-dominio.ngrok-free.dev

# ✅ Uploads acessíveis publicamente
https://seu-dominio.ngrok-free.dev/uploads/imagem.jpg
```

---

## 🔄 **FLUXO CORRETO**

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuário acessa frontend                                       │
│    http://localhost:3006                                         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Faz upload de imagem                                          │
│    POST http://localhost:3006/api/media/upload                   │
│    (Vite proxy → http://localhost:3001/api/media/upload)         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Backend salva e retorna URL pública                           │
│    URL: https://seu-dominio.ngrok-free.dev/uploads/imagem.jpg    │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Envia mensagem com URL pública                                │
│    Evolution API recebe URL pública                              │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Evolution API acessa ngrok                                     │
│    GET https://seu-dominio.ngrok-free.dev/uploads/imagem.jpg     │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Ngrok redireciona para backend                                │
│    http://localhost:3001/uploads/imagem.jpg                      │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Express serve arquivo estático                                │
│    app.use('/uploads', express.static('uploads'))                │
│    ✅ Arquivo baixado sem autenticação                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Evolution API envia via WhatsApp                              │
│    ✅ Mensagem enviada!                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 **PASSO A PASSO COMPLETO**

### **1. Parar Ngrok Atual:**

```bash
# Se ngrok está rodando na porta 3006, pare
Ctrl+C no terminal do ngrok
```

### **2. Iniciar Ngrok na Porta Correta:**

```bash
# ✅ Porta 3001 (backend)
ngrok http 3001

# Copie a URL gerada, exemplo:
# https://abc123xyz.ngrok-free.dev
```

### **3. Atualizar backend/.env:**

```bash
cd backend

# Editar .env e atualizar BACKEND_URL com o domínio do ngrok
BACKEND_URL=https://abc123xyz.ngrok-free.dev
ALLOWED_ORIGINS=https://abc123xyz.ngrok-free.dev,http://localhost:3006
```

### **4. Reiniciar Backend:**

```bash
# Parar backend atual (Ctrl+C)
# Iniciar novamente
npm run dev
```

### **5. Testar Acesso Público:**

```bash
# Testar se arquivo é acessível
https://abc123xyz.ngrok-free.dev/uploads/teste.jpg

# Deve baixar o arquivo SEM pedir senha! ✅
```

### **6. Testar Upload e Envio:**

```bash
# No frontend (http://localhost:3006)
1. Fazer upload de imagem
2. Enviar para WhatsApp
3. Verificar logs do backend
```

---

## 📊 **CONFIGURAÇÃO FINAL**

### **Ngrok:**

```bash
ngrok http 3001  # ✅ Backend
```

### **Backend (.env):**

```env
BACKEND_URL=https://seu-dominio.ngrok-free.dev
PORT=3001
ALLOWED_ORIGINS=https://seu-dominio.ngrok-free.dev,http://localhost:3006
```

### **Frontend:**

```bash
# Continua rodando em localhost
http://localhost:3006

# Proxy já redireciona /api para backend
```

---

## ✨ **RESULTADO ESPERADO**

### **URLs Geradas:**

```bash
# Upload retorna:
{
  "url": "https://seu-dominio.ngrok-free.dev/uploads/imagem-123.jpg"
}
```

### **Teste de Acesso:**

```bash
# Acessar diretamente no navegador:
https://seu-dominio.ngrok-free.dev/uploads/imagem-123.jpg

# ✅ Deve mostrar a imagem SEM pedir senha
```

### **Envio Evolution API:**

```bash
Evolution API - Request: {
  "media": "https://seu-dominio.ngrok-free.dev/uploads/imagem-123.jpg"
}

# ✅ Evolution acessa ngrok
# ✅ Ngrok redireciona para backend
# ✅ Backend serve arquivo
# ✅ Mensagem enviada!
```

**Sistema 100% funcional com ngrok apontando para o backend!** 🎯







