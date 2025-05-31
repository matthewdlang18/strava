#!/bin/bash

# Local GitHub Pages Preview Script
# Test your app locally before deploying to GitHub Pages

echo "🔍 Local GitHub Pages Preview"
echo "============================="
echo ""

# Ensure we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

cd frontend

echo "📦 Installing dependencies..."
if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
    yarn install --frozen-lockfile
else
    npm ci --legacy-peer-deps
fi

echo ""
echo "🏗️ Building production version..."

# Set GitHub Pages environment variables
export PUBLIC_URL="/strava"
export REACT_APP_STORAGE_MODE="local"
export REACT_APP_DEMO_MODE="true"
export GENERATE_SOURCEMAP="false"

# Build the app
if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
    yarn build
else
    npm run build
fi

echo ""
echo "🌐 Starting local preview server..."
echo ""
echo "📋 Preview Details:"
echo "   🔗 URL: http://localhost:3000/strava"
echo "   📱 Mobile: http://localhost:3000/strava (responsive)"
echo "   🛑 Stop: Press Ctrl+C"
echo ""
echo "⚡ Features to test:"
echo "   ✅ Dashboard loads with demo data"
echo "   ✅ Charts and graphs display correctly"
echo "   ✅ Activity maps render properly"
echo "   ✅ Add new activity functionality"
echo "   ✅ Achievement system works"
echo "   ✅ Mobile responsive design"
echo "   ✅ localStorage persists data"
echo ""

# Check if serve is installed globally
if command -v serve &> /dev/null; then
    echo "Using global 'serve' package..."
    serve -s build -l 3000 --single
elif command -v npx &> /dev/null; then
    echo "Using npx serve..."
    npx serve -s build -l 3000 --single
else
    echo "Installing serve locally..."
    npm install -g serve
    serve -s build -l 3000 --single
fi
