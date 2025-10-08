#!/bin/bash

# 3OMLA Quick Start Script
# This script provides quick commands to start, stop, and manage 3omla services

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
    echo "║                    3OMLA QUICK START                        ║"
    echo "║              Real Market Data Analysis Platform              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Show help
show_help() {
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  start           Start all 3omla services"
    echo "  stop            Stop all 3omla services"
    echo "  restart         Restart all 3omla services"
    echo "  status          Show status of all services"
    echo "  logs            Show logs for all services"
    echo "  logs [service]  Show logs for specific service"
    echo "  health          Check health of all services"
    echo "  clean           Clean up containers and volumes"
    echo "  deploy          Full deployment with build"
    echo "  help            Show this help message"
    echo
    echo "Services:"
    echo "  postgres, redis, backend, frontend, data-ingestion,"
    echo "  data-ingestion-bybit, data-ingestion-kucoin, data-ingestion-multi,"
    echo "  prometheus, grafana"
}

# Start all services
start_services() {
    log "Starting 3omla services..."
    
    # Load environment variables
    if [ -f "env.production" ]; then
        source env.production
    elif [ -f ".env" ]; then
        source .env
    fi
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    success "All services started"
    show_status
}

# Stop all services
stop_services() {
    log "Stopping 3omla services..."
    
    docker-compose -f docker-compose.prod.yml down
    
    success "All services stopped"
}

# Restart all services
restart_services() {
    log "Restarting 3omla services..."
    
    docker-compose -f docker-compose.prod.yml restart
    
    success "All services restarted"
    show_status
}

# Show status of all services
show_status() {
    log "Service Status:"
    echo
    
    docker-compose -f docker-compose.prod.yml ps
    echo
    
    # Check health of key services
    info "Health Checks:"
    
    # Backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        success "✓ Backend API is healthy"
    else
        error "✗ Backend API is not responding"
    fi
    
    # Frontend health
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "✓ Frontend is accessible"
    else
        error "✗ Frontend is not accessible"
    fi
    
    # Grafana health
    if curl -f http://localhost:3001 > /dev/null 2>&1; then
        success "✓ Grafana is accessible"
    else
        warning "✗ Grafana is not accessible"
    fi
    
    # Prometheus health
    if curl -f http://localhost:9090 > /dev/null 2>&1; then
        success "✓ Prometheus is accessible"
    else
        warning "✗ Prometheus is not accessible"
    fi
}

# Show logs
show_logs() {
    local service="$1"
    
    if [ -n "$service" ]; then
        log "Showing logs for $service..."
        docker-compose -f docker-compose.prod.yml logs -f "$service"
    else
        log "Showing logs for all services..."
        docker-compose -f docker-compose.prod.yml logs -f
    fi
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
        echo
        info "Service URLs:"
        echo "  Frontend:     http://localhost:3000"
        echo "  Backend API:  http://localhost:8000"
        echo "  API Docs:     http://localhost:8000/docs"
        echo "  Grafana:      http://localhost:3001"
        echo "  Prometheus:   http://localhost:9090"
    else
        error "Some services are not healthy. Check the logs for details."
        return 1
    fi
}

# Clean up
clean_services() {
    warning "This will stop and remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log "Cleanup cancelled"
        return 0
    fi
    
    log "Cleaning up containers and volumes..."
    
    docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans
    docker system prune -f
    
    success "Cleanup completed"
}

# Full deployment
deploy_services() {
    log "Running full deployment..."
    
    if [ -f "deploy-3omla.sh" ]; then
        ./deploy-3omla.sh
    else
        error "deploy-3omla.sh not found. Please run the deployment script first."
        return 1
    fi
}

# Main function
main() {
    show_banner
    
    case "${1:-help}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        health)
            health_check
            ;;
        clean)
            clean_services
            ;;
        deploy)
            deploy_services
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            error "Unknown command: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"

