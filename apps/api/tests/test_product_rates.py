from fastapi.testclient import TestClient
from apps.api.main import app


client = TestClient(app)


def test_product_rates_filter_by_hoc():
    r = client.get('/api/products/tenex/rates?hoc_in=0.75')
    assert r.status_code == 200
    data = r.json()
    assert 'rates' in data and 'hoc_ranges' in data['rates']
    ranges = data['rates']['hoc_ranges']
    assert len(ranges) >= 1
    assert ranges[0]['rate_unit'] in ('fl_oz_per_1k', 'oz_per_1k')

