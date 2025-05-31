# 🛠️ Troubleshooting Guide

## Common Issues & Solutions

### Node.js Version Error
**Error**: `The engine "node" is incompatible with this module. Expected version ">=20.0.0"`

**Solution**: Update Node.js to version 20 or higher

```bash
# Check current version
node --version

# If version is less than 20.0.0, update:

# Option 1: Download from nodejs.org
# Visit https://nodejs.org/ and download LTS version 20+

# Option 2: Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20

# Option 3: Using Homebrew (macOS)
brew install node@20
brew link node@20 --force

# Verify installation
node --version  # Should show v20.x.x or higher
```

### MongoDB Connection Issues
**Error**: Connection timeout, authentication failed, or SSL handshake error

**Solutions**:
1. **Check credentials**: Ensure username/password are correct in your MongoDB URL
2. **IP Whitelist**: In MongoDB Atlas, go to Network Access and add `0.0.0.0/0` for all IPs
3. **SSL Configuration**: For Render deployment, use the tested working connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/database?ssl=true&tlsInsecure=true
   ```
4. **Test connection**: Use the MongoDB test script:
   ```bash
   export MONGO_URL="your_mongodb_url_here"
   python test_mongodb.py
   ```

### GitHub Actions Deployment Failures
**Error**: Workflow fails during deployment

**Solutions**:
1. **Check secrets**: Ensure all required secrets are set in GitHub repo settings
2. **Node.js version**: Workflow now uses Node.js 20 (fixed automatically)
3. **View logs**: Go to Actions tab → Click failed workflow → Expand steps to see errors

### Render Deployment Issues
**Error**: Build fails or app doesn't start

**Solutions**:
1. **Environment variables**: Double-check all required vars are set in Render dashboard
2. **Build logs**: Check Render service Events tab for detailed error logs
3. **Health check**: Visit `/api/health` endpoint to verify backend is running

### Local Development Issues
**Error**: Frontend or backend won't start

**Solutions**:
```bash
# Kill any processes using ports
lsof -ti:3000 | xargs kill  # Frontend port
lsof -ti:8000 | xargs kill  # Backend port

# Reinstall dependencies
cd frontend && yarn install
cd ../backend && pip install -r requirements.txt

# Use setup script
./setup.sh
```

### Strava API Issues
**Error**: OAuth redirect or API calls fail

**Solutions**:
1. **Callback URL**: Ensure Strava app settings have correct domain
2. **Client ID/Secret**: Double-check credentials in environment variables
3. **API Limits**: Check Strava developer dashboard for rate limiting

### Docker Issues
**Error**: Docker build or container startup fails

**Solutions**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild with no cache
docker-compose up --build --no-cache

# Check logs
docker-compose logs
```

## Quick Diagnostics

### System Check
```bash
# Run comprehensive verification
./verify-setup.sh

# Check individual components
node --version    # Should be 20+
python3 --version # Should be 3.11+
docker --version  # Should be installed
git --version     # Should be installed
```

### Environment Variables Check
```bash
# For local development
cat .env

# For deployment
echo $MONGO_URL
echo $STRAVA_CLIENT_ID
```

### Network Connectivity
```bash
# Test MongoDB connection
curl -I https://cloud.mongodb.com

# Test GitHub connectivity
curl -I https://api.github.com

# Test Render connectivity
curl -I https://render.com
```

## Getting Help

### Documentation
- **Setup**: [`QUICK_START.md`](QUICK_START.md)
- **Detailed Guide**: [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md)
- **Testing**: [`TESTING_GUIDE.md`](TESTING_GUIDE.md)

### External Resources
- **Node.js**: [nodejs.org](https://nodejs.org/)
- **MongoDB Atlas**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com/)
- **Render**: [docs.render.com](https://docs.render.com/)
- **Strava API**: [developers.strava.com](https://developers.strava.com/)

### Support Channels
- **GitHub Issues**: Create an issue in the repository
- **Stack Overflow**: Tag with `strava-api`, `react`, `fastapi`
- **Discord/Slack**: Join relevant developer communities

---

**💡 Tip**: Most issues can be resolved by running `./verify-setup.sh` and following the error messages!
