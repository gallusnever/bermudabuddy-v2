# Test Plan (Phase 1)

Goals
- Ensure core pages render (/, /onboarding) and capture Playwright screenshots.
- Add OK‑to‑Spray drawer screenshot driven by live API.
- Verify API `/healthz` responds with status `ok`.

Unit
- API: `pytest` runs `apps/api/tests/test_healthz.py` using FastAPI TestClient.

E2E
- Playwright: smoke spec navigates to `/`, `/onboarding`, `/ok-to-spray`; opens Drawer and saves screenshots to `e2e/screenshots`.
 - Dashboard: navigate to `/dashboard` and save screenshot, showing chips and (if available) alerts.

CI (to be added)
- Node+Python matrix: install deps, lint, typecheck, run unit and e2e, upload Playwright report.
