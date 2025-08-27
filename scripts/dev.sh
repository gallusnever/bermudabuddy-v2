#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

# Ports
WEB_PORT=${WEB_PORT:-3001}
API_PORT=${API_PORT:-8000}

# Load env from ~/.env override and repo .env if present
set +u
if [ -f "$HOME/bermuda-buddy/.env" ]; then
  set -a; . "$HOME/bermuda-buddy/.env"; set +a
fi
if [ -f ./.env ]; then
  set -a; . ./.env; set +a
fi
set -u

# Prefer local SQLite for quick dev unless DATABASE_URL is already set
export DATABASE_URL=${DATABASE_URL:-sqlite:///dev.db}
export NEXT_PUBLIC_API_BASE="http://localhost:${API_PORT}"

# Ensure venv and install deps once
if [ ! -d .venv ]; then
  PY=$(command -v python3 || command -v python)
  "$PY" -m venv .venv
  . .venv/bin/activate
  python -m pip install --upgrade pip
  python -m pip install -r apps/api/requirements.txt
else
  . .venv/bin/activate
fi

# Start API with autoreload
echo "Starting API on :$API_PORT (DATABASE_URL=$DATABASE_URL)"
python -m uvicorn apps.api.main:app --port "$API_PORT" --reload &
API_PID=$!

cleanup() {
  echo "Stopping API ($API_PID)"; kill $API_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start Next dev server with HMR
echo "Starting Web on :$WEB_PORT (NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE)"
pnpm -C apps/web dev --port "$WEB_PORT" --hostname 0.0.0.0

