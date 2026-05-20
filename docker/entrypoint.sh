#!/bin/sh
set -e

echo "⏳ Aguardando Postgres aceitar conexões..."
while ! nc -z db 5432; do
  sleep 1
done
echo "✅ Postgres pronto!"

echo ""
echo "📦 Rodando migrations..."
npx prisma migrate deploy
echo "✅ Migrations aplicadas!"

echo ""
echo "🌱 Rodando seed..."
npx prisma db seed || echo "⚠️  Seed já executado ou falhou (dados podem já existir)"

echo ""
echo "🚀 Iniciando aplicação..."
exec npm run start:dev
