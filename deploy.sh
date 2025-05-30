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
echo "🎯 Next Steps:"
echo "1. Go to https://github.com/matthewdlang18/strava"
echo "2. Choose a deployment platform:"
echo "   - Render.com (recommended for beginners)"
echo "   - Railway.app"
echo "   - Heroku.com"
echo ""
echo "3. Set up these environment variables on your platform:"
echo "   STRAVA_CLIENT_ID=your_client_id"
echo "   STRAVA_CLIENT_SECRET=your_client_secret"
echo "   MONGODB_URI=your_mongodb_connection"
echo "   FRONTEND_ENV=REACT_APP_API_URL=https://your-domain.com,REACT_APP_STRAVA_CLIENT_ID=your_client_id"
echo ""
echo "4. See DEPLOYMENT.md for detailed instructions"
echo ""
echo "🔧 GitHub Actions will automatically build and deploy your app!"
echo "📊 Check the Actions tab on GitHub to monitor deployments"
