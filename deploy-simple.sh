#!/bin/bash

# Cars Bids - Simple Deployment with Automatic SSL
# Caddy handles SSL certificates automatically - no manual setup needed!

set -e

echo "🚀 Cars Bids - Simple Deployment"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_warning "Please copy .env.example to .env and configure your values"
    exit 1
fi

print_status "🛑 Stopping any existing containers..."
docker compose -f docker-compose.cloud.yml down || true

print_status "🔧 Building and starting containers..."
docker compose -f docker-compose.cloud.yml up --build -d

print_status "⏳ Waiting for services to start..."
sleep 30

print_status "🔍 Checking service health..."

# Check Redis
if docker compose -f docker-compose.cloud.yml ps redis | grep -q "Up"; then
    print_status "✅ Redis is running"
else
    print_warning "⚠️  Redis health check failed"
fi

# Check Backend
if docker compose -f docker-compose.cloud.yml ps backend | grep -q "Up"; then
    print_status "✅ Backend is running"
else
    print_warning "⚠️  Backend health check failed"
fi

# Check Frontend
if docker compose -f docker-compose.cloud.yml ps frontend | grep -q "Up"; then
    print_status "✅ Frontend is running"
else
    print_warning "⚠️  Frontend health check failed"
fi

# Check Caddy
if docker compose -f docker-compose.cloud.yml ps caddy | grep -q "Up"; then
    print_status "✅ Caddy is running"
else
    print_warning "⚠️  Caddy health check failed"
fi

print_status "🎉 Deployment completed!"
print_status ""
print_status "🌐 Your website will be available at:"
print_status "  Frontend: https://sayarat.autos"
print_status "  Backend API: https://sayarat.autos/api"
print_status ""
print_status "📋 SSL Certificates:"
print_status "  ✅ Caddy will automatically obtain and renew SSL certificates"
print_status "  ✅ HTTP traffic will automatically redirect to HTTPS"
print_status "  ✅ No manual SSL configuration needed!"
print_status ""
print_status "🔧 Management commands:"
print_status "  View logs: docker compose -f docker-compose.cloud.yml logs -f"
print_status "  Stop services: docker compose -f docker-compose.cloud.yml down"
print_status "  Restart: docker compose -f docker-compose.cloud.yml restart"
print_status ""
print_status "⏰ Note: SSL certificates may take 1-2 minutes to be issued on first run"
