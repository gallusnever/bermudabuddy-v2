import os
from fastapi.testclient import TestClient
from apps.api.main import app


client = TestClient(app)


def test_ok_to_spray_with_nws_wind(monkeypatch):
    # OpenMeteo precip rows
    async def fake_om(self, lat, lon, start, end):
        return [
            {"ts": "2024-01-01T00:00:00Z", "wind_mph": 1.0, "wind_gust_mph": 2.0, "precip_prob": 0.0, "precip_in": 0.0},
            {"ts": "2024-01-01T01:00:00Z", "wind_mph": 1.0, "wind_gust_mph": 2.0, "precip_prob": 0.1, "precip_in": 0.0},
        ]

    # NWS wind rows (OK winds)
    async def fake_nws(self, lat, lon):
        return [
            {"ts": "2024-01-01T00:00:00Z", "wind_mph": 5.0, "wind_gust_mph": 10.0},
            {"ts": "2024-01-01T01:00:00Z", "wind_mph": 6.0, "wind_gust_mph": 12.0},
        ]

    from apps.api.providers import openmeteo, nws
    monkeypatch.setattr(openmeteo.OpenMeteoProvider, 'get_hourly', fake_om)
    monkeypatch.setenv('NWS_USER_AGENT', 'BermudaBuddy/1.0 (test@example.com)')
    monkeypatch.setattr(nws.NWSProvider, 'get_forecast_hourly', fake_nws)

    r = client.get("/api/weather/ok-to-spray?lat=32.8&lon=-96.8&hours=2&wind_source=nws")
    assert r.status_code == 200
    data = r.json()
    assert data['source']['provider'] == 'NWS+OpenMeteo'
    assert data['table'][0]['wind_mph'] == 5.0
    assert data['table'][0]['status'] == 'OK'

