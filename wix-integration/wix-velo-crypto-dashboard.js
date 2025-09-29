// Wix Velo Integration - Crypto Analytics Dashboard
// This file goes in your Wix site's Velo code section

import wixFetch from 'wix-fetch';

// Configuration - Update with your API URL
const API_BASE_URL = 'https://monotriglyphic-yong-unmannered.ngrok-free.dev/api/v1'; // Your actual API URL

// Initialize the crypto dashboard when page loads
$w.onReady(function () {
    console.log('Crypto Dashboard initialized');
    loadCryptoData();
    
    // Auto-refresh every 30 seconds
    setInterval(loadCryptoData, 30000);
});

// Main function to load all crypto data
async function loadCryptoData() {
    try {
        showLoading(true);
        
        // Load data in parallel for better performance
        const [signals, marketData, correlations] = await Promise.all([
            fetchActiveSignals(),
            fetchMarketPrices(),
            fetchCorrelationMatrix()
        ]);
        
        // Display the data
        displaySignals(signals);
        displayMarketData(marketData);
        displayCorrelations(correlations);
        
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading crypto data:', error);
        showError('Failed to load crypto data. Please try again.');
        showLoading(false);
    }
}

// Fetch active trading signals
async function fetchActiveSignals() {
    try {
        const response = await wixFetch.fetch(`${API_BASE_URL}/signals/active`);
        const data = await response.json();
        return data.signals || [];
    } catch (error) {
        console.error('Error fetching signals:', error);
        return [];
    }
}

// Fetch market prices
async function fetchMarketPrices() {
    try {
        const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT'];
        const response = await wixFetch.fetch(`${API_BASE_URL}/market/prices?symbols=${symbols.join(',')}`);
        const data = await response.json();
        return data.prices || [];
    } catch (error) {
        console.error('Error fetching market prices:', error);
        return [];
    }
}

// Fetch correlation matrix
async function fetchCorrelationMatrix() {
    try {
        const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT'];
        const response = await wixFetch.fetch(`${API_BASE_URL}/analytics/correlation-matrix?symbols=${symbols.join(',')}`);
        const data = await response.json();
        return data.correlations || {};
    } catch (error) {
        console.error('Error fetching correlations:', error);
        return {};
    }
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
                <div class="timestamp">
                    ${new Date(signal.timestamp).toLocaleString()}
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

// Display correlation matrix
function displayCorrelations(correlations) {
    if (!correlations || Object.keys(correlations).length === 0) {
        $w('#correlationContainer').html = '<div class="no-data">No correlation data available</div>';
        return;
    }
    
    const symbols = Object.keys(correlations);
    let correlationHtml = '<div class="correlation-matrix">';
    
    // Create header
    correlationHtml += '<div class="correlation-header"><div class="cell"></div>';
    symbols.forEach(symbol => {
        correlationHtml += `<div class="cell header">${symbol.replace('USDT', '')}</div>`;
    });
    correlationHtml += '</div>';
    
    // Create rows
    symbols.forEach(symbol1 => {
        correlationHtml += `<div class="correlation-row">`;
        correlationHtml += `<div class="cell header">${symbol1.replace('USDT', '')}</div>`;
        
        symbols.forEach(symbol2 => {
            const correlation = correlations[symbol1]?.[symbol2] || 0;
            const intensity = Math.abs(correlation);
            const colorClass = intensity > 0.7 ? 'high' : intensity > 0.4 ? 'medium' : 'low';
            
            correlationHtml += `
                <div class="cell correlation ${colorClass}" title="${symbol1} vs ${symbol2}: ${correlation.toFixed(3)}">
                    ${correlation.toFixed(2)}
                </div>
            `;
        });
        
        correlationHtml += '</div>';
    });
    
    correlationHtml += '</div>';
    $w('#correlationContainer').html = correlationHtml;
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

// Manual refresh function (can be called from a button)
export function refreshData() {
    loadCryptoData();
}

// Export functions for use in other parts of your Wix site
export {
    loadCryptoData,
    fetchActiveSignals,
    fetchMarketPrices,
    fetchCorrelationMatrix
};
