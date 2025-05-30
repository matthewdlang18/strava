# Complete Deployment Guide - Strava FitTracker Pro

## 🚀 Recommended Platform: Render

We're deploying to **Render** first due to its excellent Docker support and simple setup process.

## Prerequisites Setup

### 1. Strava API Configuration

1. Go to [Strava Developers](https://developers.strava.com/)
2. Create a new application or use existing one
3. Note down these values:
   - **Client ID**: Your Strava app client ID
   - **Client Secret**: Your Strava app client secret
   - **Redirect URI**: Will be `https://your-app-name.onrender.com/auth/strava/callback`

### 2. MongoDB Database Setup

**Option A: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

**Option B: Render's MongoDB Add-on**
1. After creating your Render service, add MongoDB add-on
2. Connection string will be automatically provided

## Render Deployment Steps

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (recommended for easy repo access)

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `matthewdlang18/strava`
3. Configure the service:
   - **Name**: `strava-fittracker-pro` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `# Docker build handles this`
   - **Start Command**: `# Docker handles this`
   - **Instance Type**: `Free` (for testing) or `Starter` (for production)

### Step 3: Configure Environment Variables

Add these environment variables in Render dashboard:

```bash
# Strava API Configuration
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_REDIRECT_URI=https://your-app-name.onrender.com/auth/strava/callback

# Database Configuration
MONGO_URL=your_mongodb_connection_string
DB_NAME=strava_fittracker

# Frontend Environment (comma-separated for Docker build)
FRONTEND_ENV=REACT_APP_API_URL=https://your-app-name.onrender.com,REACT_APP_STRAVA_CLIENT_ID=your_strava_client_id

# Optional: Security
JWT_SECRET=your_jwt_secret_key_here
```

### Step 4: GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```bash
# Render API Integration
RENDER_API_KEY=your_render_api_key
RENDER_SERVICE_ID=your_render_service_id

# Strava Configuration
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret

# Database
MONGO_URL=your_mongodb_connection_string

# Frontend Environment
FRONTEND_ENV=REACT_APP_API_URL=https://your-app-name.onrender.com,REACT_APP_STRAVA_CLIENT_ID=your_strava_client_id
```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `STRAVA_CLIENT_ID` | Your Strava application client ID | `12345` |
| `STRAVA_CLIENT_SECRET` | Your Strava application secret | `abc123def456` |
| `STRAVA_REDIRECT_URI` | OAuth callback URL | `https://your-app.onrender.com/auth/strava/callback` |
| `MONGO_URL` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `DB_NAME` | MongoDB database name | `strava_fittracker` |
| `FRONTEND_ENV` | Frontend environment variables | `REACT_APP_API_URL=https://your-app.onrender.com` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT tokens | Auto-generated |
| `PORT` | Server port | `8000` |

## Testing the Deployment

### 1. Health Check
Visit: `https://your-app-name.onrender.com/health`

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "version": "2.0.0"
}
```

### 2. Frontend Check
Visit: `https://your-app-name.onrender.com`
Should load the React application

### 3. Strava OAuth Test
1. Click "Connect with Strava" button
2. Should redirect to Strava authorization
3. After authorization, should redirect back with user data

## Troubleshooting

### Common Issues

**1. Build Failures**
- Check that all required environment variables are set
- Verify `FRONTEND_ENV` format (comma-separated)
- Check GitHub Actions logs for specific errors

**2. Database Connection Issues**
- Verify MongoDB connection string format
- Ensure database user has proper permissions
- Check if IP whitelist includes Render's IPs (or use 0.0.0.0/0 for Atlas)

**3. Strava OAuth Not Working**
- Verify `STRAVA_REDIRECT_URI` matches exactly in Strava app settings
- Check that client ID and secret are correct
- Ensure Render app URL is correct

**4. Frontend Not Loading**
- Check that `REACT_APP_API_URL` points to correct backend URL
- Verify Docker build completed successfully
- Check Render logs for nginx errors

### Debugging Commands

```bash
# Check Render logs
render logs -s your-service-id

# Check container status
render ps -s your-service-id

# Manual deployment trigger
render deploy -s your-service-id
```

## Next Steps After Deployment

1. **Domain Setup**: Configure custom domain in Render dashboard
2. **SSL Certificate**: Automatically provided by Render
3. **Monitoring**: Set up Render's built-in monitoring
4. **Scaling**: Upgrade to paid plan for better performance
5. **Database Backup**: Configure MongoDB Atlas backup schedules

## Alternative Platforms

If Render doesn't work for your needs:

- **Railway**: Excellent for autoscaling, similar setup process
- **Heroku**: More mature platform, good for enterprise
- **DigitalOcean App Platform**: Good balance of features and pricing

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Strava API Docs**: [developers.strava.com](https://developers.strava.com)

---

**Ready to deploy? Follow the steps above and your Strava FitTracker Pro will be live! 🚀**
