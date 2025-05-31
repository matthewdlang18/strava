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
echo "🎯 Deployment Options:"
echo ""
echo "1. 🆓 GitHub Pages (Recommended - FREE & Easy!)"
echo "   - Demo mode with local storage"
echo "   - No external dependencies"
echo "   - Automatic deployment"
echo "   - Enable at: https://github.com/matthewdlang18/strava/settings/pages"
echo "   - Select 'GitHub Actions' as source"
echo "   - Your app will be live at: https://matthewdlang18.github.io/strava"
echo ""
echo "2. 🚀 Traditional Hosting (Requires external services)"
echo "   - Full Strava integration"
echo "   - Requires MongoDB setup"
echo "   - Platforms: Render.com, Railway.app, Heroku.com"
echo ""
echo "🔧 GitHub Actions will automatically build and deploy your app!"
echo "📊 Check the Actions tab on GitHub to monitor deployments"
echo ""
echo "🎉 For GitHub Pages: Just enable it in settings and you're done!"
