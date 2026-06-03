# Fire Extinguisher Management System — RESTful Microservices

A RESTful **microservices** backend for **TZW LTD**'s Fire Extinguisher Management
System. It lets users check extinguisher status, schedule inspections, log
maintenance, monitor compliance, and generate real-time reports — built for
scalability, maintainability, security and high availability.

> This repository is a pnpm + Turborepo monorepo. The **backend microservices**
> live in `services/*` and share code through `packages/core`. (`services/api`
> is the original single-service reference template the microservices were
> derived from; it is not part of the running system.)

---

## Architecture

A single **API Gateway** is the only public entry point. It reverse-proxies to
four domain microservices. Each service is independently deployable, owns its
own database (database-per-service), and authenticates requests by **statelessly
verifying a shared JWT** — so no service depends on another at request time
(except deliberate, explicit calls).

```
                                  ┌──────────────────────────┐
       Browser / API client  ───► │   API Gateway  :8080     │  reverse proxy + aggregated Swagger
                                  └─────────────┬────────────┘
            ┌───────────────┬───────────────────┼─────────────────────────┐
            ▼               ▼                   ▼                         ▼
   ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐     ┌──────────────────┐
   │   auth      │  │   management     │  │  reporting    │     │  notification    │
   │   :8081     │  │   :8082          │  │  :8083        │     │  :8084 (internal)│
   │ users, JWT, │  │ extinguishers,   │  │ aggregates,   │     │ all email +      │
   │ RBAC, OTP   │  │ inspections,     │  │ PDF/CSV export│     │ audit log        │
   │             │  │ maintenance      │  │ (no DB)       │     │                  │
   │ DB:         │  │ DB:              │  │               │     │ DB:              │
   │ restful_auth│  │ restful_management│ │               │     │ restful_notification
   └──────┬──────┘  └────────┬─────────┘  └──────┬────────┘     └────────▲─────────┘
          │                  │                   │                       │
          │ send OTP/reset   │ send alerts       │ read (cookie fwd)     │
          └──────────────────┴───────────────────┴───────────────────────┘
                          (internal service-to-service HTTP)
```

### Services

| Service          | Port | Owns / Does                                                                 | Database                |
| ---------------- | ---- | -------------------------------------------------------------------------- | ----------------------- |
| **gateway**      | 8080 | Single public entry point; reverse proxy; CORS; rate limit; unified Swagger | — (stateless)           |
| **auth**         | 8081 | Registration, login, JWT sessions, RBAC, profile, OTP email verification, password reset, user management | `restful_auth`          |
| **management**   | 8082 | Extinguisher registry, inspection scheduling/completion, maintenance logs   | `restful_management`    |
| **reporting**    | 8083 | Real-time inventory/inspection/compliance/maintenance reports + PDF/CSV export | — (aggregates over HTTP) |
| **notification** | 8084 | Centralized outbound email (Resend) + delivery audit log (internal-only)    | `restful_notification`  |
| `packages/core`  | —    | Shared library: logging, errors, JWT auth middleware, HTTP client, Express bootstrap, validation | —                       |

### Key design decisions

- **Database-per-service.** Each service owns its schema; there are no
  cross-service foreign keys. Foreign references (e.g. an inspection's
  `inspectorId`) are stored as plain ids carried in the JWT.
- **Stateless JWT auth.** The auth service signs a short-lived **access token**
  (15 min) and a long-lived **refresh token** (30 days) into `httpOnly` cookies.
  Every other service verifies the access token with the shared
  `ACCESS_TOKEN_SECRET` — no DB lookup, no call to auth. Token **refresh** lives
  only in auth (it owns the user table).
- **Three roles (RBAC):** `user` (schedule inspections, view status/history),
  `inspector` (conduct inspections, log results & maintenance), `admin` (manage
  users, settings, all data, reports).
- **Centralized notifications.** All outbound email is owned by the notification
  service. Other services call it over an **internal-key-authenticated** HTTP
  endpoint; in development (no `RESEND_API_KEY`) emails are logged, not sent, and
  every attempt is recorded in `restful_notification.notifications`.
- **Reporting is an aggregator** with no database. It forwards the caller's
  cookie to the management service so the same authentication/RBAC applies.
- **Shared `@repo/core`** is consumed as TypeScript source (no build step) via
  bundler module resolution + `tsx`, keeping all services consistent.

### Tech stack

Node.js + TypeScript · Express 5 · Drizzle ORM + PostgreSQL · Zod (validation) ·
`jsonwebtoken` · `bcryptjs` · Winston (logging) · `http-proxy-middleware`
(gateway) · React Email + Resend (notification) · `pdfkit` (PDF) ·
Swagger/OpenAPI · pnpm workspaces + Turborepo.

---

## Getting started

### Prerequisites

- Node.js ≥ 20 (developed on 24)
- pnpm ≥ 11 (`corepack enable` or `npm i -g pnpm`)
- PostgreSQL ≥ 14 running locally on `:5432`

### 1. Install

```bash
pnpm install
```

### 2. Configure environment

