#!/bin/bash

# SSL Setup Script for Cars Bids
# This script sets up SSL certificates for your domain

set -e

echo "🔐 Setting up SSL certificates for Cars Bids"
echo "============================================="

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

# Create necessary directories
print_status "Creating SSL directories..."
mkdir -p nginx/certbot/conf
mkdir -p nginx/certbot/www

print_status "Step 1: Starting with HTTP-only configuration..."

# Backup SSL config and use HTTP-only config
if [ -f "nginx/nginx.conf" ]; then
    cp nginx/nginx.conf nginx/nginx-ssl.conf.backup
    print_status "Backed up SSL config to nginx-ssl.conf.backup"
fi

cp nginx/nginx-http.conf nginx/nginx.conf
print_status "Using HTTP-only configuration"

print_status "Step 2: Starting services with HTTP configuration..."
docker-compose -f docker-compose.cloud.yml down || true
docker-compose -f docker-compose.cloud.yml up -d redis backend frontend nginx

print_status "Waiting for services to be ready..."
sleep 30

# Check if nginx is running and accessible
print_status "Testing if nginx is accessible..."
if curl -f http://localhost/.well-known/acme-challenge/test 2>/dev/null; then
    print_status "Nginx is accessible for challenges"
else
    print_warning "Nginx might not be fully ready, but continuing..."
fi

print_status "Step 3: Obtaining SSL certificates..."
docker-compose -f docker-compose.cloud.yml run --rm certbot

if [ $? -eq 0 ]; then
    print_status "✅ SSL certificates obtained successfully!"
    
    print_status "Step 4: Switching to SSL configuration..."
    if [ -f "nginx/nginx-ssl.conf.backup" ]; then
        cp nginx/nginx-ssl.conf.backup nginx/nginx.conf
        print_status "Restored SSL configuration"
    else
        print_error "SSL config backup not found!"
        exit 1
    fi
    
    print_status "Step 5: Restarting nginx with SSL..."
    docker-compose -f docker-compose.cloud.yml restart nginx
    
    print_status "Waiting for nginx to restart..."
    sleep 10
    
    print_status "🎉 SSL setup completed successfully!"
    print_status "Your site should now be available at:"
    print_status "  https://sayarat.autos"
    print_status "  https://www.sayarat.autos"
    
    print_status "Testing HTTPS..."
    if curl -f https://sayarat.autos 2>/dev/null; then
        print_status "✅ HTTPS is working!"
    else
        print_warning "⚠️  HTTPS might need a few more seconds to be ready"
    fi
    
else
    print_error "❌ Failed to obtain SSL certificates"
    print_status "Common issues:"
    print_status "1. Make sure your domain DNS points to this server"
    print_status "2. Check if port 80 is accessible from the internet"
    print_status "3. Verify nginx is running and responding"
    exit 1
fi

print_status "Cleaning up..."
rm -f nginx/nginx-ssl.conf.backup

print_status "To renew certificates in the future, run:"
print_status "  docker-compose -f docker-compose.cloud.yml run --rm certbot renew"
print_status "  docker-compose -f docker-compose.cloud.yml restart nginx"
