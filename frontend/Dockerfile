# ==========================================
# ESTÁGIO 1: Build
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# ==========================================
# ESTÁGIO 2: Production com Nginx
# ==========================================
FROM nginx:alpine AS production

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Criar script de substituição de variáveis de ambiente
RUN echo '#!/bin/sh' > /docker-entrypoint.d/40-substitute-env.sh && \
    echo 'set -e' >> /docker-entrypoint.d/40-substitute-env.sh && \
    echo 'echo "Substituindo variáveis de ambiente..."' >> /docker-entrypoint.d/40-substitute-env.sh && \
    echo 'echo "VITE_API_URL=${VITE_API_URL}"' >> /docker-entrypoint.d/40-substitute-env.sh && \
    echo 'sed -i.bak "s|VITE_API_URL_PLACEHOLDER|${VITE_API_URL}|g" /usr/share/nginx/html/config.js' >> /docker-entrypoint.d/40-substitute-env.sh && \
    echo 'rm -f /usr/share/nginx/html/config.js.bak' >> /docker-entrypoint.d/40-substitute-env.sh && \
    echo 'echo "Conteúdo do config.js:"' >> /docker-entrypoint.d/40-substitute-env.sh && \
    echo 'cat /usr/share/nginx/html/config.js' >> /docker-entrypoint.d/40-substitute-env.sh && \
    chmod +x /docker-entrypoint.d/40-substitute-env.sh

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --quiet --tries=1 --spider https://n8n-back-crm.h3ag2x.easypanel.host/api/health || exit 1


# Nginx iniciará automaticamente
