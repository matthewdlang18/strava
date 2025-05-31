# 🍃 MongoDB Atlas Setup Guide

## 🎯 Getting Your MongoDB URL in 5 Minutes

### Step 1: Create MongoDB Atlas Account
1. Go to [cloud.mongodb.com](https://cloud.mongodb.com)
2. Click **"Try Free"**
3. Sign up with Google/GitHub or email
4. Complete account verification

### Step 2: Create Your First Cluster
1. **Choose deployment type**: Select **"M0 Sandbox"** (FREE)
2. **Cloud Provider**: AWS, Google Cloud, or Azure (any is fine)
3. **Region**: Choose closest to your location
4. **Cluster Name**: Leave default or name it `strava-cluster`
5. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 3: Setup Database Access
1. **Left sidebar** → **"Database Access"**
2. Click **"Add New Database User"**
3. **Authentication Method**: Password
4. **Username**: `strava_user` (or your choice)
5. **Password**: Click "Autogenerate Secure Password" (save this!)
6. **Database User Privileges**: "Read and write to any database"
7. Click **"Add User"**

### Step 4: Setup Network Access
1. **Left sidebar** → **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
4. Click **"Confirm"**

### Step 5: Get Your Connection String
1. **Left sidebar** → **"Database"**
2. Find your cluster → Click **"Connect"**
3. Choose **"Connect your application"**
4. **Driver**: Python
5. **Version**: 3.6 or later
6. **Copy the connection string**

### Step 6: Customize Your URL

Your connection string will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**Replace placeholders:**
- `<username>` → your database username (e.g., `strava_user`)
- `<password>` → your database password
- Add database name: `/strava_fittracker` before the `?`

**Final result:**
```
mongodb+srv://strava_user:YourPassword123@cluster0.abc123.mongodb.net/strava_fittracker?retryWrites=true&w=majority
```

## 🔍 Where to Find Each Part

### Finding Your Cluster URL
- **Dashboard** → **Database** → Your cluster name
- The connection string contains your unique cluster URL

### Finding Your Username/Password
- **Database Access** tab shows all users
- Password must be saved when you create the user (can't view later)
- You can create a new user or reset password if forgotten

### Database Name
- You can name it anything: `strava_fittracker`, `myapp`, etc.
- It will be created automatically when your app connects

## 🧪 Test Your Connection

Once you have your MongoDB URL, test it locally:

```bash
# Create a test file
cat > test_mongo.py << 'EOF'
import pymongo
import os

# Your MongoDB URL
MONGO_URL = "mongodb+srv://strava_user:YourPassword123@cluster0.abc123.mongodb.net/strava_fittracker?retryWrites=true&w=majority"

try:
    client = pymongo.MongoClient(MONGO_URL)
    # Test connection
    client.admin.command('ismaster')
    print("✅ MongoDB connection successful!")
    print(f"📊 Connected to: {MONGO_URL.split('@')[1].split('/')[0]}")
    print(f"🗄️ Database: strava_fittracker")
except Exception as e:
    print(f"❌ MongoDB connection failed: {e}")
finally:
    client.close()
EOF

# Run test
python test_mongo.py
```

## 🚨 Common Issues & Solutions

### Issue: "Authentication Failed"
**Solution**: Check username/password in connection string

### Issue: "Connection Timeout"
**Solution**: 
1. Check Network Access settings
2. Add current IP or "Allow from anywhere"

### Issue: "DNS Resolution Failed"
**Solution**: Check cluster URL in connection string

### Issue: "Can't find my password"
**Solution**: 
1. Go to Database Access
2. Edit user → "Edit Password"
3. Generate new password

## 📋 Environment Variable Format

For your deployment, use this format:
```bash
MONGO_URL=mongodb+srv://strava_user:YourPassword123@cluster0.abc123.mongodb.net/strava_fittracker?retryWrites=true&w=majority
```

## 🔐 Security Best Practices

### For Development
- ✅ Allow access from anywhere
- ✅ Use strong passwords
- ✅ Use specific database names

### For Production
- 🔒 Restrict IP access to your server
- 🔒 Use environment variables for credentials
- 🔒 Enable MongoDB Atlas security features
- 🔒 Regular password rotation

## 🎉 You're Ready!

Once you have your MongoDB URL:
1. ✅ Use it in your `.env` file for local development
2. ✅ Add it to Render environment variables for deployment
3. ✅ Test connection with the test script above

**Your MongoDB URL is the key to storing all your Strava data!** 🏃‍♂️📊
