from __future__ import with_statement

import os
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from sqlmodel import SQLModel
import sys, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)
from apps.api.models import Station


config = context.config

# Safely configure logging if config has logging sections
try:
    if config.config_file_name:
        fileConfig(config.config_file_name)
except Exception:
    pass

target_metadata = SQLModel.metadata


def get_url():
    return os.getenv("POSTGRES_URL") or config.get_main_option("sqlalchemy.url")


def run_migrations_offline() -> None:
    url = get_url()
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True, dialect_opts={"paramstyle": "named"})

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        {"sqlalchemy.url": get_url()},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
