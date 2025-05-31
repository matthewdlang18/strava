#!/bin/bash

# GitHub Pages Build and Deploy Script
# This script builds the React app and deploys it to GitHub Pages

echo "🚀 GitHub Pages Build & Deploy"
echo "=============================="
echo ""

# Ensure we're in the right directory
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Check Node.js version
node_version=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$node_version" -lt "20" ]; then
    echo "❌ Error: Node.js 20+ required (current: v$(node --version))"
    echo "Please update Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version check passed: $(node --version)"
echo ""

# Navigate to frontend directory
cd frontend

echo "📦 Installing dependencies..."
if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
    echo "Using Yarn..."
    yarn install --frozen-lockfile || {
        echo "⚠️ Yarn failed, falling back to npm..."
        npm ci --legacy-peer-deps
    }
else
    echo "Using npm..."
    npm ci --legacy-peer-deps
fi

echo ""
echo "🔧 Building for GitHub Pages..."

# Set environment variables for GitHub Pages
export PUBLIC_URL="/strava"
export REACT_APP_STORAGE_MODE="local"
export REACT_APP_DEMO_MODE="true"
export GENERATE_SOURCEMAP="false"
export CI="false"

# Build the app
if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
    yarn build
else
    npm run build
fi

if [ ! -d "build" ]; then
    echo "❌ Build failed - build directory not found!"
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""

# Test the build locally (optional)
echo "🧪 Testing build locally..."
echo "📁 Build size:"
du -sh build/
echo ""
echo "📋 Build contents:"
ls -la build/
echo ""

# Check if critical files exist
if [ ! -f "build/index.html" ]; then
    echo "❌ Critical file missing: index.html"
    exit 1
fi

if [ ! -f "build/static/js/"*.js ]; then
    echo "❌ Critical files missing: JavaScript bundles"
    exit 1
fi

echo "✅ Build validation passed!"
echo ""

# Return to root directory
cd ..

# Git operations
echo "📝 Committing changes..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git branch -M main
fi

# Check if remote is set
if ! git remote | grep -q origin; then
    echo "🔗 Adding GitHub remote..."
    git remote add origin https://github.com/matthewdlang18/strava.git
fi

# Add all files
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️ No changes to commit"
else
    # Commit with timestamp
    commit_message="GitHub Pages Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$commit_message"
    echo "✅ Changes committed: $commit_message"
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo "======================="
echo ""
echo "🔗 Your Repository: https://github.com/matthewdlang18/strava"
echo "⚙️ GitHub Actions: https://github.com/matthewdlang18/strava/actions"
echo ""
echo "🎯 NEXT STEPS:"
echo "1. 🌐 Go to: https://github.com/matthewdlang18/strava/settings/pages"
echo "2. 🔧 Under 'Source', select 'GitHub Actions'"
echo "3. 💾 Click 'Save'"
echo "4. ⏱️  Wait 2-3 minutes for automatic deployment"
echo ""
echo "🚀 Your app will be live at:"
echo "   https://matthewdlang18.github.io/strava"
echo ""
echo "📊 Features Available:"
echo "   ✅ Full fitness tracking dashboard"
echo "   ✅ Interactive charts and analytics"
echo "   ✅ Route maps and GPS visualization"
echo "   ✅ Achievement system and personal records"
echo "   ✅ Responsive mobile-friendly design"
echo "   ✅ Comprehensive demo data pre-loaded"
echo ""
echo "💡 This is a static site - no servers needed!"
echo "🎊 Perfect for portfolios and demonstrations!"
