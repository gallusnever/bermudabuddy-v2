from fastapi.testclient import TestClient
from sqlmodel import create_engine, Session
from sqlalchemy.pool import StaticPool
from apps.api.main import app, get_db_session
from apps.api.models import Property as DBProperty, Polygon as DBPolygon


TEST_ENGINE = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
with TEST_ENGINE.connect() as conn:
    conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY, user_id VARCHAR, address VARCHAR NOT NULL, lat FLOAT, lon FLOAT, timezone VARCHAR, program_goal VARCHAR, irrigation VARCHAR, cultivar VARCHAR, mower VARCHAR, hoc_in FLOAT, state VARCHAR, pgr_last_gdd0 DATE, pgr_last_gdd10 DATE)")
    conn.exec_driver_sql("CREATE TABLE IF NOT EXISTS polygons (id INTEGER PRIMARY KEY, property_id INTEGER NOT NULL, name VARCHAR NOT NULL, geojson TEXT, area_sqft FLOAT, FOREIGN KEY(property_id) REFERENCES properties(id))")


def override_session():
    with Session(TEST_ENGINE) as s:
        yield s


app.dependency_overrides[get_db_session] = override_session
client = TestClient(app)


def test_create_property_and_polygon():
    r = client.post("/api/properties", json={
        "address": "123 Bermuda Ln",
        "state": "TX",
        "program_goal": "premium",
        "mower": "reel",
        "hoc_in": 0.75
    })
    assert r.status_code == 200
    pid = r.json()["id"]
    r2 = client.post(f"/api/properties/{pid}/polygons", json={
        "name": "Front Lawn",
        "geojson": '{"type":"Polygon","coordinates":[[[-96.8,32.78],[-96.8,32.79],[-96.79,32.79],[-96.79,32.78],[-96.8,32.78]]]}',
        "area_sqft": 4500
    })
    assert r2.status_code == 200
    assert r2.json()["property_id"] == pid
    assert r2.json()["area_sqft"] == 4500

    # GET endpoints
    r3 = client.get(f"/api/properties/{pid}")
    assert r3.status_code == 200
    data = r3.json()
    assert data['address'] == '123 Bermuda Ln'
    r4 = client.get(f"/api/properties/{pid}/polygons")
    assert r4.status_code == 200
    assert r4.json()[0]['area_sqft'] == 4500
