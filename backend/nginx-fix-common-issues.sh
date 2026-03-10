#!/bin/bash

# Script to fix common nginx issues after folder structure recreation

echo "=========================================="
echo "Fixing Common Nginx Issues"
echo "=========================================="
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Please run with sudo: sudo bash nginx-fix-common-issues.sh"
    exit 1
fi

# 1. Create missing directories
echo "1. Creating missing directories if they don't exist..."
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled
mkdir -p /var/log/nginx
mkdir -p /var/www

# 2. Set proper permissions
echo "2. Setting proper permissions..."
chown -R www-data:www-data /var/www 2>/dev/null || chown -R nginx:nginx /var/www 2>/dev/null
chmod -R 755 /var/www
chmod 755 /var/log/nginx
chmod 644 /etc/nginx/sites-available/* 2>/dev/null

# 3. Check for broken symlinks in sites-enabled
echo "3. Checking for broken symlinks..."
for link in /etc/nginx/sites-enabled/*; do
    if [ -L "$link" ] && [ ! -e "$link" ]; then
        echo "   Found broken symlink: $link"
        read -p "   Remove broken symlink? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm "$link"
            echo "   ✅ Removed broken symlink"
        fi
    fi
done

# 4. Check nginx main config
echo "4. Checking nginx main configuration..."
if [ -f "/etc/nginx/nginx.conf" ]; then
    # Ensure sites-enabled is included
    if ! grep -q "include /etc/nginx/sites-enabled" /etc/nginx/nginx.conf; then
        echo "   ⚠️  sites-enabled not included in nginx.conf"
        echo "   Add this line inside http {} block:"
        echo "   include /etc/nginx/sites-enabled/*;"
    else
        echo "   ✅ sites-enabled is included in nginx.conf"
    fi
else
    echo "   ❌ /etc/nginx/nginx.conf not found!"
fi

# 5. Test nginx config
echo "5. Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "   ✅ Configuration is valid"
    echo ""
    echo "6. Reloading nginx..."
    if systemctl reload nginx; then
        echo "   ✅ Nginx reloaded successfully!"
    else
        echo "   ⚠️  systemctl reload failed, trying alternative..."
        nginx -s reload && echo "   ✅ Nginx reloaded using alternative method"
    fi
else
    echo "   ❌ Configuration has errors. Please fix them first."
    echo "   Check the errors above."
fi

echo ""
echo "=========================================="
echo "Fix script complete"
echo "=========================================="

