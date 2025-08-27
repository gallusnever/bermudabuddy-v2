# Bermuda Buddy

Production-grade PWA for serious DIY Bermuda lawn care.

Monorepo layout
- `apps/web`: Next.js App Router (TS, Tailwind, dark premium UI)
- `apps/api`: FastAPI + SQLModel/SQLAlchemy
- `packages/ui`: shared design tokens + components
- `infra`: docker-compose for PostGIS, Redis, Qdrant
- `e2e`: Playwright tests (screenshots)
- `docs`: architecture, design, data sources, tests
- `scripts`: infra helpers

Quickstart (macOS)
1) Prereqs: Node 20+, Python 3.11+, Docker Desktop, pnpm (`corepack enable`).
2) Env: copy `.env.example` → `.env` and fill required values.
3) Infra: `docker compose -f infra/docker-compose.yml up -d`.
4) DB migrate: `cd apps/api && alembic upgrade head`.
5) Seed stations: `POSTGRES_URL=... python ../../scripts/seed_stations_ok_tx.py`.
6) API: `uvicorn apps.api.main:app --reload --port 8000`.
7) Web: `cd apps/web && pnpm dev --port 3000 --host`.
8) E2E: `pnpm -w install && pnpm -C e2e exec playwright install && pnpm -w e2e:test`.

Nickname API
- Backend exposes `POST /api/nickname` (uses `OPENROUTER_API_KEY`).
- Frontend calls it via `NEXT_PUBLIC_API_BASE` (default `http://localhost:8000`).
- If `OPENROUTER_API_KEY` is missing or network fails, backend returns a deterministic fallback nickname.

CI
- GitHub Actions runs lint, typecheck, API unit tests, and Playwright E2E (saves artifacts).

Security
- Never commit secrets; `.env` is ignored. Rotate leaked keys and document in `BUILD_LOG.md`.
 - OpenRouter key moved server-side for nickname generation; remove any remaining hardcoded keys in other AI helpers before enabling them.
