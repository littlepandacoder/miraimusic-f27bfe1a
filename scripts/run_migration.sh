#!/usr/bin/env bash
# Small helper to run a SQL migration file against a Postgres DATABASE_URL
# Usage:
#   DATABASE_URL="postgres://..." ./scripts/run_migration.sh migrations/20260113_add_published_to_gamified_maps.sql --dry-run

set -euo pipefail

SQL_FILE="$1"
MODE="apply"

if [ "$#" -ge 2 ]; then
  if [ "$2" = "--dry-run" ]; then
    MODE="dry"
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL must be set in your environment (Supabase DB connection string)." >&2
  exit 2
fi

if [ ! -f "$SQL_FILE" ]; then
  echo "ERROR: SQL file not found: $SQL_FILE" >&2
  exit 2
fi

echo "Running migration: $SQL_FILE"
echo "Mode: $MODE"

if [ "$MODE" = "dry" ]; then
  echo "=== DRY RUN: printing SQL ==="
  sed -n '1,200p' "$SQL_FILE"
  echo "=== END DRY RUN ==="
  exit 0
fi

echo "Applying SQL to DATABASE_URL via psql..."
# Use psql to run the migration. Requires psql to be installed and DATABASE_URL to be a full connection string.
psql "$DATABASE_URL" -f "$SQL_FILE"

echo "Migration finished. Verify results in staging before production."
