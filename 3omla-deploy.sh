#!/bin/bash

# 3OMLA DEPLOYMENT AUTOMATION - CLOUDFLARE + VERCEL
# ==================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${MAGENTA}============================================${NC}"
echo -e "${CYAN}   DEPLOYMENT CONFIGURATION${NC}"
echo -e "${MAGENTA}============================================${NC}"

PROJECT_DIR="3omla-trading-platform"

# Check if project exists
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Project directory not found. Run setup scripts first!${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# Create Vercel configuration
echo -e "${BLUE}Creating Vercel configuration...${NC}"
cat > vercel.json << 'EOF'
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "outputDirectory": ".next",
  "public": false,
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret",
    "NEXTAUTH_URL": "@nextauth_url"
  },
  "build": {
    "env": {
      "DATABASE_URL": "@database_url",
      "NEXTAUTH_SECRET": "@nextauth_secret"
    }
  },
  "functions": {
    "src/app/api/auth/[...nextauth]/route.ts": {
      "maxDuration": 10
    },
    "src/app/api/trading/*/route.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Credentials",
          "value": "true"
        },
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/ws/:path*",
      "destination": "https://stream.binance.com:9443/:path*"
    }
  ]
}
EOF

# Create Cloudflare Workers configuration
echo -e "${BLUE}Creating Cloudflare Workers configuration...${NC}"
cat > wrangler.toml << 'EOF'
name = "3omla-trading-worker"
main = "src/worker.js"
compatibility_date = "2024-01-01"
node_compat = true

[env.production]
name = "3omla-trading-production"
routes = [
  { pattern = "api.3omla.com/*", zone_name = "3omla.com" }
]

[env.staging]
name = "3omla-trading-staging"
routes = [
  { pattern = "staging-api.3omla.com/*", zone_name = "3omla.com" }
]

[[kv_namespaces]]
binding = "RATE_LIMITER"
id = "your-kv-namespace-id"

[[d1_databases]]
binding = "DB"
database_name = "3omla-trading-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "STORAGE"
bucket_name = "3omla-storage"

[build]
command = "npm run build:worker"
watch_paths = ["src/worker/**/*.js"]

[dev]
ip = "localhost"
port = 8787
local_protocol = "http"

[[analytics.datasets]]
binding = "ANALYTICS"
dataset = "3omla_analytics"
EOF

# Create Cloudflare Worker
echo -e "${BLUE}Creating Cloudflare Worker for API...${NC}"
mkdir -p src/worker
cat > src/worker/index.js << 'EOF'
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `rate_limit:${clientIP}:${Date.now() / 60000 | 0}`;
    
    const rateLimit = await env.RATE_LIMITER.get(rateLimitKey);
    if (rateLimit && parseInt(rateLimit) > 100) {
      return new Response('Rate limit exceeded', { 
        status: 429,
        headers: corsHeaders 
      });
    }
    
    await env.RATE_LIMITER.put(rateLimitKey, 
      (parseInt(rateLimit || 0) + 1).toString(), 
      { expirationTtl: 60 }
    );

    // Route handling
    try {
      if (url.pathname.startsWith('/api/market')) {
        return handleMarketData(request, env);
      } else if (url.pathname.startsWith('/api/trading')) {
        return handleTrading(request, env);
      } else if (url.pathname.startsWith('/api/analytics')) {
        return handleAnalytics(request, env);
      } else if (url.pathname.startsWith('/api/ws')) {
        return handleWebSocket(request, env);
      } else {
        return new Response('Not Found', { 
          status: 404,
          headers: corsHeaders 
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  },
};

async function handleMarketData(request, env) {
  // Implement market data caching and retrieval
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cachedResponse = await cache.match(cacheKey);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fetch fresh data from exchanges
  const data = await fetchMarketData();
  const response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=10',
    },
  });

  // Store in cache
  await cache.put(cacheKey, response.clone());
  return response;
}

async function handleTrading(request, env) {
  // Verify authentication
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Process trading request
  const body = await request.json();
  
  // Store trade in D1 database
  const stmt = env.DB.prepare(
    'INSERT INTO trades (user_id, exchange, symbol, type, side, amount, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );
  
  await stmt.bind(
    body.userId,
    body.exchange,
    body.symbol,
    body.type,
    body.side,
    body.amount,
    body.price,
    'pending'
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleAnalytics(request, env) {
  // Log analytics event
  env.ANALYTICS.writeDataPoint({
    timestamp: Date.now(),
    event: 'api_request',
    path: new URL(request.url).pathname,
    method: request.method,
  });

  return new Response(JSON.stringify({ status: 'logged' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleWebSocket(request, env) {
  // Upgrade to WebSocket
  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // Handle WebSocket messages
  server.accept();
  server.addEventListener('message', async (event) => {
    const data = JSON.parse(event.data);
    
    // Process subscription requests
    if (data.action === 'subscribe') {
      // Subscribe to market data streams
      server.send(JSON.stringify({
        type: 'subscribed',
        symbols: data.symbols,
      }));
    }
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

async function fetchMarketData() {
  // Implement actual market data fetching
  return {
    bitcoin: { price: 50000, change: 2.5 },
    ethereum: { price: 3000, change: 1.8 },
  };
}
EOF

# Create GitHub Actions workflow for CI/CD
echo -e "${BLUE}Creating GitHub Actions CI/CD workflow...${NC}"
mkdir -p .github/workflows
cat > .github/workflows/deploy.yml << 'EOF'
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run lint
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck

  deploy-vercel:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-cloudflare:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production

  database-migrate:
    needs: [deploy-vercel, deploy-cloudflare]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: npx prisma migrate deploy
EOF

# Create Dockerfile for local development
echo -e "${BLUE}Creating Docker configuration...${NC}"
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
EOF

# Create docker-compose for local development
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/3omla_trading
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=3omla_trading
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    environment:
      - ADMINER_DEFAULT_SERVER=db

volumes:
  postgres_data:
  redis_data:
EOF

# Create deployment script
echo -e "${BLUE}Creating automated deployment script...${NC}"
cat > deploy.sh << 'EOF'
#!/bin/bash

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting deployment process...${NC}"

# Check for required environment variables
if [ -z "$VERCEL_TOKEN" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo "Please set VERCEL_TOKEN and CLOUDFLARE_API_TOKEN"
    exit 1
fi

# Build the project
echo -e "${BLUE}Building project...${NC}"
npm run build

# Deploy to Vercel
echo -e "${BLUE}Deploying to Vercel...${NC}"
vercel --prod --token=$VERCEL_TOKEN

# Deploy Workers to Cloudflare
echo -e "${BLUE}Deploying to Cloudflare Workers...${NC}"
wrangler deploy --env production

# Run database migrations
echo -e "${BLUE}Running database migrations...${NC}"
npx prisma migrate deploy

echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
echo -e "${CYAN}Access your application at:${NC}"
echo "• Production: https://3omla.vercel.app"
echo "• API: https://api.3omla.com"
echo ""
EOF

chmod +x deploy.sh

echo -e "${GREEN}✓ Deployment configuration created!${NC}"
echo ""
echo -e "${CYAN}Deployment setup includes:${NC}"
echo "• Vercel configuration with optimized settings"
echo "• Cloudflare Workers for edge API"
echo "• GitHub Actions CI/CD pipeline"
echo "• Docker configuration for local development"
echo "• Automated deployment script"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Set up your environment variables"
echo "2. Configure your Vercel and Cloudflare accounts"
echo "3. Push to GitHub to trigger automatic deployment"
