from fastapi.testclient import TestClient
from sqlmodel import create_engine, Session
from sqlalchemy.pool import StaticPool
from apps.api.main import app, get_db_session
from apps.api.models import Property as DBProperty


TEST_ENGINE = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
with TEST_ENGINE.connect() as conn:
    conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY, user_id VARCHAR, address VARCHAR NOT NULL, lat FLOAT, lon FLOAT, timezone VARCHAR, program_goal VARCHAR, irrigation VARCHAR, cultivar VARCHAR, mower VARCHAR, hoc_in FLOAT, state VARCHAR, pgr_last_gdd0 DATE, pgr_last_gdd10 DATE)")
    conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY, property_id INTEGER NOT NULL, product_id VARCHAR NOT NULL, date DATE, rate_value FLOAT, rate_unit VARCHAR, area_sqft FLOAT, carrier_gpa FLOAT, tank_size_gal FLOAT, gdd_model VARCHAR, notes TEXT, weather_snapshot JSON, batch_id VARCHAR, FOREIGN KEY(property_id) REFERENCES properties(id))")


def override_session():
    with Session(TEST_ENGINE) as s:
        yield s


app.dependency_overrides[get_db_session] = override_session
client = TestClient(app)


def test_applications_bulk_inserts():
    # Ensure tables exist in this in-memory engine session
    from sqlalchemy import text as sa_text
    with Session(TEST_ENGINE) as s:
        s.execute(sa_text("CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY, property_id INTEGER NOT NULL, product_id VARCHAR NOT NULL, date DATE, rate_value FLOAT, rate_unit VARCHAR, area_sqft FLOAT, carrier_gpa FLOAT, tank_size_gal FLOAT, gdd_model VARCHAR, notes TEXT, weather_snapshot JSON, batch_id VARCHAR, FOREIGN KEY(property_id) REFERENCES properties(id))"))
        s.commit()
    # Seed property via API to ensure route/session alignment
    r_create = client.post('/api/properties', json={
        'address': '123 Bermuda Ln', 'state': 'TX'
    })
    assert r_create.status_code == 200
    pid = r_create.json()['id']

    payload = {
        'property_id': pid,
        'area_sqft': 5000,
        'carrier_gpa': 1.0,
        'tank_size_gal': 2.0,
        'gdd_model': 'gdd10',
        'items': [
            {'product_id': 'tenex', 'rate_value': 1.0, 'rate_unit': 'fl_oz_per_1k'},
            {'product_id': 'prodiamine65wdg', 'rate_value': 0.2, 'rate_unit': 'oz_per_1k'},
        ],
    }
    # sanity: property exists via API
    r_prop = client.get(f'/api/properties/{pid}')
    assert r_prop.status_code == 200
    r = client.post('/api/applications/bulk', json=payload)
    assert r.status_code == 200
    body = r.json()
    assert body['ok'] is True
    assert body['count'] == 2
    assert 'batch_id' in body and isinstance(body['batch_id'], str) and len(body['batch_id']) > 0
