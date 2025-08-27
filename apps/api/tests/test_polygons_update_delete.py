from fastapi.testclient import TestClient
from sqlmodel import create_engine, Session
from sqlalchemy.pool import StaticPool
from sqlalchemy import text as sa_text

from apps.api.main import app, get_db_session


TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def override_session():
    with Session(TEST_ENGINE) as s:
        yield s


app.dependency_overrides[get_db_session] = override_session
client = TestClient(app)


def setup_module(module=None):
    with Session(TEST_ENGINE) as s:
        s.execute(
            sa_text(
                "CREATE TABLE IF NOT EXISTS properties (id INTEGER PRIMARY KEY, user_id VARCHAR, address VARCHAR NOT NULL, lat FLOAT, lon FLOAT, timezone VARCHAR, program_goal VARCHAR, irrigation VARCHAR, cultivar VARCHAR, mower VARCHAR, hoc_in FLOAT, state VARCHAR, pgr_last_gdd0 DATE, pgr_last_gdd10 DATE)"
            )
        )
        s.execute(
            sa_text(
                "CREATE TABLE IF NOT EXISTS polygons (id INTEGER PRIMARY KEY, property_id INTEGER NOT NULL, name VARCHAR NOT NULL, geojson TEXT, area_sqft FLOAT, FOREIGN KEY(property_id) REFERENCES properties(id))"
            )
        )
        s.commit()


def test_polygon_update_and_delete_flow():
    # Create property via API
    r_prop = client.post(
        "/api/properties",
        json={"address": "123 Bermuda Ln", "state": "TX"},
    )
    assert r_prop.status_code == 200
    pid = r_prop.json()["id"]

    # Add polygon via API
    r_poly = client.post(
        f"/api/properties/{pid}/polygons",
        json={"name": "Front Lawn", "geojson": "{}", "area_sqft": 1000},
    )
    assert r_poly.status_code == 200
    poly_id = r_poly.json()["id"]

    # Update polygon name and area
    r_upd = client.put(
        f"/api/properties/{pid}/polygons/{poly_id}",
        json={"name": "Renamed Front", "area_sqft": 1200},
    )
    assert r_upd.status_code == 200
    data = r_upd.json()
    assert data["name"] == "Renamed Front"
    assert data["area_sqft"] == 1200

    # List polygons and verify update
    r_list = client.get(f"/api/properties/{pid}/polygons")
    assert r_list.status_code == 200
    items = r_list.json()
    assert len(items) == 1
    assert items[0]["name"] == "Renamed Front"
    assert int(items[0]["area_sqft"]) == 1200

    # Delete polygon
    r_del = client.delete(f"/api/properties/{pid}/polygons/{poly_id}")
    assert r_del.status_code == 200
    assert r_del.json()["ok"] is True

    # Verify deletion
    r_list2 = client.get(f"/api/properties/{pid}/polygons")
    assert r_list2.status_code == 200
    assert len(r_list2.json()) == 0

