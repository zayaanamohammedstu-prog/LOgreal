# LogGuard

A secure, role-based audit log management and reporting system built with Flask, React, PostgreSQL, and Redis.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                         Browser                              │
│                    React + Socket.IO                         │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP / WebSocket
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                 Frontend Container (Nginx)                    │
│                    React SPA  :3000                          │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API / Socket.IO
                         ▼
┌──────────────────────────────────────────────────────────────┐
│               Backend Container (Gunicorn)                   │
│          Flask + Flask-JWT-Extended + Flask-SocketIO          │
│                       :5000                                  │
└──────┬──────────────────────────────────┬────────────────────┘
       │                                  │
       ▼                                  ▼
┌─────────────┐                  ┌────────────────────┐
│  PostgreSQL │                  │       Redis        │
│  :5432      │                  │  Cache + Celery    │
│  (logguard) │                  │  Broker  :6379     │
└─────────────┘                  └────────┬───────────┘
                                          │
                                          ▼
                                 ┌────────────────────┐
                                 │   Celery Worker    │
                                 │  Email / WhatsApp  │
                                 │  Report generation │
                                 └────────────────────┘
```

---

## Features

- **JWT authentication** with refresh tokens and optional TOTP MFA
- **Role-based access control**: viewer → auditor → admin → superadmin
- **Two-step registration** with email OTP verification and admin approval
- **Audit logging** of all user actions with IP tracking
- **Report generation** in PDF, Excel, and CSV formats
- **Email notifications** via SMTP (Gmail, etc.)
- **WhatsApp notifications** via Twilio
- **Real-time updates** via Socket.IO
- **Rate limiting** on all sensitive endpoints
- **Docker Compose** for one-command deployment

---

## Quick Start

### Prerequisites

- Docker ≥ 24.x
- Docker Compose v2

### 1. Clone and configure

```bash
git clone <repo-url>
cd LOgreal
cp .env.example .env
# Edit .env with your credentials
```

### 2. Run the setup script

```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
1. Build all Docker images
2. Start PostgreSQL and Redis
3. Run database migrations
4. Create a default superadmin user
5. Start all services

### 3. Access the application

| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:3000      |
| Backend    | http://localhost:5000      |
| API Docs   | See [docs/API.md](docs/API.md) |

**Default superadmin credentials:**
- Email: `admin@logguard.local`
- Password: `Admin@LogGuard2024!`

> ⚠️ Change the default password immediately after first login.

---

## Docker Setup

### Start all services

```bash
docker compose up -d
```

### View logs

```bash
docker compose logs -f backend
docker compose logs -f celery-worker
```

### Stop services

```bash
docker compose down
```

### Reset database (destroy volumes)

```bash
docker compose down -v
```

### Run migrations manually

```bash
docker compose run --rm backend flask db upgrade
```

---

## Environment Variables

Copy `.env.example` to `.env` and set the following:

| Variable                | Default                      | Description                          |
|-------------------------|------------------------------|--------------------------------------|
| `FLASK_ENV`             | `development`                | Flask environment                    |
| `SECRET_KEY`            | *(change in prod)*           | Flask session secret                 |
| `JWT_SECRET_KEY`        | *(change in prod)*           | JWT signing key                      |
| `POSTGRES_DB`           | `logguard`                   | Database name                        |
| `POSTGRES_USER`         | `logguard`                   | Database user                        |
| `POSTGRES_PASSWORD`     | `logguard_secret`            | Database password                    |
| `DATABASE_URL`          | *(auto-built)*               | Full PostgreSQL connection string    |
| `REDIS_PASSWORD`        | `redis_secret`               | Redis auth password                  |
| `REDIS_URL`             | *(auto-built)*               | Full Redis connection string         |
| `MAIL_SERVER`           | `smtp.gmail.com`             | SMTP host                            |
| `MAIL_PORT`             | `587`                        | SMTP port                            |
| `MAIL_USERNAME`         | —                            | SMTP username                        |
| `MAIL_PASSWORD`         | —                            | SMTP password / app password         |
| `MAIL_DEFAULT_SENDER`   | —                            | Sender address                       |
| `TWILIO_ACCOUNT_SID`    | —                            | Twilio account SID                   |
| `TWILIO_AUTH_TOKEN`     | —                            | Twilio auth token                    |
| `TWILIO_WHATSAPP_FROM`  | `whatsapp:+14155238886`      | Twilio WhatsApp sender number        |
| `REACT_APP_API_URL`     | `http://localhost:5000`      | Frontend API base URL                |
| `REACT_APP_WS_URL`      | `ws://localhost:5000`        | Frontend WebSocket URL               |

---

## API Overview

Full documentation is in [docs/API.md](docs/API.md).

### Key endpoint groups

| Group        | Prefix            | Description                     |
|--------------|-------------------|---------------------------------|
| Auth         | `/api/auth`       | Login, register, MFA, tokens    |
| Dashboard    | `/api/dashboard`  | Role-specific stats & activity  |
| Admin        | `/api/admin`      | User and registration management|
| Reports      | `/api/reports`    | Generate and download reports   |
| Health       | `/health`         | Service health check            |

---

## Roles

| Role         | Permissions                                                   |
|--------------|---------------------------------------------------------------|
| `viewer`     | View own audit logs and personal dashboard                    |
| `auditor`    | Generate/download reports, view all logs                      |
| `admin`      | Approve registrations, manage users, view all data            |
| `superadmin` | All admin permissions + change roles, deactivate any user     |

---

## Security Features

- **Bcrypt** password hashing
- **TOTP-based MFA** (Google Authenticator compatible)
- **JWT access/refresh token** rotation
- **Account lockout** after 5 failed login attempts (30-minute lock)
- **Rate limiting** on all auth endpoints
- **Email OTP** verification for registration
- **Admin approval** required before new accounts are active
- **Audit trail** — every sensitive action is logged with IP and timestamp
- **CORS** restricted to configured origins

---

## Development Guide

### Backend (local, without Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # update DATABASE_URL / REDIS_URL
flask db upgrade
python run.py
```

### Frontend (local, without Docker)

```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000 npm start
```

### Running Celery worker locally

```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

### Database migrations

```bash
# Create a new migration after model changes
flask db migrate -m "description of change"
flask db upgrade
```

---

## Project Structure

```
LOgreal/
├── backend/
│   ├── app/
│   │   ├── api/           # Blueprint route handlers
│   │   ├── models/        # SQLAlchemy models
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Helpers, decorators, validators
│   │   ├── celery_app.py  # Celery factory
│   │   ├── tasks.py       # Async tasks (email, WhatsApp, reports)
│   │   ├── extensions.py  # Flask extensions
│   │   └── config.py      # Configuration classes
│   ├── migrations/        # Alembic migrations
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
├── frontend/
│   └── Dockerfile
├── scripts/
│   ├── init_db.sql        # PostgreSQL initialization
│   └── setup.sh           # One-command dev setup
├── docs/
│   └── API.md             # Full API reference
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes with tests
4. Ensure linting passes: `flake8 backend/` and `eslint frontend/src/`
5. Commit with a clear message: `git commit -m "feat: describe your change"`
6. Open a Pull Request against `main`

Please follow the existing code style and add docstrings to new public functions.
