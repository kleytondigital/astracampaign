# ==========================================
# ESTÁGIO 1: Build
# ==========================================
FROM node:20-alpine AS builder

# Instalar dependências do sistema para Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production && \
    npm install -D prisma tsx @types/node

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Compilar TypeScript (se necessário)
# RUN npm run build

# ==========================================
# ESTÁGIO 2: Production
# ==========================================
FROM node:20-alpine AS production

# Instalar dependências do sistema
RUN apk add --no-cache openssl libc6-compat curl

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar node_modules e arquivos do builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copiar código fonte
COPY --chown=nodejs:nodejs . .

# Criar diretórios necessários com permissões corretas
RUN mkdir -p uploads backups && chown -R nodejs:nodejs uploads backups

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Comando de inicialização
# TEMPORÁRIO: Ignora erro de migration para permitir acesso ao console
# Após resolver migrations, mude de volta para: npx prisma migrate deploy && npm run dev
CMD ["sh", "-c", "npx prisma migrate deploy || true && npm run dev"]
