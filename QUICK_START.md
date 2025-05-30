# 🚀 Quick Start Deployment

**Get your Strava FitTracker Pro deployed in under 30 minutes!**

## Prerequisites (5 minutes)

### 1. Strava API Setup
1. Go to [Strava Developers](https://developers.strava.com/)
2. Click "Create & Manage Your App"
3. Fill in application details:
   - **Application Name**: Your app name
   - **Category**: Data Importer
   - **Club**: Leave blank
   - **Website**: Your GitHub repo URL
   - **Authorization Callback Domain**: Leave blank for now
4. Save and note down:
   - ✅ **Client ID**
   - ✅ **Client Secret**

### 2. MongoDB Setup
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create free account and cluster
3. Create database user (remember username/password)
4. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - ✅ **MongoDB URL**: `mongodb+srv://username:password@cluster.mongodb.net/`

## Deploy to Render (15 minutes)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (connects to your repo automatically)

### Step 2: Create Web Service
1. Click "New +" → "Web Service"
2. Select your repository: `matthewdlang18/strava`
3. Configure:
   - **Name**: `strava-fittracker-pro`
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Build Command**: *(leave blank)*
   - **Start Command**: *(leave blank)*
   - **Plan**: Free (or Starter for better performance)

### Step 3: Environment Variables
Add these in Render dashboard (Environment tab):

```bash
STRAVA_CLIENT_ID=your_client_id_from_step_1
STRAVA_CLIENT_SECRET=your_client_secret_from_step_1
STRAVA_REDIRECT_URI=https://your-app-name.onrender.com/auth/strava/callback
MONGO_URL=your_mongodb_url_from_step_2
DB_NAME=strava_fittracker
FRONTEND_ENV=REACT_APP_API_URL=https://your-app-name.onrender.com,REACT_APP_STRAVA_CLIENT_ID=your_client_id_from_step_1
```

### Step 4: Deploy!
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your app will be live at: `https://your-app-name.onrender.com`

## Update Strava Redirect URI (2 minutes)

1. Go back to [Strava Developers](https://developers.strava.com/)
2. Edit your application
3. Set **Authorization Callback Domain**: `your-app-name.onrender.com`
4. Save

## ✅ Test Your Deployment

1. Visit your app URL
2. Click "Connect with Strava"
3. Authorize your app
4. Should redirect back with your Strava data!

## 🔧 Enable Auto-Deployment (5 minutes)

### Get Render API Key
1. Go to Render dashboard → Account Settings
2. Generate API key
3. Copy the key

### Add GitHub Secrets
1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these secrets:
   ```
   RENDER_API_KEY=your_render_api_key
   RENDER_SERVICE_ID=your_render_service_id
   STRAVA_CLIENT_ID=your_strava_client_id
   STRAVA_CLIENT_SECRET=your_strava_client_secret
   MONGO_URL=your_mongodb_url
   FRONTEND_ENV=REACT_APP_API_URL=https://your-app-name.onrender.com,REACT_APP_STRAVA_CLIENT_ID=your_strava_client_id
   ```

**Get Service ID**: In Render dashboard, click your service, copy ID from URL

Now every push to `main` branch will auto-deploy! 🎉

## 🆘 Need Help?

- **Detailed Guide**: See `DEPLOYMENT_GUIDE.md`
- **Troubleshooting**: Check `DEPLOYMENT_STATUS.md`
- **Issues**: Check GitHub Actions logs
- **Setup Script**: Run `./setup.sh` for local development

## 🎉 You're Live!

Your Strava FitTracker Pro is now deployed and ready for users!

**Next steps:**
- Share your app URL with friends
- Monitor usage in Render dashboard
- Check Strava API usage in Strava dashboard
- Consider upgrading to paid plans for production use

---

**⭐ Don't forget to star the repository if this helped you!**
