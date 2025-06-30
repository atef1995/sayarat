#!/bin/bash

# Cars Bids Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production up

set -e

ENVIRONMENT=${1:-development}
ACTION=${2:-up}
PROJECT_NAME="cars-bids"

echo "🚀 Deploying Cars Bids Application"
echo "Environment: $ENVIRONMENT"
echo "Action: $ACTION"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
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
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_status "Docker is running ✓"
}

# Check if required files exist
check_files() {
    local env_file=".env.${ENVIRONMENT}"
    local compose_file="docker-compose.yml"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        compose_file="docker-compose.prod.yml"
    fi
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file $env_file not found!"
        exit 1
    fi
    
    if [ ! -f "$compose_file" ]; then
        print_error "Docker compose file $compose_file not found!"
        exit 1
    fi
    
    print_status "Required files exist ✓"
}

# Build and deploy
deploy() {
    local compose_file="docker-compose.yml"
    local env_file=".env.${ENVIRONMENT}"
    
    if [ "$ENVIRONMENT" = "production" ]; then
        compose_file="docker-compose.prod.yml"
    fi
    
    print_status "Starting deployment..."
    
    # Pull latest images
    print_status "Pulling latest images..."
    docker-compose -f "$compose_file" --env-file "$env_file" pull
    
    # Build services
    print_status "Building services..."
    docker-compose -f "$compose_file" --env-file "$env_file" build --no-cache
    
    # Start services
    case $ACTION in
        "up")
            print_status "Starting services..."
            docker-compose -f "$compose_file" --env-file "$env_file" up -d
            ;;
        "down")
            print_status "Stopping services..."
            docker-compose -f "$compose_file" --env-file "$env_file" down
            ;;
        "restart")
            print_status "Restarting services..."
            docker-compose -f "$compose_file" --env-file "$env_file" restart
            ;;
        "logs")
            docker-compose -f "$compose_file" --env-file "$env_file" logs -f
            ;;
        *)
            print_error "Unknown action: $ACTION"
            echo "Available actions: up, down, restart, logs"
            exit 1
            ;;
    esac
}

# Health check
health_check() {
    print_status "Performing health checks..."
    sleep 30  # Wait for services to start
    
    # Check frontend
    if curl -f http://localhost/health > /dev/null 2>&1; then
        print_status "Frontend health check passed ✓"
    else
        print_warning "Frontend health check failed ⚠️"
    fi
    
    # Check backend through frontend proxy
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        print_status "Backend health check passed ✓"
    else
        print_warning "Backend health check failed ⚠️"
    fi
}

# Cleanup old containers and images
cleanup() {
    print_status "Cleaning up unused Docker resources..."
    docker system prune -f
    docker volume prune -f
}

# Main execution
main() {
    check_docker
    check_files
    
    case $ACTION in
        "up"|"down"|"restart"|"logs")
            deploy
            if [ "$ACTION" = "up" ]; then
                health_check
            fi
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            deploy
            ;;
    esac
    
    print_status "Deployment completed! 🎉"
}

# Run main function
main
