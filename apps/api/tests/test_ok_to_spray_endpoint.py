from fastapi.testclient import TestClient
from apps.api.main import app  # type: ignore


def test_ok_to_spray_endpoint(monkeypatch):
    async def fake_get_hourly(self, lat, lon, start, end):
        # Two OK hours followed by NOT_OK
        return [
            {"ts": "2024-01-01T00:00:00Z", "wind_mph": 5.0, "wind_gust_mph": 10.0, "precip_prob": 0.0, "precip_in": 0.0},
            {"ts": "2024-01-01T01:00:00Z", "wind_mph": 6.0, "wind_gust_mph": 10.0, "precip_prob": 0.1, "precip_in": 0.0},
            {"ts": "2024-01-01T02:00:00Z", "wind_mph": 12.0, "wind_gust_mph": 20.0, "precip_prob": 0.5, "precip_in": 0.1},
        ]

    # Patch provider method
    from apps.api import providers
    from apps.api.providers import openmeteo
    monkeypatch.setattr(openmeteo.OpenMeteoProvider, 'get_hourly', fake_get_hourly)

    client = TestClient(app)
    r = client.get("/api/weather/ok-to-spray?lat=32.8&lon=-96.8&hours=3")
    assert r.status_code == 200
    data = r.json()
    assert data["source"]["provider"] == "OpenMeteo"
    assert len(data["table"]) == 3
    assert data["table"][0]["status"] == "OK"
    assert data["ok_window"] == {"start": "2024-01-01T00:00:00Z", "end": "2024-01-01T01:00:00Z"}
