from fastapi.testclient import TestClient
from apps.api.main import app  # type: ignore


client = TestClient(app)


def test_healthz_ok():
    r = client.get("/healthz")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "ok"
    assert data["name"].startswith("Bermuda Buddy API")
