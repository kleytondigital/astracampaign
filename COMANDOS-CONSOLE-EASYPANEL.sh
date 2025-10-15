#!/bin/sh
# ==========================================
# Comandos para executar no Console do Backend
# no Easypanel para resolver migrations falhadas
# ==========================================

# 1. Verificar status atual
echo "=== Verificando status das migrations ==="
npx prisma migrate status

# 2. Resolver todas as migrations falhadas
# (marcando como aplicadas porque as mudanças já existem no banco)

echo ""
echo "=== Resolvendo migration 1/5 ==="
npx prisma migrate resolve --applied 20250925000000_add_alerts_notifications

echo ""
echo "=== Resolvendo migration 2/5 ==="
npx prisma migrate resolve --applied 20250925120000_remove_tenant_domain

echo ""
echo "=== Resolvendo migration 3/5 ==="
npx prisma migrate resolve --applied 20250930134500_add_categoria_to_contacts

echo ""
echo "=== Resolvendo migration 4/5 ==="
npx prisma migrate resolve --applied 20251001000000_add_display_name_to_sessions

echo ""
echo "=== Resolvendo migration 5/5 ==="
npx prisma migrate resolve --applied 20251001000000_add_user_tenant_many_to_many

# 3. Verificar se está OK agora
echo ""
echo "=== Verificando status final ==="
npx prisma migrate status

# 4. Gerar Prisma Client
echo ""
echo "=== Gerando Prisma Client ==="
npx prisma generate

echo ""
echo "=== CONCLUÍDO! ==="
echo "Agora reinicie o serviço do backend no Easypanel"
echo "Backend → Actions → Restart"

