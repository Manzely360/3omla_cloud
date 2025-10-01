"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Settings, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ExchangeCredentials {
  exchange: string;
  sandbox: boolean;
  created_at: number;
  last_used?: number;
  is_active: boolean;
}

interface OrderRequest {
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
  stop_price?: number;
  time_in_force?: string;
  client_order_id?: string;
}

interface OrderResponse {
  order_id: string;
  symbol: string;
  side: string;
  type: string;
  amount: number;
  price: number;
  filled: number;
  remaining: number;
  status: string;
  timestamp: number;
  exchange: string;
  client_order_id?: string;
  fees?: Record<string, number>;
  error?: string;
}

interface Balance {
  exchange: string;
  currency: string;
  free: number;
  used: number;
  total: number;
  timestamp: number;
}

interface Position {
  exchange: string;
  symbol: string;
  side: string;
  amount: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  timestamp: number;
}

const TradingPanel: React.FC = () => {
  const [credentials, setCredentials] = useState<ExchangeCredentials[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Order form state
  const [orderForm, setOrderForm] = useState<OrderRequest>({
    exchange: '',
    symbol: '',
    side: 'buy',
    type: 'market',
    amount: 0,
    price: 0,
    stop_price: 0,
    time_in_force: 'GTC',
    client_order_id: ''
  });

  // Credential form state
  const [credentialForm, setCredentialForm] = useState({
    exchange: '',
    api_key: '',
    secret_key: '',
    passphrase: '',
    sandbox: true
  });

  const [showCredentialForm, setShowCredentialForm] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchCredentials();
    fetchBalances();
    fetchPositions();
    fetchOrders();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/v1/trading-api/credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials || []);
      }
    } catch (err) {
      console.error('Failed to fetch credentials:', err);
    }
  };

  const fetchBalances = async () => {
    try {
      const response = await fetch('/api/v1/trading-api/balance/binance');
      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances || []);
      }
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/v1/trading-api/positions/binance');
      if (response.ok) {
        const data = await response.json();
        setPositions(data.positions || []);
      }
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/v1/trading-api/orders/binance');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/trading-api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderForm),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Order placed successfully!');
        setOrderForm({
          exchange: '',
          symbol: '',
          side: 'buy',
          type: 'market',
          amount: 0,
          price: 0,
          stop_price: 0,
          time_in_force: 'GTC',
          client_order_id: ''
        });
        fetchOrders(); // Refresh orders
      } else {
        setError(data.detail || 'Failed to place order');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/v1/trading-api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentialForm),
      });

      if (response.ok) {
        setSuccess('Credentials stored successfully!');
        setCredentialForm({
          exchange: '',
          api_key: '',
          secret_key: '',
          passphrase: '',
          sandbox: true
        });
        setShowCredentialForm(false);
        fetchCredentials(); // Refresh credentials
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to store credentials');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCredentials = async (exchange: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/trading-api/credentials/${exchange}/verify`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Credentials verified successfully!');
        fetchCredentials(); // Refresh credentials
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to verify credentials');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCredentials = async (exchange: string) => {
    if (!confirm('Are you sure you want to delete these credentials?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/v1/trading-api/credentials/${exchange}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess('Credentials deleted successfully!');
        fetchCredentials(); // Refresh credentials
      } else {
        const data = await response.json();
        setError(data.detail || 'Failed to delete credentials');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Trading Panel</h2>
          <p className="text-muted-foreground">Manage your exchange credentials and execute trades</p>
        </div>
        <Button
          onClick={() => setShowCredentialForm(!showCredentialForm)}
          className="bg-primary hover:bg-primary/90"
        >
          <Settings className="w-4 h-4 mr-2" />
          Manage Credentials
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center"
        >
          <AlertCircle className="w-5 h-5 text-destructive mr-2" />
          <span className="text-destructive">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center"
        >
          <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
          <span className="text-green-500">{success}</span>
        </motion.div>
      )}

      {/* Credential Management */}
      {showCredentialForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Exchange Credentials
            </CardTitle>
            <CardDescription>
              Securely store your exchange API credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStoreCredentials} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Exchange</label>
                  <select
                    value={credentialForm.exchange}
                    onChange={(e) => setCredentialForm({ ...credentialForm, exchange: e.target.value })}
                    className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                    required
                  >
                    <option value="">Select Exchange</option>
                    <option value="binance">Binance</option>
                    <option value="bybit">Bybit</option>
                    <option value="kucoin">KuCoin</option>
                    <option value="okx">OKX</option>
                    <option value="coinbase">Coinbase</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="sandbox"
                    checked={credentialForm.sandbox}
                    onChange={(e) => setCredentialForm({ ...credentialForm, sandbox: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="sandbox" className="text-sm font-medium">
                    Use Sandbox/Testnet
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">API Key</label>
                <Input
                  type="text"
                  value={credentialForm.api_key}
                  onChange={(e) => setCredentialForm({ ...credentialForm, api_key: e.target.value })}
                  placeholder="Enter your API key"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Secret Key</label>
                <Input
                  type="password"
                  value={credentialForm.secret_key}
                  onChange={(e) => setCredentialForm({ ...credentialForm, secret_key: e.target.value })}
                  placeholder="Enter your secret key"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Passphrase (Optional)</label>
                <Input
                  type="password"
                  value={credentialForm.passphrase}
                  onChange={(e) => setCredentialForm({ ...credentialForm, passphrase: e.target.value })}
                  placeholder="Enter passphrase if required"
                />
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Store Credentials
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCredentialForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stored Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Stored Credentials
          </CardTitle>
          <CardDescription>
            Your exchange API credentials are encrypted and stored securely
          </CardDescription>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No credentials stored yet. Add your exchange credentials to start trading.
            </p>
          ) : (
            <div className="space-y-3">
              {credentials.map((cred) => (
                <div
                  key={cred.exchange}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">
                        {cred.exchange.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium capitalize">{cred.exchange}</div>
                      <div className="text-sm text-muted-foreground">
                        {cred.sandbox ? 'Sandbox' : 'Live'} • 
                        {cred.is_active ? ' Active' : ' Inactive'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleVerifyCredentials(cred.exchange)}
                      disabled={loading}
                    >
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteCredentials(cred.exchange)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trading Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Place Order
          </CardTitle>
          <CardDescription>
            Execute trades on your connected exchanges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePlaceOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Exchange</label>
                <select
                  value={orderForm.exchange}
                  onChange={(e) => setOrderForm({ ...orderForm, exchange: e.target.value })}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="">Select Exchange</option>
                  {credentials.map((cred) => (
                    <option key={cred.exchange} value={cred.exchange}>
                      {cred.exchange.charAt(0).toUpperCase() + cred.exchange.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Symbol</label>
                <Input
                  type="text"
                  value={orderForm.symbol}
                  onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value })}
                  placeholder="e.g., BTCUSDT"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Side</label>
                <select
                  value={orderForm.side}
                  onChange={(e) => setOrderForm({ ...orderForm, side: e.target.value as 'buy' | 'sell' })}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={orderForm.type}
                  onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value as 'market' | 'limit' | 'stop' })}
                  className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                  <option value="stop">Stop</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={orderForm.amount}
                  onChange={(e) => setOrderForm({ ...orderForm, amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            {orderForm.type === 'limit' && (
              <div>
                <label className="text-sm font-medium">Price</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={orderForm.price}
                  onChange={(e) => setOrderForm({ ...orderForm, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
            )}
            {orderForm.type === 'stop' && (
              <div>
                <label className="text-sm font-medium">Stop Price</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={orderForm.stop_price}
                  onChange={(e) => setOrderForm({ ...orderForm, stop_price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
            )}
            <Button type="submit" disabled={loading || credentials.length === 0} className="w-full">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Place Order
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Account Balances
          </CardTitle>
          <CardDescription>
            Your current account balances across exchanges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {balances.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No balance data available. Connect your exchange credentials to view balances.
            </p>
          ) : (
            <div className="space-y-3">
              {balances.map((balance) => (
                <div
                  key={`${balance.exchange}-${balance.currency}`}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">
                        {balance.currency.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{balance.currency}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {balance.exchange}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatAmount(balance.free)}</div>
                    <div className="text-sm text-muted-foreground">
                      Total: {formatAmount(balance.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Open Orders
          </CardTitle>
          <CardDescription>
            Your currently open orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No open orders found.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.side === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                      {order.side === 'buy' ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{order.symbol}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.side.toUpperCase()} • {order.type.toUpperCase()} • {order.amount}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(order.price)}</div>
                    <Badge variant={order.status === 'filled' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingPanel;

