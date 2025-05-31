#!/bin/bash

# Quick Deploy Script - Simple push to GitHub without local building

echo "🚀 Quick Deploy to GitHub Pages"
echo "==============================="
echo ""

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

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️ No changes to commit"
else
    git commit -m "GitHub Pages Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "✅ Changes committed"
fi

# Push to GitHub
echo "⬆️ Pushing to GitHub..."
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "🎯 FINAL STEP: Enable GitHub Pages"
echo ""
echo "📋 Quick Setup (2 minutes):"
echo "1. 🌐 Go to: https://github.com/matthewdlang18/strava/settings/pages"
echo "2. 🔧 Under 'Source', select 'GitHub Actions'"
echo "3. 💾 Click 'Save'"
echo "4. ⏱️  Wait 2-3 minutes for automatic deployment"
echo "5. 🚀 Your app will be live at: https://matthewdlang18.github.io/strava"
echo ""
echo "🔍 Monitor deployment:"
echo "   👉 https://github.com/matthewdlang18/strava/actions"
echo ""
echo "🎉 What you get:"
echo "   ✅ Professional fitness tracker with demo data"
echo "   ✅ Interactive charts, maps, and analytics"
echo "   ✅ Personal records and achievements system"
echo "   ✅ Mobile-responsive design"
echo "   ✅ Portfolio-ready application"
echo ""
echo "💡 This app runs 100% in the browser - no servers needed!"
echo "🎊 Perfect solution: No Render, no MongoDB, no SSL errors!"
