from typing import Any, Dict, Optional
from sqlalchemy import text
from ..db import engine


async def select_nearest_station_safe(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    try:
        with engine().connect() as conn:
            row = conn.execute(
                text(
                    """
                    SELECT id, provider, name, lat, lon, state, has_soil_temp
                    FROM stations
                    WHERE has_soil_temp = true
                    ORDER BY ST_DistanceSphere(geom::geometry, ST_SetSRID(ST_MakePoint(:lon,:lat),4326)) ASC
                    LIMIT 1
                    """
                ),
                {"lat": lat, "lon": lon},
            ).mappings().first()
            if row:
                return dict(row)
            return None
    except Exception:
        return None
