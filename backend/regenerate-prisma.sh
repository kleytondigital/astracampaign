#!/bin/bash

echo "🔄 Regenerando Prisma Client com novo schema..."
echo ""

echo "1️⃣ Limpando cache do Prisma..."
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma/client
echo "✅ Cache limpo"
echo ""

echo "2️⃣ Gerando novo Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
  echo "❌ Erro ao gerar Prisma Client"
  exit 1
fi
echo "✅ Prisma Client gerado"
echo ""

echo "3️⃣ Verificando schema..."
npx prisma validate
if [ $? -ne 0 ]; then
  echo "⚠️  Aviso: Schema pode ter problemas"
else
  echo "✅ Schema válido"
fi
echo ""

echo "🎉 Prisma Client regenerado com sucesso!"
echo ""
echo "⚠️  IMPORTANTE: Reinicie o container do backend agora."
echo ""

