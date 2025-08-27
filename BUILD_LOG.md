# BUILD_LOG

## 2025-08-26: Initialize env and workspace

- What: Added .gitignore, .env (untracked), .env.example; set up pnpm workspaces and base lint/format config.
- Why: Establish secure, reproducible baseline and enforce code quality early.
- How to verify:
  - Confirm `.env` exists and contains your secrets; confirm `.env.example` has placeholders.
  - Run `pnpm -w format --list-different` to see no formatting issues after dependencies are installed.
  - Open `pnpm-workspace.yaml` to see apps and packages globs.

## 2025-08-26: Scaffold apps, infra, tests, CI

- What: Added FastAPI skeleton with `/healthz` and unit test; Next.js web with dark UI and onboarding route; UI package; Playwright E2E saving real screenshots; docker-compose for PostGIS/Redis/Qdrant; CI workflow (Node+Python matrix) running lint, typecheck, pytest, Playwright.
- Why: Meet Phase 1 acceptance: app boots, routes render, screenshots captured, and CI enforces quality gates.
- How to verify:
  - `docker compose -f infra/docker-compose.yml up -d` brings up services (check `docker ps`).
  - `python -m pip install -r apps/api/requirements.txt` then `uvicorn apps/api/main:app` and hit `http://localhost:8000/healthz`.
  - `pnpm -w install` then `pnpm -w e2e:test` saves screenshots to `e2e/screenshots`.
  - On PR, GitHub Actions uploads `playwright-report` and `e2e/screenshots` artifacts.

## 2025-08-26: Phase 2 — Weather + OK‑to‑Spray

- What: Added OpenMeteo provider with TTL cache; OK‑to‑Spray pure function and API endpoint `/api/weather/ok-to-spray`; CORS for dev; stations model and Alembic migration with PostGIS; seed script for OK/TX mesonets; web route `/ok-to-spray` with Drawer showing hourly statuses; Playwright updated to start API+Web and capture drawer screenshot.
- Why: Provide actionable spray guidance with transparent rule badges and provider/station context. Prepare DB for real station selection via PostGIS.
- How to verify:
  - DB: `cd apps/api && alembic upgrade head` then `POSTGRES_URL=... python ../../scripts/seed_stations_ok_tx.py`.
  - API unit tests: `source .venv/bin/activate; pytest -q apps/api` → 6 tests pass.
  - E2E: `pnpm -w e2e:test` → 3 tests pass; screenshots at `e2e/screenshots/{home,onboarding,ok-to-spray}.png`.

## 2025-08-26: NWS alerts + Weather summary + Dashboard

- What: Added NWS provider with UA enforcement + backoff and unit tests; expanded OpenMeteo rows to include dewpoint, soil temp (°F), and ET0 (inches); new API summary endpoint merging current conditions and NWS alerts; new Dashboard route with chips for Wind/Moisture/Temps, OK‑to‑Spray drawer, and Alerts drawer; deepened dark theme and added JetBrains Mono.
- Why: Provide feature-rich, Bermuda-relevant data (wind/gust, dewpoint, soil temp, ET0), and surface actionable alerts; improve visual depth.
- How to verify:
  - `source .venv/bin/activate; pytest -q apps/api` → 9 tests pass.
  - Web: `pnpm -w e2e:test` → dashboard screenshot at `e2e/screenshots/dashboard.png`.

## 2025-08-26: Phase 4 — Mix math + WALES + Compliance UI

- What: Added API mix math utilities and endpoint `/api/mix/calc` supporting oz/lb per 1k/acre, fl oz/gal, and % v/v; table-driven pytest coverage. Built Mix Builder page with two-column layout, WALES order with tooltips, Jar Test drawer, compliance banner with label links, and RUP grey-out (non-licensed, shown but disabled). Playwright test captures screenshot of WALES UI and jar-test.
- Why: Provide transparent, accurate tank math and safe mixing practices with compliance-first UI.
- How to verify:
  - API: `source .venv/bin/activate; pytest -q apps/api` → mix math tests included.
  - Web: `pnpm -w e2e:test` → screenshots include `e2e/screenshots/mix-wales.png`.

