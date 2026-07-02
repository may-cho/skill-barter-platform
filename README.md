# Skill Barter Platform

A peer-to-peer web application where users exchange knowledge and skills directly — no money involved. Trade 2 hours of Python tutoring for 3 hours of guitar lessons.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Django REST Framework |
| Database | PostgreSQL |
| Real-time | Django Channels + WebSockets |
| Cache / Locks | Redis |
| Auth | JWT (Simple JWT) |

## Core Features

- **Hybrid Profiles** — simultaneous Skill Seeker & Skill Provider roles
- **Smart Match Engine** — intersects teach/learn skills for compatible exchange partners
- **Barter Proposal State Machine** — `Pending → Negotiating ↔ Accepted → Completed / Canceled`
- **Timezone-aware Scheduling** — UTC storage with client-side timezone display
- **Real-time Chat** — isolated WebSocket rooms per proposal with quick-reply templates
- **Closed-loop Reviews** — ratings only after proposal completion

## Quick Start

### 1. Start infrastructure

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
copy ..\.env.example ..\.env  # Windows — adjust if needed
python manage.py migrate
python manage.py createsuperuser
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/token/` | JWT login |
| GET/PATCH | `/api/auth/me/` | Profile |
| GET | `/api/skills/matches/` | Smart match feed |
| GET | `/api/skills/mine/` | My teach/learn skills |
| CRUD | `/api/skills/` | Skill management |
| CRUD | `/api/proposals/` | Barter proposals |
| POST | `/api/proposals/{id}/accept/` | Accept proposal |
| POST | `/api/proposals/{id}/counter/` | Counter-offer |
| POST | `/api/proposals/{id}/complete/` | Mark completed |
| GET | `/api/messages/proposal/{id}/` | Chat history |
| CRUD | `/api/appointments/` | Schedule sessions |
| POST | `/api/reviews/` | Submit review (Completed only) |
| WS | `/ws/chat/proposal/{id}/?token=JWT` | Real-time chat |

## State Machine

```
Pending ──→ Negotiating ←──→ Accepted ──→ Completed
  │              │              │
  └──────────────┴──────────────┴──→ Canceled
```

## Project Structure

```
skill-barter-platform/
├── backend/
│   ├── config/           # Django settings, ASGI, URLs
│   └── apps/
│       ├── accounts/     # User model & JWT auth
│       ├── skills/       # Hybrid profiles & matching
│       ├── proposals/    # Negotiation engine
│       ├── messaging/    # WebSocket chat
│       ├── scheduling/   # Appointments + Calendar hooks
│       └── reviews/      # Reputation layer
├── frontend/
│   └── src/
│       ├── components/   # Atomic UI + chat
│       ├── context/      # Auth state
│       ├── lib/          # API client
│       └── pages/        # Route views
└── docker-compose.yml    # PostgreSQL + Redis
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `POSTGRES_*` — database connection
- `REDIS_*` — cache and channel layer
- `DJANGO_SECRET_KEY` — production secret
- `GOOGLE_CALENDAR_*` — optional Calendar API sync

## License

MIT
