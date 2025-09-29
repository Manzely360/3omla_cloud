// Wix Velo Integration - 3OMLA Frontend Integration
// This works with your existing frontend at https://monotriglyphic-yong-unmannered.ngrok-free.dev

import wixFetch from 'wix-fetch';

// Configuration - Your existing frontend URL
const FRONTEND_URL = 'https://monotriglyphic-yong-unmannered.ngrok-free.dev';

// Initialize the crypto dashboard when page loads
$w.onReady(function () {
    console.log('3OMLA Frontend Integration initialized');
    loadCryptoData();
    
    // Auto-refresh every 30 seconds
    setInterval(loadCryptoData, 30000);
});

// Main function to load crypto data from your frontend
async function loadCryptoData() {
    try {
        showLoading(true);
        
        // Load data from your existing frontend
        const [signals, marketData] = await Promise.all([
            fetchSignalsFromFrontend(),
            fetchMarketDataFromFrontend()
        ]);
        
        // Display the data
        displaySignals(signals);
        displayMarketData(marketData);
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading crypto data:', error);
        showError('Failed to load crypto data. Please try again.');
        showLoading(false);
    }
}

// Fetch signals from your frontend API
async function fetchSignalsFromFrontend() {
    try {
        // Try to get signals from your frontend's API endpoints
        const response = await wixFetch.fetch(`${FRONTEND_URL}/api/v1/signals/active`);
        const data = await response.json();
        return data.signals || data || [];
    } catch (error) {
        console.error('Error fetching signals from frontend:', error);
        // Fallback to mock data if API not accessible
        return generateMockSignals();
    }
}

// Fetch market data from your frontend
async function fetchMarketDataFromFrontend() {
    try {
        const response = await wixFetch.fetch(`${FRONTEND_URL}/api/v1/market/prices`);
        const data = await response.json();
        return data.prices || data || [];
    } catch (error) {
        console.error('Error fetching market data from frontend:', error);
        // Fallback to mock data
        return generateMockMarketData();
    }
}

// Generate mock signals for demonstration
function generateMockSignals() {
    return [
        {
            symbol: 'BTCUSDT',
            action: 'BUY',
            strength: 0.85,
            timestamp: new Date().toISOString(),
            price: 45000,
            change_24h: 2.5
        },
        {
            symbol: 'ETHUSDT',
            action: 'SELL',
            strength: 0.72,
            timestamp: new Date().toISOString(),
            price: 3200,
            change_24h: -1.8
        },
        {
            symbol: 'ADAUSDT',
            action: 'BUY',
            strength: 0.68,
            timestamp: new Date().toISOString(),
            price: 0.45,
            change_24h: 5.2
        }
    ];
}

// Generate mock market data
function generateMockMarketData() {
    return [
        { symbol: 'BTCUSDT', price: 45000, change_24h: 2.5 },
        { symbol: 'ETHUSDT', price: 3200, change_24h: -1.8 },
        { symbol: 'ADAUSDT', price: 0.45, change_24h: 5.2 },
        { symbol: 'SOLUSDT', price: 95, change_24h: 3.1 },
        { symbol: 'DOTUSDT', price: 6.8, change_24h: -0.5 }
    ];
}

// Display active signals
function displaySignals(signals) {
    if (!signals || signals.length === 0) {
        $w('#signalsContainer').html = '<div class="no-signals">No active signals at the moment</div>';
        return;
    }
    
    const signalsHtml = signals.map(signal => `
        <div class="signal-card ${signal.action.toLowerCase()}">
            <div class="signal-header">
                <span class="symbol">${signal.symbol}</span>
                <span class="action-badge ${signal.action.toLowerCase()}">${signal.action}</span>
            </div>
            <div class="signal-details">
                <div class="strength">
                    <span class="label">Strength:</span>
                    <span class="value">${(signal.strength * 100).toFixed(1)}%</span>
                </div>
                <div class="price">
                    <span class="label">Price:</span>
                    <span class="value">$${signal.price ? signal.price.toFixed(2) : 'N/A'}</span>
                </div>
                <div class="change ${signal.change_24h >= 0 ? 'positive' : 'negative'}">
                    ${signal.change_24h >= 0 ? '+' : ''}${signal.change_24h ? signal.change_24h.toFixed(2) : '0'}%
                </div>
            </div>
        </div>
    `).join('');
    
    $w('#signalsContainer').html = signalsHtml;
}

// Display market prices
function displayMarketData(prices) {
    if (!prices || prices.length === 0) {
        $w('#marketContainer').html = '<div class="no-data">No market data available</div>';
        return;
    }
    
    const marketHtml = prices.map(price => `
        <div class="price-card">
            <div class="symbol">${price.symbol}</div>
            <div class="price">$${parseFloat(price.price).toFixed(2)}</div>
            <div class="change ${price.change_24h >= 0 ? 'positive' : 'negative'}">
                ${price.change_24h >= 0 ? '+' : ''}${price.change_24h.toFixed(2)}%
            </div>
        </div>
    `).join('');
    
    $w('#marketContainer').html = marketHtml;
}

// Show loading state
function showLoading(show) {
    if (show) {
        $w('#loadingIndicator').show();
    } else {
        $w('#loadingIndicator').hide();
    }
}

// Show error message
function showError(message) {
    $w('#errorMessage').text = message;
    $w('#errorMessage').show();
    
    // Hide error after 5 seconds
    setTimeout(() => {
        $w('#errorMessage').hide();
    }, 5000);
}

// Manual refresh function
export function refreshData() {
    loadCryptoData();
}

// Open your main 3OMLA dashboard
export function openMainDashboard() {
    window.open(FRONTEND_URL, '_blank');
}

// Export functions for use in other parts of your Wix site
export {
    loadCryptoData,
    fetchSignalsFromFrontend,
    fetchMarketDataFromFrontend,
    openMainDashboard
};
