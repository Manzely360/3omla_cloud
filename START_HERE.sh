#!/bin/bash

# ============================================================================
# 3OMLA TRADING PLATFORM - QUICK START
# ============================================================================
# One command to rule them all! This script:
# ✅ Automatically rebuilds your entire platform
# ✅ Sets up modern UI/UX with dark/light mode
# ✅ Configures all exchange integrations
# ✅ Prepares for Cloudflare + Vercel deployment
# ✅ Creates a production-ready trading platform
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear

# Awesome ASCII Banner
cat << "EOF"

     ██████╗  ██████╗ ███╗   ███╗██╗      █████╗ 
     ╚════██╗██╔═══██╗████╗ ████║██║     ██╔══██╗
      █████╔╝██║   ██║██╔████╔██║██║     ███████║
      ╚═══██╗██║   ██║██║╚██╔╝██║██║     ██╔══██║
     ██████╔╝╚██████╔╝██║ ╚═╝ ██║███████╗██║  ██║
     ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚══════╝╚═╝  ╚═╝
                                                   
    ████████╗██████╗  █████╗ ██████╗ ██╗███╗   ██╗ ██████╗ 
    ╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██║████╗  ██║██╔════╝ 
       ██║   ██████╔╝███████║██║  ██║██║██╔██╗ ██║██║  ███╗
       ██║   ██╔══██╗██╔══██║██║  ██║██║██║╚██╗██║██║   ██║
       ██║   ██║  ██║██║  ██║██████╔╝██║██║ ╚████║╚██████╔╝
       ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ 
                                                              
              🚀 QUICK START - AUTOMATED DEPLOYMENT 🚀

EOF

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Welcome to the 3OMLA Trading Platform Quick Start!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}This automated system will:${NC}"
echo "  📦 Clean and rebuild your entire codebase"
echo "  🎨 Create a stunning UI with dark/light mode"
echo "  🔐 Set up secure authentication & onboarding"
echo "  📈 Integrate live market data feeds"
echo "  🔗 Connect Binance, Bybit, and KuCoin APIs"
echo "  ☁️  Configure Cloudflare + Vercel deployment"
echo "  🚀 Create production-ready trading platform"
echo ""

