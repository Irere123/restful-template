#!/usr/bin/env bash
#
# Back up every service database to ./backups/<db>-<timestamp>.sql
#
# Usage:
#   pnpm db:backup
#   PGPASSWORD=secret PGHOST=db.example.com bash scripts/backup-db.sh
#
# Restore a dump with:
#   psql postgresql://postgres:postgres@localhost:5432/<db> -f backups/<file>.sql
#
set -euo pipefail

HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"
USER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}"

TS="$(date +%Y%m%d-%H%M%S)"
DIR="$(cd "$(dirname "$0")/.." && pwd)/backups"
mkdir -p "$DIR"

for db in restful_auth restful_management restful_notification; do
  out="$DIR/${db}-${TS}.sql"
  echo "Backing up ${db} -> ${out}"
  pg_dump -h "$HOST" -p "$PORT" -U "$USER" -d "$db" --clean --if-exists >"$out"
done

echo "Done. Backups written to ${DIR}"