Each service reads a `.env` from its own folder. Copy the examples and adjust:

```bash
cp services/auth/.env.example         services/auth/.env
cp services/management/.env.example   services/management/.env
cp services/reporting/.env.example    services/reporting/.env
cp services/notification/.env.example services/notification/.env
cp services/gateway/.env.example      services/gateway/.env
```

> The same `ACCESS_TOKEN_SECRET` and `INTERNAL_API_KEY` must be set in every
> service (auth signs tokens; the others verify them). See **Environment
> reference** below.

### 3. Create databases + run migrations

```bash
pnpm db:setup      # creates restful_auth, restful_management, restful_notification
pnpm db:migrate    # applies Drizzle migrations to each
```

`pnpm db:setup` shells out to `psql` (override the connection string in the
`db:setup` script if your superuser/credentials differ). To regenerate
migrations after a schema change: `pnpm db:generate`.

### 4. Run

```bash
pnpm dev:backend   # starts gateway + auth + management + reporting + notification
```

Everything is reachable through the gateway at **http://localhost:8080**.

| URL                                | What                                            |
| ---------------------------------- | ----------------------------------------------- |
| http://localhost:8080              | Gateway index (route map)                       |
| http://localhost:8080/health       | Gateway health                                  |
| http://localhost:8080/docs         | **Aggregated Swagger UI** (service selector)    |
| http://localhost:8081/docs         | Auth & User Management API docs                 |
| http://localhost:8082/docs         | Fire Extinguisher Management API docs           |
| http://localhost:8083/docs         | Reporting API docs                              |
| http://localhost:8084/docs         | Notification API docs (internal)                |

---

## API overview (via the gateway)

All routes below are called on `http://localhost:8080`.

### Auth & Users (`auth` service)

| Method & path                | Role         | Description                              |
| ---------------------------- | ------------ | ---------------------------------------- |
| `POST /auth/register`        | public       | Create account, start session, send OTP  |
| `POST /auth/login`           | public       | Log in (sets `httpOnly` cookies)          |
| `POST /auth/logout`          | public       | Clear this client's session               |
| `POST /auth/logout-all`      | auth         | Revoke every session                      |
| `POST /auth/refresh`         | public       | Rotate tokens using the refresh cookie    |
| `GET  /auth/me`              | auth         | Current user                              |
| `PATCH /auth/me`             | auth         | Update profile                            |
| `POST /auth/change-password` | auth         | Change password (revokes other sessions)  |
| `POST /auth/verify-email`    | auth         | Confirm email with the 6-digit OTP        |
| `POST /auth/verify-email/resend` | auth     | Re-send the OTP                           |
| `POST /auth/forgot-password` | public       | Email a password-reset code               |
| `POST /auth/reset-password`  | public       | Reset password with the code              |
| `GET  /users`                | admin        | List users                                |
| `GET  /users/:id`            | admin        | Get a user                                |
| `PATCH /users/:id/role`      | admin        | Change a user's role                      |
| `DELETE /users/:id`          | admin        | Delete a user                             |

### Fire Extinguisher Management (`management` service)

| Method & path                       | Role               | Description                          |
| ----------------------------------- | ------------------ | ------------------------------------ |
| `POST /extinguishers`               | admin, inspector   | Register an extinguisher             |
| `GET  /extinguishers`               | auth               | List (filters: `status`, `type`)     |
| `GET  /extinguishers/:id`           | auth               | Details                              |
| `PATCH /extinguishers/:id`          | admin, inspector   | Update                               |
| `DELETE /extinguishers/:id`         | admin              | Delete                               |
| `POST /inspections`                 | auth               | Schedule (notifies personnel)        |
| `GET  /inspections`                 | auth               | List (filters: `status`, `extinguisherId`) |
| `GET  /inspections/:id`             | auth               | Details                              |
| `POST /inspections/:id/complete`    | admin, inspector   | Record result                        |
| `PATCH /inspections/:id`            | admin, inspector   | Reschedule / cancel                  |
| `DELETE /inspections/:id`           | admin              | Delete                               |
| `POST /maintenance`                 | admin, inspector   | Log maintenance (notifies)           |
| `GET  /maintenance`                 | auth               | List (filter: `extinguisherId`)      |
| `GET  /maintenance/:id`             | auth               | Details                              |

Extinguisher **types**: `water`, `co2`, `foam`, `dry_chemical`.
Extinguisher **sizes**: `2.5lb`, `5lb`, `9lb`, `12lb`.

### Reporting (`reporting` service)

| Method & path                          | Description                                       |
| -------------------------------------- | ------------------------------------------------- |
| `GET /reports/inventory`               | Totals by type/size/status; daily/monthly/yearly  |
| `GET /reports/inspections`             | Pending, completed, overdue inspections           |
| `GET /reports/compliance?windowDays=30`| Expired, upcoming expirations, compliance rate    |
| `GET /reports/maintenance?recentDays=30`| History, frequency, recent activity              |
| `GET /reports/:type/export?format=pdf` | Export a report as **PDF** (`pdfkit`)             |
| `GET /reports/:type/export?format=csv` | Export a report as **CSV**                        |

