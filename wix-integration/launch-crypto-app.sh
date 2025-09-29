#!/bin/bash

echo "🚀 Launching 3OMLA Crypto Dashboard"
echo "=================================="

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_FILE="$SCRIPT_DIR/standalone-crypto-app.html"

# Check if the app file exists
if [ ! -f "$APP_FILE" ]; then
    echo "❌ App file not found: $APP_FILE"
    exit 1
fi

echo "✅ Found app file: $APP_FILE"
echo "🌐 Opening in your default browser..."

# Open the app in the default browser
if command -v open &> /dev/null; then
    # macOS
    open "$APP_FILE"
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open "$APP_FILE"
elif command -v start &> /dev/null; then
    # Windows
    start "$APP_FILE"
else
    echo "❌ Could not open browser automatically"
    echo "📁 Please open this file manually: $APP_FILE"
    exit 1
fi

echo "🎉 Crypto Dashboard launched!"
echo ""
echo "📊 Features:"
echo "  - Live trading signals from your API"
echo "  - Real-time market data"
echo "  - Auto-refresh every 30 seconds"
echo "  - Professional dashboard design"
echo ""
echo "🔗 Your API: https://monotriglyphic-yong-unmannered.ngrok-free.dev"
echo "📱 Mobile responsive - works on all devices!"
