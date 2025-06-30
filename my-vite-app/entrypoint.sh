#!/bin/sh

# entrypoint.sh - Container entrypoint that injects env vars then starts nginx

set -e

echo "Starting environment variable injection..."

# Default target directory
TARGET_DIR="${TARGET_DIR:-/usr/share/nginx/html}"


# Check if target directory exists
if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Target directory '$TARGET_DIR' not found"
    exit 1
fi

# Counter for injected variables
count=0

# Process each VITE_ environment variable
for i in $(env | grep "^VITE_" || true); do
    if [ -n "$i" ]; then
        key=$(echo "$i" | cut -d '=' -f 1)
        value=$(echo "$i" | cut -d '=' -f 2-)
                
        # Escape special characters in value for sed
        escaped_value=$(echo "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')
        
        # Replace in JS, CSS, and HTML files
        find "$TARGET_DIR" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -exec sed -i "s|$key|$escaped_value|g" '{}' + 2>/dev/null || true
        
        # Also handle placeholder patterns
        placeholder1="__${key}__"
        placeholder2="{{${key}}}"
        
        find "$TARGET_DIR" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -exec sed -i "s|$placeholder1|$escaped_value|g" '{}' + 2>/dev/null || true
        find "$TARGET_DIR" -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -exec sed -i "s|$placeholder2|$escaped_value|g" '{}' + 2>/dev/null || true
        
        count=$((count + 1))
    fi
done

if [ $count -eq 0 ]; then
    echo "No VITE_ environment variables found"
else
    echo "Successfully injected $count VITE_ variables"
fi

echo "Environment injection complete!"

# Start nginx
echo "Starting nginx..."
exec nginx -g 'daemon off;'