from fastapi.testclient import TestClient
from sqlmodel import create_engine, Session
from sqlalchemy.pool import StaticPool
from apps.api.main import app, get_db_session
from apps.api.models import Property as DBProperty
from sqlalchemy import text as sa_text


TEST_ENGINE = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
with Session(TEST_ENGINE) as s:
    s.execute(sa_text("CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY, user_id VARCHAR, address VARCHAR NOT NULL, lat FLOAT, lon FLOAT, timezone VARCHAR, program_goal VARCHAR, irrigation VARCHAR, cultivar VARCHAR, mower VARCHAR, hoc_in FLOAT, state VARCHAR, pgr_last_gdd0 DATE, pgr_last_gdd10 DATE)"))
    s.execute(sa_text("CREATE TABLE IF NOT EXISTS applications (id INTEGER PRIMARY KEY, property_id INTEGER NOT NULL, product_id VARCHAR NOT NULL, date DATE, rate_value FLOAT, rate_unit VARCHAR, area_sqft FLOAT, batch_id VARCHAR)"))
    s.commit()


def override_session():
    with Session(TEST_ENGINE) as s:
        yield s


app.dependency_overrides[get_db_session] = override_session
client = TestClient(app)


def test_list_applications():
    # seed property and applications
    with Session(TEST_ENGINE) as s:
        s.add(DBProperty(address='123 Bermuda Ln'))
        s.commit()
        pid = s.execute(sa_text("SELECT id FROM properties LIMIT 1")).scalar()
        s.execute(sa_text("INSERT INTO applications (property_id, product_id, date, rate_value, rate_unit, area_sqft) VALUES (:pid,'tenex','2025-01-01',1.0,'fl_oz_per_1k',5000)"), {"pid": pid})
        s.commit()
    r = client.get(f"/api/properties/{pid}/applications")
    assert r.status_code == 200
    data = r.json()
    assert len(data) >= 1 and data[0]['product_id'] == 'tenex'
