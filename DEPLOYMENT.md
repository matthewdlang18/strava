# Strava App Deployment Guide

## Quick Start Deployment

Your Strava application is now configured for deployment on multiple platforms. Here's how to deploy it:

### 1. GitHub Setup

1. **Initialize your repository** (if not already done):
```bash
cd /Users/mattlang/VSCode/Strava/strava
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/matthewdlang18/strava.git
git push -u origin main
```

2. **Configure GitHub Secrets**:
Go to your repository on GitHub → Settings → Secrets and variables → Actions

Add these secrets:
- `FRONTEND_ENV`: Your frontend environment variables
  ```
  REACT_APP_API_URL=https://your-app-domain.com,REACT_APP_STRAVA_CLIENT_ID=your_client_id
  ```

### 2. Platform-Specific Deployment

#### Option A: Render (Recommended - Free Tier Available)

1. Visit [render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Use these settings:
   - **Name**: strava-app
   - **Region**: Oregon (US West)
   - **Branch**: main
   - **Build Command**: `docker build -t strava-app .`
   - **Start Command**: `/entrypoint.sh`
   - **Plan**: Free

5. Add environment variables in Render:
   ```
   STRAVA_CLIENT_ID=your_strava_client_id
   STRAVA_CLIENT_SECRET=your_strava_client_secret
   MONGODB_URI=your_mongodb_connection_string
   FRONTEND_ENV=REACT_APP_API_URL=https://your-render-app.onrender.com,REACT_APP_STRAVA_CLIENT_ID=your_client_id
   ```

6. Add GitHub secrets for auto-deployment:
   - `RENDER_API_KEY`: Get from Render account settings
   - `RENDER_SERVICE_ID`: Get from your service URL

#### Option B: Railway

1. Visit [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect the Dockerfile
5. Add environment variables in Railway dashboard
6. Add GitHub secrets:
   - `RAILWAY_TOKEN`: Get from Railway settings
   - `RAILWAY_PROJECT_ID`: Get from project settings

#### Option C: Heroku

1. Visit [heroku.com](https://heroku.com) and create account
2. Create new app
3. Go to Deploy tab → Connect to GitHub
4. Enable automatic deploys
5. Add GitHub secrets:
   - `HEROKU_API_KEY`: Get from Heroku account settings
   - `HEROKU_APP_NAME`: Your app name
   - `HEROKU_EMAIL`: Your Heroku email

### 3. MongoDB Setup

You'll need a MongoDB database. Options:

#### MongoDB Atlas (Recommended)
1. Visit [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Use it in your `MONGODB_URI` environment variable

#### Railway MongoDB (if using Railway)
1. In Railway, add MongoDB service to your project
2. Use the provided connection string

### 4. Strava API Setup

1. Visit [developers.strava.com](https://developers.strava.com)
2. Create an application
3. Note your Client ID and Client Secret
4. Set redirect URI to: `https://your-deployed-domain.com/api/auth/strava/callback`

### 5. Update Environment Variables

Update your deployed app's environment variables:

```env
STRAVA_CLIENT_ID=your_actual_client_id
STRAVA_CLIENT_SECRET=your_actual_client_secret
STRAVA_REDIRECT_URI=https://your-deployed-domain.com/api/auth/strava/callback
MONGODB_URI=your_mongodb_connection_string
FRONTEND_ENV=REACT_APP_API_URL=https://your-deployed-domain.com,REACT_APP_STRAVA_CLIENT_ID=your_actual_client_id
```

### 6. Test Your Deployment

1. Visit your deployed URL
2. Try the Strava authentication flow
3. Check the health endpoint: `https://your-domain.com/health`

## Automatic Deployment

Once set up, your app will automatically deploy when you push to the main branch:

```bash
git add .
git commit -m "Update app"
git push origin main
```

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check your environment variables are set correctly
2. **Strava Auth Fails**: Verify redirect URI matches your deployment URL
3. **Database Connection**: Ensure MongoDB URI is correct and accessible
4. **Frontend Not Loading**: Check FRONTEND_ENV variable is properly formatted

### Logs:
- **Render**: View logs in Render dashboard
- **Railway**: Use Railway CLI or dashboard
- **Heroku**: Use `heroku logs --tail` or dashboard

## Local Development

To run locally:

```bash
# With Docker
docker-compose up --build

# Without Docker
# Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001

# Frontend (new terminal)
cd frontend
npm install
npm start
```

Your app is now ready for deployment! Choose your preferred platform and follow the steps above.
