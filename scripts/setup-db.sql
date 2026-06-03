-- Create the per-service databases for the Fire Extinguisher Management System.
-- Database-per-service: each microservice owns its own database.
--
-- Run:
--   psql postgresql://postgres:postgres@localhost:5432/postgres -f scripts/setup-db.sql
-- or:
--   pnpm db:setup
--
-- CREATE DATABASE cannot run inside a transaction/DO block, so we use psql's
-- \gexec to conditionally execute the statement only when the DB is missing.

SELECT 'CREATE DATABASE restful_auth'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'restful_auth')\gexec

SELECT 'CREATE DATABASE restful_management'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'restful_management')\gexec

SELECT 'CREATE DATABASE restful_notification'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'restful_notification')\gexec

\echo 'Databases ready: restful_auth, restful_management, restful_notification'
