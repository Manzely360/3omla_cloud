# 🚀 FREE Wix Integration for Coin Matcher v2

This integration allows you to embed your cryptocurrency analytics directly into a Wix website with **ZERO COST**!

## 🎯 What You Get

- **Real-time crypto signals** displayed on your Wix site
- **Live market prices** with 24h change indicators
- **Correlation matrix** showing how cryptocurrencies move together
- **Auto-refresh** every 30 seconds
- **Responsive design** that works on all devices
- **Professional styling** with dark theme

## 📋 What You Need (All FREE)

### 1. Wix Account (Free)
- Go to [wix.com](https://wix.com)
- Create a free account (no credit card required)
- Choose any template

### 2. Your Coin Matcher API
- We'll set this up for free using ngrok
- No hosting costs required

## 🚀 Quick Setup (5 Minutes)

### Step 1: Start Your API
```bash
# Run the setup script
cd wix-integration
./setup-free-testing.sh
```

This will:
- Install ngrok (if needed)
- Start your Coin Matcher backend
- Create a public URL for your API
- Display the URL you need for Wix

### Step 2: Create Your Wix Site

1. **Go to Wix.com** and create a free account
2. **Choose a template** (any will work)
3. **Enable Dev Mode**:
   - Click "Site" → "Dev Mode" → "Turn On Dev Mode"
   - This enables Velo (Wix's coding platform)

### Step 3: Add the Code

1. **Create a new page** called "Crypto Dashboard"
2. **Add the HTML structure**:
   - Copy content from `wix-page-setup.html`
   - Paste into your page using Wix's HTML element

3. **Add the CSS styles**:
   - Go to "Site" → "Custom CSS"
   - Copy content from `wix-styles.css`
   - Paste into the custom CSS section

4. **Add the JavaScript**:
   - Go to "Site" → "Dev Mode" → "Master Page"
   - Add a new JavaScript file
   - Copy content from `wix-velo-crypto-dashboard.js`
   - **IMPORTANT**: Replace `https://your-coinmatcher-api.ngrok.io` with your actual ngrok URL

### Step 4: Test Your Integration

1. **Publish your site**
2. **Visit your crypto dashboard page**
3. **You should see**:
   - Live crypto signals
   - Market prices
   - Correlation matrix
   - Auto-refreshing data

## 🔧 Configuration Options

### API Endpoints Used
- `/api/v1/signals/active` - Active trading signals
- `/api/v1/market/prices` - Market price data
- `/api/v1/analytics/correlation-matrix` - Correlation data

### Customization
You can easily modify:
- **Cryptocurrencies**: Change the symbols array in the JavaScript
- **Refresh rate**: Modify the `setInterval` value (currently 30 seconds)
- **Styling**: Update the CSS to match your brand
- **Data display**: Modify the HTML structure

## 🎨 Styling Features

- **Dark theme** with gradient backgrounds
- **Responsive design** for mobile and desktop
- **Hover effects** and smooth animations
- **Color-coded signals** (green for buy, red for sell)
- **Professional correlation matrix** with heat map colors

## 🚨 Troubleshooting

### API Not Loading
- Check that your ngrok URL is correct
- Ensure your backend is running: `docker-compose logs backend`
- Verify CORS is enabled (already configured)

### No Data Showing
- Check browser console for errors
- Verify API endpoints are working: `curl https://your-ngrok-url.ngrok.io/api/v1/signals/active`
- Ensure your backend has data (check database)

### Styling Issues
- Make sure CSS is added to "Custom CSS" section
- Check that HTML elements have correct IDs
- Verify Wix Dev Mode is enabled

## 💡 Advanced Features

### Add More Cryptocurrencies
```javascript
// In wix-velo-crypto-dashboard.js
const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT', 'DOTUSDT', 'LINKUSDT'];
```

### Change Refresh Rate
```javascript
// Update every 60 seconds instead of 30
setInterval(loadCryptoData, 60000);
```

### Add Custom Styling
```css
/* In wix-styles.css */
.signal-card {
    background: your-custom-gradient;
    border-radius: your-custom-radius;
}
```

## 🔄 Updating Your Integration

When you make changes to your Coin Matcher backend:
1. Restart the setup script: `./setup-free-testing.sh`
2. Update the ngrok URL in your Wix JavaScript
3. Publish your Wix site

## 📱 Mobile Optimization

The integration is fully responsive and includes:
- Touch-friendly buttons
- Optimized layouts for small screens
- Readable text sizes
- Smooth scrolling

## 🎯 Next Steps

Once you've tested the integration:
1. **Customize the design** to match your brand
2. **Add more features** like user authentication
3. **Deploy to production** using a proper hosting service
4. **Add analytics** to track usage

## 🆘 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all files are correctly added to Wix
3. Ensure your API is running and accessible
4. Check the ngrok logs: `tail -f ngrok.log`

## 🎉 Success!

You now have a professional cryptocurrency analytics dashboard embedded in your Wix website with zero ongoing costs!

---

**Note**: This integration uses ngrok for free API tunneling. For production use, consider deploying to a proper hosting service like Heroku, Railway, or DigitalOcean.
