#!/bin/bash

echo "🚀 Aplicando migrações do módulo de relatórios..."

# Aplicar mudanças do schema diretamente
echo "📊 Aplicando mudanças do schema..."
npx prisma db push

# Verificar se foi aplicado com sucesso
if [ $? -eq 0 ]; then
    echo "✅ Schema aplicado com sucesso!"
    
    # Regenerar Prisma Client
    echo "🔄 Regenerando Prisma Client..."
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        echo "✅ Prisma Client regenerado com sucesso!"
        echo "🎉 Migrações do módulo de relatórios concluídas!"
    else
        echo "❌ Erro ao regenerar Prisma Client"
        exit 1
    fi
else
    echo "❌ Erro ao aplicar schema"
    exit 1
fi