# Quick options menu
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}SELECT YOUR SETUP MODE:${NC}"
echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  [1] 🚀 FULL AUTOMATED SETUP (Recommended)"
echo "      Complete rebuild with all features"
echo ""
echo "  [2] ⚡ QUICK SETUP"
echo "      Basic setup without configuration prompts"
echo ""
echo "  [3] 🛠  CUSTOM SETUP"
echo "      Step-by-step with manual configuration"
echo ""
echo "  [4] 🔧 REPAIR EXISTING PROJECT"
echo "      Fix and update existing installation"
echo ""
echo "  [5] 📖 VIEW DOCUMENTATION"
echo "      Show detailed setup instructions"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "$(echo -e ${YELLOW}Enter your choice [1-5]: ${NC})" choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}Starting FULL AUTOMATED SETUP...${NC}"
        echo -e "${CYAN}This will take approximately 2-3 minutes${NC}"
        echo ""
        
        # Run master automation script
        bash /home/claude/3omla-master.sh
        ;;
        
    2)
        echo ""
        echo -e "${GREEN}Starting QUICK SETUP...${NC}"
        echo ""
        
        # Quick setup with defaults
        PROJECT_NAME="3omla-trading-platform"
        
        # Create project quickly
        bash /home/claude/3omla-rebuild.sh <<< "y"
        bash /home/claude/3omla-ui-builder.sh
        bash /home/claude/3omla-deploy.sh
        
        cd "$PROJECT_NAME"
        npm install --silent
        
        echo ""
        echo -e "${GREEN}✅ Quick setup complete!${NC}"
        echo "Run: cd $PROJECT_NAME && npm run dev"
        ;;
        
    3)
        echo ""
        echo -e "${GREEN}Starting CUSTOM SETUP...${NC}"
        echo ""
        
        # Interactive custom setup
        echo "Step 1: Project Setup"
        bash /home/claude/3omla-rebuild.sh
        
        echo ""
        echo "Step 2: UI Components"
        read -p "Build UI components? (y/n): " build_ui
        if [[ $build_ui == "y" ]]; then
            bash /home/claude/3omla-ui-builder.sh
        fi
        
        echo ""
        echo "Step 3: Deployment Configuration"
        read -p "Configure deployment? (y/n): " config_deploy
        if [[ $config_deploy == "y" ]]; then
            bash /home/claude/3omla-deploy.sh
        fi
        
        echo ""
        echo -e "${GREEN}✅ Custom setup complete!${NC}"
        ;;
        
    4)
        echo ""
        echo -e "${YELLOW}Starting PROJECT REPAIR...${NC}"
        echo ""
        
        # Check for existing project
        if [ -d "3omla-trading-platform" ]; then
            cd 3omla-trading-platform
            
            echo "🔧 Cleaning project..."
            rm -rf node_modules .next
            
            echo "📦 Reinstalling dependencies..."
            npm install
            
            echo "🔨 Rebuilding project..."
            npm run build
            
            echo ""
            echo -e "${GREEN}✅ Project repaired successfully!${NC}"
        else
            echo -e "${RED}No existing project found. Run option 1 for full setup.${NC}"
        fi
        ;;
        
    5)
        echo ""
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BOLD}3OMLA TRADING PLATFORM - DOCUMENTATION${NC}"
        echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${YELLOW}📁 PROJECT STRUCTURE:${NC}"
        echo "   3omla-trading-platform/"
        echo "   ├── src/               # Source code"
        echo "   │   ├── app/          # Next.js app directory"
        echo "   │   ├── components/   # React components"
        echo "   │   ├── services/    # API services"
        echo "   │   ├── hooks/       # Custom hooks"
        echo "   │   └── styles/      # CSS files"
        echo "   ├── public/           # Static assets"
        echo "   ├── prisma/           # Database schema"
        echo "   ├── .github/          # CI/CD workflows"
        echo "   └── docker-compose.yml # Docker setup"
        echo ""
        echo -e "${YELLOW}🔧 CONFIGURATION FILES:${NC}"
        echo "   • .env              - Environment variables"
        echo "   • vercel.json       - Vercel deployment config"
        echo "   • wrangler.toml     - Cloudflare Workers config"
        echo "   • next.config.js    - Next.js configuration"
        echo ""
        echo -e "${YELLOW}🚀 DEPLOYMENT:${NC}"
        echo "   1. Set up environment variables in .env"
        echo "   2. Configure Vercel: vercel login"
        echo "   3. Configure Cloudflare: wrangler login"
        echo "   4. Deploy: ./deploy.sh"
        echo ""
        echo -e "${YELLOW}📊 FEATURES:${NC}"
        echo "   • Real-time WebSocket market data"
        echo "   • Multi-exchange support (Binance, Bybit, KuCoin)"
        echo "   • Automated trading strategies"
        echo "   • Advanced charting with indicators"
        echo "   • Secure authentication with JWT"
        echo "   • Dark/Light mode UI"
        echo "   • Mobile responsive design"
        echo ""
        echo -e "${YELLOW}💡 TIPS:${NC}"
        echo "   • Always test on testnet first"
        echo "   • Keep API keys secure and never commit them"
        echo "   • Use environment variables for all secrets"
        echo "   • Monitor rate limits on exchanges"
        echo "   • Implement proper error handling"
        echo ""
        echo -e "${CYAN}Press Enter to return to menu...${NC}"
        read
        bash $0  # Restart script
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Exiting...${NC}"
        exit 1
        ;;
esac

# Success footer
if [[ $choice != "5" ]]; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}                         🎉 SUCCESS! 🎉${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}Your trading platform is ready!${NC}"
    echo ""
    echo -e "${YELLOW}📱 Access Points:${NC}"
    echo "   Local:      http://localhost:3000"
    echo "   Production: https://3omla.vercel.app"
    echo "   API:        https://api.3omla.com"
    echo ""
    echo -e "${MAGENTA}🔑 Remember to:${NC}"
    echo "   1. Add your exchange API keys to .env"
    echo "   2. Configure your database connection"
    echo "   3. Set up payment processing (Stripe/Crypto)"
    echo "   4. Enable 2FA for production"
    echo ""
    echo -e "${BOLD}${CYAN}Happy Trading! 📈💰${NC}"
    echo ""
fi
