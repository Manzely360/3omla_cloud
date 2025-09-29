# 🚀 QUICK START - Wix Integration

## ✅ Your API is Running!

Your Coin Matcher API is now running at: **http://localhost:8000**

## 🌐 Get Your Public URL

### Option 1: Use ngrok (Recommended)
```bash
# Install ngrok if you haven't already
brew install ngrok

# Start ngrok tunnel
ngrok http 8000

# Copy the HTTPS URL (looks like: https://abc123.ngrok.io)
```

### Option 2: Use localtunnel (Alternative)
```bash
# Install localtunnel
npm install -g localtunnel

# Start tunnel
lt --port 8000

# Copy the URL (looks like: https://abc123.loca.lt)
```

## 🎯 Your API Endpoints

Once you have your public URL (let's call it `https://your-api.ngrok.io`), test these:

- **Health Check**: `https://your-api.ngrok.io/health`
- **API Docs**: `https://your-api.ngrok.io/docs`
- **Signals**: `https://your-api.ngrok.io/api/v1/signals/active`
- **Market Data**: `https://your-api.ngrok.io/api/v1/market/prices`

## 🏗️ Create Your Wix Site

### Step 1: Create Wix Account
1. Go to [wix.com](https://wix.com)
2. Click "Get Started" (Free)
3. Choose any template
4. Skip the AI setup for now

### Step 2: Enable Dev Mode
1. Click "Site" in the left menu
2. Click "Dev Mode" 
3. Toggle "Turn On Dev Mode"
4. Click "Apply"

### Step 3: Add Your Crypto Dashboard

#### A. Create a New Page
1. Click "Pages" in the left menu
2. Click "+" to add a new page
3. Name it "Crypto Dashboard"
4. Choose "Blank Page"

#### B. Add HTML Structure
1. Click "Add" → "More" → "HTML Embed"
2. Click "Enter Code"
3. Copy and paste the content from `wix-page-setup.html`
4. Click "Apply"

#### C. Add Custom CSS
1. Click "Site" → "Custom CSS"
2. Copy and paste the content from `wix-styles.css`
3. Click "Apply"

#### D. Add JavaScript
1. Click "Site" → "Dev Mode" → "Master Page"
2. Click "+" to add a new file
3. Name it "crypto-dashboard.js"
4. Copy the content from `wix-velo-crypto-dashboard.js`
5. **IMPORTANT**: Replace `https://your-coinmatcher-api.ngrok.io` with your actual ngrok URL

### Step 4: Test Your Integration

1. **Publish your site** (click "Publish" button)
2. **Visit your crypto dashboard page**
3. **You should see**:
   - Live crypto signals
   - Market prices
   - Correlation matrix
   - Auto-refreshing data

## 🔧 Troubleshooting

### If you see "No data" or errors:
1. **Check your ngrok URL** - Make sure it's correct in the JavaScript
2. **Test your API** - Visit `https://your-api.ngrok.io/health` in browser
3. **Check browser console** - Press F12 and look for errors
4. **Verify CORS** - Your API already has CORS enabled

### If ngrok isn't working:
1. **Try localtunnel**: `npm install -g localtunnel && lt --port 8000`
2. **Use a different port**: `ngrok http 8001` (if 8000 is busy)
3. **Check firewall**: Make sure port 8000 isn't blocked

## 🎉 Success!

Once working, you'll have:
- ✅ Real-time crypto signals on your Wix site
- ✅ Live market prices with 24h changes
- ✅ Professional correlation matrix
- ✅ Auto-refresh every 30 seconds
- ✅ Mobile-responsive design

## 📱 Next Steps

1. **Customize the design** to match your brand
2. **Add more cryptocurrencies** by editing the symbols array
3. **Change refresh rate** by modifying the setInterval value
4. **Add user authentication** for private dashboards
5. **Deploy to production** using proper hosting

## 🆘 Need Help?

- Check the browser console for errors
- Verify your API is accessible from the internet
- Make sure all files are correctly added to Wix
- Test your API endpoints individually

---

**Your API is ready! Just get your public URL and update the JavaScript file.**
