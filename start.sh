#!/bin/bash

# Crypto Lead-Lag Pattern Radar - Startup Script
# This script sets up and starts the entire application stack

set -e

echo "🚀 Starting Crypto Lead-Lag Pattern Radar..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp env.example .env
    print_warning "Please edit .env file with your configuration before continuing."
    print_warning "At minimum, you should set your Binance API keys."
    read -p "Press Enter to continue after editing .env file..."
fi

# Check if .env file has been configured
if grep -q "your_binance_api_key" .env; then
    print_warning "Please configure your Binance API keys in .env file"
    print_warning "Set BINANCE_API_KEY and BINANCE_SECRET_KEY"
    read -p "Press Enter to continue (or Ctrl+C to exit and configure)..."
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p docker/postgres
mkdir -p docker/prometheus
mkdir -p docker/grafana/dashboards
mkdir -p docker/grafana/datasources
mkdir -p logs

# Build and start services
print_status "Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."

# Wait for PostgreSQL
print_status "Waiting for PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U user -d coinmatcher; do
    sleep 2
done
print_success "PostgreSQL is ready"

# Wait for Redis
print_status "Waiting for Redis..."
until docker-compose exec -T redis redis-cli ping; do
    sleep 2
done
print_success "Redis is ready"

# Wait for backend API
print_status "Waiting for backend API..."
until curl -f http://localhost:8000/health > /dev/null 2>&1; do
    sleep 5
done
print_success "Backend API is ready"

# Wait for frontend
print_status "Waiting for frontend..."
until curl -f http://localhost:3000 > /dev/null 2>&1; do
    sleep 5
done
print_success "Frontend is ready"

# Initialize database
print_status "Initializing database..."
docker-compose exec -T backend python -c "
import asyncio
from core.database import init_db
asyncio.run(init_db())
print('Database initialized successfully')
"

# Start data ingestion
print_status "Starting data ingestion services..."
docker-compose up -d data-ingestion data-ingestion-bybit data-ingestion-kucoin

# Display service URLs
echo ""
print_success "🎉 Crypto Lead-Lag Pattern Radar is now running!"
echo ""
echo "📊 Service URLs:"
echo "  Frontend:        http://localhost:3000"
echo "  Backend API:     http://localhost:8000"
echo "  API Docs:        http://localhost:8000/docs"
echo "  Grafana:         http://localhost:3001 (admin/admin)"
echo "  Prometheus:      http://localhost:9090"
echo ""
echo "📝 Useful Commands:"
echo "  View logs:       docker-compose logs -f [service-name]"
echo "  Stop services:   docker-compose down"
echo "  Restart:         docker-compose restart [service-name]"
echo "  Shell access:    docker-compose exec [service-name] bash"
echo ""
echo "🔧 Configuration:"
echo "  Edit .env file to configure API keys and settings"
echo "  Check docker-compose.yml for service configuration"
echo ""
print_warning "Remember to configure your Binance API keys in .env file for live data!"

# Show logs
echo ""
print_status "Showing recent logs (Ctrl+C to exit):"
docker-compose logs -f --tail=50
