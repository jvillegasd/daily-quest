#!/bin/sh

echo "DATABASE_URL is set: $([ -n "$DATABASE_URL" ] && echo yes || echo NO)"
echo "Running database migrations..."
if prisma migrate deploy; then
  echo "Migrations done."
else
  echo "Warning: migrations failed, continuing anyway."
fi

echo "Starting server..."
exec node server.js
