# syntax=docker/dockerfile:1
FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps (optional): ca-certificates for outbound HTTPS
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 10001 appuser

# Install Python deps
COPY apps/api/requirements.txt /app/apps/api/requirements.txt
RUN pip install --upgrade pip && pip install -r /app/apps/api/requirements.txt

# Copy source
COPY apps /app/apps
COPY data /app/data
COPY apps/api/alembic.ini /app/apps/api/alembic.ini
COPY apps/api/migrations /app/apps/api/migrations

ENV PORT=8000 \
    APP_VERSION=0.1.0

EXPOSE 8000

USER appuser

CMD ["sh", "-lc", "if [ \"$MIGRATE_ON_START\" = \"1\" ]; then alembic -c apps/api/alembic.ini upgrade head; fi; exec uvicorn apps.api.main:app --host 0.0.0.0 --port ${PORT}"]

