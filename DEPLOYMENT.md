# 3OMLA Platform Deployment Guide

This guide covers deploying the 3OMLA trading intelligence platform to production using modern cloud infrastructure.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Data Layer    │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│   (Railway)     │
│   Next.js 14    │    │   FastAPI       │    │   PostgreSQL    │
│   React 18      │    │   Python 3.11   │    │   Redis         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Monitoring    │    │   Data Sources  │
│   (Cloudflare)  │    │   (Grafana)     │    │   (WebSockets)  │
│   Workers       │    │   (Prometheus)  │    │   (Exchanges)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Tools
- Docker & Docker Compose
- Git
- Node.js 18+
- Python 3.11+
- Railway CLI
- Vercel CLI
- Cloudflare Wrangler CLI

### Required Accounts
- [Railway](https://railway.app) - Backend hosting
- [Vercel](https://vercel.com) - Frontend hosting
- [Cloudflare](https://cloudflare.com) - CDN & Workers
- [GitHub](https://github.com) - Source control & CI/CD

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/your-org/3omla-cloud.git
cd 3omla-cloud
cp env.production.example .env
# Edit .env with your actual values
```

### 2. Deploy Backend to Railway
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# Login to Railway
railway login

# Deploy backend
cd backend
railway up --detach
cd ..
```

### 3. Deploy Frontend to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel --prod
cd ..
```

### 4. Deploy to Cloudflare Workers (Optional)
```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy workers
wrangler deploy
```

## Detailed Deployment

### Backend Deployment (Railway)

1. **Create Railway Project**
   ```bash
   railway login
   railway new 3omla-backend
   ```

2. **Configure Environment Variables**
   ```bash
   railway variables set DATABASE_URL=postgresql://...
   railway variables set REDIS_URL=redis://...
   railway variables set SECRET_KEY=your-secret-key
   ```

3. **Deploy**
   ```bash
   railway up --detach
   ```

### Frontend Deployment (Vercel)

1. **Create Vercel Project**
   ```bash
   vercel login
   vercel --prod
   ```

2. **Configure Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_API_URL
   vercel env add NEXT_PUBLIC_WS_URL
   ```

### Database Setup (Railway)

1. **Add PostgreSQL Service**
   ```bash
   railway add postgresql
   ```

2. **Add Redis Service**
   ```bash
   railway add redis
   ```

3. **Run Migrations**
   ```bash
   railway run alembic upgrade head
   ```

## Environment Configuration

### Required Environment Variables

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port

# Security
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
ENCRYPTION_KEY=your-32-char-key

# API
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=false

# CORS
ALLOWED_ORIGINS=https://your-domain.com
ALLOWED_HOSTS=your-domain.com
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
```

## CI/CD Pipeline

The GitHub Actions workflow automatically:
- Runs tests on pull requests
- Builds and deploys on main branch
- Performs security scans
- Sends deployment notifications

### Workflow Triggers
- **Pull Request**: Runs tests and linting
- **Push to main**: Deploys to production
- **Manual**: Can be triggered manually

## Monitoring & Observability

### Grafana Dashboard
- URL: `http://your-domain:3001`
- Default credentials: `admin/admin`
- Metrics: API performance, database stats, Redis usage

### Prometheus Metrics
- URL: `http://your-domain:9090`
- Endpoints: `/metrics` on all services
- Alerts: Configured for error rates and response times

### Logging
- Structured JSON logs
- Centralized logging with Railway
- Error tracking and alerting

## Security

### SSL/TLS
- Automatic SSL certificates via Vercel
- HSTS headers enabled
- Secure cookie settings

### Rate Limiting
- API rate limiting: 10 req/s per IP
- Login rate limiting: 1 req/s per IP
- Burst handling for legitimate traffic

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content Security Policy

## Performance Optimization

### Frontend
- Next.js 14 with App Router
- Static generation where possible
- Image optimization
- Code splitting
- CDN caching

### Backend
- FastAPI with async/await
- Connection pooling
- Redis caching
- Database indexing
- Gzip compression

### Database
- Read replicas for analytics
- Connection pooling
- Query optimization
- Indexing strategy

## Backup & Recovery

### Database Backups
- Automated daily backups
- 30-day retention policy
- Point-in-time recovery

### Configuration Backups
- Environment variables in version control
- Infrastructure as code
- Disaster recovery procedures

## Troubleshooting

### Common Issues

#### Backend Won't Start
```bash
# Check logs
railway logs

# Check environment variables
railway variables

# Restart service
railway restart
```

#### Frontend Build Fails
```bash
# Check build logs
vercel logs

# Test locally
npm run build

# Check environment variables
vercel env ls
```

#### Database Connection Issues
```bash
# Check database status
railway status

# Test connection
railway run python -c "import psycopg2; print('Connected')"
```

### Health Checks

#### Backend Health
```bash
curl https://your-backend.railway.app/health
```

#### Frontend Health
```bash
curl https://your-frontend.vercel.app
```

#### Database Health
```bash
railway run psql -c "SELECT 1"
```

## Scaling

### Horizontal Scaling
- Multiple backend instances
- Load balancing
- Database read replicas
- Redis clustering

### Vertical Scaling
- Increase Railway plan
- Optimize database queries
- Add more Redis memory
- Upgrade Vercel plan

## Cost Optimization

### Railway
- Use development plan for testing
- Monitor resource usage
- Optimize database queries
- Use Redis for caching

### Vercel
- Use free tier for development
- Optimize bundle size
- Use edge functions
- Monitor bandwidth usage

### Cloudflare
- Use free tier for basic features
- Optimize worker scripts
- Use caching effectively

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Monitor security advisories
- Review and rotate secrets
- Clean up old logs

### Monitoring
- Set up alerts for critical metrics
- Monitor error rates
- Track performance metrics
- Review security logs

## Support

### Documentation
- API documentation: `/docs`
- OpenAPI spec: `/openapi.json`
- Health check: `/health`

### Contact
- GitHub Issues: For bug reports
- Email: support@3omla.com
- Discord: Community support

## License

This project is licensed under the MIT License - see the LICENSE file for details.

