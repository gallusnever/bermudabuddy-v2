import os
from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session


def get_db_url() -> str:
    url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    if not url:
      raise RuntimeError("POSTGRES_URL is required for DB access")
    return url


_engine = None


def engine():
    global _engine
    if _engine is None:
        _engine = create_engine(get_db_url(), future=True)
    return _engine


@contextmanager
def get_session() -> Iterator[Session]:
    sess = Session(engine())
    try:
        yield sess
    finally:
        sess.close()
