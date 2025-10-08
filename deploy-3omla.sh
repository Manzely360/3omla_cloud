#!/bin/bash

# 3OMLA Complete Deployment Script
# This script deploys the entire 3OMLA platform with real market data analysis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
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

info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Banner
show_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   3OMLA DEPLOYMENT SCRIPT                    ║"
    echo "║              Real Market Data Analysis Platform              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
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
    
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
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
    
    if [ -f "env.production" ]; then
        source env.production
        success "Production environment variables loaded"
    elif [ -f ".env" ]; then
        source .env
        success "Environment variables loaded from .env"
    else
        warning "No environment file found, using defaults"
        # Set default values
        export POSTGRES_DB="3omla_production"
        export POSTGRES_USER="3omla_user"
        export POSTGRES_PASSWORD="3omla_secure_password_2024!"
        export DATABASE_URL="postgresql://3omla_user:3omla_secure_password_2024!@postgres:5432/3omla_production"
        export REDIS_URL="redis://redis:6379"
        export SECRET_KEY="3omla_super_secure_secret_key_2024_production_ready!"
    fi
}

# Clean up existing containers and volumes
cleanup() {
    log "Cleaning up existing containers and volumes..."
    
    # Stop and remove existing containers
    docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    # Remove old volumes if requested
    if [ "$1" = "--clean-volumes" ]; then
        warning "Removing all volumes (this will delete all data!)"
        docker volume prune -f
        success "Volumes cleaned up"
    fi
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    # Build backend
    log "Building backend image..."
    docker build -t 3omla-backend:latest ./backend
    success "Backend image built"
    
    # Build data ingestion
    log "Building data ingestion image..."
    docker build -t 3omla-data-ingestion:latest ./data-ingestion
    success "Data ingestion image built"
    
    # Build frontend
    log "Building frontend image..."
    docker build -t 3omla-frontend:latest ./frontend
    success "Frontend image built"
    
    success "All Docker images built successfully"
}

# Start core services (PostgreSQL and Redis)
start_core_services() {
    log "Starting core services (PostgreSQL and Redis)..."
    
    docker-compose -f docker-compose.prod.yml up -d postgres redis
    
    # Wait for services to be healthy
    log "Waiting for core services to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose -f docker-compose.prod.yml ps postgres | grep -q "healthy" && \
           docker-compose -f docker-compose.prod.yml ps redis | grep -q "healthy"; then
            success "Core services are healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for core services... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    error "Core services failed to become healthy"
    return 1
}

# Initialize database
init_database() {
    log "Initializing database..."
    
    # Wait a bit more for PostgreSQL to be fully ready
    sleep 10
    
    # Run database initialization
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "${POSTGRES_USER:-3omla_user}" -d "${POSTGRES_DB:-3omla_production}" -f /docker-entrypoint-initdb.d/init.sql || true
    
    success "Database initialized"
}

# Start backend services
start_backend_services() {
    log "Starting backend services..."
    
    docker-compose -f docker-compose.prod.yml up -d backend
    
    # Wait for backend to be healthy
    log "Waiting for backend to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:8000/health > /dev/null 2>&1; then
            success "Backend is healthy"
            break
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for backend... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "Backend failed to become healthy"
        return 1
    fi
}

# Start data ingestion services
start_data_ingestion() {
    log "Starting data ingestion services..."
    
    # Start all data ingestion services
    docker-compose -f docker-compose.prod.yml up -d data-ingestion data-ingestion-bybit data-ingestion-kucoin data-ingestion-multi
    
    success "Data ingestion services started"
}

# Start frontend
start_frontend() {
    log "Starting frontend..."
    
    docker-compose -f docker-compose.prod.yml up -d frontend
    
    # Wait for frontend to be ready
    log "Waiting for frontend to be ready..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            success "Frontend is ready"
            break
        fi
        
        attempt=$((attempt + 1))
        log "Waiting for frontend... (attempt $attempt/$max_attempts)"
        sleep 5
    done
    
    if [ $attempt -eq $max_attempts ]; then
        warning "Frontend may not be fully ready yet"
    fi
}

