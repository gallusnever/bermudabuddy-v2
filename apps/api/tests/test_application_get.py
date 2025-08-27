from fastapi.testclient import TestClient
from sqlmodel import create_engine, Session
from sqlalchemy.pool import StaticPool
from sqlalchemy import text as sa_text

from apps.api.main import app, get_db_session


TEST_ENGINE = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)


def override_session():
    with Session(TEST_ENGINE) as s:
        yield s


app.dependency_overrides[get_db_session] = override_session
client = TestClient(app)


def setup_module(module=None):
    with Session(TEST_ENGINE) as s:
        s.execute(sa_text("CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY, address VARCHAR NOT NULL)"))
        s.execute(sa_text("CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY, property_id INTEGER NOT NULL, product_id VARCHAR NOT NULL, date DATE, rate_value FLOAT, rate_unit VARCHAR, area_sqft FLOAT, carrier_gpa FLOAT, tank_size_gal FLOAT, gdd_model VARCHAR, notes TEXT, weather_snapshot JSON, FOREIGN KEY(property_id) REFERENCES properties(id))"))
        s.execute(sa_text("INSERT INTO properties (address) VALUES ('123 Bermuda Ln')"))
        pid = s.execute(sa_text("SELECT id FROM properties LIMIT 1")).scalar()
        s.execute(sa_text("INSERT INTO applications (property_id, product_id, date, rate_value, rate_unit, area_sqft, carrier_gpa, tank_size_gal, gdd_model) VALUES (:pid, 'tenex', '2025-01-01', 1.0, 'fl_oz_per_1k', 5000, 1.0, 2.0, 'gdd10')"), {"pid": pid})
        s.commit()


def test_get_application_by_id():
    # Find inserted row id
    with Session(TEST_ENGINE) as s:
        app_id = s.execute(sa_text("SELECT id FROM applications LIMIT 1")).scalar()
    r = client.get(f"/api/applications/{app_id}")
    assert r.status_code == 200
    data = r.json()
    assert data['id'] == app_id
    assert data['product_id'] == 'tenex'
    assert data['rate_unit'] == 'fl_oz_per_1k'
