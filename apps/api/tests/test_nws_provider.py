import os
import pytest
from apps.api.providers.nws import NWSProvider, MissingNWSUserAgent


class FakeResp:
    def __init__(self, status_code=200, json_data=None, request=None):
        self.status_code = status_code
        self._json = json_data or {}
        self.request = request

    def raise_for_status(self):
        if self.status_code >= 400:
            raise Exception(f"HTTP {self.status_code}")

    def json(self):
        return self._json


class FakeClient:
    def __init__(self, responses):
        self._responses = responses
        self.calls = []

    async def get(self, url, params=None):
        self.calls.append((url, params))
        if not self._responses:
            return FakeResp(200, {"features": []})
        return self._responses.pop(0)


@pytest.mark.asyncio
async def test_nws_requires_user_agent(monkeypatch):
    monkeypatch.delenv('NWS_USER_AGENT', raising=False)
    with pytest.raises(MissingNWSUserAgent):
        NWSProvider()


@pytest.mark.asyncio
async def test_nws_backoff_on_429(monkeypatch):
    monkeypatch.setenv('NWS_USER_AGENT', 'BermudaBuddy/1.0 (test@example.com)')
    responses = [FakeResp(429), FakeResp(403), FakeResp(200, {"features": []})]
    client = FakeClient(responses)
    slept = []

    async def fake_sleep(t):
        slept.append(t)

    nws = NWSProvider(client=client, sleeper=fake_sleep)
    alerts = await nws.get_alerts(32.8, -96.8)
    assert isinstance(alerts, list)
    # Should have retried twice before success
    assert len(slept) == 2
    assert len(client.calls) == 3

