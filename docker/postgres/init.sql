-- Database initialization script for Crypto Lead-Lag Pattern Radar

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created after tables are created by SQLAlchemy

-- Insert initial symbols data
INSERT INTO symbols (symbol, base_asset, quote_asset, exchange, is_active) VALUES
('BTCUSDT', 'BTC', 'USDT', 'binance', true),
('ETHUSDT', 'ETH', 'USDT', 'binance', true),
('ADAUSDT', 'ADA', 'USDT', 'binance', true),
('SOLUSDT', 'SOL', 'USDT', 'binance', true),
('DOTUSDT', 'DOT', 'USDT', 'binance', true),
('MATICUSDT', 'MATIC', 'USDT', 'binance', true),
('AVAXUSDT', 'AVAX', 'USDT', 'binance', true),
('LINKUSDT', 'LINK', 'USDT', 'binance', true),
('UNIUSDT', 'UNI', 'USDT', 'binance', true),
('ATOMUSDT', 'ATOM', 'USDT', 'binance', true),
('NEARUSDT', 'NEAR', 'USDT', 'binance', true),
('FTMUSDT', 'FTM', 'USDT', 'binance', true),
('ALGOUSDT', 'ALGO', 'USDT', 'binance', true),
('VETUSDT', 'VET', 'USDT', 'binance', true),
('ICPUSDT', 'ICP', 'USDT', 'binance', true),
('FILUSDT', 'FIL', 'USDT', 'binance', true),
('TRXUSDT', 'TRX', 'USDT', 'binance', true),
('ETCUSDT', 'ETC', 'USDT', 'binance', true),
('XLMUSDT', 'XLM', 'USDT', 'binance', true),
('LTCUSDT', 'LTC', 'USDT', 'binance', true)
ON CONFLICT (symbol) DO NOTHING;

-- targeted Bybit listings (custom high-priority symbols)
INSERT INTO symbols (symbol, base_asset, quote_asset, exchange, is_active) VALUES
('PORTALUSDT', 'PORTAL', 'USDT', 'bybit', true)
ON CONFLICT (symbol) DO NOTHING;

-- Create additional indexes for performance
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

-- Create materialized view for frequently accessed correlation data
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_correlation_summary AS
SELECT 
    symbol1,
    symbol2,
    interval,
    AVG(correlation) as avg_correlation,
    COUNT(*) as sample_count,
    MAX(end_time) as last_updated
FROM correlation_matrices
WHERE correlation IS NOT NULL
GROUP BY symbol1, symbol2, interval;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_correlation_summary_unique 
ON mv_correlation_summary (symbol1, symbol2, interval);

-- Create function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_correlation_summary;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean old data
CREATE OR REPLACE FUNCTION clean_old_data()
RETURNS void AS $$
BEGIN
    -- Delete old klines (keep last 30 days)
    DELETE FROM klines 
    WHERE open_time < NOW() - INTERVAL '30 days';
    
    -- Delete old trades (keep last 7 days)
    DELETE FROM trades 
    WHERE timestamp < NOW() - INTERVAL '7 days';
    
    -- Delete old order books (keep last 1 day)
    DELETE FROM order_books 
    WHERE timestamp < NOW() - INTERVAL '1 day';
    
    -- Delete old correlation matrices (keep last 90 days)
    DELETE FROM correlation_matrices 
    WHERE end_time < NOW() - INTERVAL '90 days';
    
    -- Delete old signals (keep last 30 days)
    DELETE FROM signals 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job to clean old data (requires pg_cron extension)
-- SELECT cron.schedule('clean-old-data', '0 2 * * *', 'SELECT clean_old_data();');

-- Create function to get market overview
CREATE OR REPLACE FUNCTION get_market_overview()
RETURNS TABLE (
    symbol text,
    price numeric,
    change_24h numeric,
    volume_24h numeric,
    market_cap numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.symbol,
        k.close_price as price,
        ((k.close_price - LAG(k.close_price) OVER (PARTITION BY s.symbol ORDER BY k.open_time)) / LAG(k.close_price) OVER (PARTITION BY s.symbol ORDER BY k.open_time) * 100) as change_24h,
        k.volume as volume_24h,
        k.close_price * k.volume as market_cap
    FROM symbols s
    JOIN klines k ON s.symbol = k.symbol
    WHERE s.is_active = true
    AND k.interval = '1d'
    AND k.open_time >= CURRENT_DATE - INTERVAL '1 day'
    ORDER BY k.volume DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO user;
