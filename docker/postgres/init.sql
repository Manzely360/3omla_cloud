-- Database initialization script for 3OMLA Intelligence Hub

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create core tables for market data
CREATE TABLE IF NOT EXISTS symbols (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    exchange VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS klines (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    interval VARCHAR(10) NOT NULL,
    open_time TIMESTAMP NOT NULL,
    close_time TIMESTAMP NOT NULL,
    open_price DECIMAL(20, 8) NOT NULL,
    high_price DECIMAL(20, 8) NOT NULL,
    low_price DECIMAL(20, 8) NOT NULL,
    close_price DECIMAL(20, 8) NOT NULL,
    volume DECIMAL(20, 8) NOT NULL,
    quote_volume DECIMAL(20, 8) NOT NULL,
    trades_count INTEGER NOT NULL,
    taker_buy_volume DECIMAL(20, 8) NOT NULL,
    taker_buy_quote_volume DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, exchange, interval, open_time)
);

CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    trade_id VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(20, 8) NOT NULL,
    quantity DECIMAL(20, 8) NOT NULL,
    quote_quantity DECIMAL(20, 8) NOT NULL,
    is_buyer_maker BOOLEAN NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_books (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    exchange VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    bids JSONB NOT NULL,
    asks JSONB NOT NULL,
    best_bid DECIMAL(20, 8) NOT NULL,
    best_ask DECIMAL(20, 8) NOT NULL,
    spread DECIMAL(20, 8) NOT NULL,
    mid_price DECIMAL(20, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create analytics tables
CREATE TABLE IF NOT EXISTS correlation_matrices (
    id SERIAL PRIMARY KEY,
    symbol1 VARCHAR(20) NOT NULL,
    symbol2 VARCHAR(20) NOT NULL,
    interval VARCHAR(10) NOT NULL,
    correlation DECIMAL(10, 6) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    sample_size INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_lag_relationships (
    id SERIAL PRIMARY KEY,
    leader_symbol VARCHAR(20) NOT NULL,
    follower_symbol VARCHAR(20) NOT NULL,
    interval VARCHAR(10) NOT NULL,
    lag_minutes INTEGER NOT NULL,
    correlation DECIMAL(10, 6) NOT NULL,
    confidence DECIMAL(10, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS signals (
    id SERIAL PRIMARY KEY,
    primary_symbol VARCHAR(20) NOT NULL,
    signal_type VARCHAR(50) NOT NULL,
    signal_strength DECIMAL(10, 6) NOT NULL,
    trigger_time TIMESTAMP NOT NULL,
    price DECIMAL(20, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user and access tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS access_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_klines_symbol_interval_time_desc 
ON klines (symbol, interval, open_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_trades_symbol_timestamp_desc 
ON trades (symbol, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_books_symbol_timestamp_desc 
ON order_books (symbol, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_correlation_matrices_symbols_interval_time 
ON correlation_matrices (symbol1, symbol2, interval, start_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lead_lag_relationships_leader_follower 
ON lead_lag_relationships (leader_symbol, follower_symbol, interval);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signals_symbol_trigger_time_desc 
ON signals (primary_symbol, trigger_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_signals_status_created_desc 
ON signals (status, created_at DESC);

-- Insert initial symbols
INSERT INTO symbols (symbol, exchange, is_active) VALUES
('BTCUSDT', 'binance', true),
('ETHUSDT', 'binance', true),
('BNBUSDT', 'binance', true),
('SOLUSDT', 'binance', true),
('XRPUSDT', 'binance', true),
('ADAUSDT', 'binance', true),
('DOGEUSDT', 'binance', true),
('AVAXUSDT', 'binance', true),
('LINKUSDT', 'binance', true),
('MATICUSDT', 'binance', true),
('ATOMUSDT', 'binance', true),
('DOTUSDT', 'binance', true),
('LTCUSDT', 'binance', true),
('UNIUSDT', 'binance', true),
('AAVEUSDT', 'binance', true)
ON CONFLICT (symbol, exchange) DO NOTHING;

-- Create materialized view for frequently accessed correlation data
-- Note: This will be created after tables are created by SQLAlchemy migrations
-- CREATE MATERIALIZED VIEW IF NOT EXISTS mv_correlation_summary AS
-- SELECT 
--     symbol1,
--     symbol2,
--     interval,
--     AVG(correlation) as avg_correlation,
--     COUNT(*) as sample_count,
--     MAX(end_time) as last_updated
-- FROM correlation_matrices
-- WHERE correlation IS NOT NULL
-- GROUP BY symbol1, symbol2, interval;

-- CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_correlation_summary_unique 
-- ON mv_correlation_summary (symbol1, symbol2, interval);

-- Create function to refresh materialized views
-- Note: This will be created after tables are created by SQLAlchemy migrations
-- CREATE OR REPLACE FUNCTION refresh_analytics_views()
-- RETURNS void AS $$
-- BEGIN
--     REFRESH MATERIALIZED VIEW CONCURRENTLY mv_correlation_summary;
-- END;
-- $$ LANGUAGE plpgsql;

-- Create function to clean old data
-- Note: This will be created after tables are created by SQLAlchemy migrations
-- CREATE OR REPLACE FUNCTION clean_old_data()
-- RETURNS void AS $$
-- BEGIN
--     -- Delete old klines (keep last 30 days)
--     DELETE FROM klines 
--     WHERE open_time < NOW() - INTERVAL '30 days';
--     
--     -- Delete old trades (keep last 7 days)
--     DELETE FROM trades 
--     WHERE timestamp < NOW() - INTERVAL '7 days';
--     
--     -- Delete old order books (keep last 1 day)
--     DELETE FROM order_books 
--     WHERE timestamp < NOW() - INTERVAL '1 day';
--     
--     -- Delete old correlation matrices (keep last 90 days)
--     DELETE FROM correlation_matrices 
--     WHERE end_time < NOW() - INTERVAL '90 days';
--     
--     -- Delete old signals (keep last 30 days)
--     DELETE FROM signals 
--     WHERE created_at < NOW() - INTERVAL '30 days';
-- END;
-- $$ LANGUAGE plpgsql;

-- Create scheduled job to clean old data (requires pg_cron extension)
-- SELECT cron.schedule('clean-old-data', '0 2 * * *', 'SELECT clean_old_data();');

-- Create function to get market overview
-- Note: This will be created after tables are created by SQLAlchemy migrations
-- CREATE OR REPLACE FUNCTION get_market_overview()
-- RETURNS TABLE (
--     symbol text,
--     price numeric,
--     change_24h numeric,
--     volume_24h numeric,
--     market_cap numeric
-- ) AS $$
-- BEGIN
--     RETURN QUERY
--     SELECT 
--         s.symbol,
--         k.close_price as price,
--         ((k.close_price - LAG(k.close_price) OVER (PARTITION BY s.symbol ORDER BY k.open_time)) / LAG(k.close_price) OVER (PARTITION BY s.symbol ORDER BY k.open_time) * 100) as change_24h,
--         k.volume as volume_24h,
--         k.close_price * k.volume as market_cap
--     FROM symbols s
--     JOIN klines k ON s.symbol = k.symbol
--     WHERE s.is_active = true
--     AND k.interval = '1d'
--     AND k.open_time >= CURRENT_DATE - INTERVAL '1 day'
--     ORDER BY k.volume DESC
--     LIMIT 50;
-- END;
-- $$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "user";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "user";
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO "user";
