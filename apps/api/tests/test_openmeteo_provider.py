import asyncio
from datetime import datetime, timedelta

import pytest

from apps.api.providers.openmeteo import OpenMeteoProvider


class FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return True

    def json(self):
        return self._payload


class FakeClient:
    async def get(self, url, params=None):
        now = datetime(2024, 1, 1)
        payload = {
            "hourly": {
                "time": [(now + timedelta(hours=i)).isoformat() + 'Z' for i in range(3)],
                "wind_speed_10m": [4.0, 5.0, 6.0],
                "wind_gusts_10m": [8.0, 10.0, 12.0],
                "precipitation_probability": [10, 0, 50],
                "precipitation": [0.0, 0.0, 0.2],
                "dew_point_2m": [50.0, 51.0, 52.0],
                "soil_temperature_0cm": [10.0, 12.0, 14.0],
                "et0_fao_evapotranspiration": [1.27, 0.0, 2.54],
            }
        }
        return FakeResp(payload)


@pytest.mark.asyncio
async def test_openmeteo_normalizes_rows():
    prov = OpenMeteoProvider(client=FakeClient(), ttl_seconds=5)
    start = datetime(2024, 1, 1)
    end = start + timedelta(hours=3)
    rows = await prov.get_hourly(32.7, -96.8, start, end)
    assert len(rows) == 3
    assert rows[0]['provider'] == 'OpenMeteo'
    assert rows[0]['wind_mph'] == 4.0
    assert rows[0]['precip_prob'] == 0.1
    assert rows[0]['dewpoint_f'] == 50.0
    # 10C -> 50F, 12C -> 53.6F
    assert round(rows[1]['soil_temp_f'], 1) == 53.6
    # 1.27mm -> 0.05in
    assert round(rows[0]['et0_in'], 2) == 0.05
