#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"

# Load env
if [ -f "$HOME/bermuda-buddy/.env" ]; then
  set -a; . "$HOME/bermuda-buddy/.env"; set +a
fi
if [ -f ./.env ]; then
  set -a; . ./.env; set +a
fi

echo "[1/4] Starting infra (Postgres/Redis/Qdrant)"
bash scripts/infra_up.sh || true

echo "[2/4] Installing deps"
pnpm -w install
python3 -m pip install -r apps/api/requirements.txt

echo "[3/4] Running E2E (production servers)"
pnpm -w e2e:test || { echo "E2E failed"; exit 1; }

echo "[4/4] Screenshots at e2e/screenshots" && ls -la e2e/screenshots

