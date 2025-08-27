#!/usr/bin/env bash
set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
ROOT=$(cd "$HERE/.." && pwd)
cd "$ROOT/infra"

echo "Stopping infra (Postgres, Redis, Qdrant)..."
docker compose -f docker-compose.yml down
echo "Infra stopped."

