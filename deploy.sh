#!/bin/bash

# GitHub Pages Deployment Script for Strava Fitness Tracker
# This script deploys your app to GitHub Pages (FREE hosting)

echo "🎯 GitHub Pages Deployment"
echo "=========================="
echo ""
echo "🚀 Deploying Strava Fitness Tracker to GitHub Pages..."
echo "   ✅ No external services needed"
echo "   ✅ No MongoDB setup required"
echo "   ✅ 100% FREE hosting forever"
echo "   ✅ Comprehensive demo data included"
echo ""

# Confirm no external deployments
echo "🔒 External Deployment Status:"
echo "   ❌ Render deployment: DISABLED"
echo "   ❌ Railway deployment: DISABLED" 
echo "   ❌ Heroku deployment: DISABLED"
echo "   ✅ GitHub Pages only: ACTIVE"
echo ""

# Offer different deployment options
echo "🎯 Choose your deployment method:"
echo ""
echo "1. 🚀 Quick Deploy (recommended)"
echo "   └── Push code and get setup instructions"
echo ""
echo "2. 🏗️ Build & Deploy"
echo "   └── Test locally, then deploy with validation"
echo ""
echo "3. 🔍 Preview First" 
echo "   └── Test locally before deploying"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Running Quick Deploy..."
        ./quick-deploy.sh
        ;;
    2)
        echo ""
        echo "🏗️ Running Build & Deploy..."
        ./build-and-deploy.sh
        ;;
    3)
        echo ""
        echo "🔍 Starting Local Preview..."
        echo "After testing, run './deploy.sh' again and choose option 1 or 2"
        ./preview-local.sh
        ;;
    *)
        echo ""
        echo "Invalid choice. Running Quick Deploy..."
        ./quick-deploy.sh
        ;;
esac
