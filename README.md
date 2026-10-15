# Atlas v2 — Backend

REST + Socket.IO API for the Atlas job scheduler. It serves two independent boards:

| Board | Source in Grove | Atlas table |
|---|---|---|
| Artwork Jobs | `artworkjobcard` | `artwork_jobs` |
| Proof Jobs | `proofing_job_card` | `proofing_jobs` |

Job cards are pulled from **Grove's database** (read-only) instead of the old Google Sheet. Operators then place jobs on machines and order them; that scheduling state lives only in Atlas's own database, `job_schedular_v2`.

```
Grove DB (read-only)  --sync every 60s-->  job_schedular_v2  <--REST-->  frontend
                                               |
                                               +--Socket.IO "grove:synced"--> boards show "Grove updated"
```

## Stack

Node.js 20+ (ESM) · TypeScript · Express 5 · Prisma 7 (MariaDB adapter, MySQL) · `mariadb` (read-only Grove pool) · Socket.IO 4 · Zod 4 · JWT (bcryptjs)

## Folder structure

Each feature uses the same controller → service → repository layout:

```
src/
├── server.ts                 # entry: HTTP server, Socket.IO, Grove sync scheduler, graceful shutdown
├── app.ts                    # Express app (middleware + routes), no listen()
├── config/                   # env (Zod-validated), Prisma client, Grove read-only pool, Socket.IO
├── middlewares/              # requireAuth (Bearer JWT), global error handler, 404
├── utils/                    # AppError, sendResponse, JWT, logger
├── routes/index.ts           # mounts feature routers under /api
├── types/express.d.ts        # req.user typing
├── features/
│   ├── auth/                 # login, register (signed-in users only), me
│   ├── jobs/                 # boards, move / complete / unschedule
│   ├── grove-sync/           # pulls Grove job cards into the two job tables
│   └── health/               # GET /health
│   #   every feature: controllers/ services/ repositories/ data/ types/ routes/
└── generated/prisma/         # Prisma client (generated, git-ignored)
prisma/
├── schema.prisma             # users, artwork_jobs, proofing_jobs
└── migrations/0_init/        # baseline of the existing tables
scripts/seed-admin.ts         # creates the first user from ADMIN_* in .env
tests/unit/                   # node:test unit tests (ordering, sync planner, board config)
```

- **controllers** validate the request (Zod) and shape the response.
- **services** hold the rules.
- **repositories** are the only code that touches a database.
- **data** holds fixed values: machine lists, Grove table mapping, messages.
- **types** holds schemas and interfaces.

## Getting started

```bash
npm install
cp .env.example .env        # already filled in on this machine
npm run prisma:generate     # generate the Prisma client
npm run seed:admin          # create the first login (safe to re-run)
npm run dev                 # http://localhost:4000 (watch mode)
```

Production:

```bash
npm run build               # prisma generate + tsc -> dist/
npm start                   # node dist/server.js
```

Checks:

```bash
npm run typecheck
npm test                    # unit tests
```

## Environment variables

| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default 4000) |
| `CORS_ORIGINS` | Comma-separated frontend origins allowed by CORS and Socket.IO |
| `DATABASE_HOST` / `_PORT` / `_USER` / `_PASSWORD` / `_NAME` | Atlas database (`job_schedular_v2`). The Prisma CLI builds its URL from these too. |
| `DATABASE_CONNECTION_LIMIT` | Prisma pool size |
| `GROVE_DATABASE_HOST` / `_PORT` / `_USER` / `_PASSWORD` / `_NAME` | Grove database: `grove_db_dev_backup` while Grove is in development, `grove_db` once it is live |
| `GROVE_SYNC_ENABLED` | `false` turns off both the automatic and the manual sync |
| `GROVE_SYNC_INTERVAL_MS` | Sync interval (default 60000, minimum 10000) |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Token signing (secret ≥ 32 chars) / lifetime (default `7d`) |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost (default 10) |
| `ADMIN_USERNAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used only by `npm run seed:admin` |

The server refuses to start, with a list of what's wrong, if a required variable is missing or invalid.

## API

Every response uses the envelope `{ statusCode, success, message, data }`. Errors use `{ statusCode, success: false, message, errors? }`. Everything under `/api/jobs` and `/api/sync` needs `Authorization: Bearer <token>`. `:jobType` is `artwork` or `proofing`.

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Database + Grove reachability (503 if either is down) |
| POST | `/api/auth/login` | `{ username, password }` → `{ user, token }` |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/register` | Create a user (signed-in users only) |
| GET | `/api/jobs/:jobType/board` | `{ machines, unscheduled, scheduled: { [machineKey]: Job[] } }` |
| GET | `/api/jobs/:jobType/completed` | `{ machines, completed: { [machineKey]: Job[] } }` |
| PATCH | `/api/jobs/:jobType/:jobId/position` | `{ machine, prevRunOrder, nextRunOrder }`. Places/reorders a job (the only way `machine_name` gets set) |
| PATCH | `/api/jobs/:jobType/:jobId/complete` | Mark completed (job must be on a machine) |
| PATCH | `/api/jobs/:jobType/:jobId/unschedule` | Back to unscheduled (clears machine + order) |
| POST | `/api/sync` | Pull from Grove now (the boards' Refresh button) |
| GET | `/api/sync/status` | Last sync run, interval, Grove database |

Socket.IO: connect with `auth: { token }`. The server emits `grove:synced` with `{ jobType, created, updated, removed, jobNumbers, syncedAt }` whenever a sync changed a board.

### Ordering (gap-based run order)

Jobs on a machine are sorted by `run_order`. A dropped job takes the midpoint of its neighbours (`prevRunOrder` / `nextRunOrder`), so nothing else is rewritten. When there's no integer gap left, the whole machine is renumbered in steps of 1,000,000 and the response says `rebalanced: true`.

## Grove sync rules

Every run (at startup, every `GROVE_SYNC_INTERVAL_MS`, and on `POST /api/sync`) reads the **open** job cards of both types.

A card counts as open when it has a job number, `job_completed` is not true, and `job_status` is not one of `DONE`, `BILLED`, `TRANSFERED`, `CANCLED` (Grove's own spellings; see `features/grove-sync/data/grove.data.ts`).

- **New** open card → inserted unscheduled (`machine_name` NULL).
- **Name or remarks changed** in Grove → updated, `is_updated = 1`. Machine, run order and completion are never touched by the sync.
- **No longer open** (closed or deleted in Grove) → deleted from Atlas **only if it is still unscheduled**. Jobs already on a machine or completed stay for the operators.
- **The same job number on two open cards** (it happens in Grove's artwork data) → the newest card wins and the number is logged once. `artwork_jobs.job_number` is unique, so only one row can exist per number.

Grove is only ever read. The pool opens every connection with `SET SESSION TRANSACTION READ ONLY`, so MySQL rejects any write.

## Database & migrations

`job_schedular_v2` was created by copying the v1 table structure (no data), with `expected_delivery_date`, `revised_delivery_date` and `job_priority` removed. Prisma was then baselined (`0_init` marked as applied), so `prisma migrate status` reports it up to date.

To change the schema: edit `prisma/schema.prisma`, then run `npx prisma migrate dev --name <change>`.

> ⚠️ The MySQL server is shared with production databases (v1's `job_scheduler`, `grove_db`, and others), and the `.env` user has full rights on all of them. Always check `DATABASE_NAME=job_schedular_v2` before running any Prisma migrate command.

## Docker

```bash
docker compose up --build   # builds the image, serves on 127.0.0.1:4002 using .env
```

The image contains only `dist/` and production dependencies and runs as the `node` user. `.env` is supplied at runtime. Its health check calls `/health`, so the container is healthy only while both databases are reachable.

## CI checks (GitHub Actions)

`.github/workflows/checks.yml` runs on every push and on pull requests into `main`. It needs no secrets, because it starts its own throwaway MySQL:

1. Install, Prisma client, type-check, unit tests, build.
2. Apply the migrations to the empty MySQL, then fail if `schema.prisma` has changes without a migration.
3. Seed a CI admin, build the Docker image, and run it.
4. Check that `/health` is ok, the admin can log in, both boards are served, and a request without a token gets 401.

To make it a merge gate, mark **Backend checks** as a required status check in the `main` branch protection rule.

## Deploy (GitHub Actions → EC2)

`.github/workflows/deploy.yml` runs on every push to `main` (or manually from the Actions tab). It follows the same flow as v1:

1. Install, type-check, run the unit tests and build.
2. Write `.env.prod` from the repository secrets.
3. Copy the sources to `~/job-scheduler-backend-v2` on the EC2 server.
4. `docker compose -p atlas-v2-backend -f docker-compose.prod.yml` build and up.
5. Wait for the container health check.

It runs as container `atlas-v2-backend` on `127.0.0.1:4002`, separate from v1's `atlas-backend` (4001).

A missing secret fails the run before anything is copied. Point your reverse proxy (domain → `127.0.0.1:4002`) at the API. Socket.IO needs WebSocket upgrade headers on that proxy.
