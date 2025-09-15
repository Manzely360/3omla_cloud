# Crypto Lead-Lag Pattern Radar

A real-time web application and API that identifies cryptocurrencies with similar or opposite movements and detects lead-lag relationships for trading opportunities.

## 🚀 Features

### Core Analytics
- **Similarity Matrix**: Rolling correlations (Pearson/Spearman/Kendall) across multiple timeframes
- **Lead-Lag Engine**: Cross-correlation analysis, Granger-causality tests, and transfer entropy
- **Pairs & Baskets**: Auto-discovery of clusters and cointegrated pairs
- **Regime Detection**: Market regime classification (risk-on/off, trend vs. chop)
- **Order Book Analysis**: Depth imbalance and spoof detection

### Data Sources
- **Primary**: Binance (spot, futures) REST + WebSocket
- **Future**: OKX, Bybit, Coinbase support
- **Optional**: On-chain whale flow data

### Signals & Alerts
- Lead-trigger alerts with historical hit-rate validation
- Opposite-move detection for anti-correlated pairs
- Breakout/breakdown windows (Egypt time zones)
- Order book depth guardrails
- Spoof/wash trading detection

## 🏗️ Architecture

```
├── backend/                 # FastAPI backend
│   ├── api/                # API endpoints
│   ├── analytics/          # Core analytics engine
│   ├── data/              # Data ingestion services
│   ├── models/            # Database models
│   └── services/          # Business logic
├── frontend/              # Next.js frontend
│   ├── components/        # React components
│   ├── pages/            # Next.js pages
│   └── hooks/            # Custom React hooks
├── data-ingestion/        # Market data services
├── docker/               # Docker configurations
└── tests/               # Test suites
```

## ⚡ Quick Start

### Prerequisites
- Docker and Docker Compose
- Binance API keys (for live data)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd coinmatcher-v2
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env with your Binance API keys and settings
```

### 3. Start Everything
```bash
./start.sh
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Grafana Dashboard**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090

## 🔧 Configuration

### Environment Variables
Key settings in `.env`:

```bash
# Binance API (Required for live data)
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret_key
BINANCE_TESTNET=true  # Use testnet for safety

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/coinmatcher
REDIS_URL=redis://localhost:6379

# Analytics Settings
CORRELATION_WINDOWS=5m,15m,1h,4h,1d
MIN_CORRELATION_THRESHOLD=0.3
MIN_HIT_RATE_THRESHOLD=0.6

# Risk Management
MAX_POSITION_SIZE=0.1
MAX_DAILY_LOSS=0.05
```

## 📊 Usage

### Dashboard
The main dashboard shows:
- Active trading signals
- Market overview with top movers
- Correlation heatmap
- Lead-lag relationship network

### Analytics
- **Correlation Matrix**: View correlations between selected assets
- **Lead-Lag Analysis**: Identify which assets lead others
- **Market Regime**: Current market conditions
- **Spread Analysis**: Mean reversion opportunities

### Signals
- **Lead-Lag Signals**: When one asset typically leads another
- **Opposite Move Signals**: Anti-correlated pairs
- **Breakout Signals**: Volume-based breakouts
- **Mean Reversion**: Statistical arbitrage opportunities

### Backtesting
- Test strategies with historical data
- Realistic execution modeling (latency, fees, slippage)
- Performance metrics and risk analysis

## 🛠️ Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Data Ingestion
```bash
cd data-ingestion
python -m services.binance_websocket
```

### Database Management
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U user -d coinmatcher

# Run migrations
docker-compose exec backend alembic upgrade head

# View logs
docker-compose logs -f backend
```

## 📈 Trading Strategies

### 1. Lead-Lag Momentum
- Identify assets that typically lead others
- Enter positions when leader moves
- Exit when follower catches up

### 2. Mean Reversion Pairs
- Find cointegrated pairs
- Trade when spread deviates from mean
- Use z-score thresholds for entry/exit

### 3. Regime-Based Trading
- Adjust strategy based on market regime
- Risk-on: Momentum strategies
- Risk-off: Mean reversion strategies

### 4. Order Book Analysis
- Monitor depth imbalances
- Detect spoofing and manipulation
- Use for signal confirmation

## 🔍 Monitoring

### Grafana Dashboards
- System metrics and performance
- Trading signal performance
- Market data quality
- Error rates and latency

### Prometheus Metrics
- API response times
- Database query performance
- WebSocket connection health
- Signal generation rates

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

### Paper Trading
The system includes a paper trading mode for safe testing:
- No real money at risk
- Realistic execution simulation
- Full signal generation
- Performance tracking

## 🚨 Risk Management

### Built-in Safeguards
- Position size limits
- Daily loss limits
- Cooldown periods after losses
- Regime-based signal filtering
- Order book confirmation

### Best Practices
1. **Start with Paper Trading**: Test strategies before risking capital
2. **Use Small Position Sizes**: Never risk more than you can afford to lose
3. **Monitor Performance**: Track hit rates and adjust thresholds
4. **Diversify**: Don't rely on single strategies or pairs
5. **Stay Updated**: Market conditions change, update your models

## 📚 API Documentation

### Authentication
```bash
# Get API token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password"}'
```

### Example API Calls
```bash
# Get correlation matrix
curl "http://localhost:8000/api/v1/analytics/correlation-matrix?symbols=BTCUSDT,ETHUSDT&interval=15m"

# Get active signals
curl "http://localhost:8000/api/v1/signals/active?min_strength=0.6"

# Get lead-lag relationships
curl "http://localhost:8000/api/v1/analytics/lead-lag?min_hit_rate=0.6"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Trading Disclaimer

**IMPORTANT**: This software is for educational and research purposes only. Cryptocurrency trading involves substantial risk of loss and is not suitable for all investors. Past performance does not guarantee future results. Always conduct your own research and consider consulting with a financial advisor before making investment decisions.

The developers and contributors are not responsible for any financial losses incurred through the use of this software.

## 🆘 Support

- **Issues**: Report bugs and request features on GitHub
- **Documentation**: Check the API docs at `/docs`
- **Community**: Join our Discord for discussions
- **Email**: support@cryptoradar.com

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Basic lead-lag detection
- ✅ Correlation analysis
- ✅ Signal generation
- ✅ Paper trading

### Phase 2 (Next)
- 🔄 Additional exchanges (OKX, Bybit)
- 🔄 Advanced ML models
- 🔄 Mobile app
- 🔄 Social trading features

### Phase 3 (Future)
- 📋 Options and derivatives
- 📋 Cross-chain analysis
- 📋 Institutional features
- 📋 White-label solutions
