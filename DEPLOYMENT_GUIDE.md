# DigitalOcean Deployment Guide

## Prerequisites

1. DigitalOcean account
2. Domain name (optional but recommended)
3. SSH key configured

## Important Notes

⚠️ **Test Exclusion**: This deployment automatically excludes test files from production builds. See [TEST_EXCLUSION_GUIDE.md](docs/TEST_EXCLUSION_GUIDE.md) for details.

## Step 1: Create Droplet

1. Create Ubuntu 22.04 droplet (minimum 2GB RAM, 2 vCPUs)
2. Add your SSH key
3. Enable monitoring and backups

## Step 2: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx (for reverse proxy)
sudo apt install nginx certbot python3-certbot-nginx -y

# Install fail2ban (security)
sudo apt install fail2ban -y
```

## Step 3: Configure Firewall

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## Step 4: Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/cars-bids.git
cd cars-bids

# Set up environment
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# Deploy
chmod +x deploy.sh
./deploy.sh production up
```

## Step 5: Configure Domain (Optional)

```bash
# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/cars-bids

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/cars-bids /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Step 6: Set up Monitoring

```bash
# Install monitoring tools
docker run -d --name watchtower --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower

# Set up log rotation
sudo nano /etc/logrotate.d/cars-bids
```
