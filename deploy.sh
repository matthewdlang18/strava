#!/bin/bash

# Strava App Deployment Script
# This script helps you deploy your Strava application

echo "🚀 Strava App Deployment Helper"
echo "================================="

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

# Add and commit all changes
echo "📝 Committing changes..."
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🎯 IMPORTANT: Enable GitHub Pages First!"
echo ""
echo "📋 Step-by-Step Instructions:"
echo "1. 🌐 Go to: https://github.com/matthewdlang18/strava/settings/pages"
echo "2. 🔧 Under 'Source', select 'GitHub Actions'"
echo "3. 💾 Click 'Save'"
echo "4. ⏱️  Wait 2-3 minutes for automatic deployment"
echo "5. 🚀 Your app will be live at: https://matthewdlang18.github.io/strava"
echo ""
echo "🔍 Monitor deployment progress:"
echo "   - Actions tab: https://github.com/matthewdlang18/strava/actions"
echo "   - Look for 'Deploy to GitHub Pages' workflow"
echo ""
echo "💡 Why GitHub Pages?"
echo "   ✅ 100% FREE hosting forever"
echo "   ✅ No MongoDB/server setup needed"
echo "   ✅ Demo mode with sample fitness data"
echo "   ✅ All features work (charts, maps, analytics)"
echo "   ✅ Professional portfolio piece"
echo ""
echo "🎉 Once enabled, GitHub Actions will handle everything automatically!"
