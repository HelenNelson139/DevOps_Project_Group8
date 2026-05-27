#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

echo "Running database migrations..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /migrations/migrations/001_users.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /migrations/migrations/002_courses_classes.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /migrations/migrations/003_enrollments.sql

if [ "${RUN_SEED:-true}" = "true" ]; then
  echo "Running database seed..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /migrations/seed.sql
fi

echo "Database migration completed."
