# Strava Fitness Tracker

A modern fitness tracking application built with React, deployed as a static site on GitHub Pages with demo mode featuring sample fitness data.

## 🏗️ Architecture

- **Frontend**: React.js with modern UI components
- **Storage**: Browser localStorage (demo mode)
- **Deployment**: GitHub Pages (static site hosting)
- **CI/CD**: GitHub Actions automated deployment
- **Demo Data**: Pre-populated activities, achievements, and analytics

**🎯 Simplified Architecture**: No backend servers, databases, or external dependencies needed!

## 🚀 Quick Start

### 🎯 Ready to Deploy?

**GitHub Pages Deployment (5 minutes)**:

1. **🚀 Quick Deploy**: Run `./deploy.sh` to push code and get setup instructions
2. **⚙️ Enable Pages**: Go to repository settings and enable GitHub Pages with "GitHub Actions" source  
3. **🎉 Live in 2-3 minutes**: Your app will be live at `https://matthewdlang18.github.io/strava`

**Documentation**:
- **🎯 GitHub Pages Setup**: [`SETUP_GITHUB_PAGES.md`](SETUP_GITHUB_PAGES.md)
- **📚 Success Guide**: [`GITHUB_PAGES_SUCCESS.md`](GITHUB_PAGES_SUCCESS.md) 
- **🔧 Local Development**: Run `./setup.sh` for automated setup
- **🛠️ Troubleshooting**: See [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md)

### ⚙️ Requirements
- **Node.js 20+** (required for React and modern dependencies)
- **Git** (for version control and deployment)
- **Modern Browser** (for localStorage and demo features)

**Check your versions:**
```bash
node --version   # Should be v20.0.0+
git --version    # Any recent version
```

### 🌟 Features
- ✅ **GitHub Pages Hosting** - Free, fast, reliable
- ✅ **Demo Mode** - Pre-populated with sample fitness data
- ✅ **Activity Tracking** - Log runs, rides, and workouts
- ✅ **Progress Analytics** - Charts and progress visualization  
- ✅ **Achievement System** - Unlock badges and milestones
- ✅ **Responsive Design** - Works on desktop and mobile

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/matthewdlang18/strava.git
cd strava
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run with Docker Compose:
```bash
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- Health Check: http://localhost:8000/health

5. **Test everything works**:
```bash
./verify-setup.sh
```

## 🧪 Testing Your Website

### Quick Test
```bash
./verify-setup.sh  # Comprehensive test suite
```

### Manual Testing
- **Local**: http://localhost:3000 (frontend) + http://localhost:8000 (backend)
- **Live**: https://your-app-name.onrender.com (after deployment)
- **Health**: `/api/health` endpoint should return `{"status": "healthy"}`

📖 **Complete testing guide**: See [TESTING_GUIDE.md](TESTING_GUIDE.md)
- Backend API: http://localhost:8001

### Manual Setup

#### Frontend
```bash
cd frontend
yarn install
yarn start
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Strava API
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/callback

# MongoDB
MONGODB_URI=mongodb://localhost:27017/strava

# Frontend Environment (comma-separated key=value pairs)
FRONTEND_ENV=REACT_APP_API_URL=http://localhost:8001,REACT_APP_STRAVA_CLIENT_ID=your_client_id
```

## 🚀 Deployment

This application supports multiple deployment platforms. The GitHub Actions workflows have been optimized to use Yarn (which the frontend uses) instead of npm, fixing caching issues.

### GitHub Container Registry (Automatic)

The GitHub Actions workflow automatically builds and pushes Docker images to GitHub Container Registry on every push to main/master.

### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set the following:
   - **Build Command**: `docker build -t strava-app .`
   - **Start Command**: `docker run -p 10000:80 strava-app`
4. Add environment variables in Render dashboard
5. Add these secrets to your GitHub repository:
   - `RENDER_API_KEY`: Your Render API key
   - `RENDER_SERVICE_ID`: Your Render service ID

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Railway will automatically detect the Dockerfile
4. Add environment variables in Railway dashboard
5. Add these secrets to your GitHub repository:
   - `RAILWAY_TOKEN`: Your Railway API token
   - `RAILWAY_PROJECT_ID`: Your Railway project ID
   - `RAILWAY_ENVIRONMENT_ID`: Your Railway environment ID

### Heroku

1. Create a new app on [Heroku](https://heroku.com)
2. Install Heroku CLI and login
3. Add these secrets to your GitHub repository:
   - `HEROKU_API_KEY`: Your Heroku API key
   - `HEROKU_APP_NAME`: Your Heroku app name
   - `HEROKU_EMAIL`: Your Heroku account email

### DigitalOcean App Platform

1. Create a new app on [DigitalOcean](https://cloud.digitalocean.com/apps)
2. Connect your GitHub repository
3. DigitalOcean will automatically detect the Dockerfile
4. Set environment variables in the DigitalOcean dashboard

## 🛠️ Troubleshooting

### GitHub Actions Issues

**npm cache path resolution errors**: ✅ **RESOLVED** - Updated workflows to use Yarn instead of npm, since the frontend uses `yarn.lock`.

**Workflow conditional deployments**: ✅ **RESOLVED** - The workflows now use `continue-on-error: true` to gracefully handle missing deployment secrets without failing the entire workflow.

**Testing dependency issues**: ✅ **RESOLVED** - All required testing dependencies (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) are now properly installed and tests pass successfully.

### Local Development Issues

**Port conflicts**: If you get port conflicts, modify the ports in `docker-compose.yml` or stop other services using ports 80, 8001, or 27017.

**Frontend build issues**: Ensure you're using Yarn:
```bash
cd frontend
yarn install
yarn build
```

**Backend dependency issues**: Use a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 🔐 GitHub Secrets Setup

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required for all deployments:
- `FRONTEND_ENV`: Frontend environment variables (comma-separated)

### For Render deployment:
- `RENDER_API_KEY`
- `RENDER_SERVICE_ID`

### For Railway deployment:
- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_ENVIRONMENT_ID`

### For Heroku deployment:
- `HEROKU_API_KEY`
- `HEROKU_APP_NAME`
- `HEROKU_EMAIL`

## 📦 Docker

### Build the image:
```bash
docker build -t strava-app .
```

### Run the container:
```bash
docker run -p 80:80 -p 8001:8001 --env-file .env strava-app
```

### Using Docker Compose:
```bash
docker-compose up --build
```

## 🧪 Testing

### Run all tests:
```bash
# Frontend tests
cd frontend && yarn test

# Backend tests
python -m pytest backend_test.py -v
```

### CI/CD

The GitHub Actions workflow automatically:
1. Runs tests on every push and PR
2. Builds and pushes Docker images to GitHub Container Registry
3. Deploys to configured platforms on successful builds

## 📁 Project Structure

```
├── .github/workflows/    # GitHub Actions workflows
├── backend/             # FastAPI backend
│   ├── server.py       # Main server file
│   ├── requirements.txt
│   └── external_integrations/
├── frontend/           # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── scripts/           # Utility scripts
├── tests/            # Test files
├── Dockerfile        # Multi-stage Docker build
├── docker-compose.yml
├── nginx.conf        # Nginx configuration
└── entrypoint.sh     # Container startup script
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `yarn test` and `pytest`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
