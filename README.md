# Fire Extinguisher Management System — RESTful Microservices

A RESTful **microservices** backend for **TZW LTD**'s Fire Extinguisher Management
System. It lets users check extinguisher status, schedule inspections, log
maintenance, monitor compliance, and generate real-time reports — built for
scalability, maintainability, security and high availability.

> This repository is a pnpm + Turborepo monorepo. The **backend microservices**
> live in `services/*` and share code through `packages/core`.

---

## Architecture

The system uses a small gateway-first microservice layout. The browser calls the
Next.js app, Next rewrites `/api/*` to the gateway, and the gateway routes to the
service that owns the requested domain.

```mermaid
flowchart LR
    B[Browser] --> F[Next.js :3000]
    F -->|/api/* rewrite| G[API Gateway :8080]
    G --> A[Auth :8081]
    G --> M[Management :8082]
    G --> R[Reporting :8083]
    A -. email .-> N[Notification :8084]
    M -. alerts .-> N
    R -. reads with caller cookie .-> M
```

| Service | Responsibility | State |
| --- | --- | --- |
| `gateway` | Public backend entry point, proxying, rate limits, Swagger index | Stateless |
| `auth` | Users, login, JWT cookies, refresh, RBAC, OTP/password reset | Auth DB |
| `management` | Extinguishers, inspections, maintenance, scheduled alert jobs | Management DB |
| `reporting` | Aggregated reports and PDF/CSV export | Stateless |
| `notification` | Internal email delivery and audit log | Notification DB |
| `packages/core` | Shared middleware, errors, logging, HTTP helpers, validation | Library |

Core rules: services own their data, access JWTs are verified locally, refresh is
owned by auth, reporting reads through management, and notification is
internal-only.

See [`docs/architecture.md`](docs/architecture.md) for the request-flow diagram
and [`docs/db-schema.md`](docs/db-schema.md) for the per-service data model.

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

### 5. Seed development data (optional)

Load three ready-made test accounts (one per role) plus a small set of
extinguishers, inspections and maintenance logs so every screen has content:

```bash
pnpm db:seed
```

| Email                | Password      | Role        | Can…                                                          |
| -------------------- | ------------- | ----------- | ------------------------------------------------------------- |
| `admin@tzw.test`     | `Password123` | `admin`     | Everything — manage users & roles, delete any record          |
| `inspector@tzw.test` | `Password123` | `inspector` | Register/edit extinguishers, complete inspections, log maintenance |
| `user@tzw.test`      | `Password123` | `user`      | Read-only + schedule inspections                              |

All three have verified emails (no OTP step). The seed is **idempotent** — users
are upserted by email and the sample assets (ids prefixed `seed-`) are replaced
on each run. It loads `scripts/seed-dev.sql` into the `fire_auth_service` and
`fire_management_service` databases. **Development only** — never run it against
production data.

The sample assets include expired and soon-to-expire units and an overdue
inspection, so the dashboard, reports and alerts all show realistic data
(compliance ≈ 71%).

---

## API overview (via the gateway)

All routes below are called on `http://localhost:8080`.

### Auth & Users (`auth` service)

| Method & path                | Role         | Description                              |
| ---------------------------- | ------------ | ---------------------------------------- |
| `POST /auth/register`        | public       | Create account (`firstName`, `lastName`, `email`, `password`), start session, send OTP |
| `POST /auth/login`           | public       | Log in (sets `httpOnly` cookies)          |
| `POST /auth/logout`          | public       | Clear this client's session               |
| `POST /auth/logout-all`      | auth         | Revoke every session                      |
| `POST /auth/refresh`         | public       | Rotate tokens using the refresh cookie    |
| `GET  /auth/me`              | auth         | Current user                              |
| `PATCH /auth/me`             | auth         | Update profile                            |
| `DELETE /auth/me`            | auth         | Delete own account (emails confirmation)  |
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
  -d '{"firstName":"Admin","lastName":"User","email":"admin@tzw.test","password":"Password123"}'
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

## Automated notifications & scheduled jobs

### Event-driven (lifecycle) emails

The auth and management services fire emails on user/asset events. All sends are
**best-effort** — a notification outage never fails the underlying operation —
and every attempt is recorded in the `notifications` audit log.

| Event                                   | Email          | Type (`notifications.type`) |
| --------------------------------------- | -------------- | --------------------------- |
| Register                                | Verification OTP + Welcome | `otp`, `welcome`  |
| New sign-in                             | Security alert (time, IP, device) | `login_alert`    |
| Sign-out / sign-out-all                 | Sign-out confirmation | `logout_alert`         |
| Delete account (self or by admin)       | Account-deleted confirmation | `account_deleted` |
| Forgot password                         | Reset OTP      | `password_reset`            |
| Inspection scheduled                    | Inspection notice | `inspection_scheduled`   |
| Maintenance logged                      | Maintenance notice | `maintenance_logged`    |

Per-event sign-in/sign-out alerts can be turned off with
`SECURITY_ALERTS_ENABLED=false` on the auth service (welcome and
account-deleted always send).

### Scheduled (cron) jobs — `management` service

Two background jobs run on a schedule via `node-cron` (enable/disable with
`CRON_ENABLED`):

| Job                    | Default schedule | What it does                                                                 |
| ---------------------- | ---------------- | ---------------------------------------------------------------------------- |
| **Expiry scan**        | `0 8 * * *` (08:00 daily) | Flips lapsed extinguishers `active → expired`, then emails recipients an **expiry digest** (newly expired + expiring within `EXPIRY_ALERT_WINDOW_DAYS`, default 30). |
| **Inspection reminder**| `0 7 * * *` (07:00 daily) | Emails recipients a digest of **overdue** and **upcoming** scheduled inspections (within `INSPECTION_REMINDER_WINDOW_DAYS`, default 3). |

- **Recipients** are resolved from auth's internal directory API
  (`GET /internal/users?roles=…`, internal-key only). By default
  `ALERT_RECIPIENT_ROLES=admin,inspector`.
- **Idempotent:** an extinguisher is alerted once when it crosses its expiry
  date (the scan only reports units it just flipped), so re-runs don't re-spam.
- The job summary (`{ expiringSoon, expired, recipients }` /
  `{ upcoming, overdue, recipients }`) is logged on every run.

**Run on demand** (internal-key guarded, not exposed through the gateway —
handy for testing without waiting for the schedule):

```bash
curl -s -X POST http://localhost:8082/jobs/expiry-scan          -H "x-internal-key: dev-internal-key"
curl -s -X POST http://localhost:8082/jobs/inspection-reminders -H "x-internal-key: dev-internal-key"
```

> With no `RESEND_API_KEY` the digests are recorded with status `skipped`; with a
> key set they are actually sent (status `sent`, or `failed` if the provider
> rejects the recipient).

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
│  └─ notification/      email + audit log (DB: restful_notification)
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
| auth          | `PORT=8081`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `DOMAIN?`, `NOTIFICATION_URL`, `APP_NAME`, `SECURITY_ALERTS_ENABLED` |
| management    | `PORT=8082`, `DATABASE_URL`, `ACCESS_TOKEN_SECRET`, `NOTIFICATION_URL`, `AUTH_URL`, `APP_NAME`, `CRON_ENABLED`, `EXPIRY_ALERT_WINDOW_DAYS`, `INSPECTION_REMINDER_WINDOW_DAYS`, `ALERT_RECIPIENT_ROLES`, `EXPIRY_CRON`, `INSPECTION_REMINDER_CRON` |
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
