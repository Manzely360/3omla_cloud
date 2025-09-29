#!/bin/bash

echo "🚀 Getting your Coin Matcher API URL..."
echo "========================================"

# Check if API is running
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Your API is running on http://localhost:8000"
else
    echo "❌ API not running. Please start it with: docker-compose up -d backend"
    exit 1
fi

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "📦 Installing ngrok..."
    brew install ngrok
fi

# Kill any existing ngrok processes
pkill ngrok 2>/dev/null
sleep 2

# Start ngrok
echo "🌐 Starting ngrok tunnel..."
ngrok http 8000 > /dev/null 2>&1 &
sleep 5

# Get the URL
URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$URL" ]; then
    echo "🎉 Your public API URL: $URL"
    echo ""
    echo "📋 Next steps:"
    echo "1. Copy this URL: $URL"
    echo "2. Open wix-velo-crypto-dashboard.js"
    echo "3. Replace 'https://your-coinmatcher-api.ngrok.io' with: $URL"
    echo "4. Follow QUICK_START.md to create your Wix site"
    echo ""
    echo "🔗 Test your API:"
    echo "   Health: $URL/health"
    echo "   Docs: $URL/docs"
    echo "   Signals: $URL/api/v1/signals/active"
else
    echo "❌ Could not get ngrok URL. Try running: ngrok http 8000"
fi
