# 3OMLA Deployment Guide

This guide will help you deploy 3OMLA with fully working backend and real market data analysis.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git installed
- At least 4GB RAM available
- Ports 3000, 8000, 3001, 9090, 5432, 6379 available

### One-Command Deployment

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd 3omla_cloud

# Run the deployment script
./deploy-3omla.sh
```

This will:
- Build all Docker images
- Start PostgreSQL and Redis
- Initialize the database with proper schema
- Start the backend API
- Start all data ingestion services (Binance, Bybit, KuCoin, Multi-exchange)
- Start the frontend
- Start monitoring services (Prometheus, Grafana)
- Perform health checks

## 📋 Manual Deployment Steps

### 1. Environment Setup

```bash
# Copy the production environment file
cp env.production .env

# Edit the environment variables if needed
nano .env
```

### 2. Build and Start Services

```bash
# Build all images
docker-compose -f docker-compose.prod.yml build

# Start core services (PostgreSQL and Redis)
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for core services to be healthy
docker-compose -f docker-compose.prod.yml ps

# Start backend
docker-compose -f docker-compose.prod.yml up -d backend

# Start data ingestion services
docker-compose -f docker-compose.prod.yml up -d data-ingestion data-ingestion-bybit data-ingestion-kucoin data-ingestion-multi

# Start frontend
docker-compose -f docker-compose.prod.yml up -d frontend

# Start monitoring
docker-compose -f docker-compose.prod.yml up -d prometheus grafana
```

## 🔧 Service Management

### Using the Quick Start Script

```bash
# Start all services
./start-3omla.sh start

# Stop all services
./start-3omla.sh stop

# Restart all services
./start-3omla.sh restart

# Check status
./start-3omla.sh status

# View logs
./start-3omla.sh logs

# View logs for specific service
./start-3omla.sh logs backend

# Health check
./start-3omla.sh health

# Clean up everything
./start-3omla.sh clean
```

### Using Docker Compose Directly

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Stop all services
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

## 🌐 Service URLs

Once deployed, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Grafana Dashboard**: http://localhost:3001 (admin/3omla_grafana_2024!)
- **Prometheus**: http://localhost:9090

## 📊 Real Market Data

The platform collects real-time market data from:

- **Binance** (WebSocket + REST)
- **Bybit** (WebSocket)
- **KuCoin** (WebSocket + REST)
- **Coinbase** (WebSocket)
- **Kraken** (WebSocket)
- **OKX** (WebSocket)
- **Gate.io** (WebSocket)
- **Huobi** (WebSocket)
- **Bitfinex** (WebSocket)
- **BitMEX** (WebSocket)

### Data Types Collected

- **Klines/Candlesticks**: 1m, 5m, 15m, 1h, 4h, 1d intervals
- **Trades**: Real-time trade data
- **Order Books**: Real-time order book updates
- **Tickers**: 24h price and volume data

## 🗄️ Database Schema

The platform uses PostgreSQL with the following key tables:

- `symbols`: Trading pairs and their status
- `klines`: Candlestick/OHLCV data
- `trades`: Individual trade records
- `order_books`: Order book snapshots
- `correlation_matrices`: Price correlation data
- `lead_lag_relationships`: Lead-lag analysis results
- `signals`: Trading signals
- `users`: User accounts
- `access_tokens`: API access tokens

## 📈 Analytics Features

### Real-Time Analysis

- **Price Correlation**: Cross-asset correlation analysis
- **Lead-Lag Analysis**: Identify leading and lagging assets
- **Volume Analysis**: Trading volume patterns
- **Spread Analysis**: Bid-ask spread monitoring
- **Whale Analysis**: Large transaction detection

### Market Intelligence

- **Signal Generation**: Automated trading signals
- **Risk Assessment**: Portfolio risk metrics
- **Market Sentiment**: Social sentiment analysis
- **Arbitrage Opportunities**: Cross-exchange arbitrage detection

## 🔍 Monitoring and Logging

### Prometheus Metrics

- Service health status
- Data ingestion rates
- API response times
- Database performance
- Memory and CPU usage

### Grafana Dashboards

- Real-time system metrics
- Market data ingestion status
- Service health overview
- Performance analytics

### Logging

- Structured JSON logging
- Service-specific log levels
- Error tracking and alerting
- Performance monitoring

## 🛠️ Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs [service-name]
   
   # Check status
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Database connection issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose -f docker-compose.prod.yml logs postgres
   
   # Test database connection
   docker-compose -f docker-compose.prod.yml exec postgres psql -U 3omla_user -d 3omla_production -c "SELECT 1;"
   ```

3. **Data ingestion not working**
   ```bash
   # Check data ingestion logs
   docker-compose -f docker-compose.prod.yml logs data-ingestion
   
   # Check Redis connection
   docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
   ```

4. **Frontend not loading**
   ```bash
   # Check frontend logs
   docker-compose -f docker-compose.prod.yml logs frontend
   
   # Check if backend is accessible
   curl http://localhost:8000/health
   ```

### Health Checks

```bash
# Run comprehensive health check
./start-3omla.sh health

# Check individual services
curl http://localhost:8000/health  # Backend
curl http://localhost:3000         # Frontend
curl http://localhost:3001         # Grafana
curl http://localhost:9090         # Prometheus
```

### Performance Optimization

1. **Increase Docker resources** if services are slow
2. **Adjust data retention** settings in environment variables
3. **Monitor memory usage** with Grafana dashboards
4. **Scale services** by running multiple instances

## 🔒 Security Considerations

- Change default passwords in production
- Use environment variables for sensitive data
- Enable HTTPS in production
- Configure firewall rules
- Regular security updates

## 📚 API Documentation

Once the backend is running, visit http://localhost:8000/docs for interactive API documentation.

### Key Endpoints

- `GET /api/v1/market/prices` - Get current prices
- `GET /api/v1/analytics/correlation` - Get correlation data
- `GET /api/v1/signals` - Get trading signals
- `GET /api/v1/realtime/stream` - WebSocket for real-time data
- `POST /api/v1/auth/login` - User authentication

## 🚀 Production Deployment

For production deployment:

1. **Use a reverse proxy** (Nginx) for SSL termination
2. **Set up proper monitoring** and alerting
3. **Configure backups** for PostgreSQL
4. **Use secrets management** for sensitive data
5. **Set up log aggregation** (ELK stack)
6. **Configure auto-scaling** based on load

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Run health checks
3. Review this documentation
4. Check GitHub issues
5. Contact support team

---

**Happy Trading with 3OMLA! 🚀📈**

