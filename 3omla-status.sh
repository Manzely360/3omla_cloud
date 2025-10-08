#!/bin/bash

# 3OMLA Status Check Script
# This script provides a comprehensive status overview of the 3omla platform

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
    echo "║                    3OMLA STATUS CHECK                        ║"
    echo "║              Real Market Data Analysis Platform              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    success "Docker is running"
}

# Check service status
check_services() {
    log "Checking service status..."
    echo
    
    # Get service status
    local services=("postgres" "redis" "backend" "frontend" "data-ingestion" "data-ingestion-bybit" "data-ingestion-kucoin" "data-ingestion-multi" "prometheus" "grafana")
    
    for service in "${services[@]}"; do
        local status=$(docker-compose -f docker-compose.prod.yml ps "$service" 2>/dev/null | grep "$service" | awk '{print $3}' || echo "Not found")
        
        case "$status" in
            "Up")
                success "✓ $service is running"
                ;;
            "Exit")
                error "✗ $service has exited"
                ;;
            "Not found")
                warning "? $service not found in compose file"
                ;;
            *)
                warning "? $service status: $status"
                ;;
        esac
    done
    echo
}

# Check health endpoints
check_health() {
    log "Checking health endpoints..."
    echo
    
    # Backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "✓ Backend API is healthy (http://localhost:8000/health)"
    else
        error "✗ Backend API is not responding"
    fi
    
    # Frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "✓ Frontend is accessible (http://localhost:3000)"
    else
        error "✗ Frontend is not accessible"
    fi
    
    # Grafana health
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        success "✓ Grafana is accessible (http://localhost:3001)"
    else
        warning "✗ Grafana is not accessible"
    fi
    
    # Prometheus health
    if curl -f http://localhost:9090 > /dev/null 2>&1; then
        success "✓ Prometheus is accessible (http://localhost:9090)"
    else
        warning "✗ Prometheus is not accessible"
    fi
    echo
}

# Check data ingestion
check_data_ingestion() {
    log "Checking data ingestion status..."
    echo
    
    # Check if data ingestion services are running
    local data_services=("data-ingestion" "data-ingestion-bybit" "data-ingestion-kucoin" "data-ingestion-multi")
    
    for service in "${data_services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "Up"; then
            success "✓ $service is running"
        else
            error "✗ $service is not running"
        fi
    done
    echo
}

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    echo
    
    # Check PostgreSQL
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U 3omla_user -d 3omla_production > /dev/null 2>&1; then
        success "✓ PostgreSQL is ready"
    else
        error "✗ PostgreSQL is not ready"
    fi
    
    # Check Redis
    if docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        success "✓ Redis is ready"
    else
        error "✗ Redis is not ready"
    fi
    echo
}

# Show resource usage
show_resources() {
    log "Resource usage:"
    echo
    
    # Docker stats
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" 2>/dev/null | head -10
    echo
}

# Show service URLs
show_urls() {
    log "Service URLs:"
    echo
    echo -e "${CYAN}Web Interfaces:${NC}"
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
}

# Show recent logs
show_recent_logs() {
    log "Recent logs (last 10 lines from each service):"
    echo
    
    local services=("backend" "data-ingestion" "data-ingestion-multi")
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "Up"; then
            echo -e "${CYAN}=== $service ===${NC}"
            docker-compose -f docker-compose.prod.yml logs --tail=10 "$service" 2>/dev/null || echo "No logs available"
            echo
        fi
    done
}

# Main function
main() {
    show_banner
    
    check_docker
    check_services
    check_health
    check_data_ingestion
    check_database
    show_resources
    show_urls
    
    # Ask if user wants to see recent logs
    echo
    warning "Would you like to see recent logs? (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        show_recent_logs
    fi
    
    echo
    info "To manage services, use: ./start-3omla.sh [command]"
    info "For full deployment, use: ./deploy-3omla.sh"
}

# Run main function
main "$@"

