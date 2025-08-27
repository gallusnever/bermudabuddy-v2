#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

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

# Ports (override via WEB_PORT, API_PORT)
WEB_PORT=${WEB_PORT:-3000}
API_PORT=${API_PORT:-8000}

# Start API in background
python -m uvicorn apps.api.main:app --port "$API_PORT" &
API_PID=$!

# Start Next dev server (foreground)
NEXT_PUBLIC_API_BASE="http://localhost:${API_PORT}" pnpm -C apps/web dev --port "$WEB_PORT" --hostname 0.0.0.0

kill $API_PID || true