# Start monitoring services
start_monitoring() {
    log "Starting monitoring services..."
    
    docker-compose -f docker-compose.prod.yml up -d prometheus grafana
    
    success "Monitoring services started"
}

# Health check
health_check() {
    log "Performing comprehensive health checks..."
    
    local all_healthy=true
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "✓ Backend health check passed"
    else
        error "✗ Backend health check failed"
        all_healthy=false
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "✓ Frontend health check passed"
    else
        error "✗ Frontend health check failed"
        all_healthy=false
    fi
    
    # Check data ingestion services
    local data_services=("data-ingestion" "data-ingestion-bybit" "data-ingestion-kucoin" "data-ingestion-multi")
    for service in "${data_services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "Up"; then
            success "✓ $service is running"
        else
            error "✗ $service is not running"
            all_healthy=false
        fi
    done
    
    # Check monitoring services
    if curl -f http://localhost:9090 > /dev/null 2>&1; then
        success "✓ Prometheus is accessible"
    else
        warning "✗ Prometheus is not accessible"
    fi
    
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        success "✓ Grafana is accessible"
    else
        warning "✗ Grafana is not accessible"
    fi
    
    if [ "$all_healthy" = true ]; then
        success "All critical services are healthy!"
    else
        error "Some services are not healthy. Check the logs for details."
        return 1
    fi
}

# Show service URLs
show_urls() {
    echo
    log "🚀 3OMLA Platform is now running!"
    echo
    echo -e "${CYAN}Service URLs:${NC}"
    echo -e "  Frontend:     ${GREEN}http://localhost:3000${NC}"
    echo -e "  Backend API:  ${GREEN}http://localhost:8000${NC}"
    echo -e "  API Docs:     ${GREEN}http://localhost:8000/docs${NC}"
    echo -e "  Grafana:      ${GREEN}http://localhost:3001${NC} (admin/3omla_grafana_2024!)"
    echo -e "  Prometheus:   ${GREEN}http://localhost:9090${NC}"
    echo
    echo -e "${CYAN}Database:${NC}"
    echo -e "  Host:         ${GREEN}localhost:5432${NC}"
    echo -e "  Database:     ${GREEN}3omla_production${NC}"
    echo -e "  User:         ${GREEN}3omla_user${NC}"
    echo
    echo -e "${CYAN}Redis:${NC}"
    echo -e "  Host:         ${GREEN}localhost:6379${NC}"
    echo
    echo -e "${YELLOW}To stop the platform: docker-compose -f docker-compose.prod.yml down${NC}"
    echo -e "${YELLOW}To view logs: docker-compose -f docker-compose.prod.yml logs -f [service_name]${NC}"
}

# Show logs
show_logs() {
    log "Showing logs for all services..."
    docker-compose -f docker-compose.prod.yml logs -f
}

# Main deployment function
main() {
    show_banner
    
    # Parse command line arguments
    local clean_volumes=false
    local show_logs_flag=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --clean-volumes)
                clean_volumes=true
                shift
                ;;
            --logs)
                show_logs_flag=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --clean-volumes    Remove all volumes before deployment"
                echo "  --logs            Show logs after deployment"
                echo "  --help            Show this help message"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Ask for confirmation
    echo
    warning "This will deploy 3OMLA with real market data analysis. Are you sure? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log "Deployment cancelled"
        exit 0
    fi
    
    # Execute deployment steps
    check_dependencies
    load_env
    cleanup $([ "$clean_volumes" = true ] && echo "--clean-volumes" || echo "")
    build_images
    start_core_services
    init_database
    start_backend_services
    start_data_ingestion
    start_frontend
    start_monitoring
    
    # Wait a bit for all services to stabilize
    log "Waiting for all services to stabilize..."
    sleep 30
    
    # Perform health checks
    if health_check; then
        show_urls
        
        if [ "$show_logs_flag" = true ]; then
            show_logs
        else
            echo
            info "To view logs, run: $0 --logs"
        fi
    else
        error "Deployment completed with issues. Check the logs for details."
        exit 1
    fi
}

# Run main function with all arguments
main "$@"