### Example: a full flow with `curl`

```bash
G=http://localhost:8080
# Register (saves session cookies)
curl -s -c cj.txt -H content-type:application/json -X POST $G/auth/register \
  -d '{"email":"admin@tzw.test","password":"Password123","displayName":"Admin"}'
# (promote to admin out-of-band, then) log in
curl -s -c cj.txt -H content-type:application/json -X POST $G/auth/login \
  -d '{"email":"admin@tzw.test","password":"Password123"}'
# Register an extinguisher
curl -s -b cj.txt -H content-type:application/json -X POST $G/extinguishers \
  -d '{"serialNumber":"FE-001","location":"Building A","type":"co2","size":"5lb","installationDate":"2026-01-15","expiryDate":"2027-01-15"}'
# Report + export
curl -s -b cj.txt $G/reports/inventory
curl -s -b cj.txt "$G/reports/compliance/export?format=pdf" -o compliance.pdf
```

> In development, OTP and password-reset codes are **logged by the notification
> service** (no email is sent) so you can complete the verification flow.

---

## Project structure

```
restful-template/
├─ packages/
│  ├─ core/              @repo/core — shared logger, errors, JWT auth, HTTP client,
│  │                     Express bootstrap (createBaseApp/startServer), validation
│  ├─ eslint-config/     shared ESLint config
│  └─ tsconfig/          shared TS config
├─ services/
│  ├─ gateway/           API gateway (reverse proxy + aggregated docs)
│  ├─ auth/              authentication + user management   (DB: restful_auth)
│  ├─ management/        extinguishers + inspections + maintenance (DB: restful_management)
│  ├─ reporting/         reports + PDF/CSV export (no DB)
│  ├─ notification/      email + audit log (DB: restful_notification)
│  └─ api/               original single-service reference template (not run)
├─ scripts/
│  ├─ setup-db.sql       create the per-service databases
│  └─ backup-db.sh       pg_dump each database to ./backups
└─ turbo.json, pnpm-workspace.yaml
```

Each service follows the same layout: `src/config.ts` (Zod-validated env),
`src/logger.ts`, `src/db/` (schema + queries via Drizzle), `src/routers/`,
`src/middleware/`, `src/openapi.ts`, `src/index.ts` (bootstrap).

---

## Database

Migrations are generated with Drizzle Kit and committed under each service's
`migrations/` folder.

```bash
pnpm db:generate   # regenerate SQL migrations from the Drizzle schema
pnpm db:migrate    # apply pending migrations to each database
pnpm db:backup     # pg_dump every database into ./backups
```

Restore a dump:

```bash
psql postgresql://postgres:postgres@localhost:5432/restful_auth -f backups/restful_auth-<ts>.sql
```

### Schema summary (ERD)

- **auth** — `users` (id, username, display_name, email, password, role,
  email_verified, refresh_token_version, timestamps), `email_verification_codes`
  and `password_reset_codes` (hashed OTP, attempts, expiry) → FK to `users`.
- **management** — `extinguishers` (serial_number, location, type, size,
  installation/expiry dates, status), `inspections` → FK `extinguishers`,
  `maintenance_logs` → FK `extinguishers` (+ optional FK `inspections`).
- **notification** — `notifications` (type, recipient, subject, status, error,
  metadata, created_at).

---

## Environment reference

Shared by all services: `NODE_ENV`, `LOG_LEVEL`, `CORS_ORIGIN`,
`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `INTERNAL_API_KEY`.

| Service       | Additional variables                                                                 |
| ------------- | ------------------------------------------------------------------------------------ |
| gateway       | `PORT=8080`, `AUTH_URL`, `MANAGEMENT_URL`, `REPORTING_URL`                             |
| auth          | `PORT=8081`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `DOMAIN?`, `NOTIFICATION_URL`, `APP_NAME` |
| management    | `PORT=8082`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `NOTIFICATION_URL`                 |
| reporting     | `PORT=8083`, `ACCESS_TOKEN_SECRET`, `MANAGEMENT_URL`, `AUTH_URL`                       |
| notification  | `PORT=8084`, `DATABASE_URL`, `RESEND_API_KEY?`, `EMAIL_FROM`, `APP_NAME`               |

**Production notes:** set strong, distinct `ACCESS_TOKEN_SECRET` /
`REFRESH_TOKEN_SECRET` (≥ 32 chars); set an explicit `CORS_ORIGIN` (not `*`);
set `DOMAIN` (auth, for cookie scoping); set `RESEND_API_KEY` (notification).
Each service's `config.ts` enforces these in `NODE_ENV=production`.

---

## Deployment

Each service is a standalone Node process (`pnpm --filter <service> start`,
which runs `tsx src/index.ts`). Provision one PostgreSQL database per stateful
service, set the environment variables above, and place the gateway behind your
TLS terminator / load balancer (`trust proxy` is already enabled). Services can
be containerised independently and scaled horizontally — they share no state
beyond their databases and the signed JWT.
