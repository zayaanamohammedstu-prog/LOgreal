#!/bin/bash
set -e

echo "=========================================="
echo "  LogGuard Development Setup"
echo "=========================================="

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 || { echo "Docker Compose is required. Aborting." >&2; exit 1; }

# Copy env file
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual credentials before running!"
fi

# Build and start services
echo "Building Docker images..."
docker compose build

echo "Starting services..."
docker compose up -d db redis

echo "Waiting for database to be ready..."
sleep 5

echo "Running database migrations..."
docker compose run --rm backend flask db upgrade

echo "Creating initial superadmin user..."
docker compose run --rm backend python -c "
from app import create_app
from app.extensions import db
from app.models.user import User, UserRole
import os

app = create_app()
with app.app_context():
    if not User.query.filter_by(role=UserRole.SUPERADMIN).first():
        admin = User(
            email='admin@logguard.local',
            username='superadmin',
            role=UserRole.SUPERADMIN,
            is_active=True,
            is_approved=True
        )
        admin.set_password('Admin@LogGuard2024!')
        db.session.add(admin)
        db.session.commit()
        print('Default superadmin created: admin@logguard.local / Admin@LogGuard2024!')
    else:
        print('Superadmin already exists, skipping.')
"

echo "Starting all services..."
docker compose up -d

echo ""
echo "=========================================="
echo "  LogGuard is running!"
echo "=========================================="
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:5000"
echo "  API Docs:  http://localhost:5000/api/docs"
echo ""
echo "  Default login: admin@logguard.local"
echo "  Password: Admin@LogGuard2024!"
echo "=========================================="
