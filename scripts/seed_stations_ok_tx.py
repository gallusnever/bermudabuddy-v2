#!/usr/bin/env python3
"""
Seed a minimal set of OK Mesonet and TexMesonet stations with soil temp capability.

Usage:
  POSTGRES_URL=postgresql+psycopg://postgres:postgres@localhost:5432/bermuda \
    python scripts/seed_stations_ok_tx.py
"""
import os
from sqlalchemy import text
from apps.api.db import engine


STATIONS = [
    {
        "provider": "OK_MESONET",
        "name": "OKC East",
        "lat": 35.508,
        "lon": -97.427,
        "state": "OK",
        "has_soil_temp": True,
        "depth_in": [2, 4],
        "priority": 10,
        "metadata_json": {"site_id": "okce"},
    },
    {
        "provider": "TEX_MESONET",
        "name": "Dallas Love",
        "lat": 32.847,
        "lon": -96.851,
        "state": "TX",
        "has_soil_temp": True,
        "depth_in": [2, 4],
        "priority": 10,
        "metadata_json": {"site_id": "kdal"},
    },
]


def main():
    url = os.getenv("POSTGRES_URL")
    if not url:
        raise SystemExit("POSTGRES_URL required")

    e = engine()
    with e.begin() as conn:
        for s in STATIONS:
            conn.execute(
                text(
                    """
                    INSERT INTO stations (provider, name, lat, lon, state, has_soil_temp, depth_in, geom, priority, metadata_json)
                    VALUES (:provider, :name, :lat, :lon, :state, :has_soil_temp, :depth_in, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :priority, :metadata_json)
                    ON CONFLICT DO NOTHING
                    """
                ),
                s,
            )
    print(f"Seeded {len(STATIONS)} stations")


if __name__ == "__main__":
    main()

