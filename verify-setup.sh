#!/bin/bash

# Strava Application Test Suite
# Verifies both frontend and backend functionality

set -e

echo "🧪 Running Strava Application Test Suite..."
echo "=============================================="

# Test Frontend
echo ""
echo "🎨 Testing Frontend..."
cd frontend
echo "📦 Installing dependencies..."
yarn install --silent

echo "🧪 Running frontend tests..."
yarn test --passWithNoTests --watchAll=false --silent

echo "🏗️ Testing frontend build..."
yarn build --silent

echo "✅ Frontend tests passed!"

# Test Backend  
echo ""
echo "🔧 Testing Backend..."
cd ../backend

echo "📦 Installing dependencies..."
python3 -m pip install -r requirements.txt --quiet

echo "🧪 Testing backend imports..."
python3 -c "
import sys
import importlib.util
spec = importlib.util.spec_from_file_location('server', 'server.py')
server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(server)
print('✅ Backend server imports successfully')
"

echo "🔍 Testing health endpoints..."
python3 -c "
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

# Test main health endpoint
response = client.get('/health')
assert response.status_code == 200
assert 'status' in response.json()
assert response.json()['status'] == 'healthy'
print('✅ /health endpoint working')

# Test API health endpoint
response = client.get('/api/health')
assert response.status_code == 200
assert 'status' in response.json()
print('✅ /api/health endpoint working')
"

echo "🧪 Running comprehensive backend tests..."
python3 -m pytest ../test_backend.py -v --tb=short

echo "✅ Backend tests passed!"

# Summary
echo ""
echo "🎉 All tests passed successfully!"
echo "=============================================="
echo "✅ Frontend: Dependencies installed, tests pass, builds successfully"
echo "✅ Backend: Dependencies installed, server starts, health endpoints working"
echo "✅ Testing infrastructure: Both React Testing Library and FastAPI TestClient working"
echo ""
echo "🚀 Your application is ready for deployment!"
echo "   Follow the deployment guides in QUICK_START.md or DEPLOYMENT_GUIDE.md"
