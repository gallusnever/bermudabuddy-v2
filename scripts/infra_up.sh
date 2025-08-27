#!/usr/bin/env bash
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/.." && pwd)
cd "$ROOT/infra"

echo "Starting infra (Postgres, Redis, Qdrant)..."
docker compose -f docker-compose.yml up -d
echo "Infra started."

