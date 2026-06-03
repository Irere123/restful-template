-- ---------------------------------------------------------------------------
-- Development seed data (NOT for production).
--
-- Seeds three test accounts (one per role) and a small, realistic set of
-- extinguishers / inspections / maintenance so every screen has content.
--
-- All three users share the password:  Password123
--   admin@tzw.test      → admin
--   inspector@tzw.test  → inspector
--   user@tzw.test       → user
--
-- The bcrypt hash below is `Password123` hashed with bcryptjs (cost 12) — the
-- same algorithm the auth service uses to verify logins. Emails are marked
-- verified so you skip the OTP step.
--
-- Run (psql connects to the auth DB first; `\c` switches to management):
--   pnpm db:seed
-- or directly:
--   psql postgresql://postgres:postgres@localhost:5432/fire_auth_service -f scripts/seed-dev.sql
--
-- Idempotent: users are upserted by email; asset rows use `seed-*` ids and are
-- replaced on every run (deleting a seed extinguisher cascades to its
-- inspections + maintenance).
-- ---------------------------------------------------------------------------

\set ON_ERROR_STOP on

-- ── Auth service: test users ────────────────────────────────────────────────
\connect fire_auth_service

INSERT INTO users (id, first_name, last_name, display_name, email, password, role, email_verified, created_at, updated_at)
VALUES
  ('seed-usr-admin',     'Ada', 'Admin',     'Ada Admin',     'admin@tzw.test',     '$2b$12$HJJ.Ck4K3qhnHgqBLg2ZWukqlPVT.RPXG0e2HAcwPyM3IS43L9LVO', 'admin',     now(), now(), now()),
  ('seed-usr-inspector', 'Ian', 'Inspector', 'Ian Inspector', 'inspector@tzw.test', '$2b$12$HJJ.Ck4K3qhnHgqBLg2ZWukqlPVT.RPXG0e2HAcwPyM3IS43L9LVO', 'inspector', now(), now(), now()),
  ('seed-usr-user',      'Uma', 'User',      'Uma User',      'user@tzw.test',      '$2b$12$HJJ.Ck4K3qhnHgqBLg2ZWukqlPVT.RPXG0e2HAcwPyM3IS43L9LVO', 'user',      now(), now(), now())
ON CONFLICT (email) DO UPDATE SET
  first_name     = EXCLUDED.first_name,
  last_name      = EXCLUDED.last_name,
  display_name   = EXCLUDED.display_name,
  password       = EXCLUDED.password,
  role           = EXCLUDED.role,
  email_verified = EXCLUDED.email_verified,
  updated_at     = now();

-- ── Management service: extinguishers, inspections, maintenance ──────────────
\connect fire_management_service

-- Clear any prior seed (cascades to inspections + maintenance_logs).
DELETE FROM extinguishers WHERE id LIKE 'seed-%';

INSERT INTO extinguishers (id, serial_number, location, type, size, installation_date, expiry_date, status, created_by, created_at, updated_at) VALUES
  ('seed-ext-001','FE-001','Building A — Lobby',   'co2',         '5lb',  '2025-06-01','2027-06-01','active',     NULL, now(), now()),
  ('seed-ext-002','FE-002','Building A — Floor 2', 'water',       '9lb',  '2024-03-15','2026-06-20','active',     NULL, now(), now()),
  ('seed-ext-003','FE-003','Building B — Kitchen', 'dry_chemical','5lb',  '2023-01-10','2026-05-01','expired',    NULL, now(), now()),
  ('seed-ext-004','FE-004','Building B — Garage',  'foam',        '12lb', '2025-02-20','2027-02-20','active',     NULL, now(), now()),
  ('seed-ext-005','FE-005','Warehouse — Bay 1',    'co2',         '2.5lb','2024-11-05','2026-07-01','active',     NULL, now(), now()),
  ('seed-ext-006','FE-006','Warehouse — Bay 2',    'dry_chemical','9lb',  '2022-08-08','2026-04-15','expired',    NULL, now(), now()),
  ('seed-ext-007','FE-007','Server Room',          'co2',         '5lb',  '2025-05-01','2027-05-01','maintenance',NULL, now(), now());

INSERT INTO inspections (id, extinguisher_id, scheduled_date, scheduled_time, status, result, notes, scheduled_by, inspector_id, completed_at, created_at, updated_at) VALUES
  ('seed-insp-001','seed-ext-001','2026-06-15','10:00','scheduled', NULL,               'Quarterly check',             NULL, NULL, NULL,                  now(), now()),
  ('seed-insp-002','seed-ext-002','2026-05-20','09:30','scheduled', NULL,               'Annual inspection (overdue)', NULL, NULL, NULL,                  now(), now()),
  ('seed-insp-003','seed-ext-004','2026-05-10','14:00','completed', 'pass',             'All good',                    NULL, NULL, '2026-05-10 14:30:00', now(), now()),
  ('seed-insp-004','seed-ext-003','2026-05-02','11:00','completed', 'needs_maintenance','Low pressure',                NULL, NULL, '2026-05-02 11:20:00', now(), now());

INSERT INTO maintenance_logs (id, extinguisher_id, inspection_id, action_taken, maintenance_date, issues_identified, notes, inspector_id, created_at) VALUES
  ('seed-mnt-001','seed-ext-003','seed-insp-004','Recharged and replaced seal','2026-05-03','Low pressure found during inspection','Returned to service pending re-test', NULL, now()),
  ('seed-mnt-002','seed-ext-007', NULL,          'Annual pressure test',       '2026-05-15', NULL,                                  'Unit offline for testing',            NULL, now());
