#!/bin/bash

# 3OMLA Production Deployment Script
# This script deploys the entire 3OMLA platform to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command -v git &> /dev/null; then
        missing_deps+=("git")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing_deps[*]}"
        error "Please install the missing dependencies and try again."
        exit 1
    fi
    
    success "All dependencies are installed"
}

# Load environment variables
load_env() {
    log "Loading environment variables..."
    
    if [ ! -f .env ]; then
        error ".env file not found. Please create one based on .env.example"
        exit 1
    fi
    
    source .env
    success "Environment variables loaded"
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    # Build backend
    log "Building backend image..."
    docker build -t 3omla-backend:latest ./backend
    
    # Build data ingestion
    log "Building data ingestion image..."
    docker build -t 3omla-data-ingestion:latest ./data-ingestion
    
    # Build frontend
    log "Building frontend image..."
    docker build -t 3omla-frontend:latest ./frontend
    
    success "All Docker images built successfully"
}

# Deploy to Railway (Backend)
deploy_backend() {
    log "Deploying backend to Railway..."
    
    if [ -z "$RAILWAY_TOKEN" ]; then
        error "RAILWAY_TOKEN environment variable is not set"
        exit 1
    fi
    
    # Install Railway CLI if not present
    if ! command -v railway &> /dev/null; then
        log "Installing Railway CLI..."
        curl -fsSL https://railway.app/install.sh | sh
    fi
    
    # Login to Railway
    railway login --token "$RAILWAY_TOKEN"
    
    # Deploy backend
    cd backend
    railway up --detach
    cd ..
    
    success "Backend deployed to Railway"
}

# Deploy to Vercel (Frontend)
deploy_frontend() {
    log "Deploying frontend to Vercel..."
    
    if [ -z "$VERCEL_TOKEN" ] || [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
        error "Vercel environment variables are not set"
        exit 1
    fi
    
    # Install Vercel CLI if not present
    if ! command -v vercel &> /dev/null; then
        log "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy frontend
    cd frontend
    vercel --token "$VERCEL_TOKEN" --prod
    cd ..
    
    success "Frontend deployed to Vercel"
}

# Deploy to Cloudflare Workers (Optional)
deploy_workers() {
    log "Deploying to Cloudflare Workers..."
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        warning "CLOUDFLARE_API_TOKEN not set, skipping Workers deployment"
        return
    fi
    
    # Install Wrangler CLI if not present
    if ! command -v wrangler &> /dev/null; then
        log "Installing Wrangler CLI..."
        npm install -g wrangler
    fi
    
    # Deploy workers
    wrangler deploy
    
    success "Workers deployed to Cloudflare"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # This would typically run Alembic migrations
    # For now, we'll just log that migrations should be run
    warning "Please run database migrations manually after deployment"
    warning "Command: docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
        exit 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
        exit 1
    fi
    
    success "All health checks passed"
}

# Main deployment function
main() {
    log "Starting 3OMLA production deployment..."
    
    check_dependencies
    load_env
    
    # Ask for confirmation
    echo
    warning "This will deploy 3OMLA to production. Are you sure? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log "Deployment cancelled"
        exit 0
    fi
    
    build_images
    
    # Deploy services
    deploy_backend
    deploy_frontend
    deploy_workers
    
    run_migrations
    
    # Wait a bit for services to start
    log "Waiting for services to start..."
    sleep 30
    
    health_check
    
    success "3OMLA production deployment completed successfully!"
    log "Frontend: https://3omla.vercel.app"
    log "Backend API: https://3omla-backend.railway.app"
    log "Grafana: http://localhost:3001 (admin/admin)"
    log "Prometheus: http://localhost:9090"
}

# Run main function
main "$@"

