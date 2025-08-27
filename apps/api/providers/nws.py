import os
import asyncio
from typing import Any, Dict, List, Optional, Callable

import httpx


class MissingNWSUserAgent(Exception):
    pass


class NWSProvider:
    def __init__(
        self,
        client: Optional[httpx.AsyncClient] = None,
        sleeper: Optional[Callable[[float], Any]] = None,
    ) -> None:
        ua = os.getenv("NWS_USER_AGENT")
        if not ua:
            raise MissingNWSUserAgent("NWS_USER_AGENT is required to call NWS APIs")
        self.user_agent = ua
        self.client = client or httpx.AsyncClient(timeout=20, headers={"User-Agent": ua, "Accept": "application/geo+json"})
        self.sleep = sleeper or asyncio.sleep

    async def _get_with_backoff(self, url: str, params: Optional[Dict[str, Any]] = None, max_attempts: int = 3) -> httpx.Response:
        last_exc: Optional[Exception] = None
        for attempt in range(1, max_attempts + 1):
            try:
                resp = await self.client.get(url, params=params)
                # Backoff on 403/429 per requirements
                if resp.status_code in (403, 429):
                    raise httpx.HTTPStatusError("backoff", request=resp.request, response=resp)
                resp.raise_for_status()
                return resp
            except Exception as e:  # noqa: BLE001
                last_exc = e
                if attempt == max_attempts:
                    break
                await self.sleep(min(2 ** attempt, 5))
        assert last_exc is not None
        raise last_exc

    async def get_alerts(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        url = f"https://api.weather.gov/alerts/active"
        resp = await self._get_with_backoff(url, params={"point": f"{lat},{lon}"})
        data = resp.json()
        feats = data.get("features", [])
        results: List[Dict[str, Any]] = []
        for f in feats:
            props = f.get("properties", {})
            results.append({
                "id": f.get("id"),
                "area": props.get("areaDesc"),
                "event": props.get("event"),
                "severity": props.get("severity"),
                "headline": props.get("headline"),
                "effective": props.get("effective"),
                "expires": props.get("expires"),
                "senderName": props.get("senderName"),
            })
        return results

    async def get_forecast_hourly(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        # Discover gridpoint
        pt_url = f"https://api.weather.gov/points/{lat},{lon}"
        pt_resp = await self._get_with_backoff(pt_url)
        pt_data = pt_resp.json()
        hourly_url = pt_data.get("properties", {}).get("forecastHourly")
        if not hourly_url:
            return []
        fc_resp = await self._get_with_backoff(hourly_url)
        fc = fc_resp.json()
        periods = fc.get("properties", {}).get("periods", [])
        rows: List[Dict[str, Any]] = []
        for p in periods:
            rows.append({
                "ts": p.get("startTime"),
                "wind_mph": _parse_wind(p.get("windSpeed")),
                "wind_gust_mph": _parse_wind(p.get("windGust")),
                "precip_prob": (p.get("probabilityOfPrecipitation", {}) or {}).get("value", 0.0) / 100.0 if isinstance((p.get("probabilityOfPrecipitation", {}) or {}).get("value", None), (int, float)) else None,
                "precip_in": None,  # NWS hourly doesn't include qty directly
                "provider": "NWS",
            })
        return rows


def _parse_wind(s: Any) -> Optional[float]:
    if s is None:
        return None
    if isinstance(s, (int, float)):
        return float(s)
    try:
        # e.g., "10 mph" or "5 to 10 mph"
        parts = str(s).split()
        for token in parts:
            try:
                return float(token)
            except Exception:
                continue
    except Exception:
        return None
    return None

