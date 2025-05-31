#!/bin/bash
set -e

echo "🚀 Strava FitTracker Pro - Quick Setup Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    print_error "This doesn't appear to be the Strava FitTracker Pro directory"
    print_error "Please run this script from the root of your project"
    exit 1
fi

print_step "Setting up Strava FitTracker Pro for deployment..."

# Check for required files
print_step "Checking project structure..."

required_files=(
    "frontend/package.json"
    "backend/requirements.txt"
    "backend/server.py"
    "Dockerfile"
    ".github/workflows/deploy.yml"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    print_error "Missing required files:"
    printf '%s\n' "${missing_files[@]}"
    exit 1
fi

print_success "Project structure looks good!"

# Check if environment file exists
if [ ! -f ".env.example" ]; then
    print_step "Creating .env.example file..."
    cat > .env.example << EOF
# Strava API Configuration
STRAVA_CLIENT_ID=your_strava_client_id_here
STRAVA_CLIENT_SECRET=your_strava_client_secret_here
STRAVA_REDIRECT_URI=http://localhost:3000/auth/strava/callback

# Database Configuration
MONGO_URL=mongodb://localhost:27017/strava_fittracker
DB_NAME=strava_fittracker

# Optional Configuration
JWT_SECRET=your_jwt_secret_key_here
PORT=8000

# Frontend Environment Variables
REACT_APP_API_URL=http://localhost:8000
REACT_APP_STRAVA_CLIENT_ID=your_strava_client_id_here
EOF
    print_success "Created .env.example file"
else
    print_success ".env.example already exists"
fi

# Check if Node.js and Python are installed
print_step "Checking system requirements..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version (require 20+)
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    print_error "Node.js version 20+ is required (current: $(node --version))"
    print_error "Please update Node.js:"
    print_error "  - Download from https://nodejs.org/ (LTS version 20+)"
    print_error "  - Or use nvm: nvm install 20 && nvm use 20"
    exit 1
fi
print_success "Node.js $(node --version) ✓"

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.11+ from https://python.org/"
    exit 1
fi

if ! command -v yarn &> /dev/null; then
    print_warning "Yarn is not installed. Installing yarn globally..."
    npm install -g yarn
    print_success "Yarn installed successfully"
fi

print_success "System requirements met!"

# Install dependencies
print_step "Installing frontend dependencies..."
cd frontend
yarn install --frozen-lockfile
cd ..
print_success "Frontend dependencies installed!"

print_step "Installing backend dependencies..."
cd backend
python3 -m pip install -r requirements.txt
cd ..
print_success "Backend dependencies installed!"

# Check if Docker is installed
print_step "Checking Docker installation..."
if command -v docker &> /dev/null; then
    print_success "Docker is installed"
    
    # Test Docker build
    print_step "Testing Docker build (this may take a few minutes)..."
    if docker build -t strava-fittracker-test . --build-arg FRONTEND_ENV="REACT_APP_API_URL=http://localhost:8000" > /dev/null 2>&1; then
        print_success "Docker build test passed!"
        docker rmi strava-fittracker-test > /dev/null 2>&1
    else
        print_warning "Docker build test failed. You may need to fix Docker configuration."
    fi
else
    print_warning "Docker is not installed. You'll need Docker for deployment."
    print_warning "Install Docker Desktop from: https://www.docker.com/products/docker-desktop/"
fi

# Create local environment file if it doesn't exist
if [ ! -f ".env" ]; then
    print_step "Creating local .env file..."
    cp .env.example .env
    print_warning "Please edit .env file with your actual configuration values"
fi

if [ ! -f "frontend/.env" ]; then
    print_step "Creating frontend .env file..."
    cat > frontend/.env << EOF
REACT_APP_API_URL=http://localhost:8000
REACT_APP_STRAVA_CLIENT_ID=your_strava_client_id_here
EOF
    print_warning "Please edit frontend/.env file with your actual Strava client ID"
fi

echo ""
print_success "Setup completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "1. 📝 Edit .env and frontend/.env with your Strava API credentials"
echo "2. 🔑 Get your Strava API credentials from: https://developers.strava.com/"
echo "3. 🗄️  Set up MongoDB (Atlas recommended): https://cloud.mongodb.com/"
echo "4. 🚀 Deploy to Render following the DEPLOYMENT_GUIDE.md"
echo ""
echo "Local development:"
echo "• Frontend: cd frontend && yarn start"
echo "• Backend: cd backend && python3 server.py"
echo ""
echo "Deployment guide: 📖 DEPLOYMENT_GUIDE.md"
echo ""
print_success "Happy coding! 🚀"
