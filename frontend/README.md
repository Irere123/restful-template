# TZW Fire Safety — Frontend

The web client for the Fire Extinguisher Management System. A **Next.js 16**
(App Router) single-page app that talks to the backend **API gateway** and
covers the full product: authentication, the extinguisher registry, inspection
scheduling/completion, maintenance logging, compliance reports & exports, alerts,
and admin user management.

## Stack

- **Next.js 16** (App Router, React 19) — all feature pages are client components.
- **TanStack Query** — every server interaction (queries + mutations) with cache
  invalidation; the session user is cached under the `["me"]` key.
- **fetch** — a single typed client (`lib/api/client.ts`) that calls the gateway
  and normalizes errors into an `ApiError` (`code`, `status`, field `details`).
- **React Context** — `AuthProvider` (`components/providers/auth-provider.tsx`)
  exposes the current user + role helpers app-wide.
- **base-ui + Tailwind v4** — the component kit under `components/ui`.
- **Zod** — client-side form validation mirroring the backend rules.

## How it talks to the backend

The browser only ever calls **this app** (same origin). `next.config.ts` rewrites
`/api/*` to the API gateway, so:

- no CORS configuration is required, and
- the auth `httpOnly` cookies set by the gateway are scoped to this host
  (`SameSite=Lax` works as-is in development).

Point the gateway elsewhere with `API_GATEWAY_URL` (default
`http://localhost:8080`).

## Getting started

From the monorepo root, install once with `pnpm install`, then start the backend
(`pnpm dev:backend`) and, in another terminal, this app:

```bash
cd frontend
pnpm dev          # http://localhost:3000
```

Open http://localhost:3000 — you’ll be routed to sign-in, then the dashboard.

### Test accounts

Run `pnpm db:seed` from the repo root to load test accounts (and sample data).
All share the password `Password123`:

| Email                | Role        |
| -------------------- | ----------- |
| `admin@tzw.test`     | `admin`     |
| `inspector@tzw.test` | `inspector` |
| `user@tzw.test`      | `user`      |

Sign in as each to see how the UI adapts to roles (create/edit/delete and the
Users page appear only for the roles allowed to use them).

> In development the OTP / password-reset codes are **logged by the notification
> service** (no email is sent), so you can complete email verification and
> password reset locally.

## Project layout

```
frontend/
├─ app/
│  ├─ providers.tsx           QueryClient + Toast + Auth providers
│  ├─ page.tsx                root redirect (→ dashboard or sign-in)
│  ├─ auth/                   login, register, verify-email, forgot/reset password
│  └─ (app)/                  authenticated shell (sidebar + topbar), guarded
│     ├─ dashboard/           overview (report aggregates)
│     ├─ extinguishers/       registry CRUD + filters/search
│     ├─ inspections/         schedule / complete / reschedule / cancel
│     ├─ maintenance/         maintenance log
│     ├─ reports/             inventory / inspections / compliance / maintenance + PDF/CSV export
│     ├─ notifications/       live compliance & inspection alerts
│     ├─ users/               admin: roles + deletion
│     └─ settings/            profile, password, sessions, danger zone
├─ lib/api/                   typed fetch client + TanStack Query hooks per domain
├─ lib/validation.ts          Zod form schemas
└─ components/                shared UI (page header, data states, dialogs, badges…)
```

## RBAC in the UI

Role-restricted actions are hidden with `RoleGate` / `useAuth()` (reads are open
to any signed-in user; create/update need admin or inspector; delete and user
management are admin-only). The server still enforces RBAC — the UI just avoids
showing actions that would be rejected.

## Scripts

```bash
pnpm dev      # start the dev server
pnpm build    # production build
pnpm start    # serve the production build
pnpm lint     # eslint
```
