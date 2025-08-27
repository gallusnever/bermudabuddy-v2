import os
from fastapi.testclient import TestClient
from apps.api.main import app


def test_nickname_endpoint_fallback_when_no_key():
    # Ensure we exercise the fallback path (no external call)
    os.environ.pop("OPENROUTER_API_KEY", None)
    client = TestClient(app)
    payload = {
        "firstName": "John",
        "state": "TX",
        "hoc": 2.0,
        "issues": ["weeds"],
    }
    r = client.post("/api/nickname", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data.get("nickname"), str)
    assert len(data["nickname"]) > 0
