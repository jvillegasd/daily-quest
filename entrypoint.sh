#!/bin/sh

echo "Running database migrations..."
if node /app/node_modules/prisma/build/index.js migrate deploy; then
  echo "Migrations done."
else
  echo "Warning: migrations failed, continuing anyway."
fi

echo "Starting server..."
exec node server.js
