#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

WEB_PORT=${WEB_PORT:-3000}
API_PORT=${API_PORT:-8000}

# Load env from repo .env or ~/bermuda-buddy/.env
set +u
if [ -f "$HOME/bermuda-buddy/.env" ]; then
  set -a; . "$HOME/bermuda-buddy/.env"; set +a
fi
if [ -f ./.env ]; then
  set -a; . ./.env; set +a
fi
set -u

# Ensure Python venv and deps
if [ ! -d .venv ]; then
  if command -v python3 >/dev/null 2>&1; then PY=python3; else PY=python; fi
  $PY -m venv .venv
  . .venv/bin/activate
  python -m pip install --upgrade pip
  python -m pip install -r apps/api/requirements.txt
else
  . .venv/bin/activate
fi

# Start API in background
# Run DB migrations only for non-sqlite databases
if [ -n "${DATABASE_URL:-}" ]; then
  case "$DATABASE_URL" in
    sqlite:*)
      echo "Skipping alembic migrations for sqlite database ($DATABASE_URL)"
      ;;
    *)
      alembic -c apps/api/alembic.ini upgrade head || true
      ;;
  esac
elif [ -n "${POSTGRES_URL:-}" ]; then
  alembic -c apps/api/alembic.ini upgrade head || true
fi

python -m uvicorn apps.api.main:app --port "$API_PORT" &
API_PID=$!

# Build and start Next in production
PNPM=pnpm
# Map MAPBOX_TOKEN to NEXT_PUBLIC_MAPBOX_TOKEN if not already set
if [ -z "${NEXT_PUBLIC_MAPBOX_TOKEN:-}" ] && [ -n "${MAPBOX_TOKEN:-}" ]; then
  export NEXT_PUBLIC_MAPBOX_TOKEN="$MAPBOX_TOKEN"
fi

# Build and start Next.js with pnpm if available; otherwise fall back to direct node binary
if [ -d apps/web/.next ]; then
  echo "Using existing .next build"
  NEXT_PUBLIC_API_BASE="http://localhost:${API_PORT}" node apps/web/node_modules/next/dist/bin/next start -p "$WEB_PORT" -H 0.0.0.0
else
  if command -v pnpm >/dev/null 2>&1; then
    $PNPM -C apps/web build
    NEXT_PUBLIC_API_BASE="http://localhost:${API_PORT}" $PNPM -C apps/web -- start -p "$WEB_PORT" -H 0.0.0.0
  else
    node apps/web/node_modules/next/dist/bin/next build
    NEXT_PUBLIC_API_BASE="http://localhost:${API_PORT}" node apps/web/node_modules/next/dist/bin/next start -p "$WEB_PORT" -H 0.0.0.0
  fi
fi

kill $API_PID || true
