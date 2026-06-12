#!/bin/sh

# Construct DATABASE_URL if not already set (docker-compose passes it, but prisma.config.ts
# runs at global CLI level where env inheritance may differ)
if [ -z "$DATABASE_URL" ] && [ -n "$POSTGRES_PASSWORD" ]; then
  DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/dailyquest"
  export DATABASE_URL
fi

echo "Running database migrations..."
if DATABASE_URL="$DATABASE_URL" prisma migrate deploy; then
  echo "Migrations done."
else
  echo "Warning: migrations failed, continuing anyway."
fi

echo "Starting server..."
exec node server.js
