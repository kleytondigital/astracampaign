#!/bin/bash

# ==========================================
# Script de Build e Push para Easypanel
# ==========================================

set -e

echo ""
echo "=========================================="
echo " BUILD E PUSH - EASYPANEL"
echo "=========================================="
echo ""

# Solicitar nome do registry
read -p "Digite o nome do seu registry (ex: seu-usuario): " REGISTRY

if [ -z "$REGISTRY" ]; then
    echo "Erro: Nome do registry não pode estar vazio!"
    exit 1
fi

# Solicitar tag (default: latest)
read -p "Digite a tag (pressione Enter para 'latest'): " TAG
TAG=${TAG:-latest}

echo ""
echo "=========================================="
echo " CONFIGURAÇÃO"
echo "=========================================="
echo "Registry: $REGISTRY"
echo "Tag: $TAG"
echo ""
echo "Backend Image: $REGISTRY/astra-backend:$TAG"
echo "Frontend Image: $REGISTRY/astra-frontend:$TAG"
echo ""
read -p "Pressione Enter para continuar..."

# ==========================================
# BUILD BACKEND
# ==========================================
echo ""
echo "=========================================="
echo " BUILDING BACKEND..."
echo "=========================================="
cd backend
docker build -t $REGISTRY/astra-backend:$TAG .
cd ..
echo "Backend build concluído!"

# ==========================================
# BUILD FRONTEND
# ==========================================
echo ""
echo "=========================================="
echo " BUILDING FRONTEND..."
echo "=========================================="
cd frontend
docker build -t $REGISTRY/astra-frontend:$TAG .
cd ..
echo "Frontend build concluído!"

# ==========================================
# PUSH IMAGES
# ==========================================
echo ""
echo "=========================================="
echo " FAZENDO LOGIN NO DOCKER REGISTRY"
echo "=========================================="
docker login

echo ""
echo "=========================================="
echo " PUSHING BACKEND..."
echo "=========================================="
docker push $REGISTRY/astra-backend:$TAG
echo "Backend push concluído!"

echo ""
echo "=========================================="
echo " PUSHING FRONTEND..."
echo "=========================================="
docker push $REGISTRY/astra-frontend:$TAG
echo "Frontend push concluído!"

# ==========================================
# SUCESSO
# ==========================================
echo ""
echo "=========================================="
echo " SUCESSO!"
echo "=========================================="
echo ""
echo "Imagens disponíveis:"
echo "- $REGISTRY/astra-backend:$TAG"
echo "- $REGISTRY/astra-frontend:$TAG"
echo ""
echo "Agora você pode usar essas imagens no Easypanel!"
echo ""




