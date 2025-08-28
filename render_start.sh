#!/bin/bash
# Start script for Render deployment

# Run database migrations if DATABASE_URL is set
if [ ! -z "$DATABASE_URL" ]; then
    echo "Running database migrations..."
    cd apps/api && alembic upgrade head && cd ../..
fi

# Start the FastAPI application
echo "Starting FastAPI application..."
exec uvicorn apps.api.main:app --host 0.0.0.0 --port ${PORT:-8000}