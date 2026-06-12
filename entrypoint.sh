#!/bin/sh

echo "Running database migrations..."
if prisma migrate deploy; then
  echo "Migrations done."
else
  echo "Warning: migrations failed, continuing anyway."
fi

echo "Starting server..."
exec node server.js
