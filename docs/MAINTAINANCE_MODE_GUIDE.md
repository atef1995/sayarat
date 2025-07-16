# Create maintenance flag

sudo touch /var/www/maintenance_on

# Copy maintenance page

sudo cp nginx/maintenance.html /var/www/maintenance.html

# Reload nginx

sudo nginx -s reload

# Remove maintenance flag

sudo rm /var/www/maintenance_on

# Reload nginx

sudo nginx -s reload
