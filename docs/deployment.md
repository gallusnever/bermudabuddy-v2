# Deployment

This repo ships Dockerfiles for the API and Web app and a production Docker Compose file to run the full stack locally or in a host.

## Prerequisites
- Docker 24+
- Compose v2
- Required env vars set (see `.env.example`)

## Images

- API (`apps/api/Dockerfile`)
  - Exposes `8000`
  - Env:
    - `POSTGRES_URL` (required)
    - `NWS_USER_AGENT` (required for NWS alerts)
    - `APP_VERSION` (optional)
    - `MIGRATE_ON_START=1` to run Alembic migrations on startup

- Web (`apps/web/Dockerfile`)
  - Exposes `3000`
  - Build arg / env:
    - `NEXT_PUBLIC_API_BASE` (required in production) — e.g. `http://api:8000`

## Compose (production)

`infra/docker-compose.prod.yml` defines:
- `postgres` (PostGIS), ports `5432`
- `api` (FastAPI), ports `8000`, depends on postgres
- `web` (Next.js), ports `3000`, depends on api

Run:

```
# from repo root
export NWS_USER_AGENT="BermudaBuddy/1.0 (email@example.com)"
export APP_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo dev)

docker compose -f infra/docker-compose.prod.yml build \
  --build-arg NEXT_PUBLIC_API_BASE=http://localhost:8000

docker compose -f infra/docker-compose.prod.yml up -d
```

Then open http://localhost:3000.

## Notes
- The web app reads `NEXT_PUBLIC_API_BASE` at build time. Always set it when building the image.
- The API enforces `POSTGRES_URL` and does not use fake defaults.
- For migrations outside the container: `cd apps/api && POSTGRES_URL=... alembic upgrade head`.
- For local dev infra only: use `scripts/infra_up.sh` and `scripts/infra_down.sh`.

