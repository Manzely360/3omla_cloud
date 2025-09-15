import React, { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PlayIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';

interface StrategyConfig {
  name: string;
  type: string;
  config: Record<string, any>;
  max_position_size: number;
  max_daily_loss: number;
  stop_loss_pct: number;
  take_profit_pct: number;
}

const StrategyBuilder: React.FC = () => {
  const [strategies, setStrategies] = useState<StrategyConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyConfig | null>(null);

  const strategyTypes = [
    { value: 'lead_lag', label: 'Lead-Lag Momentum', description: 'Trade based on lead-lag relationships between cryptocurrencies' },
    { value: 'momentum', label: 'Momentum', description: 'Trade based on price and volume momentum' },
    { value: 'mean_reversion', label: 'Mean Reversion', description: 'Trade based on Bollinger Bands and mean reversion' },
    { value: 'breakout', label: 'Breakout', description: 'Trade based on support/resistance breakouts' },
    { value: 'arbitrage', label: 'Arbitrage', description: 'Trade price differences between exchanges' },
    { value: 'copy_trade', label: 'Copy Trade', description: 'Copy trades from successful traders' },
  ];

  const [formData, setFormData] = useState<StrategyConfig>({
    name: '',
    type: 'lead_lag',
    config: {},
    max_position_size: 0.1,
    max_daily_loss: 0.05,
    stop_loss_pct: 0.02,
    take_profit_pct: 0.04,
  });

  const handleInputChange = (field: keyof StrategyConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }));
  };

  const getStrategyConfigFields = (type: string) => {
    switch (type) {
      case 'lead_lag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Lead Symbol</label>
              <input
                type="text"
                value={formData.config.lead_symbol || 'BTCUSDT'}
                onChange={(e) => handleConfigChange('lead_symbol', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="BTCUSDT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lag Symbol</label>
              <input
                type="text"
                value={formData.config.lag_symbol || 'ETHUSDT'}
                onChange={(e) => handleConfigChange('lag_symbol', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="ETHUSDT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lookback Periods</label>
              <input
                type="number"
                value={formData.config.lookback_periods || 20}
                onChange={(e) => handleConfigChange('lookback_periods', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="5"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Correlation Threshold</label>
              <input
                type="number"
                step="0.1"
                value={formData.config.correlation_threshold || 0.7}
                onChange={(e) => handleConfigChange('correlation_threshold', parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="0"
                max="1"
              />
            </div>
          </div>
        );
      
      case 'momentum':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Symbols (comma-separated)</label>
              <input
                type="text"
                value={formData.config.symbols?.join(',') || 'BTCUSDT,ETHUSDT,ADAUSDT'}
                onChange={(e) => handleConfigChange('symbols', e.target.value.split(',').map(s => s.trim()))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="BTCUSDT,ETHUSDT,ADAUSDT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lookback Periods</label>
              <input
                type="number"
                value={formData.config.lookback_periods || 20}
                onChange={(e) => handleConfigChange('lookback_periods', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="5"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Momentum Threshold</label>
              <input
                type="number"
                step="0.01"
                value={formData.config.momentum_threshold || 0.02}
                onChange={(e) => handleConfigChange('momentum_threshold', parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="0"
                max="0.1"
              />
            </div>
          </div>
        );
      
      case 'mean_reversion':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Symbols (comma-separated)</label>
              <input
                type="text"
                value={formData.config.symbols?.join(',') || 'BTCUSDT,ETHUSDT,ADAUSDT'}
                onChange={(e) => handleConfigChange('symbols', e.target.value.split(',').map(s => s.trim()))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="BTCUSDT,ETHUSDT,ADAUSDT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lookback Periods</label>
              <input
                type="number"
                value={formData.config.lookback_periods || 20}
                onChange={(e) => handleConfigChange('lookback_periods', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="5"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Standard Deviation</label>
              <input
                type="number"
                step="0.1"
                value={formData.config.std_dev || 2}
                onChange={(e) => handleConfigChange('std_dev', parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="1"
                max="3"
              />
            </div>
          </div>
        );
      
      case 'breakout':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Symbols (comma-separated)</label>
              <input
                type="text"
                value={formData.config.symbols?.join(',') || 'BTCUSDT,ETHUSDT,ADAUSDT'}
                onChange={(e) => handleConfigChange('symbols', e.target.value.split(',').map(s => s.trim()))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="BTCUSDT,ETHUSDT,ADAUSDT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lookback Periods</label>
              <input
                type="number"
                value={formData.config.lookback_periods || 50}
                onChange={(e) => handleConfigChange('lookback_periods', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="10"
                max="200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Breakout Threshold</label>
              <input
                type="number"
                step="0.01"
                value={formData.config.breakout_threshold || 0.01}
                onChange={(e) => handleConfigChange('breakout_threshold', parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="0.005"
                max="0.05"
              />
            </div>
          </div>
        );
      
      case 'arbitrage':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Symbols (comma-separated)</label>
              <input
                type="text"
                value={formData.config.symbols?.join(',') || 'BTCUSDT,ETHUSDT,ADAUSDT'}
                onChange={(e) => handleConfigChange('symbols', e.target.value.split(',').map(s => s.trim()))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="BTCUSDT,ETHUSDT,ADAUSDT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Spread (%)</label>
              <input
                type="number"
                step="0.001"
                value={formData.config.min_spread || 0.005}
                onChange={(e) => handleConfigChange('min_spread', parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="0.001"
                max="0.1"
              />
            </div>
          </div>
        );
      
      case 'copy_trade':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Trader Addresses (comma-separated)</label>
              <input
                type="text"
                value={formData.config.trader_addresses?.join(',') || ''}
                onChange={(e) => handleConfigChange('trader_addresses', e.target.value.split(',').map(s => s.trim()))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="0x1234...,0x5678..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Copy Ratio</label>
              <input
                type="number"
                step="0.01"
                value={formData.config.copy_ratio || 0.1}
                onChange={(e) => handleConfigChange('copy_ratio', parseFloat(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="0.01"
                max="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Minimum Trade Size ($)</label>
              <input
                type="number"
                value={formData.config.min_trade_size || 10000}
                onChange={(e) => handleConfigChange('min_trade_size', parseInt(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                min="1000"
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/v1/trading/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        const newStrategy = await response.json();
        setStrategies(prev => [...prev, newStrategy]);
        setShowForm(false);
        setFormData({
          name: '',
          type: 'lead_lag',
          config: {},
          max_position_size: 0.1,
          max_daily_loss: 0.05,
          stop_loss_pct: 0.02,
          take_profit_pct: 0.04,
        });
      }
    } catch (error) {
      console.error('Error creating strategy:', error);
    }
  };

  const handleDeleteStrategy = async (id: number) => {
    try {
      const response = await fetch(`/api/v1/trading/strategies/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setStrategies(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Error deleting strategy:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Strategy Builder</h1>
          <p className="text-gray-600">Create and manage your trading strategies</p>
        </div>
        
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Strategy</span>
        </button>
      </div>

      {/* Strategy Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Strategy</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Strategy Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Strategy Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  >
                    {strategyTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    {strategyTypes.find(t => t.value === formData.type)?.description}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Strategy Configuration</label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    {getStrategyConfigFields(formData.type)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Position Size (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_position_size}
                      onChange={(e) => handleInputChange('max_position_size', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      min="0.01"
                      max="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Daily Loss (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.max_daily_loss}
                      onChange={(e) => handleInputChange('max_daily_loss', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      min="0.01"
                      max="0.5"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Stop Loss (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.stop_loss_pct}
                      onChange={(e) => handleInputChange('stop_loss_pct', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      min="0.01"
                      max="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Take Profit (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.take_profit_pct}
                      onChange={(e) => handleInputChange('take_profit_pct', parseFloat(e.target.value))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      min="0.01"
                      max="0.2"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                  >
                    Create Strategy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Strategies List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Strategies</h2>
        </div>
        <div className="p-6">
          {strategies.length === 0 ? (
            <div className="text-center py-8">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No strategies</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new trading strategy.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy) => (
                <div key={strategy.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <CogIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteStrategy(strategy.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Type:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {strategyTypes.find(t => t.value === strategy.type)?.label}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Max Position:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(strategy.max_position_size * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Stop Loss:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(strategy.stop_loss_pct * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Take Profit:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {(strategy.take_profit_pct * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <button className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors">
                      <PlayIcon className="h-4 w-4" />
                      <span>Activate</span>
                    </button>
                    <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                      Backtest
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StrategyBuilder;