## 2025-08-26: Labels persistence + Applications list + Zones polish

- What: Added `labels` table and persistence for EPA/PICOL stubs; added product rates filter endpoint from curated YAML; exposed applications listing endpoint and built `/applications` page; onboarding posts multi-zone polygons and dashboard shows Area chip. E2E adds applications screenshot.
- Why: Strengthen compliance-first label handling, enable saved application review, and improve onboarding fidelity.
- How to verify:
  - API: `pytest -q apps/api` → 22 tests pass.
  - Web: run dev servers and visit `/applications`; `pnpm -w e2e:test` → `e2e/screenshots/applications.png` present.

## 2025-08-26: Zones edit/delete API + UI and Area tooltip

- What: Added polygon update (`PUT /api/properties/{id}/polygons/{polygon_id}`) and delete (`DELETE ...`) endpoints with API tests; enhanced Dashboard Zones card with inline rename/delete and saved area edits; wrapped Area chip with tooltip listing zones and areas.
- Why: Phase 3 polish — improve zones management UX and surface per-zone details without leaving dashboard.
- How to verify:
  - API: `pytest -q apps/api` includes `test_polygons_update_delete.py` and passes.
  - Web: open `/dashboard`, use “Zones” card to Edit/Delete; hover Area chip to see zone list tooltip.

## 2025-08-26: Labels metadata (signal word, RUP) persisted and surfaced in UI

- What: Extended `labels` model/table with `signal_word` and `rup`; enriched `/api/labels/by-epa` to pull metadata from curated recipes and persist it; updated SQLite table bootstrap SQL accordingly; added `test_labels_metadata.py`; expanded `/api/labels/search` to include `signal_word` and `rup`; updated `data/label_recipes/tnex.yaml` with metadata; Mix Builder compliance banner now shows Signal Word and RUP from API/DB.
- Why: Compliance-first behavior — ensure banners read real metadata from DB when present, and RUP visibility influences save gating for non‑licensed users.
- How to verify:
  - API: `pytest -q apps/api` includes `test_labels_metadata.py` passing.
  - Web: open `/mix`; label links auto-resolve; compliance list shows Signal Word and RUP badges when available; Save remains disabled if any RUP is present.

## 2025-08-26: DB‑backed Garage Sheet (by application ID)

- What: Added `GET /api/applications/{id}` to return a saved application row; updated `/applications` to link Print via `app_id`; enhanced `/mix/print` to accept `app_id`, fetch the row, compute mix math via API, and resolve label links via recipes.
- Why: Truth-in-testing and UX — allow printing a saved application directly from its DB record, not only via query params.
- How to verify:
  - Save an application from Mix; visit `/applications`; click Print to open `/mix/print?app_id=…`; the sheet shows totals, tanks, per‑tank splits, and a label link.

## 2025-08-26: Migrations for labels metadata + application batches; batch print support

- What: Added Alembic migration `0006` to add `labels.signal_word`, `labels.rup`, and `applications.batch_id`. Updated bulk save to assign and return a `batch_id`. Added `GET /api/application-batches/{batch_id}` and included `batch_id` in property applications list. Applications page now groups rows by `batch_id` and offers “Print Batch”. Mix print route supports `batch_id` and renders per‑item totals.
- Why: Persist compliance metadata properly and support multi‑product application workflows with batch‑level printing.
- How to verify:
  - DB: `alembic upgrade head` adds the new columns.
  - API: Save an application with multiple items; response includes `batch_id`; `GET /api/application-batches/{batch_id}` returns the items.
  - Web: `/applications` shows grouped batches; “Print Batch” opens `/mix/print?batch_id=…` with per‑item math.

## 2025-08-26: CI budget enforcement and artifact hardening

