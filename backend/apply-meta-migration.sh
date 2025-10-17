#!/bin/bash

echo "🚀 Iniciando migração para integração Meta Ads..."

# Navegar para o diretório backend
cd /app

# Aplicar as mudanças do schema diretamente no banco de dados
echo "📊 Executando npx prisma db push..."
npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
  echo "❌ Erro ao executar npx prisma db push. Verifique os logs acima."
  exit 1
fi

# Regenerar o Prisma Client
echo "🔄 Executando npx prisma generate..."
npx prisma generate

if [ $? -ne 0 ]; then
  echo "❌ Erro ao executar npx prisma generate. Verifique os logs acima."
  exit 1
fi

echo "✅ Migração Meta Ads aplicada e Prisma Client regenerado com sucesso!"
echo "📋 Próximos passos:"
echo "   1. Configure as variáveis de ambiente: ENCRYPTION_KEY"
echo "   2. Reinicie o container do backend"
echo "   3. Configure o App Meta no painel SuperAdmin"
echo "   4. Teste a integração OAuth"
