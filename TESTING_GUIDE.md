# 🧪 Website Testing Guide

## 🏠 Local Testing (Start Here!)

### 1. Quick Health Check
```bash
# Test the verification script
./verify-setup.sh
```

### 2. Start Local Development Servers
```bash
# Terminal 1: Start Backend
cd backend
python server.py

# Terminal 2: Start Frontend  
cd frontend
yarn start
```

**Local URLs:**
- 🎨 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Docs**: http://localhost:8000/docs
- ❤️ **Health Check**: http://localhost:8000/health

### 3. Manual Testing Checklist
- [ ] Frontend loads at http://localhost:3000
- [ ] No console errors in browser dev tools
- [ ] Backend health check returns `{"status": "healthy"}`
- [ ] API documentation loads at http://localhost:8000/docs
- [ ] Can navigate through the app interface

## 🚀 After Deployment Testing

### 1. Check GitHub Actions
1. Go to your GitHub repository
2. Click **Actions** tab
3. Verify latest workflow run is ✅ green
4. Check build logs for any errors

### 2. Render Deployment Testing
Once deployed to Render, test these URLs:

```bash
# Replace 'your-app-name' with your actual Render service name
export APP_URL="https://your-app-name.onrender.com"

# Test health endpoints
curl $APP_URL/api/health
curl $APP_URL/health

# Test frontend loads
curl -I $APP_URL
```

**Live URLs to Test:**
- 🌐 **Main App**: https://your-app-name.onrender.com
- ❤️ **Health Check**: https://your-app-name.onrender.com/api/health  
- 📚 **API Docs**: https://your-app-name.onrender.com/api/docs
- 🔐 **Strava Auth**: https://your-app-name.onrender.com/auth/strava

### 3. Production Testing Checklist
- [ ] Main URL loads without errors
- [ ] Health endpoint returns `{"status": "healthy"}`
- [ ] API documentation accessible
- [ ] SSL certificate working (https://)
- [ ] No 404 errors for main routes
- [ ] Frontend builds and serves correctly
- [ ] Backend API endpoints respond
- [ ] Environment variables loaded correctly

## 🔧 Automated Testing

### 1. Run Test Suites
```bash
# Frontend tests
cd frontend
yarn test

# Backend tests  
python -m pytest test_backend.py -v

# Full verification
./verify-setup.sh
```

### 2. GitHub Actions Continuous Testing
Every push to `main` automatically:
- ✅ Runs frontend tests
- ✅ Runs backend tests  
- ✅ Builds application
- ✅ Deploys to Render

## 🌐 Browser Testing

### 1. Open Multiple Browser Tabs
- **Frontend**: http://localhost:3000 (local) or https://your-app.onrender.com (live)
- **API Docs**: http://localhost:8000/docs (local) or https://your-app.onrender.com/api/docs (live)
- **Health**: http://localhost:8000/health (local) or https://your-app.onrender.com/api/health (live)

### 2. Browser Console Check
1. Open Developer Tools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Verify all resources load correctly

## 🔍 Troubleshooting

### Common Issues & Solutions

#### Local Development
```bash
# Port already in use
lsof -ti:3000 | xargs kill  # Kill frontend
lsof -ti:8000 | xargs kill  # Kill backend

# Dependencies issues
cd frontend && yarn install
pip install -r requirements.txt
pip install -r backend/requirements.txt
```

#### Deployment Issues
```bash
# Check Render logs
# 1. Login to dashboard.render.com
# 2. Click your service
# 3. Go to "Events" tab
# 4. Check build/deploy logs

# Test health endpoint
curl https://your-app-name.onrender.com/api/health
```

#### GitHub Actions Issues
1. Go to repository → Actions tab
2. Click failed workflow
3. Expand failed step
4. Check error logs
5. Common fixes:
   - Update secrets (RENDER_API_KEY, etc.)
   - Check package.json/requirements.txt
   - Verify test files exist

## 🎯 Success Indicators

### ✅ Local Development Success
- Frontend starts without errors
- Backend starts and serves health endpoint
- Tests pass when run manually
- No console errors in browser

### ✅ Deployment Success  
- GitHub Actions workflow passes
- Health endpoint returns `{"status": "healthy"}`
- Frontend loads at live URL
- API documentation accessible
- SSL certificate valid

### ✅ End-to-End Success
- User can access main application
- Strava OAuth flow works (once credentials added)
- Data displays correctly
- No broken links or 404 errors

## 🚀 Next Steps

1. **Local Testing**: Start with `./verify-setup.sh`
2. **Deploy**: Follow `QUICK_START.md` 
3. **Test Live**: Use this guide to verify deployment
4. **Add Features**: Build on the solid foundation!

---

**🎉 Your Strava FitTracker Pro is ready for users!**
