#!/bin/bash

# Cars Bids Cloud Database Deployment Script
# This script deploys the application using cloud database

set -e

echo "🌐 Cars Bids - Cloud Database Deployment"
echo "======================================="

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

# Check if ca.pem exists
if [ ! -f "backend/ca.pem" ]; then
    print_error "backend/ca.pem not found!"
    print_warning "Please ensure your Aiven SSL certificate is in backend/ca.pem"
    exit 1
fi


print_status "Building and starting containers (HTTP mode first)..."
# Use HTTP-only config initially if SSL certs don't exist
if [ ! -f "nginx/certbot/conf/live/sayarat.autos/fullchain.pem" ]; then
    print_warning "SSL certificates not found, starting in HTTP-only mode"
    if [ -f "nginx/nginx-http.conf" ]; then
        cp nginx/nginx.conf nginx/nginx-ssl.conf.temp 2>/dev/null || true
        cp nginx/nginx-http.conf nginx/nginx.conf
        print_status "Using HTTP-only configuration"
    fi
fi

docker compose -f docker-compose.cloud.yml up --build -d

print_status "Waiting for services to start..."
sleep 30

print_status "Checking service health..."

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

# Check Nginx
if docker compose -f docker-compose.cloud.yml ps nginx | grep -q "Up"; then
    print_status "✅ Nginx is running"
else
    print_warning "⚠️  Nginx health check failed"
fi

print_status "🎉 Deployment completed!"

# Check if SSL certificates exist
if [ -f "nginx/certbot/conf/live/sayarat.autos/fullchain.pem" ]; then
    print_status "✅ SSL certificates found - HTTPS is enabled"
    print_status "Access your application at:"
    print_status "  Frontend: https://sayarat.autos"
    print_status "  Backend API: https://sayarat.autos/api"
else
    print_warning "⚠️  No SSL certificates found - running in HTTP mode"
    print_status "Access your application at:"
    print_status "  Frontend: http://sayarat.autos"
    print_status "  Backend API: http://sayarat.autos/api"
    print_status ""
    print_status "🔐 To set up SSL certificates, run:"
    print_status "  chmod +x setup-ssl.sh && ./setup-ssl.sh"
fi

print_status "  Redis: localhost:6379"

print_status ""
print_status "🔍 Troubleshooting - Test these URLs:"
print_status "  Direct IP: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
print_status "  HTTP: http://sayarat.autos"
print_status "  HTTPS: https://sayarat.autos"

print_status ""
print_status "💡 Quick diagnostics:"
print_status "  Test HTTP: curl -I http://sayarat.autos"
print_status "  Test HTTPS: curl -I https://sayarat.autos"
print_status "  Check nginx config: docker compose -f docker-compose.cloud.yml exec nginx nginx -t"

print_status "To view logs, run:"
print_status "  docker compose -f docker-compose.cloud.yml logs -f"

print_status "To stop services, run:"
print_status "  docker compose -f docker-compose.cloud.yml down"
