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

# Create temporary nginx config without SSL for initial setup
print_status "Creating temporary nginx config for SSL setup..."
cat > nginx/nginx-temp.conf << 'EOF'
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
  worker_connections  1024;
}

http {
  include       /etc/nginx/mime.types;
  default_type  application/octet-stream;

  sendfile        on;
  keepalive_timeout  65;

  server {
    listen 80;
    server_name sayarat.autos www.sayarat.autos;

    location /.well-known/acme-challenge/ {
      root /var/www/certbot;
    }

    location / {
      proxy_pass http://frontend:80;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
      proxy_pass http://backend:5000;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_cache_bypass $http_upgrade;
    }
  }
}
EOF

# Backup original nginx config
if [ -f "nginx/nginx.conf" ]; then
    cp nginx/nginx.conf nginx/nginx-ssl.conf.backup
fi

# Use temporary config
cp nginx/nginx-temp.conf nginx/nginx.conf

print_status "Starting services without SSL..."
docker-compose -f docker-compose.cloud.yml up -d nginx frontend backend redis

print_status "Waiting for services to be ready..."
sleep 30

print_status "Obtaining SSL certificates..."
docker-compose -f docker-compose.cloud.yml run --rm certbot

print_status "Restoring SSL-enabled nginx config..."
if [ -f "nginx/nginx-ssl.conf.backup" ]; then
    cp nginx/nginx-ssl.conf.backup nginx/nginx.conf
else
    print_error "SSL config backup not found. Please restore your SSL nginx config manually."
    exit 1
fi

print_status "Restarting nginx with SSL..."
docker-compose -f docker-compose.cloud.yml restart nginx

print_status "Cleaning up..."
rm nginx/nginx-temp.conf

print_status "🎉 SSL setup completed!"
print_status "Your site should now be available at:"
print_status "  https://sayarat.autos"
print_status "  https://www.sayarat.autos"

print_status "To renew certificates in the future, run:"
print_status "  docker-compose -f docker-compose.cloud.yml run --rm certbot renew"
