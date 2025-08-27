# Data Sources

- Weather: NWS (alerts/forecast; requires `NWS_USER_AGENT`), Open-Meteo (hourly, ET0, soil temp fallback).
- Stations: OK Mesonet, TexMesonet (Phase 2 seeding), with provider abstraction for others.
- Labels: EPA PPLS (federal PDFs), PICOL (WA/OR supplements), curated rate recipes under `/data/label_recipes`.
- Fertilizers: CA CDFA, WA WSDA registries.

Rate limits & headers
- NWS: identify via `NWS_USER_AGENT` and backoff on 403/429.
- Open-Meteo: public JSON API; cache responses 1–3 hours.