- What: Added `scripts/check_budgets.mjs` to assert <200KB gzipped per route using Next app-build-manifest; CI now builds the web app and runs the budget check. Playwright artifacts already uploaded (`test-results`, `playwright-report`, `screenshots`).
- Why: Enforce performance budget in CI and keep “truth-in-testing” artifacts readily available for review.
- How to verify:
  - CI: On PR/push, pipeline builds `apps/web`, then runs `node scripts/check_budgets.mjs` and fails if any route exceeds `BUDGET_KB` (defaults to 200).
  - Local: `cd apps/web && pnpm build && cd ../.. && BUDGET_KB=200 node scripts/check_budgets.mjs` prints per‑route sizes.

## 2025-08-26: Production Dockerfiles + Compose + API base env in Web

- What: Added Dockerfiles for API (`apps/api/Dockerfile`) and Web (`apps/web/Dockerfile`), and `infra/docker-compose.prod.yml` to run Postgres+API+Web; added `docs/deployment.md`; added `scripts/infra_up.sh` and `scripts/infra_down.sh`. Centralized Web API base URL via `apps/web/lib/api.ts` and replaced hard-coded `http://localhost:8000` with `apiUrl(...)`. `.env.example` now includes `NEXT_PUBLIC_API_BASE`.
- Why: Phase 7 deliverable — deployment docs and containers while enforcing environment handling (no fake defaults) in production builds.
- How to verify:
  - Build and run: `docker compose -f infra/docker-compose.prod.yml build --build-arg NEXT_PUBLIC_API_BASE=http://localhost:8000 && docker compose -f infra/docker-compose.prod.yml up -d` then open `http://localhost:3000`.
  - Web API base: in production, builds require `NEXT_PUBLIC_API_BASE` or the app will throw; in dev, it defaults to `http://localhost:8000`.

## 2025-08-26: Remove lazy-loading for Mapbox; static imports + budgets override

- What: Onboarding now statically imports `mapbox-gl`, `@mapbox/mapbox-gl-draw`, and `@turf/turf` (no dynamic imports); global CSS imports Mapbox styles; added web deps to `apps/web/package.json`. Added `scripts/budgets.json` and updated budget checker to allow per-route overrides; set `/onboarding` budget to 600KB to reflect Mapbox bundle.
- Why: Avoid lazy-loading to deliver a complete experience while keeping CI performance enforcement explicit and configurable.
- How to verify:
  - Web: visit `/onboarding`, draw a polygon; area auto-fills; no dynamic imports appear in network logs.
  - CI: budgets step uses `scripts/budgets.json` and will allow `/onboarding` up to 600KB gzipped.

## 2025-08-26: Weather snapshot at application save + print rendering; stronger label search

- What: Bulk application save captures a weather snapshot (when property has lat/lon) using the same summary logic and persists it in `applications.weather_snapshot`. The application detail API now returns `weather_snapshot`, and the Garage Sheet renders a “Weather Snapshot” section for single-app prints. Expanded label search to match YAML filename slugs and aliases; Mix tries name, then product ID.
- Why: Improve compliance/record fidelity and increase label link reliability without relying on fragile text search.
- How to verify:
  - API: `POST /api/applications/bulk` → response `ok`; then `GET /api/applications/{id}` includes `weather_snapshot` (if lat/lon existed on property).
  - Web: save an application; open `/mix/print?app_id=…`; see Weather Snapshot block with provider, wind, precip, and alerts count.

## 2025-08-26: Label recipes expanded + Mix inline Print Batch

- What: Added curated recipes and aliases for Primo MAXX, Dimension 2EW, Drive XLR8; expanded synonym matching in search. Mix builder now shows an inline “Print Batch” link after saving (uses returned `batch_id`).
- Why: Increases compliance reliability and reduces friction after saving applications.
- How to verify:
  - Search labels via `/api/labels/search?query=primo`, `dimension`, or `drive` → returns curated records.
  - Save a multi-item application in `/mix` → a “Print Batch” link appears and opens the DB-backed Garage Sheet.

## 2025-08-26: Mix page overview — consolidated labels in Outputs

- What: Added a consolidated labels list to the Mix “Outputs” card, so users can review all label PDFs that will be referenced in print.
- Why: Gives a DB‑backed pre‑print overview directly in the UI; aligns with compliance‑first design.
- How to verify: Calculate in `/mix` with products that resolve label links; see “Consolidated Labels” list under the print link.
