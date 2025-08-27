from fastapi.testclient import TestClient
from sqlmodel import create_engine, Session
from sqlalchemy.pool import StaticPool
from apps.api.main import app, get_db_session
from apps.api.models import Label as DBLabel


TEST_ENGINE = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
from sqlalchemy import text as sa_text
with Session(TEST_ENGINE) as s:
    s.execute(sa_text("CREATE TABLE IF NOT EXISTS labels (id INTEGER PRIMARY KEY, product_id VARCHAR, epa_reg_no VARCHAR, pdf_url VARCHAR, source VARCHAR, retrieved_at VARCHAR, state_reg_json JSON, signal_word VARCHAR, rup BOOLEAN)"))
    s.commit()


def override_session():
    with Session(TEST_ENGINE) as s:
        yield s


app.dependency_overrides[get_db_session] = override_session
client = TestClient(app)


def test_by_epa_persists_label():
    r = client.get('/api/labels/by-epa?reg_no=91585-4')
    assert r.status_code == 200
    data = r.json()
    assert 'pdf_url' in data and data['pdf_url'].startswith('https://')
