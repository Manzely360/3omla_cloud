#!/bin/bash

# 3OMLA TRADING PLATFORM - COMPLETE REBUILD & DEPLOYMENT AUTOMATION
# =================================================================
# This script automates the entire process of rebuilding and deploying
# your trading platform with modern architecture and best practices

set -e  # Exit on error

# Color codes for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project Configuration
PROJECT_NAME="3omla-trading-platform"
GITHUB_REPO=""  # Will be set during setup
VERCEL_PROJECT=""  # Will be set during setup
CLOUDFLARE_ACCOUNT=""  # Will be set during setup

echo -e "${MAGENTA}============================================${NC}"
echo -e "${CYAN}   3OMLA TRADING PLATFORM REBUILD v2.0${NC}"
echo -e "${MAGENTA}============================================${NC}"
echo ""

# Function to print colored status messages
status_message() {
    echo -e "${GREEN}[✓]${NC} $1"
}

error_message() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

info_message() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if project directory exists
if [ -d "$PROJECT_NAME" ]; then
    echo -e "${YELLOW}Existing project found. Backing up...${NC}"
    mv "$PROJECT_NAME" "${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
    status_message "Backup created"
fi

# Create project structure
info_message "Creating optimized project structure..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize Git repository
git init
status_message "Git repository initialized"

# Create directory structure
mkdir -p {src/{components,pages,lib,hooks,utils,styles,services,store,config},public/{images,icons,fonts},tests,docs,scripts,api}

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output

# Production
build/
dist/
.next/
out/

# Misc
.DS_Store
*.pem
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Vercel
.vercel

# Typescript
*.tsbuildinfo
next-env.d.ts

# Cloudflare
.wrangler/
.dev.vars

# IDE
.vscode/
.idea/

# API Keys (NEVER commit these!)
**/api-keys.json
**/secrets.json
EOF

status_message "Project structure created"

# Create package.json with all dependencies
info_message "Setting up package.json with optimized dependencies..."
cat > package.json << 'EOF'
{
  "name": "3omla-trading-platform",
  "version": "2.0.0",
  "description": "Advanced Crypto Trading Platform with AI Analysis & Automation",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "analyze": "ANALYZE=true next build",
    "deploy:vercel": "vercel --prod",
    "deploy:cloudflare": "wrangler deploy",
    "clean": "rm -rf .next node_modules package-lock.json && npm install",
    "format": "prettier --write .",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@tanstack/react-query": "^5.17.0",
    "@radix-ui/themes": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0",
    "framer-motion": "^10.17.0",
    "recharts": "^2.10.0",
    "lightweight-charts": "^4.1.0",
    "axios": "^1.6.0",
    "ws": "^8.16.0",
    "ccxt": "^4.2.0",
    "socket.io-client": "^4.5.4",
    "zustand": "^4.4.7",
    "next-auth": "^4.24.5",
    "@auth/prisma-adapter": "^1.0.12",
    "prisma": "@prisma/client@^5.7.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "react-hook-form": "^7.48.2",
    "@hookform/resolvers": "^3.3.4",
    "date-fns": "^3.0.6",
    "lucide-react": "^0.303.0",
    "react-hot-toast": "^2.4.1",
    "@vercel/analytics": "^1.1.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.6",
    "@types/react": "^18.2.46",
    "@types/react-dom": "^18.2.18",
    "@types/ws": "^8.5.10",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "typescript": "^5.3.3",
    "eslint": "^8.56.0",
    "eslint-config-next": "14.0.4",
    "prettier": "^3.1.1",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.33",
    "@next/bundle-analyzer": "^14.0.4",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.6",
    "prisma": "^5.7.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

status_message "Package.json created with optimized dependencies"

# Create Next.js config with performance optimizations
info_message "Creating Next.js configuration..."
cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    serverActions: true,
  },
  images: {
    domains: ['cdn.binance.com', 'cdn.bybit.com', 'assets.coingecko.com'],
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/ws/:path*',
        destination: 'https://stream.binance.com:9443/:path*',
      },
    ]
  },
}

module.exports = withBundleAnalyzer(nextConfig)
EOF

status_message "Next.js configuration created"

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/styles/*": ["./src/styles/*"],
      "@/services/*": ["./src/services/*"],
      "@/store/*": ["./src/store/*"],
      "@/config/*": ["./src/config/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF

# Create Tailwind config
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          100: '#1e1e2e',
          200: '#2a2a3e',
          300: '#35354a',
          400: '#404056',
          500: '#4b4b63',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgb(14, 165, 233), 0 0 10px rgb(14, 165, 233)' },
          '100%': { boxShadow: '0 0 20px rgb(14, 165, 233), 0 0 30px rgb(14, 165, 233)' },
        },
      },
    },
  },
  plugins: [],
}
EOF

# Create PostCSS config
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Create environment template
cat > .env.template << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/3omla_trading"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Exchange API Configuration (Users will add their own)
BINANCE_API_KEY=""
BINANCE_SECRET=""
BYBIT_API_KEY=""
BYBIT_SECRET=""
KUCOIN_API_KEY=""
KUCOIN_SECRET=""
KUCOIN_PASSPHRASE=""

# WebSocket Endpoints
WS_BINANCE="wss://stream.binance.com:9443/ws"
WS_BYBIT="wss://stream.bybit.com/v5/public/spot"
WS_KUCOIN="wss://ws-api-spot.kucoin.com"

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=""

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=""
CLOUDFLARE_API_TOKEN=""

# Vercel
VERCEL_TOKEN=""

# Email (for notifications)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
EOF

status_message "Configuration files created"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   PROJECT STRUCTURE CREATED SUCCESSFULLY${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${CYAN}Next steps will:${NC}"
echo "1. Set up the complete UI/UX components"
echo "2. Create authentication system"
echo "3. Implement market data integration"
echo "4. Set up exchange connections"
echo "5. Configure deployment pipelines"
echo ""
echo -e "${YELLOW}Continue with component creation? (y/n)${NC}"
