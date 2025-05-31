# 🚀 Quick Start Deployment

**Get your Strava F   **Your URL format:**
   ```
   mongodb+srv://<db_username>:<db_password>@strava-fittracker-pro.dvvyezk.mongodb.net/?retryWrites=true&w=majority&appName=strava-fittracker-pro&ssl=true&authSource=admin&tlsAllowInvalidCertificates=true
   ```
   
   **Replace placeholders with your credentials:**
   ```
   mongodb+srv://myuser:mypass123@strava-fittracker-pro.dvvyezk.mongodb.net/strava_fittracker?retryWrites=true&w=majority&appName=strava-fittracker-pro&ssl=true&authSource=admin&tlsAllowInvalidCertificates=true
   ``` Pro deployed in under 30 minutes!**

## ⚠️ Requirements

- **Node.js 20+** (required for react-router-dom v7)
- **Python 3.11+** 
- **Git**

**Check your Node.js version:**
```bash
node --version  # Should be v20.0.0 or higher
```

**Update Node.js if needed:**
- [Download from nodejs.org](https://nodejs.org/) (choose LTS version 20+)
- Or use nvm: `nvm install 20 && nvm use 20`

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
2. **Create account** and **create cluster** (choose M0 FREE tier)
3. **Create database user**:
   - Left sidebar → "Database Access" → "Add New Database User"
   - Username: `strava_user` (or your choice)
   - Password: Generate secure password
   - Database User Privileges: "Read and write to any database"
4. **Get connection string**:
   - Left sidebar → "Database" → Your cluster → "Connect"
   - Choose "Connect your application"
   - Select "Python" and "3.6 or later"
   - Copy the connection string and **replace the placeholders**:
   
   **Your URL format:**
   ```
   mongodb+srv://<db_username>:<db_password>@strava-fittracker-pro.dvvyezk.mongodb.net/?retryWrites=true&w=majority&appName=strava-fittracker-pro
   ```
   
   **Replace placeholders with your credentials:**
   ```
   mongodb+srv://myuser:mypass123@strava-fittracker-pro.dvvyezk.mongodb.net/strava_fittracker?retryWrites=true&w=majority&appName=strava-fittracker-pro&ssl=true&tlsAllowInvalidCertificates=true
   ```
   
   **🔧 For Render deployment, use this SSL-compatible format:**
   ```
   mongodb+srv://myuser:mypass123@strava-fittracker-pro.dvvyezk.mongodb.net/strava_fittracker?retryWrites=true&w=majority&ssl=true&authSource=admin&tlsAllowInvalidCertificates=true
   ```
   
   ✅ **MongoDB URL**: Your final URL with real username/password

**Test your MongoDB connection:**
```bash
export MONGO_URL="your_complete_url_here"
python test_mongodb.py
```

**Example MongoDB URL format:**
```
mongodb+srv://USERNAME:PASSWORD@cluster0.abc123.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority&ssl=true&authSource=admin&tlsAllowInvalidCertificates=true
```

**Working Example (tested ✅):**
```
mongodb+srv://strava_app:strava_app@strava-fittracker-pro.dvvyezk.mongodb.net/?ssl=true&authSource=admin&tlsAllowInvalidCertificates=true
```

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

- **Issues or Errors**: See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)
- **Detailed Guide**: See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
- **Testing**: Check [`TESTING_GUIDE.md`](TESTING_GUIDE.md)
- **Local Development**: Run `./setup.sh` for automated setup

## 🎉 You're Live!

Your Strava FitTracker Pro is now deployed and ready for users!

**Next steps:**
- Share your app URL with friends
- Monitor usage in Render dashboard
- Check Strava API usage in Strava dashboard
- Consider upgrading to paid plans for production use

---

**⭐ Don't forget to star the repository if this helped you!**
