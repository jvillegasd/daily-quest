#!/bin/sh

# Ensure DATABASE_URL is available — Coolify passes POSTGRES_PASSWORD via docker-compose substitution
# but the global prisma CLI may not inherit it. Construct it explicitly as a fallback.
DB_URL="${DATABASE_URL:-postgresql://postgres:${POSTGRES_PASSWORD:-postgres}@postgres:5432/dailyquest}"

echo "Running database migrations..."
if DATABASE_URL="$DB_URL" prisma migrate deploy --schema ./prisma/schema.prisma; then
  echo "Migrations done."
else
  echo "Warning: migrations failed, continuing anyway."
fi

echo "Starting server..."
exec node server.js
