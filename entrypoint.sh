#!/bin/sh

# Hardcoded fallback while we debug env var flow — overridden if DATABASE_URL is set
_DB="postgresql://postgres:J3MaAjrwydQXTVTMNU1W@postgres:5432/dailyquest"
DB_URL="${DATABASE_URL:-$_DB}"

echo "Running database migrations..."
if DATABASE_URL="$DB_URL" prisma migrate deploy --schema ./prisma/schema.prisma; then
  echo "Migrations done."
else
  echo "Warning: migrations failed, continuing anyway."
fi

echo "Starting server..."
exec node server.js
