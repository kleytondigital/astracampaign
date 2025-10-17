#!/bin/bash

echo "🚀 Iniciando aplicação de migração Meta Ads..."

# Navegar para o diretório backend
cd /app

# Aplicar as mudanças do schema diretamente no banco de dados
echo "📝 Executando npx prisma db push..."
npx prisma db push --accept-data-loss

if [ $? -ne 0 ]; then
  echo "❌ Erro ao executar npx prisma db push. Verifique os logs acima."
  exit 1
fi

# Regenerar o Prisma Client
echo "🔄 Regenerando Prisma Client..."
npx prisma generate

if [ $? -ne 0 ]; then
  echo "❌ Erro ao executar npx prisma generate. Verifique os logs acima."
  exit 1
fi

echo "✅ Migração Meta Ads aplicada com sucesso!"
echo "⚠️  IMPORTANTE: Reinicie o container do backend para que as mudanças entrem em vigor."
echo ""
echo "Para reiniciar o container:"
echo "1. Acesse Easypanel"
echo "2. Vá em Services → backend"
echo "3. Clique em 'Restart'"
