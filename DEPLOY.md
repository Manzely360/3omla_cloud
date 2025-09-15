Coin Matcher v2 — Deployment Guide

Overview
- This project ships with Docker Compose for a complete stack: Postgres, Redis, Backend (FastAPI), Frontend (Next.js), data ingestion workers, Prometheus, and Grafana.
- Use `docker-compose.yml` for local/dev and `docker-compose.prod.yml` for production (no bind mounts, restart policies, prod commands).

Prerequisites
- Docker 24+ and Docker Compose v2 (`docker compose` CLI).
- A machine with at least 2 CPU, 4 GB RAM recommended.
- Optional: a domain and DNS pointing to your server if you want HTTPS.

Quick Start (Local)
1) Configure env: copy `env.example` to `.env` and adjust values (at least API keys if ingesting live data).
2) Build and start stack:
   docker compose -f docker-compose.yml up -d --build
3) Access services:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000 (docs at /docs)
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090
4) Logs and management:
   - Tail logs: docker compose logs -f backend
   - Stop stack: docker compose down

Production Deploy
1) Prepare env:
   - Copy `.env` and set `DEBUG=false`, `ENVIRONMENT=production`.
   - For production networking, the compose files already set `DATABASE_URL` and `REDIS_URL` to use service names.
   - Frontend → Backend URL:
     - In Docker Compose, the default works out‑of‑the‑box now: `NEXT_PUBLIC_API_URL` defaults to `http://backend:8000` (service name).
     - If you are routing via domains, set at runtime:
       - `PUBLIC_API_URL` (e.g. https://api.example.com)
       - `PUBLIC_FRONTEND_URL` (e.g. https://app.example.com)
   - Backend allowed hosts:
     - `ALLOWED_HOSTS` (comma-separated). Defaults to `*` for compose/local. Set to your domains in production if desired.

2) Build and run with production overrides:
   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

3) Optional: Reverse proxy + TLS
   - Use your preferred reverse proxy (Caddy, Traefik, Nginx) to terminate TLS and route:
     - app.example.com -> frontend:3000
     - api.example.com -> backend:8000
   - Ensure the proxy forwards websockets and sets appropriate timeouts.

4) Health checks and verification
   - Backend health: curl http://your-host:8000/health
   - Frontend root: curl http://your-host:3000
   - Data ingestion logs: docker compose logs -f data-ingestion

5) Operations
   - Restart a service: docker compose restart backend
   - Update images after code changes: docker compose build backend frontend && docker compose up -d
   - Persisted data lives in named volumes: `postgres_data`, `redis_data`, `prometheus_data`, `grafana_data`.

Notes
- The production override removes bind mounts and dev commands (e.g., Uvicorn `--reload`, Next.js `dev`).
- Secrets: keep API keys in `.env` (do not commit). For cloud secrets, prefer environment injection via your orchestrator.
- Scaling: you can increase replicas for stateless services (frontend, backend, ingestion) with Compose’s `deploy.replicas` when using a Swarm or migrate to Kubernetes for HPA and advanced scheduling.
