#!/bin/bash

# Script para aplicar as mudanças do sistema de departamentos no banco de dados

echo "🔄 Aplicando mudanças do sistema de departamentos..."
echo ""

echo "1️⃣ Gerando Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "❌ Erro ao gerar Prisma Client"
  exit 1
fi
echo "✅ Prisma Client gerado com sucesso"
echo ""

echo "2️⃣ Aplicando mudanças no banco de dados..."
npx prisma db push --accept-data-loss
if [ $? -ne 0 ]; then
  echo "❌ Erro ao aplicar mudanças no banco de dados"
  exit 1
fi
echo "✅ Mudanças aplicadas com sucesso"
echo ""

echo "3️⃣ Verificando estrutura do banco..."
npx prisma db pull --force
if [ $? -ne 0 ]; then
  echo "⚠️  Aviso: Não foi possível verificar a estrutura do banco"
else
  echo "✅ Estrutura do banco verificada"
fi
echo ""

echo "🎉 Migração concluída com sucesso!"
echo ""
echo "⚠️  IMPORTANTE: Reinicie o container do backend agora."
echo ""

