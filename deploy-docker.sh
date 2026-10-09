#!/bin/bash

set -e

echo "🚀 Starting Docker deployment..."

# Pull cambios
echo "⬇️  Pulling latest changes..."
git pull origin main

# Rebuild imagen
echo "🔨 Building Docker image..."
docker compose build --no-cache

# Detener contenedor actual
echo "🛑 Stopping current container..."
docker compose down

# Iniciar nuevo contenedor
echo "🚀 Starting new container..."
docker compose up -d

# Verificar salud
echo "🏥 Checking health..."
sleep 10

if docker compose ps | grep -q "Up"; then
    echo "✅ Deployment successful!"
    docker compose logs --tail=50
else
    echo "❌ Deployment failed!"
    exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo ""
echo "📊 Container status:"
docker compose ps
