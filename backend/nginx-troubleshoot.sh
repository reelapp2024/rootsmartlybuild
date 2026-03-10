#!/bin/bash

# Nginx Troubleshooting Script for SmartlyBuild Deployment
# Run this script to diagnose nginx configuration issues

echo "=========================================="
echo "Nginx Troubleshooting Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Please run with sudo: sudo bash nginx-troubleshoot.sh"
    exit 1
fi

echo "1. Checking nginx installation..."
if command -v nginx &> /dev/null; then
    echo "✅ Nginx is installed"
    nginx -v
else
    echo "❌ Nginx is not installed"
    exit 1
fi

echo ""
echo "2. Checking nginx syntax..."
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration syntax is OK"
else
    echo "❌ Nginx configuration has syntax errors!"
    echo "Check the errors above and fix them before reloading."
    exit 1
fi

echo ""
echo "3. Checking nginx service status..."
systemctl status nginx --no-pager | head -n 10

echo ""
echo "4. Checking for common directory issues..."
echo ""
echo "Checking /etc/nginx/sites-available..."
if [ -d "/etc/nginx/sites-available" ]; then
    echo "✅ /etc/nginx/sites-available exists"
    echo "   Config files found:"
    ls -la /etc/nginx/sites-available/ | grep -v "^total" | grep -v "^d"
else
    echo "❌ /etc/nginx/sites-available does not exist"
fi

echo ""
echo "Checking /etc/nginx/sites-enabled..."
if [ -d "/etc/nginx/sites-enabled" ]; then
    echo "✅ /etc/nginx/sites-enabled exists"
    echo "   Symlinks found:"
    ls -la /etc/nginx/sites-enabled/ | grep -v "^total"
else
    echo "❌ /etc/nginx/sites-enabled does not exist"
fi

echo ""
echo "5. Checking nginx error log for recent errors..."
if [ -f "/var/log/nginx/error.log" ]; then
    echo "Last 20 lines of error log:"
    tail -n 20 /var/log/nginx/error.log
else
    echo "⚠️  /var/log/nginx/error.log does not exist"
fi

echo ""
echo "6. Checking webroot directories..."
echo "Looking for webroot directories in /var/www..."
if [ -d "/var/www" ]; then
    echo "   Found directories:"
    ls -la /var/www/ | grep "^d" | tail -n 10
else
    echo "⚠️  /var/www does not exist"
fi

echo ""
echo "7. Checking file permissions..."
echo "Checking nginx config files permissions:"
find /etc/nginx/sites-available -type f -exec ls -la {} \; 2>/dev/null | head -n 5

echo ""
echo "8. Testing nginx reload..."
echo "Attempting to reload nginx..."
if systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully!"
else
    echo "❌ Failed to reload nginx"
    echo ""
    echo "Trying alternative method (nginx -s reload)..."
    if nginx -s reload; then
        echo "✅ Nginx reloaded using alternative method"
    else
        echo "❌ Both reload methods failed"
        echo ""
        echo "Try restarting nginx:"
        echo "  sudo systemctl restart nginx"
    fi
fi

echo ""
echo "=========================================="
echo "Troubleshooting complete"
echo "=========================================="

