import React, { useState, useEffect } from 'react';
import { useI18n } from '../../lib/i18n'
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface PortfolioSummary {
  positions: Array<{
    symbol: string;
    side: string;
    quantity: number;
    entry_price: number;
    current_price: number;
    unrealized_pnl: number;
    pnl_percentage: number;
  }>;
  risk_metrics: {
    total_equity: number;
    daily_pnl: number;
    daily_trades: number;
  };
}

interface Strategy {
  id: number;
  name: string;
  type: string;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  total_pnl: number;
  sharpe_ratio: number;
  is_active: boolean;
}

const TradingDashboard: React.FC = () => {
  const { t } = useI18n()
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [livePositions, setLivePositions] = useState<any[] | null>(null);
  const [openOrders, setOpenOrders] = useState<any[] | null>(null);
  const [paperPositions, setPaperPositions] = useState<any[] | null>(null);

  useEffect(() => {
    fetchPortfolioData();
    fetchStrategies();
    fetchLive();
    fetchPaperPositions();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const response = await fetch('/api/v1/trading/portfolio');
      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    }
  };

  const fetchStrategies = async () => {
    try {
      const response = await fetch('/api/v1/trading/strategies');
      const data = await response.json();
      setStrategies(data);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutoTrade = async () => {
    try {
      const response = await fetch('/api/v1/trading/auto-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: !autoTradeEnabled }),
      });
      
      if (response.ok) {
        setAutoTradeEnabled(!autoTradeEnabled);
      }
    } catch (error) {
      console.error('Error toggling auto trade:', error);
    }
  };

  const fetchLive = async () => {
    try {
      const [lp, oo] = await Promise.all([
        fetch('/api/v1/trading/live/positions').then((r) => r.json()).catch(() => []),
        fetch('/api/v1/trading/live/open-orders').then((r) => r.json()).catch(() => []),
      ]);
      setLivePositions(Array.isArray(lp) ? lp : []);
      setOpenOrders(Array.isArray(oo) ? oo : []);
    } catch (e) {
      // ignore
    }
  };

  const fetchPaperPositions = async () => {
    try {
      const res = await fetch('/api/v1/trading/positions?active_only=true&mode=paper')
      const data = await res.json()
      setPaperPositions(Array.isArray(data) ? data : [])
    } catch (e) {
      setPaperPositions([])
    }
  }

  const closePaperPosition = async (id: number) => {
    try {
      const res = await fetch(`/api/v1/trading/positions/${id}/close`, { method: 'POST' })
      if (res.ok) {
        await fetchPaperPositions()
      }
    } catch (e) {}
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('trading.title','Trading Dashboard')}</h1>
          <p className="text-gray-600">Monitor your portfolio and trading strategies</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleAutoTrade}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              autoTradeEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {autoTradeEnabled ? (
              <>
                <StopIcon className="h-5 w-5" />
                <span>Stop Auto Trade</span>
              </>
            ) : (
              <>
                <PlayIcon className="h-5 w-5" />
                <span>Start Auto Trade</span>
              </>
            )}
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            <CogIcon className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Equity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(portfolio.risk_metrics.total_equity)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily P&L</p>
                <p className={`text-2xl font-bold ${
                  portfolio.risk_metrics.daily_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(portfolio.risk_metrics.daily_pnl)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Trades</p>
                <p className="text-2xl font-bold text-gray-900">
                  {portfolio.risk_metrics.daily_trades}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Positions (Paper) */}
      {portfolio && portfolio.positions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Positions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Side
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entry Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P&L %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolio.positions.map((position, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {position.symbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        position.side === 'long' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {position.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {position.quantity.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(position.entry_price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(position.current_price)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      position.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(position.unrealized_pnl)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      position.pnl_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(position.pnl_percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Positions (Bybit) */}
      {livePositions && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Live Positions (Bybit)</h2>
            <button onClick={fetchLive} className="text-sm text-primary-600">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contracts</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mark</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unrealized</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {livePositions.map((p, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate">{p.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs">
                      <span className={`inline-flex px-2 py-1 rounded-full ${p.side === 'long' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{p.side?.toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.contracts ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.entryPrice ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.markPrice ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.unrealizedPnl ?? '-'}</td>
                  </tr>
                ))}
                {livePositions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-sm text-gray-500">No live positions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Open Orders (Bybit) */}
      {openOrders && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Live Open Orders (Bybit)</h2>
            <button onClick={fetchLive} className="text-sm text-primary-600">Refresh</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {openOrders.map((o, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate">{o.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.side}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.amount ?? o.remaining ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.price ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.status ?? 'open'}</td>
                  </tr>
                ))}
                {openOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-sm text-gray-500">No open orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paper Positions (Quick Manage) */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Paper Positions</h2>
          <button onClick={fetchPaperPositions} className="text-sm text-primary-600">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PnL (realized)</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paperPositions?.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.side}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.entry_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.current_price ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.realized_pnl ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {p.is_active ? (
                      <button onClick={()=>closePaperPosition(p.id)} className="text-sm text-red-600">Close</button>
                    ) : (
                      <span className="text-xs text-gray-500">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
              {paperPositions && paperPositions.length === 0 && (
                <tr>
                  <td className="px-6 py-4 text-sm text-gray-500" colSpan={7}>No paper positions</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trading Strategies */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Trading Strategies</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    strategy.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {strategy.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900">{strategy.type}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Trades:</span>
                    <span className="text-sm font-medium text-gray-900">{strategy.total_trades}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Win Rate:</span>
                    <span className="text-sm font-medium text-gray-900">{strategy.win_rate.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total P&L:</span>
                    <span className={`text-sm font-medium ${
                      strategy.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(strategy.total_pnl)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Sharpe Ratio:</span>
                    <span className="text-sm font-medium text-gray-900">{strategy.sharpe_ratio.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Risk Warning</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Trading cryptocurrencies involves substantial risk of loss and is not suitable for all investors. 
                The high degree of leverage can work against you as well as for you. Before deciding to trade 
                cryptocurrencies, you should carefully consider your investment objectives, level of experience, 
                and risk appetite.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingDashboard;
