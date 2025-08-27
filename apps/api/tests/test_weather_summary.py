import os
import pytest
from fastapi.testclient import TestClient
from apps.api.main import app


client = TestClient(app)


def test_summary_merges_provider_and_alerts(monkeypatch):
    async def fake_get_hourly(self, lat, lon, start, end):
        return [{
            "ts": "2024-01-01T00:00:00Z",
            "t_air_f": 70.0,
            "wind_mph": 5.0,
            "wind_gust_mph": 10.0,
            "precip_prob": 0.1,
            "precip_in": 0.0,
            "dewpoint_f": 52.0,
            "soil_temp_f": 60.0,
            "et0_in": 0.05,
            "provider": "OpenMeteo",
        }]

    async def fake_alerts(self, lat, lon):
        return [{"event": "Wind Advisory", "severity": "Moderate", "headline": "Gusty winds"}]

    from apps.api.providers import openmeteo
    from apps.api.providers import nws

    monkeypatch.setattr(openmeteo.OpenMeteoProvider, 'get_hourly', fake_get_hourly)
    monkeypatch.setenv('NWS_USER_AGENT', 'BermudaBuddy/1.0 (test@example.com)')
    monkeypatch.setattr(nws.NWSProvider, 'get_alerts', fake_alerts)

    r = client.get("/api/weather/summary?lat=32.8&lon=-96.8")
    assert r.status_code == 200
    data = r.json()
    assert data['current']['wind_mph'] == 5.0
    assert data['alerts']['status'] in ('ok','error')
    assert data['alerts']['provider'] == 'NWS'
    assert isinstance(data['hourlies'], list)
    assert 't_air_f' in data['hourlies'][0]
