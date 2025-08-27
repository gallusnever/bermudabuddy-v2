# Architecture

- Monorepo: pnpm workspaces with `apps` (web/api), `packages` (UI), `infra`, `e2e`, `docs`, `scripts`.
- Web: Next.js App Router (TypeScript, Tailwind). Dark-first UI via shared tokens from `@bermuda/ui`.
- API: FastAPI (async-ready) with SQLModel/SQLAlchemy and Postgres/PostGIS (infra provided). Minimal `/healthz` and `/metrics` now.
- Data: Postgres + PostGIS (docker-compose). Redis for jobs. Qdrant for vectors.
- Auth: Supabase (email OTP) – wiring in later phase, gated by env.
- Testing: Playwright E2E (screenshots), unit tests (pytest for API, Vitest for FE utils later).
- CI: GitHub Actions matrix (Node/Python) to lint, typecheck, test, and publish Playwright report (to be added).

Flow overview:
- Frontend calls API routes (`/api/...`) for weather, stations, math, labels. For Phase 1 only static pages are exercised.
- Secrets live in `.env` and are not committed; features gate cleanly if env is absent.
