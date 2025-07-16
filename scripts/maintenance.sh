#!/bin/bash

# maintenance.sh - Script to control maintenance mode

NGINX_MAINTENANCE_FILE="/var/www/maintenance_on"
MAINTENANCE_HTML="/var/www/maintenance.html"
NGINX_CONFIG_DIR="/etc/nginx"

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

# Function to enable maintenance mode
enable_maintenance() {
    print_status "Enabling maintenance mode..."
    
    # Copy maintenance HTML file
    if [ -f "./nginx/maintenance.html" ]; then
        sudo cp ./nginx/maintenance.html "$MAINTENANCE_HTML"
        print_status "Maintenance page copied to $MAINTENANCE_HTML"
    else
        print_error "Maintenance HTML file not found at ./nginx/maintenance.html"
        exit 1
    fi
    
    # Create maintenance flag file
    sudo touch "$NGINX_MAINTENANCE_FILE"
    print_status "Maintenance flag created at $NGINX_MAINTENANCE_FILE"
    
    # Reload nginx configuration
    sudo nginx -t && sudo nginx -s reload
    if [ $? -eq 0 ]; then
        print_status "Nginx reloaded successfully"
        print_status "🔧 Maintenance mode is now ENABLED"
        print_status "Website will show maintenance page to all visitors"
    else
        print_error "Failed to reload nginx configuration"
        exit 1
    fi
}

# Function to disable maintenance mode
disable_maintenance() {
    print_status "Disabling maintenance mode..."
    
    # Remove maintenance flag file
    if [ -f "$NGINX_MAINTENANCE_FILE" ]; then
        sudo rm "$NGINX_MAINTENANCE_FILE"
        print_status "Maintenance flag removed"
    else
        print_warning "Maintenance flag file not found - maintenance might already be disabled"
    fi
    
    # Reload nginx configuration
    sudo nginx -t && sudo nginx -s reload
    if [ $? -eq 0 ]; then
        print_status "Nginx reloaded successfully"
        print_status "✅ Maintenance mode is now DISABLED"
        print_status "Website is back online for all visitors"
    else
        print_error "Failed to reload nginx configuration"
        exit 1
    fi
}

# Function to check maintenance status
check_status() {
    print_status "Checking maintenance mode status..."
    
    if [ -f "$NGINX_MAINTENANCE_FILE" ]; then
        print_status "🔧 Maintenance mode is currently ENABLED"
        
        # Show file creation time
        if command -v stat > /dev/null; then
            CREATED=$(stat -c %y "$NGINX_MAINTENANCE_FILE" 2>/dev/null || stat -f %SB "$NGINX_MAINTENANCE_FILE" 2>/dev/null)
            print_status "Enabled since: $CREATED"
        fi
    else
        print_status "✅ Maintenance mode is currently DISABLED"
        print_status "Website is online and accessible"
    fi
    
    # Check if nginx is running
    if sudo nginx -t > /dev/null 2>&1; then
        print_status "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors"
    fi
}

# Function to show help
show_help() {
    echo "Maintenance Mode Control Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  enable     Enable maintenance mode"
    echo "  disable    Disable maintenance mode (bring site back online)"
    echo "  status     Check current maintenance mode status"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 enable      # Put site into maintenance mode"
    echo "  $0 disable     # Bring site back online"
    echo "  $0 status      # Check if maintenance mode is active"
    echo ""
    echo "Note: This script requires sudo privileges to modify nginx configuration"
}

# Main script logic
case "$1" in
    enable)
        enable_maintenance
        ;;
    disable)
        disable_maintenance
        ;;
    status)
        check_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Invalid command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
