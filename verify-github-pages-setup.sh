#!/bin/bash

# Verification script to confirm GitHub Pages-only deployment setup

echo "🔍 Strava App Deployment Verification"
echo "====================================="
echo ""

# Check active workflows
echo "✅ ACTIVE WORKFLOWS:"
if ls .github/workflows/*.yml >/dev/null 2>&1; then
    for file in .github/workflows/*.yml; do
        filename=$(basename "$file")
        echo "   ✓ $filename"
        
        # Check if it's the GitHub Pages workflow
        if grep -q "Deploy to GitHub Pages" "$file"; then
            echo "     📍 GitHub Pages deployment workflow ✅"
        else
            echo "     ⚠️  Unknown workflow - may need review"
        fi
    done
else
    echo "   ❌ No active workflows found!"
fi

echo ""

# Check disabled workflows
echo "❌ DISABLED WORKFLOWS:"
if ls .github/workflows/*.disabled >/dev/null 2>&1; then
    for file in .github/workflows/*.disabled; do
        filename=$(basename "$file" .disabled)
        echo "   ✓ $filename (disabled)"
        
        # Check what type of deployment it was
        if grep -q "render\|railway\|heroku" "$file" 2>/dev/null; then
            echo "     📍 External platform deployment (safely disabled)"
        fi
    done
else
    echo "   ℹ️  No disabled workflows found"
fi

echo ""

# Check if GitHub Pages workflow is properly configured
echo "🔧 GITHUB PAGES CONFIGURATION:"
if [ -f ".github/workflows/github-pages.yml" ]; then
    if grep -q "permissions:" ".github/workflows/github-pages.yml" && \
       grep -q "pages: write" ".github/workflows/github-pages.yml" && \
       grep -q "actions/deploy-pages" ".github/workflows/github-pages.yml"; then
        echo "   ✅ GitHub Pages workflow is properly configured"
    else
        echo "   ⚠️  GitHub Pages workflow may need configuration review"
    fi
    
    if grep -q "REACT_APP_STORAGE_MODE: local" ".github/workflows/github-pages.yml"; then
        echo "   ✅ Demo mode (localStorage) is enabled"
    else
        echo "   ⚠️  Demo mode configuration not found"
    fi
else
    echo "   ❌ GitHub Pages workflow not found!"
fi

echo ""

# Check frontend demo configuration
echo "📱 FRONTEND DEMO CONFIGURATION:"
if [ -f "frontend/src/api/localStorage.js" ]; then
    echo "   ✅ localStorage API implementation found"
else
    echo "   ❌ localStorage API not found - demo mode may not work"
fi

if [ -f "frontend/src/App.js" ] && grep -q "localStorage" "frontend/src/App.js"; then
    echo "   ✅ App.js configured for localStorage"
else
    echo "   ⚠️  App.js may not be configured for demo mode"
fi

echo ""

# Summary
echo "📋 DEPLOYMENT SUMMARY:"
echo "   🎯 Target: GitHub Pages (static site hosting)"
echo "   💾 Storage: Browser localStorage (demo data)"
echo "   🔒 External deployments: All disabled"
echo "   💰 Cost: FREE"
echo "   🚀 URL: https://matthewdlang18.github.io/strava"
echo ""

echo "✅ Verification complete!"
echo ""
echo "🚀 TO DEPLOY:"
echo "   1. Run: ./deploy.sh"
echo "   2. Enable GitHub Pages in repository settings"
echo "   3. Wait 2-3 minutes for deployment"
echo "   4. Visit your live app!"
