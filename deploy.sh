#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./deploy.sh [--api https://api.example.com] [--app https://app.example.com] [--hosts api.example.com,app.example.com]

API_URL="${PUBLIC_API_URL:-}"
APP_URL="${PUBLIC_FRONTEND_URL:-}"
HOSTS="${ALLOWED_HOSTS:-*}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --api)
      API_URL="$2"; shift 2 ;;
    --app)
      APP_URL="$2"; shift 2 ;;
    --hosts)
      HOSTS="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

export DEBUG=false
export ENVIRONMENT=production
export PUBLIC_API_URL="${API_URL:-http://backend:8000}"
export PUBLIC_FRONTEND_URL="${APP_URL:-http://localhost:3000}"
export ALLOWED_HOSTS="${HOSTS:-*}"

echo "Deploying with:" 
echo "  PUBLIC_API_URL=$PUBLIC_API_URL"
echo "  PUBLIC_FRONTEND_URL=$PUBLIC_FRONTEND_URL"
echo "  ALLOWED_HOSTS=$ALLOWED_HOSTS"

docker compose -f docker-compose.prod.yml up -d --build

echo "Waiting for backend health..."
for i in {1..30}; do
  if curl -fsS "${PUBLIC_API_URL/http:\/\/backend:8000/http:\/\/localhost:8000}/health" >/dev/null 2>&1; then
    echo "Backend healthy."; break
  fi
  sleep 1
done

echo "Services running. Frontend: ${PUBLIC_FRONTEND_URL:-http://localhost:3000}  Backend: ${PUBLIC_API_URL:-http://localhost:8000}"

